"""
Shopify Admin GraphQL API Client (Targeting 2024-10+).
Handles product creation, high-res media ingestion, inventory location assignment,
multi-channel publication (Online Store, TikTok, eBay, Shop), and catalog status transitions.
Includes simulated dry-run mode for local sandboxing and development.
"""

import logging
from typing import Any, Dict, List, Optional
import httpx
from config.settings import Settings, get_settings

logger = logging.getLogger("ShopifyClient")


class ShopifyGraphQLClient:
    def __init__(self, settings: Optional[Settings] = None):
        self.settings = settings or get_settings()
        self.domain = self.settings.shopify_shop_domain
        self.api_version = self.settings.shopify_api_version
        self.access_token = self.settings.shopify_admin_access_token
        self.endpoint = f"https://{self.domain}/admin/api/{self.api_version}/graphql.json"
        self.is_live = self.settings.is_live_shopify_configured

    async def execute_graphql(self, query: str, variables: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Execute a GraphQL query/mutation against Shopify Admin API."""
        if not self.is_live:
            return self._simulate_graphql(query, variables or {})

        headers = {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": self.access_token,
        }
        payload = {"query": query, "variables": variables or {}}

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(self.endpoint, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
            if "errors" in data and data["errors"]:
                raise RuntimeError(f"Shopify GraphQL Error: {data['errors']}")
            return data.get("data", {})

    async def get_locations(self) -> List[Dict[str, Any]]:
        """Fetch shop inventory locations (e.g. Supplier Warehouse, Utah Base)."""
        query = """
        query GetLocations {
          locations(first: 20) {
            nodes {
              id
              name
              isActive
              isPrimary
              address {
                city
                provinceCode
                countryCode
              }
            }
          }
        }
        """
        data = await self.execute_graphql(query)
        return data.get("locations", {}).get("nodes", [])

    async def get_publications(self) -> List[Dict[str, Any]]:
        """Fetch registered sales channel publications (Online Store, TikTok, eBay, Shop)."""
        query = """
        query GetPublications {
          publications(first: 25) {
            nodes {
              id
              name
              supportsFuturePublishing
            }
          }
        }
        """
        data = await self.execute_graphql(query)
        return data.get("publications", {}).get("nodes", [])

    async def publish_to_channels(self, product_gid: str, publication_gids: List[str]) -> List[Dict[str, Any]]:
        """Publish product to specified sales channels."""
        mutation = """
        mutation PublishProduct($id: ID!, $input: [PublicationInput!]!) {
          publishablePublish(id: $id, input: $input) {
            publishable {
              availablePublicationsCount {
                count
              }
            }
            userErrors {
              field
              message
            }
          }
        }
        """
        inputs = [{"publicationId": pub_id} for pub_id in publication_gids]
        data = await self.execute_graphql(mutation, {"id": product_gid, "input": inputs})
        return data.get("publishablePublish", {}).get("userErrors", [])

    async def create_product(
        self,
        title: str,
        description_html: str,
        tags: List[str],
        product_type: str,
        vendor: str,
        price: float,
        compare_at_price: float,
        sku: str,
        image_urls: List[str],
        status: str = "DRAFT",
    ) -> Dict[str, Any]:
        """
        Create a product with media, price, and initial variant in Shopify.
        Returns product dict with id, handle, variants, and direct store URL.
        """
        mutation = """
        mutation CreateProductWithMedia($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
          productCreate(product: $product, media: $media) {
            product {
              id
              title
              handle
              status
              variants(first: 5) {
                nodes {
                  id
                  price
                  compareAtPrice
                  sku
                  inventoryItem {
                    id
                    tracked
                  }
                }
              }
            }
            userErrors {
              field
              message
            }
          }
        }
        """

        media_inputs = [
            {"originalSource": url, "mediaContentType": "IMAGE"}
            for url in image_urls[:5] # Max top 5 high-res supplier images
        ]

        product_input: Dict[str, Any] = {
            "title": title,
            "descriptionHtml": description_html,
            "vendor": vendor,
            "productType": product_type,
            "tags": tags,
            "status": status, # ACTIVE or DRAFT based on safe mode
        }

        # If we have variants/pricing:
        product_input["variants"] = [
            {
                "price": f"{price:.2f}",
                "compareAtPrice": f"{compare_at_price:.2f}",
                "sku": sku,
                "inventoryItem": {
                    "tracked": True,
                },
            }
        ]

        data = await self.execute_graphql(
            mutation,
            {"product": product_input, "media": media_inputs if media_inputs else None},
        )

        res = data.get("productCreate", {})
        errors = res.get("userErrors", [])
        if errors:
            raise RuntimeError(f"Failed to create product in Shopify: {errors}")

        product = res.get("product", {})
        handle = product.get("handle", "")
        product["direct_url"] = f"https://{self.domain}/products/{handle}"
        return product

    async def assign_inventory_location(
        self,
        inventory_item_id: str,
        location_id: str,
        on_hand_quantity: int = 100,
    ) -> Dict[str, Any]:
        """Assign inventory tracking to Supplier Warehouse location."""
        mutation = """
        mutation InventoryActivate($inventoryItemId: ID!, $locationId: ID!, $available: Int) {
          inventoryActivate(inventoryItemId: $inventoryItemId, locationId: $locationId, available: $available) {
            inventoryLevel {
              id
            }
            userErrors {
              field
              message
            }
          }
        }
        """
        data = await self.execute_graphql(
            mutation,
            {
                "inventoryItemId": inventory_item_id,
                "locationId": location_id,
                "available": on_hand_quantity,
            },
        )
        return data.get("inventoryActivate", {})

    async def update_product_status(self, product_gid: str, status: str) -> Dict[str, Any]:
        """Update product status (ACTIVE or DRAFT)."""
        mutation = """
        mutation UpdateProductStatus($product: ProductUpdateInput!) {
          productUpdate(product: $product) {
            product {
              id
              status
            }
            userErrors {
              field
              message
            }
          }
        }
        """
        data = await self.execute_graphql(
            mutation,
            {"product": {"id": product_gid, "status": status}},
        )
        return data.get("productUpdate", {})

    async def query_products_by_tag(self, tag: str) -> List[Dict[str, Any]]:
        """Query automated catalog products by specific tag."""
        query = """
        query GetProductsByTag($query: String!) {
          products(first: 50, query: $query) {
            nodes {
              id
              title
              handle
              status
              createdAt
              tags
              totalInventory
            }
          }
        }
        """
        data = await self.execute_graphql(query, {"query": f"tag:{tag}"})
        return data.get("products", {}).get("nodes", [])

    def _simulate_graphql(self, query: str, variables: Dict[str, Any]) -> Dict[str, Any]:
        """Deterministic sandbox simulation of Shopify GraphQL responses for testing."""
        logger.info("[Shopify-Simulation] Executing simulated GraphQL query: %s", query.strip().split("\n")[0])
        
        if "query GetLocations" in query:
            return {
                "locations": {
                    "nodes": [
                        {
                            "id": "gid://shopify/Location/882104921",
                            "name": self.settings.supplier_domestic_location_name,
                            "isActive": True,
                            "isPrimary": False,
                            "address": {"city": "Ontario", "provinceCode": "CA", "countryCode": "US"},
                        },
                        {
                            "id": "gid://shopify/Location/991048201",
                            "name": self.settings.primary_base_location_name,
                            "isActive": True,
                            "isPrimary": True,
                            "address": {"city": "Salt Lake City", "provinceCode": "UT", "countryCode": "US"},
                        },
                    ]
                }
            }

        if "query GetPublications" in query:
            return {
                "publications": {
                    "nodes": [
                        {"id": "gid://shopify/Publication/101", "name": "Online Store", "supportsFuturePublishing": True},
                        {"id": "gid://shopify/Publication/102", "name": "TikTok", "supportsFuturePublishing": True},
                        {"id": "gid://shopify/Publication/103", "name": "eBay", "supportsFuturePublishing": True},
                        {"id": "gid://shopify/Publication/104", "name": "Shop", "supportsFuturePublishing": True},
                        {"id": "gid://shopify/Publication/105", "name": "Point of Sale", "supportsFuturePublishing": True},
                    ]
                }
            }

        if "mutation CreateProductWithMedia" in query:
            prod_in = variables.get("product", {})
            title = prod_in.get("title", "Sample Dropship Product")
            handle = title.lower().replace(" ", "-").replace("/", "-")[:40]
            status = prod_in.get("status", "DRAFT")
            import random
            fake_id = f"gid://shopify/Product/{random.randint(8000000000, 8999999999)}"
            fake_var_id = f"gid://shopify/ProductVariant/{random.randint(40000000000, 49999999999)}"
            fake_inv_id = f"gid://shopify/InventoryItem/{random.randint(60000000000, 69999999999)}"
            
            return {
                "productCreate": {
                  "product": {
                    "id": fake_id,
                    "title": title,
                    "handle": handle,
                    "status": status,
                    "variants": {
                      "nodes": [
                        {
                          "id": fake_var_id,
                          "price": prod_in.get("variants", [{}])[0].get("price", "29.99"),
                          "compareAtPrice": prod_in.get("variants", [{}])[0].get("compareAtPrice", "49.99"),
                          "sku": prod_in.get("variants", [{}])[0].get("sku", "BZB-DROPSHIP-001"),
                          "inventoryItem": {
                            "id": fake_inv_id,
                            "tracked": True
                          }
                        }
                      ]
                    }
                  },
                  "userErrors": []
                }
            }

        if "mutation PublishProduct" in query:
            return {
                "publishablePublish": {
                    "publishable": {
                        "availablePublicationsCount": {"count": 4}
                    },
                    "userErrors": []
                }
            }

        if "mutation InventoryActivate" in query:
            return {
                "inventoryActivate": {
                    "inventoryLevel": {
                        "id": "gid://shopify/InventoryLevel/12345678"
                    },
                    "userErrors": []
                }
            }

        if "mutation UpdateProductStatus" in query:
            prod_in = variables.get("product", {})
            return {
                "productUpdate": {
                    "product": {
                        "id": prod_in.get("id", "gid://shopify/Product/123"),
                        "status": prod_in.get("status", "DRAFT")
                    },
                    "userErrors": []
                }
            }

        if "query GetProductsByTag" in query:
            return {
                "products": {
                    "nodes": []
                }
            }

        return {}

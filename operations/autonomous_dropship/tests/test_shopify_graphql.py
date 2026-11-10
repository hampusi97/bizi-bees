import pytest
from integrations.shopify_client import ShopifyGraphQLClient
from config.settings import Settings


@pytest.mark.asyncio
async def test_shopify_graphql_client_locations_and_publications():
    settings = Settings(shopify_shop_domain="bizibees-store.myshopify.com")
    client = ShopifyGraphQLClient(settings)

    locations = await client.get_locations()
    assert len(locations) >= 2
    location_names = [loc["name"] for loc in locations]
    assert "Supplier Warehouse" in location_names
    assert "Utah Base" in location_names

    publications = await client.get_publications()
    pub_names = [p["name"] for p in publications]
    assert "Online Store" in pub_names
    assert "TikTok" in pub_names
    assert "eBay" in pub_names
    assert "Shop" in pub_names


@pytest.mark.asyncio
async def test_shopify_graphql_client_product_creation():
    settings = Settings(shopify_shop_domain="bizibees-store.myshopify.com")
    client = ShopifyGraphQLClient(settings)

    res = await client.create_product(
        title="Test Ergonomic Traction Support",
        description_html="<p>Test</p>",
        tags=["source:trendscout", "posture"],
        product_type="Health & Personal Care",
        vendor="Bizibees Select",
        price=39.99,
        compare_at_price=59.99,
        sku="TEST-SKU-001",
        image_urls=["https://images.unsplash.com/photo-1544367567-0f2fcb009e0b"],
        status="DRAFT",
    )

    assert "id" in res
    assert "handle" in res
    assert res["status"] == "DRAFT"
    assert "bizibees-store.myshopify.com/products/" in res["direct_url"]

"""
MODULE D: THE AUTONOMOUS CATALOG LIFECYCLE MANAGER (CatalogJanitor).
Automates the complete product lifecycle via Shopify Admin GraphQL API:
1. Add Action: Programmatically creates products with high-res supplier imagery, pricing, and tags.
2. Channel Sync Action: Publishes to Online Store, TikTok Shop, eBay, and Shop app.
3. Inventory Location Sync: Maps fulfillment to 'Supplier Warehouse' vs 'Utah Base'.
4. Auto-Audit & Prune Engine (Weekly): Automatically transitions underperforming products
   (active >21 days with 0 orders and <1.2% CTR) from ACTIVE to DRAFT across all sales channels.
"""

from datetime import datetime, timezone, timedelta
import logging
from typing import Any, Dict, List, Optional
from config.settings import Settings, get_settings
from database.models import (
    AuditRecord,
    CandidateProduct,
    CandidateStatus,
    CatalogProduct,
    CreativeAsset,
    ProductStatus,
    VettingResult,
)
from database.store import DatabaseStore
from integrations.shopify_client import ShopifyGraphQLClient

logger = logging.getLogger("CatalogJanitor")


class CatalogJanitor:
    """
    Autonomous Module D: Ingests top winning candidates into Shopify,
    routes multi-channel sales feeds, assigns warehouse inventory, and cleans catalog clutter.
    """

    AUTOMATION_TAG = "source:trendscout"

    def __init__(
        self,
        store: DatabaseStore,
        settings: Optional[Settings] = None,
        shopify_client: Optional[ShopifyGraphQLClient] = None,
    ):
        self.store = store
        self.settings = settings or get_settings()
        self.shopify = shopify_client or ShopifyGraphQLClient(self.settings)
        self.launch_target = self.settings.daily_product_launch_target
        self.auto_publish = self.settings.autopilot_auto_publish

    async def run_add_and_sync(self) -> List[CatalogProduct]:
        """
        Upload the top 2 winning products with CREATIVE_READY status to Shopify via GraphQL.
        Assigns inventory location to Supplier Warehouse and publishes across channels.
        """
        logger.info("[CatalogJanitor] Executing Add & Channel Sync workflow...")
        ready_candidates = self.store.get_candidates_by_status(CandidateStatus.CREATIVE_READY)
        
        # Sort by total trend score descending
        ready_candidates.sort(key=lambda c: c.total_trend_score, reverse=True)
        top_candidates = ready_candidates[: self.launch_target]

        if not top_candidates:
            logger.info("[CatalogJanitor] No candidates currently awaiting launch.")
            return []

        # 1. Discover shop publications and inventory locations
        publications = await self.shopify.get_publications()
        target_channel_names = set(self.settings.target_channels_list)
        publication_gids = [
            pub["id"] for pub in publications
            if pub.get("name") in target_channel_names
        ]

        locations = await self.shopify.get_locations()
        supplier_location = next(
            (loc for loc in locations if self.settings.supplier_domestic_location_name.lower() in loc["name"].lower()),
            locations[0] if locations else None
        )
        supplier_location_id = supplier_location["id"] if supplier_location else "gid://shopify/Location/default"

        launched_products: List[CatalogProduct] = []

        for candidate in top_candidates:
            creative = self.store.get_creative_asset(candidate.id)
            vetting = self.store.get_vetting_result(candidate.id)

            if not creative or not vetting:
                logger.error("[CatalogJanitor] Missing creative or vetting data for %s", candidate.id)
                continue

            retail_price = vetting.target_retail_price
            compare_price = round(retail_price * 1.5, 2)
            product_status = "ACTIVE" if self.auto_publish else "DRAFT"

            tags = [
                self.AUTOMATION_TAG,
                f"category:{candidate.category.lower().replace(' ', '-')}",
                f"painpoint:{candidate.pain_point_category}",
                f"warehouse:us-domestic",
                f"gpc:{creative.google_product_category_id}",
            ]

            logger.info(
                "[CatalogJanitor] Creating product '%s' (Status: %s, Price: $%.2f, Store: %s)...",
                creative.shopify_title, product_status, retail_price, self.settings.shopify_shop_domain
            )

            # A. Programmatically create product in Shopify GraphQL Admin API
            product_resp = await self.shopify.create_product(
                title=creative.shopify_title,
                description_html=creative.shopify_description_html,
                tags=tags,
                product_type=candidate.category,
                vendor="Bizibees Select",
                price=retail_price,
                compare_at_price=compare_price,
                sku=candidate.supplier_sku,
                image_urls=candidate.image_urls,
                status=product_status,
            )

            product_gid = product_resp.get("id")
            handle = product_resp.get("handle")
            direct_url = product_resp.get("direct_url", f"https://{self.settings.shopify_shop_domain}/products/{handle}")

            # Extract variant and inventory item
            variants = product_resp.get("variants", {}).get("nodes", [])
            inventory_item_id = None
            if variants:
                inventory_item_id = variants[0].get("inventoryItem", {}).get("id")

            # B. Sync Action: Assign inventory locations (Supplier Warehouse vs Utah Base)
            if inventory_item_id and supplier_location_id:
                logger.info(
                    "[CatalogJanitor] Assigning inventory for item %s to %s (%s)...",
                    inventory_item_id, self.settings.supplier_domestic_location_name, supplier_location_id
                )
                await self.shopify.assign_inventory_location(
                    inventory_item_id=inventory_item_id,
                    location_id=supplier_location_id,
                    on_hand_quantity=150, # Domestic warehouse synced stock allocation
                )

            # C. Multi-Channel Synchronization (Online Store, TikTok, eBay, Shop)
            synced_channel_names: List[str] = []
            if publication_gids and product_status == "ACTIVE":
                logger.info("[CatalogJanitor] Publishing to %d sales channels...", len(publication_gids))
                errors = await self.shopify.publish_to_channels(product_gid, publication_gids)
                if not errors:
                    synced_channel_names = [p["name"] for p in publications if p["id"] in publication_gids]
            elif product_status == "DRAFT":
                synced_channel_names = ["Staged for Approval (Safe Mode)"]

            catalog_product = CatalogProduct(
                candidate_id=candidate.id,
                shopify_product_id=product_gid,
                shopify_handle=handle,
                direct_shopify_url=direct_url,
                status=ProductStatus.ACTIVE if product_status == "ACTIVE" else ProductStatus.DRAFT,
                retail_price=retail_price,
                compare_at_price=compare_price,
                inventory_item_id=inventory_item_id,
                inventory_location_assigned=self.settings.supplier_domestic_location_name,
                published_sales_channels=synced_channel_names or ["Online Store"],
                published_at=datetime.now(timezone.utc).isoformat(),
                orders_count=0,
                ctr=0.0,
            )

            self.store.save_catalog_product(catalog_product)
            self.store.update_candidate_status(candidate.id, CandidateStatus.PUBLISHED)
            launched_products.append(catalog_product)

            logger.info(
                "[CatalogJanitor] 🚀 Successfully ingested: %s | URL: %s",
                catalog_product.shopify_handle, catalog_product.direct_shopify_url
            )

        return launched_products

    async def run_audit_and_prune(self) -> List[CatalogProduct]:
        """
        Auto-Audit & Prune Engine:
        Runs weekly (or on scheduled cadence):
        Queries automated products: If an automated product has been active for >21 days
        with 0 orders and <1.2% CTR, automatically transitions product status from ACTIVE to DRAFT
        across all sales channels to prevent catalog clutter.
        """
        logger.info("[CatalogJanitor] Running Autonomous Catalog Audit & Prune Engine...")
        active_products = self.store.list_active_catalog_products()
        now = datetime.now(timezone.utc)
        threshold_days = self.settings.prune_inactive_days_threshold
        max_ctr_threshold = self.settings.prune_max_ctr_threshold

        pruned_products: List[CatalogProduct] = []
        audit_details: List[Dict[str, Any]] = []

        for prod in active_products:
            pub_date = datetime.fromisoformat(prod.published_at.replace("Z", "+00:00"))
            days_active = (now - pub_date).days

            # In production, query Shopify GraphQL or Analytics API for orders and sessions/CTR:
            # Here we evaluate stored metrics or simulate aged analytics:
            orders = prod.orders_count
            ctr = prod.ctr

            should_prune = (days_active >= threshold_days and orders == 0 and ctr < max_ctr_threshold)

            audit_details.append({
                "candidate_id": prod.candidate_id,
                "shopify_id": prod.shopify_product_id,
                "days_active": days_active,
                "orders": orders,
                "ctr": ctr,
                "pruned": should_prune,
            })

            if should_prune:
                logger.warning(
                    "[CatalogJanitor] 🧹 Pruning underperforming product '%s': Active %d days, %d orders, %.2f%% CTR. Demoting to DRAFT.",
                    prod.shopify_handle, days_active, orders, ctr * 100
                )
                # Mutate status to DRAFT via Shopify GraphQL API
                await self.shopify.update_product_status(prod.shopify_product_id, "DRAFT")
                
                # Update database records
                self.store.mark_product_pruned(prod.candidate_id, now.isoformat())
                prod.status = ProductStatus.DRAFT
                prod.is_pruned = True
                prod.pruned_at = now.isoformat()
                pruned_products.append(prod)

        # Log audit run
        import uuid
        audit_record = AuditRecord(
            id=str(uuid.uuid4())[:8],
            products_evaluated=len(active_products),
            products_pruned=len(pruned_products),
            details=audit_details,
        )
        self.store.save_audit_record(audit_record)

        logger.info(
            "[CatalogJanitor] Audit complete. %d active products evaluated, %d products pruned to DRAFT.",
            len(active_products), len(pruned_products)
        )
        return pruned_products

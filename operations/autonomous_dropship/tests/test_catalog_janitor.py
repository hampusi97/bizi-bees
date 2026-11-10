from datetime import datetime, timezone, timedelta
import pytest
from config.settings import Settings
from database.models import (
    CandidateProduct,
    CandidateStatus,
    CatalogProduct,
    CreativeAsset,
    ProductStatus,
    VettingResult,
)
from database.store import DatabaseStore
from modules.catalog_janitor import CatalogJanitor


@pytest.fixture
def populated_store(tmp_path):
    store = DatabaseStore(tmp_path / "test_janitor.db")
    candidate = CandidateProduct(
        id="cand_win_01",
        title="Cryo Stainless Steel Facial Sculpting Ice Roller",
        category="Beauty & Personal Care",
        supplier_product_id="ZD-01",
        supplier_sku="ZD-ICE-01",
        supplier_url="https://zendrop.com",
        supplier_cost=5.00,
        supplier_shipping_cost=3.50,
        pain_point_category="skin",
        total_trend_score=92.5,
        status=CandidateStatus.CREATIVE_READY,
    )
    store.save_candidate(candidate)

    vetting = VettingResult(
        candidate_id=candidate.id,
        target_retail_price=29.99,
        target_margin_multiplier=3.52,
        total_landed_cost=8.50,
        is_approved=True,
    )
    store.save_vetting_result(vetting)

    creative = CreativeAsset(
        candidate_id=candidate.id,
        shopify_title="Cryo Facial Sculpting Ice Roller | Premium Edition",
        shopify_description_html="<p>Test</p>",
        google_product_category_id="2697",
        ebay_item_specifics={"Brand": "Bizibees", "MPN": "BZB-001"},
        tiktok_shop_taxonomy="Beauty > Tools",
        hook_1_curiosity="Hook 1 test",
        hook_2_price_disruption="Hook 2 test",
        hook_3_problem_agitation="Hook 3 test",
        social_caption="Caption test",
        hashtags=["#test"],
    )
    store.save_creative_asset(creative)
    return store


@pytest.mark.asyncio
async def test_catalog_janitor_add_and_sync_safe_mode(populated_store):
    # Safe mode: autopilot_auto_publish = False -> DRAFT
    settings = Settings(autopilot_auto_publish=False)
    janitor = CatalogJanitor(populated_store, settings)

    launched = await janitor.run_add_and_sync()
    assert len(launched) == 1
    prod = launched[0]
    assert prod.status == ProductStatus.DRAFT
    assert prod.inventory_location_assigned == "Supplier Warehouse"
    assert "bizibees-store.myshopify.com" in prod.direct_shopify_url


@pytest.mark.asyncio
async def test_catalog_janitor_add_and_sync_autopilot_live(populated_store):
    # Autopilot Live mode: autopilot_auto_publish = True -> ACTIVE
    settings = Settings(autopilot_auto_publish=True)
    janitor = CatalogJanitor(populated_store, settings)

    launched = await janitor.run_add_and_sync()
    assert len(launched) == 1
    prod = launched[0]
    assert prod.status == ProductStatus.ACTIVE


@pytest.mark.asyncio
async def test_catalog_janitor_auto_audit_and_prune(populated_store):
    janitor = CatalogJanitor(populated_store)

    # Insert an underperforming active product that has been live for 25 days with 0 orders and 0.8% CTR
    old_date = (datetime.now(timezone.utc) - timedelta(days=25)).isoformat()
    underperforming_product = CatalogProduct(
        candidate_id="cand_old_underperformer",
        shopify_product_id="gid://shopify/Product/999111222",
        shopify_handle="old-failing-gadget",
        direct_shopify_url="https://bizibees-store.myshopify.com/products/old-failing-gadget",
        status=ProductStatus.ACTIVE,
        retail_price=24.99,
        compare_at_price=39.99,
        published_sales_channels=["Online Store", "TikTok", "eBay"],
        published_at=old_date,
        orders_count=0,
        ctr=0.008, # 0.8% CTR (< 1.2% threshold)
        is_pruned=False,
    )
    populated_store.save_catalog_product(underperforming_product)

    # Insert a well-performing product live for 30 days but with 12 orders
    performing_product = CatalogProduct(
        candidate_id="cand_old_winner",
        shopify_product_id="gid://shopify/Product/888333444",
        shopify_handle="old-winning-item",
        direct_shopify_url="https://bizibees-store.myshopify.com/products/old-winning-item",
        status=ProductStatus.ACTIVE,
        retail_price=34.99,
        compare_at_price=59.99,
        published_sales_channels=["Online Store", "TikTok", "eBay"],
        published_at=old_date,
        orders_count=12, # Has orders -> do not prune!
        ctr=0.035, # 3.5% CTR
        is_pruned=False,
    )
    populated_store.save_catalog_product(performing_product)

    pruned = await janitor.run_audit_and_prune()

    assert len(pruned) == 1
    assert pruned[0].shopify_product_id == "gid://shopify/Product/999111222"
    assert pruned[0].status == ProductStatus.DRAFT
    assert pruned[0].is_pruned is True

    # Verify performing product was NOT pruned
    active_now = populated_store.list_active_catalog_products()
    active_ids = [p.shopify_product_id for p in active_now]
    assert "gid://shopify/Product/888333444" in active_ids
    assert "gid://shopify/Product/999111222" not in active_ids

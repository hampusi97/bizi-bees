import pytest
from database.models import CandidateProduct, CandidateStatus, VettingResult
from database.store import DatabaseStore
from modules.creative_director import CreativeDirector


@pytest.fixture
def temp_store(tmp_path):
    store = DatabaseStore(tmp_path / "test_creative.db")
    candidate = CandidateProduct(
        id="cand_posture_test",
        title="Smart Cervical Neck Traction Pillow",
        category="Health & Personal Care",
        supplier_product_id="CJ-01",
        supplier_sku="CJ-SKU-01",
        supplier_url="https://cjdropshipping.com",
        supplier_cost=8.50,
        supplier_shipping_cost=4.25,
        pain_point_category="posture",
        status=CandidateStatus.VETTED_PASSED,
    )
    store.save_candidate(candidate)

    vetting = VettingResult(
        candidate_id=candidate.id,
        target_retail_price=39.99,
        target_margin_multiplier=3.13,
        total_landed_cost=12.75,
        us_warehouse_verified=True,
        trademark_counterfeit_cleared=True,
        ingestible_medical_cleared=True,
        tiktok_cosmetic_guidelines_compliant=True,
        is_approved=True,
    )
    store.save_vetting_result(vetting)
    return store


@pytest.mark.asyncio
async def test_creative_director_generation(temp_store):
    director = CreativeDirector(temp_store)
    assets = await director.run()

    assert len(assets) == 1
    asset = assets[0]

    # 1. Product title & Shopify OS 2.0 HTML description
    assert "Cervical Neck Traction" in asset.shopify_title
    assert "bizibees-product-container" in asset.shopify_description_html
    assert "Key Benefits" in asset.shopify_description_html
    assert "<table" in asset.shopify_description_html
    assert "<details" in asset.shopify_description_html
    assert "<summary" in asset.shopify_description_html

    # 2. Multi-channel metadata
    assert asset.google_product_category_id == "569"
    assert "Brand" in asset.ebay_item_specifics
    assert "MPN" in asset.ebay_item_specifics
    assert "Posture" in asset.tiktok_shop_taxonomy or "Supports" in asset.tiktok_shop_taxonomy

    # 3. The 3-Hook Viral Ad Blueprint
    assert len(asset.hook_1_curiosity) > 10
    assert "Why" in asset.hook_2_price_disruption or "$" in asset.hook_2_price_disruption
    assert len(asset.hook_3_problem_agitation) > 10
    assert len(asset.hashtags) >= 3

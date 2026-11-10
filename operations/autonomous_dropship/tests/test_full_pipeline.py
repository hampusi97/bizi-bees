import pytest
from config.settings import Settings
from database.store import DatabaseStore
from scheduler.cron_orchestrator import CronOrchestrator


@pytest.mark.asyncio
async def test_full_pipeline_run(tmp_path):
    db_file = tmp_path / "test_pipeline.db"
    settings = Settings(
        database_path=str(db_file),
        trend_score_min_threshold=80.0,
        daily_product_launch_target=2,
        autopilot_auto_publish=False, # Safe mode
    )
    store = DatabaseStore(db_file)
    orchestrator = CronOrchestrator(settings=settings, db_store=store)

    results = await orchestrator.run_full_pipeline()

    # Verify stage progression
    assert results["scouted_count"] >= 2
    assert results["vetted_count"] >= 2
    assert results["creatives_count"] >= 2
    assert results["launched_count"] == 2
    assert len(results["launched_products"]) == 2

    for prod in results["launched_products"]:
        assert prod.status.value == "DRAFT" # Safe mode
        assert "bizibees-store.myshopify.com" in prod.direct_shopify_url
        assert prod.inventory_location_assigned == "Supplier Warehouse"

    # Verify executive briefing delivery
    assert results["briefing_sent"] is True

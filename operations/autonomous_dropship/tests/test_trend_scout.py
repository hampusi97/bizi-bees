import pytest
from database.store import DatabaseStore
from modules.trend_scout import TrendScout
from config.settings import Settings


@pytest.fixture
def temp_store(tmp_path):
    db_file = tmp_path / "test_dropship.db"
    return DatabaseStore(db_file)


def test_trend_scoring_algorithm(temp_store):
    scout = TrendScout(temp_store)

    # 1. Perfect breakout candidate
    # DoD > 20% (30pts) + Ad days > 14 (30pts) + Demo <= 5s (20pts) + Pain Point "posture" (20pts) = 100pts
    scores = scout.calculate_trend_score(
        dod_growth=0.25,
        ad_longevity_days=18,
        visual_demo_seconds=3.2,
        pain_point="posture",
    )
    assert scores["velocity_score"] == 30.0
    assert scores["longevity_score"] == 30.0
    assert scores["visual_score"] == 20.0
    assert scores["utility_score"] == 20.0
    assert scores["total_score"] == 100.0

    # 2. Borderline candidate (~80)
    # DoD 15% (22.5pts) + Ad days 10 (21.4pts) + Demo 4s (20pts) + Pain point "skin" (20pts) = ~83.9pts
    scores_borderline = scout.calculate_trend_score(
        dod_growth=0.15,
        ad_longevity_days=10,
        visual_demo_seconds=4.0,
        pain_point="skin",
    )
    assert scores_borderline["total_score"] >= 80.0

    # 3. Low-scoring novelty candidate (< 80)
    # DoD 5% (7.5pts) + Ad days 3 (6.4pts) + Demo 8s (11pts) + Pain point "novelty" (5pts) = ~29.9pts
    scores_low = scout.calculate_trend_score(
        dod_growth=0.05,
        ad_longevity_days=3,
        visual_demo_seconds=8.0,
        pain_point="novelty",
    )
    assert scores_low["total_score"] < 80.0


@pytest.mark.asyncio
async def test_trend_scout_run(temp_store):
    settings = Settings(trend_score_min_threshold=80.0)
    scout = TrendScout(temp_store, settings)

    qualified = await scout.run()
    assert len(qualified) >= 2
    for candidate in qualified:
        assert candidate.total_trend_score >= 80.0
        assert candidate.pain_point_category in ["posture", "skin", "tension", "sleep", "organization"]

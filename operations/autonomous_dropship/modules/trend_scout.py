"""
MODULE A: THE VIRAL TREND RESEARCHER (TrendScout).
Ingests trend signals from TikTok Creative Center, Meta Ad Library, and Supplier Feeds.
Calculates numerical trend scores (0-100) and qualifies products scoring >= 80.
"""

import logging
from typing import Any, Dict, List, Optional
from config.settings import Settings, get_settings
from database.models import CandidateProduct, CandidateStatus
from database.store import DatabaseStore
from integrations.meta_ad_library import MetaAdLibraryClient
from integrations.supplier_feeds import SupplierFeedManager
from integrations.tiktok_creative import TikTokCreativeCenterClient

logger = logging.getLogger("TrendScout")


class TrendScout:
    """
    Autonomous Module A: Discovers breakout viral products and scores them
    against viral velocity, ad longevity, visual demo factor, and pain-point utility.
    """

    def __init__(
        self,
        store: DatabaseStore,
        settings: Optional[Settings] = None,
        tiktok_client: Optional[TikTokCreativeCenterClient] = None,
        meta_client: Optional[MetaAdLibraryClient] = None,
        supplier_feed: Optional[SupplierFeedManager] = None,
    ):
        self.store = store
        self.settings = settings or get_settings()
        self.tiktok = tiktok_client or TikTokCreativeCenterClient(self.settings)
        self.meta = meta_client or MetaAdLibraryClient(self.settings)
        self.supplier = supplier_feed or SupplierFeedManager(self.settings)
        self.threshold = self.settings.trend_score_min_threshold

    async def run(self) -> List[CandidateProduct]:
        """
        Execute TrendScout discovery workflow:
        1. Fetch breakout trend candidates from TikTok Creative Center.
        2. Query Meta Ad Library for competitor ad longevity (>14 days).
        3. Match with supplier feeds (CJ, Zendrop, AliExpress).
        4. Calculate 4-part trend score (0-100).
        5. Persist candidates scoring >= 80 to candidate queue.
        """
        logger.info("[TrendScout] Ingesting breakout trend candidates...")
        trend_items = await self.tiktok.fetch_breakout_trends()
        qualified_candidates: List[CandidateProduct] = []

        for item in trend_items:
            identifier = item["product_identifier"]
            title = item["title"]
            category = item["category"]
            pain_point = item.get("pain_point_category", "general")
            dod_growth = item.get("tiktok_dod_view_growth", 0.0)
            visual_sec = item.get("visual_demo_seconds", 5.0)

            # 1. Check Meta Ad Longevity
            meta_ads = await self.meta.search_active_ads(title)
            max_ad_days = max([ad.get("days_active", 0) for ad in meta_ads], default=0)

            # 2. Check Supplier Details
            supplier_info = await self.supplier.lookup_supplier_details(identifier, title)

            # 3. Compute 4-part Trend Score (0-100)
            scores = self.calculate_trend_score(
                dod_growth=dod_growth,
                ad_longevity_days=max_ad_days,
                visual_demo_seconds=visual_sec,
                pain_point=pain_point,
            )

            total_score = scores["total_score"]
            logger.info(
                "[TrendScout] Evaluated '%s' | Score: %.1f/100 (Velocity: %.1f, Longevity: %.1f, Visual: %.1f, Utility: %.1f)",
                title, total_score, scores["velocity_score"], scores["longevity_score"],
                scores["visual_score"], scores["utility_score"]
            )

            candidate = CandidateProduct(
                id=identifier,
                title=title,
                category=category,
                supplier_source=supplier_info.get("supplier_source", "cj_dropshipping"),
                supplier_product_id=supplier_info.get("supplier_product_id", ""),
                supplier_sku=supplier_info.get("supplier_sku", ""),
                supplier_url=supplier_info.get("supplier_url", ""),
                image_urls=supplier_info.get("image_urls", []),
                supplier_cost=supplier_info.get("supplier_cost", 10.0),
                supplier_shipping_cost=supplier_info.get("supplier_shipping_cost", 5.0),
                supplier_shipping_min_days=supplier_info.get("supplier_shipping_min_days", 3),
                supplier_shipping_max_days=supplier_info.get("supplier_shipping_max_days", 7),
                supplier_warehouse_location=supplier_info.get("supplier_warehouse_location", "US Warehouse"),
                tiktok_dod_view_growth=dod_growth,
                meta_ad_longevity_days=max_ad_days,
                visual_demo_seconds=visual_sec,
                pain_point_category=pain_point,
                viral_velocity_score=scores["velocity_score"],
                ad_longevity_score=scores["longevity_score"],
                visual_demo_score=scores["visual_score"],
                problem_solving_score=scores["utility_score"],
                total_trend_score=total_score,
                status=CandidateStatus.SCOUTED if total_score >= self.threshold else CandidateStatus.VETTED_REJECTED,
            )

            self.store.save_candidate(candidate)

            if total_score >= self.threshold:
                qualified_candidates.append(candidate)

        logger.info(
            "[TrendScout] Completed discovery run. Qualified %d/%d breakout candidates (Score >= %.1f).",
            len(qualified_candidates), len(trend_items), self.threshold
        )
        return qualified_candidates

    def calculate_trend_score(
        self,
        dod_growth: float,
        ad_longevity_days: int,
        visual_demo_seconds: float,
        pain_point: str,
    ) -> Dict[str, float]:
        """
        Trend Scoring Criteria:
        1. Viral Velocity (Max 30 pts):
           - Full 30 pts if DoD view growth > 20% (0.20).
           - Scaled linearly between 0% and 20%.
        2. Ad Longevity (Max 30 pts):
           - Full 30 pts if competitor ads active > 14 days.
           - Scaled linearly between 0 and 14 days.
        3. Visual Demonstration Factor (Max 20 pts):
           - Full 20 pts if demonstrated under 5.0 seconds.
           - Reduced if visual demo exceeds 5.0 seconds.
        4. Problem-Solving Utility (Max 20 pts):
           - Full 20 pts for clear pain points: posture, skin, tension, sleep, organization.
           - 10 pts for general pain points; 0 for novelty/gimmick items.
        """
        # 1. Viral Velocity
        if dod_growth >= 0.20:
            velocity_score = 30.0
        else:
            velocity_score = max(0.0, (dod_growth / 0.20) * 30.0)

        # 2. Ad Longevity
        if ad_longevity_days >= 14:
            longevity_score = 30.0
        else:
            longevity_score = max(0.0, (ad_longevity_days / 14.0) * 30.0)

        # 3. Visual Demonstration Factor
        if visual_demo_seconds <= 5.0:
            visual_score = 20.0
        else:
            visual_score = max(5.0, 20.0 - (visual_demo_seconds - 5.0) * 3.0)

        # 4. Problem-Solving Utility
        priority_pain_points = {"posture", "skin", "tension", "sleep", "organization"}
        if pain_point.lower() in priority_pain_points:
            utility_score = 20.0
        elif pain_point.lower() in {"kitchen", "cleaning", "ergonomic", "back"}:
            utility_score = 15.0
        else:
            utility_score = 5.0

        total_score = round(velocity_score + longevity_score + visual_score + utility_score, 1)

        return {
            "velocity_score": round(velocity_score, 1),
            "longevity_score": round(longevity_score, 1),
            "visual_score": round(visual_score, 1),
            "utility_score": round(utility_score, 1),
            "total_score": total_score,
        }

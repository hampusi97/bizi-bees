"""
MODULE C: THE CREATIVE & CAMPAIGN GENERATOR (CreativeDirector).
Generates high-converting Shopify OS 2.0 product content, multi-channel taxonomy metadata,
and the "3-Hook" Viral Ad Blueprint for TikTok and Instagram.
"""

import logging
from typing import Any, Dict, List, Optional
from config.settings import Settings, get_settings
from database.models import CandidateProduct, CandidateStatus, CreativeAsset
from database.store import DatabaseStore
from integrations.llm_client import LLMClient

logger = logging.getLogger("CreativeDirector")


class CreativeDirector:
    """
    Autonomous Module C: Crafts marketing assets, OS 2.0 HTML descriptions,
    multi-channel marketplace taxonomies, and high-retention video ad scripts.
    """

    def __init__(
        self,
        store: DatabaseStore,
        settings: Optional[Settings] = None,
        llm_client: Optional[LLMClient] = None,
    ):
        self.store = store
        self.settings = settings or get_settings()
        self.llm = llm_client or LLMClient(self.settings)

    async def run(self) -> List[CreativeAsset]:
        """
        Process all candidates in VETTED_PASSED status.
        """
        logger.info("[CreativeDirector] Generating creative bundles for approved candidates...")
        vetted_candidates = self.store.get_candidates_by_status(CandidateStatus.VETTED_PASSED)
        generated_assets: List[CreativeAsset] = []

        for candidate in vetted_candidates:
            vetting = self.store.get_vetting_result(candidate.id)
            retail_price = vetting.target_retail_price if vetting else candidate.supplier_cost * 3.0
            compare_price = round(retail_price * 1.6, 2)

            bundle_data = await self.llm.generate_creative_bundle(
                product_title=candidate.title,
                category=candidate.category,
                pain_point=candidate.pain_point_category,
                retail_price=retail_price,
                compare_at_price=compare_price,
                supplier_notes=candidate.supplier_warehouse_location,
            )

            asset = CreativeAsset(
                candidate_id=candidate.id,
                shopify_title=bundle_data.get("shopify_title", candidate.title),
                shopify_description_html=bundle_data.get("shopify_description_html", ""),
                google_product_category_id=str(bundle_data.get("google_product_category_id", "569")),
                ebay_item_specifics=bundle_data.get("ebay_item_specifics", {}),
                tiktok_shop_taxonomy=bundle_data.get("tiktok_shop_taxonomy", ""),
                hook_1_curiosity=bundle_data.get("hook_1_curiosity", ""),
                hook_2_price_disruption=bundle_data.get("hook_2_price_disruption", ""),
                hook_3_problem_agitation=bundle_data.get("hook_3_problem_agitation", ""),
                social_caption=bundle_data.get("social_caption", ""),
                hashtags=bundle_data.get("hashtags", []),
            )

            self.store.save_creative_asset(asset)
            self.store.update_candidate_status(candidate.id, CandidateStatus.CREATIVE_READY)
            generated_assets.append(asset)

            logger.info(
                "[CreativeDirector] 🎨 Generated creative for '%s' | GPC: %s | TT Taxonomy: %s",
                asset.shopify_title, asset.google_product_category_id, asset.tiktok_shop_taxonomy
            )
            logger.info("  ↳ Hook 1 (Curiosity/Shock): %s", asset.hook_1_curiosity)
            logger.info("  ↳ Hook 2 (Price Disruption): %s", asset.hook_2_price_disruption)
            logger.info("  ↳ Hook 3 (Agitation): %s", asset.hook_3_problem_agitation)

        logger.info(
            "[CreativeDirector] Finished creative generation. %d assets created and ready for catalog ingestion.",
            len(generated_assets)
        )
        return generated_assets

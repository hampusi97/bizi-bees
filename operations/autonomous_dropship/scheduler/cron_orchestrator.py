"""
CRON WORKFLOW & AUTONOMOUS ORCHESTRATOR.
Schedules and triggers the 5-stage daily autonomous dropship cycle adhering strictly to UTC:
- 02:00 AM UTC: TrendScout scrapes breakout products and updates candidate queue.
- 03:00 AM UTC: EconVetter filters queue against margin rules and supplier shipping times.
- 04:00 AM UTC: CreativeDirector writes copy, SEO tags, and TikTok video scripts.
- 05:00 AM UTC: CatalogJanitor uploads top 2 winning products to Shopify via GraphQL & prunes.
- 06:00 AM UTC: Deliver autonomous Daily Executive Briefing with direct URLs and 3 ad hooks.
"""

import asyncio
from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from config.settings import Settings, get_settings
from database.models import CatalogProduct, CreativeAsset
from database.store import DatabaseStore
from integrations.notification_client import NotificationClient
from modules.catalog_janitor import CatalogJanitor
from modules.creative_director import CreativeDirector
from modules.econ_vetter import EconVetter
from modules.trend_scout import TrendScout

logger = logging.getLogger("CronOrchestrator")


class CronOrchestrator:
    def __init__(self, settings: Optional[Settings] = None, db_store: Optional[DatabaseStore] = None):
        self.settings = settings or get_settings()
        self.store = db_store or DatabaseStore(self.settings.database_path)
        self.trend_scout = TrendScout(self.store, self.settings)
        self.econ_vetter = EconVetter(self.store, self.settings)
        self.creative_director = CreativeDirector(self.store, self.settings)
        self.catalog_janitor = CatalogJanitor(self.store, self.settings)
        self.notifier = NotificationClient(self.settings)
        self.scheduler = AsyncIOScheduler(timezone=timezone.utc)

    # --- Individual Scheduled Jobs ---
    async def stage_0200_trend_scout(self) -> None:
        """02:00 AM UTC: TrendScout scrapes breakout products."""
        logger.info("[SCHEDULE 02:00 UTC] 🛰️ Initiating TrendScout breakout product crawl...")
        await self.trend_scout.run()

    async def stage_0300_econ_vetter(self) -> None:
        """03:00 AM UTC: EconVetter filters against margin rules & shipping SLA."""
        logger.info("[SCHEDULE 03:00 UTC] ⚖️ Initiating EconVetter unit economics & compliance check...")
        await self.econ_vetter.run()

    async def stage_0400_creative_director(self) -> None:
        """04:00 AM UTC: CreativeDirector writes copy, SEO, and TikTok scripts."""
        logger.info("[SCHEDULE 04:00 UTC] 🎨 Initiating CreativeDirector copywriting & ad blueprint generation...")
        await self.creative_director.run()

    async def stage_0500_catalog_janitor(self) -> Dict[str, Any]:
        """05:00 AM UTC: CatalogJanitor uploads top 2 products & audits for pruning."""
        logger.info("[SCHEDULE 05:00 UTC] 🛒 Initiating CatalogJanitor GraphQL upload & prune audit...")
        launched = await self.catalog_janitor.run_add_and_sync()
        pruned = await self.catalog_janitor.run_audit_and_prune()
        return {"launched": launched, "pruned": pruned}

    async def stage_0600_executive_briefing(
        self,
        launched_override: Optional[List[CatalogProduct]] = None,
        pruned_override: Optional[List[CatalogProduct]] = None,
    ) -> bool:
        """06:00 AM UTC: Deliver Daily Executive Briefing."""
        logger.info("[SCHEDULE 06:00 UTC] 📢 Compiling and dispatching Daily Executive Briefing...")
        
        # If not passed from pipeline run, fetch recent catalog additions
        if launched_override is not None:
            launched = launched_override
        else:
            all_prods = self.store.list_all_catalog_products()
            launched = all_prods[: self.settings.daily_product_launch_target]

        pruned = pruned_override if pruned_override is not None else []

        creatives_map: Dict[str, CreativeAsset] = {}
        for p in launched:
            cr = self.store.get_creative_asset(p.candidate_id)
            if cr:
                creatives_map[p.candidate_id] = cr

        return await self.notifier.send_executive_briefing(launched, creatives_map, pruned)

    # --- End-to-End Pipeline Runner (Immediate / Manual Trigger) ---
    async def run_full_pipeline(self) -> Dict[str, Any]:
        """
        Execute the entire 5-stage workflow sequentially in a single pass.
        Perfect for testing, verification, manual on-demand triggers, and container startup.
        """
        logger.info("⚡ Executing Full 5-Stage Autonomous Pipeline on demand...")

        # 02:00 AM UTC equivalent
        scouted = await self.trend_scout.run()

        # 03:00 AM UTC equivalent
        vetted = await self.econ_vetter.run()

        # 04:00 AM UTC equivalent
        creatives = await self.creative_director.run()

        # 05:00 AM UTC equivalent
        janitor_results = await self.stage_0500_catalog_janitor()
        launched = janitor_results["launched"]
        pruned = janitor_results["pruned"]

        # 06:00 AM UTC equivalent
        briefing_sent = await self.stage_0600_executive_briefing(
            launched_override=launched, pruned_override=pruned
        )

        return {
            "scouted_count": len(scouted),
            "vetted_count": len(vetted),
            "creatives_count": len(creatives),
            "launched_count": len(launched),
            "pruned_count": len(pruned),
            "briefing_sent": briefing_sent,
            "launched_products": launched,
            "pruned_products": pruned,
        }

    # --- Background Cron Scheduler ---
    def start_cron_scheduler(self) -> None:
        """
        Register cron jobs strictly aligned to the UTC schedule.
        """
        logger.info("Configuring APScheduler with strict UTC schedule:")
        logger.info("  • 02:00 UTC: TrendScout crawl")
        logger.info("  • 03:00 UTC: EconVetter margin & SLA checks")
        logger.info("  • 04:00 UTC: CreativeDirector copy & ad blueprint")
        logger.info("  • 05:00 UTC: CatalogJanitor GraphQL upload & prune")
        logger.info("  • 06:00 UTC: Daily Executive Briefing")

        self.scheduler.add_job(
            self.stage_0200_trend_scout,
            CronTrigger(hour=2, minute=0, timezone=timezone.utc),
            id="job_0200_trendscout",
            replace_existing=True,
        )
        self.scheduler.add_job(
            self.stage_0300_econ_vetter,
            CronTrigger(hour=3, minute=0, timezone=timezone.utc),
            id="job_0300_econvetter",
            replace_existing=True,
        )
        self.scheduler.add_job(
            self.stage_0400_creative_director,
            CronTrigger(hour=4, minute=0, timezone=timezone.utc),
            id="job_0400_creativedirector",
            replace_existing=True,
        )
        self.scheduler.add_job(
            self.stage_0500_catalog_janitor,
            CronTrigger(hour=5, minute=0, timezone=timezone.utc),
            id="job_0500_catalogjanitor",
            replace_existing=True,
        )
        self.scheduler.add_job(
            self.stage_0600_executive_briefing,
            CronTrigger(hour=6, minute=0, timezone=timezone.utc),
            id="job_0600_executivebriefing",
            replace_existing=True,
        )

        self.scheduler.start()
        logger.info("APScheduler started successfully. Bot is operating autonomously in background.")

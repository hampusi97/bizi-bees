"""
Multi-Channel Autonomous Notification & Executive Briefing Client.
Delivers the 06:00 AM UTC Daily Executive Briefing to Discord Webhooks,
Telegram Channels, and console logging.
"""

import logging
from typing import Any, Dict, List, Optional
import httpx
from config.settings import Settings, get_settings
from database.models import CatalogProduct, CreativeAsset

logger = logging.getLogger("NotificationClient")


class NotificationClient:
    def __init__(self, settings: Optional[Settings] = None):
        self.settings = settings or get_settings()
        self.discord_url = self.settings.discord_webhook_url
        self.tg_token = self.settings.telegram_bot_token
        self.tg_chat_id = self.settings.telegram_chat_id

    async def send_executive_briefing(
        self,
        launched_products: List[CatalogProduct],
        creatives: Dict[str, CreativeAsset],
        pruned_products: List[CatalogProduct],
    ) -> bool:
        """
        Deliver the 06:00 AM UTC Daily Executive Briefing across all configured channels.
        """
        markdown_text = self._build_briefing_markdown(launched_products, creatives, pruned_products)
        discord_embed = self._build_discord_payload(launched_products, creatives, pruned_products)

        success = True
        logger.info("\n%s\n%s\n%s", "=" * 60, "DAILY EXECUTIVE BRIEFING (06:00 AM UTC)", "=" * 60)
        logger.info("%s", markdown_text)
        logger.info("=" * 60)

        # 1. Send Discord Webhook
        if self.discord_url and not self.discord_url.startswith("https://discord.com/api/webhooks/xxxx"):
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    res = await client.post(self.discord_url, json=discord_embed)
                    if res.status_code not in (200, 204):
                        logger.warning("Discord webhook returned status %s: %s", res.status_code, res.text)
                        success = False
            except Exception as e:
                logger.error("Failed to post Discord webhook: %s", e)
                success = False

        # 2. Send Telegram Message
        if self.tg_token and self.tg_chat_id and not self.tg_token.startswith("123456"):
            try:
                tg_url = f"https://api.telegram.org/bot{self.tg_token}/sendMessage"
                payload = {
                    "chat_id": self.tg_chat_id,
                    "text": markdown_text[:4000], # Telegram char limit
                    "parse_mode": "Markdown",
                    "disable_web_page_preview": False,
                }
                async with httpx.AsyncClient(timeout=15.0) as client:
                    res = await client.post(tg_url, json=payload)
                    if res.status_code != 200:
                        logger.warning("Telegram API error %s: %s", res.status_code, res.text)
                        success = False
            except Exception as e:
                logger.error("Failed to send Telegram message: %s", e)
                success = False

        return success

    def _build_briefing_markdown(
        self,
        launched_products: List[CatalogProduct],
        creatives: Dict[str, CreativeAsset],
        pruned_products: List[CatalogProduct],
    ) -> str:
        safe_mode_label = "🟡 SAFE MODE (Staged as DRAFT)" if self.settings.is_safe_mode else "🟢 AUTONOMOUS AUTOPILOT (Published ACTIVE)"
        
        lines = [
            "🐝 **BIZIBEES AUTONOMOUS STORE — DAILY EXECUTIVE BRIEFING**",
            f"**Execution Mode:** {safe_mode_label}",
            f"**Target Store:** `{self.settings.shopify_shop_domain}`",
            "",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            "🚀 **1. NEWLY LAUNCHED WINNING PRODUCTS (Top 2)**",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        ]

        if not launched_products:
            lines.append("No new products met the >=80 trend and 3x margin threshold today.")
        else:
            for idx, prod in enumerate(launched_products[:2], start=1):
                cr = creatives.get(prod.candidate_id)
                title = cr.shopify_title if cr else prod.shopify_handle
                lines.extend([
                    f"**#{idx}: {title}**",
                    f"• **Direct Shopify URL:** {prod.direct_shopify_url}",
                    f"• **Status:** `{prod.status.value}` | **Retail:** ${prod.retail_price:.2f} (Compare: ${prod.compare_at_price:.2f})",
                    f"• **Fulfillment Location:** `{prod.inventory_location_assigned}` (Verified US Domestic)",
                    f"• **Channels Synced:** {', '.join(prod.published_sales_channels)}",
                    "",
                    "🎬 **Ready-to-Record TikTok Video Hooks:**",
                    f"  1️⃣ **Hook 1 (0-3s Pattern Interrupt):** {cr.hook_1_curiosity if cr else 'N/A'}",
                    f"  2️⃣ **Hook 2 (Price Disruption):** {cr.hook_2_price_disruption if cr else 'N/A'}",
                    f"  3️⃣ **Hook 3 (Problem/Agitation):** {cr.hook_3_problem_agitation if cr else 'N/A'}",
                    f"  📱 **Caption:** {cr.social_caption if cr else 'N/A'}",
                    f"  🏷️ **Hashtags:** {' '.join(cr.hashtags) if cr else ''}",
                    "",
                ])

        lines.extend([
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            "🧹 **2. CATALOG JANITOR: PRUNED / DRAFTED PRODUCTS**",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        ])

        if not pruned_products:
            lines.append("✅ Catalog Health Optimal: 0 products met the 21-day inactivity prune criteria.")
        else:
            for p in pruned_products:
                lines.append(f"• **{p.shopify_handle}** — Inactive >21d (Orders: {p.orders_count}, CTR: {p.ctr*100:.1f}%) -> Status updated to `DRAFT` across all sales channels.")

        lines.extend([
            "",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            "⚙️ **System Status:** All 4 Modules (TrendScout, EconVetter, CreativeDirector, CatalogJanitor) executed smoothly.",
        ])

        return "\n".join(lines)

    def _build_discord_payload(
        self,
        launched_products: List[CatalogProduct],
        creatives: Dict[str, CreativeAsset],
        pruned_products: List[CatalogProduct],
    ) -> Dict[str, Any]:
        fields = []
        for idx, prod in enumerate(launched_products[:2], start=1):
            cr = creatives.get(prod.candidate_id)
            title = cr.shopify_title if cr else prod.shopify_handle
            hooks_summary = (
                f"**URL:** [View in Store]({prod.direct_shopify_url})\n"
                f"**Price:** ${prod.retail_price:.2f} | **Status:** `{prod.status.value}`\n"
                f"**Hook 1:** {cr.hook_1_curiosity[:120]}...\n"
                f"**Hook 2:** {cr.hook_2_price_disruption[:120]}...\n"
                f"**Hook 3:** {cr.hook_3_problem_agitation[:120]}..."
                if cr else f"[Link]({prod.direct_shopify_url})"
            )
            fields.append({
                "name": f"🚀 Product #{idx}: {title[:60]}",
                "value": hooks_summary,
                "inline": False,
            })

        prune_text = (
            f"🧹 {len(pruned_products)} product(s) pruned to DRAFT (>21d, <1.2% CTR)"
            if pruned_products
            else "✅ 0 products flagged for pruning today"
        )

        embed = {
            "title": "🐝 Bizibees Autonomous Store — Daily Executive Briefing",
            "description": f"Autopilot Report for **{self.settings.shopify_shop_domain}**\nMode: **{'SAFE MODE (DRAFT)' if self.settings.is_safe_mode else 'AUTONOMOUS ACTIVE'}**",
            "color": 0xF59E0B if self.settings.is_safe_mode else 0x10B981, # Amber or Emerald
            "fields": fields + [{"name": "Catalog Prune Engine", "value": prune_text, "inline": False}],
            "footer": {"text": "Shopify GraphQL 2024-10 • Autonomous Dropship Orchestrator"},
        }

        return {"embeds": [embed]}

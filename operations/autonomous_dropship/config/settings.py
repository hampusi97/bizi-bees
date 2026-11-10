"""
System settings and runtime configurations.
Powered by Pydantic Settings with automatic environment variable loading.
"""

from functools import lru_cache
from pathlib import Path
from typing import List, Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # --- Shopify Admin GraphQL API Configuration ---
    shopify_shop_domain: str = Field(
        default="bizibees-store.myshopify.com",
        description="Shopify store domain (myshopify.com or custom domain with admin API)",
    )
    shopify_admin_access_token: str = Field(
        default="",
        description="Shopify Admin API access token (shpat_...)",
    )
    shopify_api_version: str = Field(
        default="2024-10",
        description="Target Shopify GraphQL Admin API version",
    )

    # --- Autopilot Safety Controls ---
    autopilot_auto_publish: bool = Field(
        default=False,
        description="Safe Mode: False stages as DRAFT for merchant approval; True publishes live as ACTIVE",
    )

    # --- Inventory & Multi-Channel Locations ---
    supplier_domestic_location_name: str = Field(
        default="Supplier Warehouse",
        description="Name of the dropship supplier US fulfillment location in Shopify",
    )
    primary_base_location_name: str = Field(
        default="Utah Base",
        description="Primary store origin / home base fulfillment location in Shopify",
    )
    enabled_sales_channels: str = Field(
        default="Online Store,TikTok,eBay,Point of Sale,Shop",
        description="Comma-delimited target sales channel names to publish products onto",
    )

    # --- LLM Providers ---
    gemini_api_key: Optional[str] = Field(default=None)
    openai_api_key: Optional[str] = Field(default=None)
    primary_llm_provider: str = Field(
        default="gemini",
        description="Primary LLM provider ('gemini' or 'openai')",
    )

    # --- Trend & Advertising Feeds ---
    tiktok_business_api_key: Optional[str] = Field(default=None)
    meta_marketing_api_key: Optional[str] = Field(default=None)
    meta_ad_account_id: Optional[str] = Field(default=None)

    # --- Supplier Feeds ---
    cj_dropshipping_api_key: Optional[str] = Field(default=None)
    zendrop_api_key: Optional[str] = Field(default=None)
    aliexpress_affiliate_app_key: Optional[str] = Field(default=None)
    aliexpress_affiliate_secret: Optional[str] = Field(default=None)

    # --- Notification Webhooks ---
    discord_webhook_url: Optional[str] = Field(default=None)
    telegram_bot_token: Optional[str] = Field(default=None)
    telegram_chat_id: Optional[str] = Field(default=None)

    # --- Autonomous Lifecycle & Pruning Rules ---
    trend_score_min_threshold: float = Field(
        default=80.0,
        description="Minimum combined trend score (out of 100) required to proceed from Module A to Module B",
    )
    margin_multiplier_target: float = Field(
        default=3.0,
        description="Target retail price formula multiplier: Retail >= (Cost + Shipping) * 3",
    )
    max_supplier_shipping_days: int = Field(
        default=7,
        description="Maximum permitted US domestic shipping SLA in days (max 3-7 day delivery)",
    )
    daily_product_launch_target: int = Field(
        default=2,
        description="Number of top vetted products to programmatically launch daily",
    )
    prune_inactive_days_threshold: int = Field(
        default=21,
        description="Days active with 0 orders before auto-drafting",
    )
    prune_max_ctr_threshold: float = Field(
        default=0.012,
        description="Maximum CTR threshold (1.2%) for inactive products to be auto-drafted",
    )

    # --- System & Storage ---
    database_path: str = Field(
        default="data/autonomous_dropship.db",
        description="SQLite database path for tracking candidates, creatives, and catalog state",
    )
    log_level: str = Field(default="INFO")
    dry_run_mode: bool = Field(
        default=False,
        description="Force dry run mode (simulating external mutations)",
    )

    @field_validator("shopify_shop_domain")
    @classmethod
    def clean_domain(cls, v: str) -> str:
        clean = v.strip().replace("https://", "").replace("http://", "").rstrip("/")
        return clean

    @property
    def target_channels_list(self) -> List[str]:
        return [c.strip() for c in self.enabled_sales_channels.split(",") if c.strip()]

    @property
    def is_live_shopify_configured(self) -> bool:
        return bool(
            self.shopify_admin_access_token
            and not self.shopify_admin_access_token.startswith("shpat_xxxx")
            and not self.dry_run_mode
        )

    @property
    def is_safe_mode(self) -> bool:
        return not self.autopilot_auto_publish

    @property
    def db_full_path(self) -> Path:
        p = Path(self.database_path)
        p.parent.mkdir(parents=True, exist_ok=True)
        return p


@lru_cache()
def get_settings() -> Settings:
    """Cached singleton instance of application settings."""
    return Settings()

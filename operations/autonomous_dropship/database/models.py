"""
Data models for the Autonomous Dropship Bot.
Using Pydantic v2 models for serialization, typing, and SQLite persistence.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class CandidateStatus(str, Enum):
    SCOUTED = "SCOUTED"
    VETTED_PASSED = "VETTED_PASSED"
    VETTED_REJECTED = "VETTED_REJECTED"
    CREATIVE_READY = "CREATIVE_READY"
    PUBLISHED = "PUBLISHED"
    PRUNED = "PRUNED"
    FAILED = "FAILED"


class ProductStatus(str, Enum):
    ACTIVE = "ACTIVE"
    DRAFT = "DRAFT"
    ARCHIVED = "ARCHIVED"


class CandidateProduct(BaseModel):
    """Raw candidate discovered by TrendScout."""
    id: str
    title: str
    category: str
    supplier_source: str = "cj_dropshipping" # cj_dropshipping, zendrop, aliexpress
    supplier_product_id: str
    supplier_sku: str
    supplier_url: str
    image_urls: List[str] = Field(default_factory=list)
    supplier_cost: float
    supplier_shipping_cost: float
    supplier_shipping_min_days: int = 3
    supplier_shipping_max_days: int = 7
    supplier_warehouse_location: str = "US West Fulfillment Center"
    
    # Trend Scout Metrics
    tiktok_dod_view_growth: float = 0.0 # e.g. 0.25 = +25%
    meta_ad_longevity_days: int = 0      # e.g. 16 days
    visual_demo_seconds: float = 0.0    # e.g. 3.2 seconds
    pain_point_category: str = "posture" # posture, skin, tension, sleep, organization, etc.
    
    # Sub-scores
    viral_velocity_score: float = 0.0   # Max 30
    ad_longevity_score: float = 0.0     # Max 30
    visual_demo_score: float = 0.0      # Max 20
    problem_solving_score: float = 0.0  # Max 20
    total_trend_score: float = 0.0      # Total out of 100
    
    status: CandidateStatus = CandidateStatus.SCOUTED
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class VettingResult(BaseModel):
    """Unit economics and compliance verification details."""
    candidate_id: str
    target_retail_price: float
    target_margin_multiplier: float
    total_landed_cost: float # supplier_cost + supplier_shipping_cost
    us_warehouse_verified: bool = False
    trademark_counterfeit_cleared: bool = False
    ingestible_medical_cleared: bool = False
    tiktok_cosmetic_guidelines_compliant: bool = False
    is_approved: bool = False
    rejection_reasons: List[str] = Field(default_factory=list)
    sanitized_notes: str = ""
    vetted_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class CreativeAsset(BaseModel):
    """Generated marketing copy, OS 2.0 HTML, taxonomy, and video hooks."""
    candidate_id: str
    shopify_title: str
    shopify_description_html: str
    google_product_category_id: str
    ebay_item_specifics: Dict[str, Any] = Field(default_factory=dict)
    tiktok_shop_taxonomy: str
    
    # The 3-Hook Viral Ad Blueprint
    hook_1_curiosity: str # 0-3s visual pattern interrupt
    hook_2_price_disruption: str # "Why pay $100+ when this does..."
    hook_3_problem_agitation: str # daily frustration solved
    
    social_caption: str
    hashtags: List[str] = Field(default_factory=list)
    generated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class CatalogProduct(BaseModel):
    """Published or managed product in Shopify catalog."""
    candidate_id: str
    shopify_product_id: str
    shopify_handle: str
    direct_shopify_url: str
    status: ProductStatus = ProductStatus.DRAFT
    retail_price: float
    compare_at_price: float
    inventory_item_id: Optional[str] = None
    inventory_location_assigned: str = "Supplier Warehouse"
    published_sales_channels: List[str] = Field(default_factory=list)
    published_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    last_audited_at: Optional[str] = None
    orders_count: int = 0
    ctr: float = 0.0
    is_pruned: bool = False
    pruned_at: Optional[str] = None


class AuditRecord(BaseModel):
    """Weekly prune and performance audit record."""
    id: str
    audit_date: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    products_evaluated: int
    products_pruned: int
    details: List[Dict[str, Any]] = Field(default_factory=list)

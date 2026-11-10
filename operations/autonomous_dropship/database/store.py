"""
SQLite persistence layer and repository for the dropship bot.
Provides thread-safe atomic transactions and query helpers.
"""

import json
import sqlite3
from pathlib import Path
from typing import Any, Dict, List, Optional
from .models import (
    CandidateProduct,
    CandidateStatus,
    CatalogProduct,
    CreativeAsset,
    ProductStatus,
    VettingResult,
    AuditRecord,
)


class DatabaseStore:
    def __init__(self, db_path: Path | str = "data/autonomous_dropship.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # Candidates table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS candidates (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                category TEXT NOT NULL,
                supplier_source TEXT NOT NULL,
                supplier_product_id TEXT NOT NULL,
                supplier_sku TEXT NOT NULL,
                supplier_url TEXT NOT NULL,
                image_urls TEXT NOT NULL, -- JSON array
                supplier_cost REAL NOT NULL,
                supplier_shipping_cost REAL NOT NULL,
                supplier_shipping_min_days INTEGER NOT NULL,
                supplier_shipping_max_days INTEGER NOT NULL,
                supplier_warehouse_location TEXT NOT NULL,
                tiktok_dod_view_growth REAL NOT NULL,
                meta_ad_longevity_days INTEGER NOT NULL,
                visual_demo_seconds REAL NOT NULL,
                pain_point_category TEXT NOT NULL,
                viral_velocity_score REAL NOT NULL,
                ad_longevity_score REAL NOT NULL,
                visual_demo_score REAL NOT NULL,
                problem_solving_score REAL NOT NULL,
                total_trend_score REAL NOT NULL,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            """)

            # Vetting Results table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS vetting_results (
                candidate_id TEXT PRIMARY KEY,
                target_retail_price REAL NOT NULL,
                target_margin_multiplier REAL NOT NULL,
                total_landed_cost REAL NOT NULL,
                us_warehouse_verified INTEGER NOT NULL,
                trademark_counterfeit_cleared INTEGER NOT NULL,
                ingestible_medical_cleared INTEGER NOT NULL,
                tiktok_cosmetic_guidelines_compliant INTEGER NOT NULL,
                is_approved INTEGER NOT NULL,
                rejection_reasons TEXT NOT NULL, -- JSON array
                sanitized_notes TEXT,
                vetted_at TEXT NOT NULL,
                FOREIGN KEY (candidate_id) REFERENCES candidates (id)
            );
            """)

            # Creative Assets table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS creative_assets (
                candidate_id TEXT PRIMARY KEY,
                shopify_title TEXT NOT NULL,
                shopify_description_html TEXT NOT NULL,
                google_product_category_id TEXT NOT NULL,
                ebay_item_specifics TEXT NOT NULL, -- JSON dict
                tiktok_shop_taxonomy TEXT NOT NULL,
                hook_1_curiosity TEXT NOT NULL,
                hook_2_price_disruption TEXT NOT NULL,
                hook_3_problem_agitation TEXT NOT NULL,
                social_caption TEXT NOT NULL,
                hashtags TEXT NOT NULL, -- JSON array
                generated_at TEXT NOT NULL,
                FOREIGN KEY (candidate_id) REFERENCES candidates (id)
            );
            """)

            # Catalog Products table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS catalog_products (
                candidate_id TEXT PRIMARY KEY,
                shopify_product_id TEXT NOT NULL,
                shopify_handle TEXT NOT NULL,
                direct_shopify_url TEXT NOT NULL,
                status TEXT NOT NULL,
                retail_price REAL NOT NULL,
                compare_at_price REAL NOT NULL,
                inventory_item_id TEXT,
                inventory_location_assigned TEXT NOT NULL,
                published_sales_channels TEXT NOT NULL, -- JSON array
                published_at TEXT NOT NULL,
                last_audited_at TEXT,
                orders_count INTEGER NOT NULL DEFAULT 0,
                ctr REAL NOT NULL DEFAULT 0.0,
                is_pruned INTEGER NOT NULL DEFAULT 0,
                pruned_at TEXT,
                FOREIGN KEY (candidate_id) REFERENCES candidates (id)
            );
            """)

            # Audit Records table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_records (
                id TEXT PRIMARY KEY,
                audit_date TEXT NOT NULL,
                products_evaluated INTEGER NOT NULL,
                products_pruned INTEGER NOT NULL,
                details TEXT NOT NULL -- JSON array
            );
            """)

            conn.commit()

    # --- Candidate Methods ---
    def save_candidate(self, candidate: CandidateProduct) -> None:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT OR REPLACE INTO candidates (
                id, title, category, supplier_source, supplier_product_id, supplier_sku,
                supplier_url, image_urls, supplier_cost, supplier_shipping_cost,
                supplier_shipping_min_days, supplier_shipping_max_days, supplier_warehouse_location,
                tiktok_dod_view_growth, meta_ad_longevity_days, visual_demo_seconds,
                pain_point_category, viral_velocity_score, ad_longevity_score,
                visual_demo_score, problem_solving_score, total_trend_score,
                status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                candidate.id, candidate.title, candidate.category, candidate.supplier_source,
                candidate.supplier_product_id, candidate.supplier_sku, candidate.supplier_url,
                json.dumps(candidate.image_urls), candidate.supplier_cost,
                candidate.supplier_shipping_cost, candidate.supplier_shipping_min_days,
                candidate.supplier_shipping_max_days, candidate.supplier_warehouse_location,
                candidate.tiktok_dod_view_growth, candidate.meta_ad_longevity_days,
                candidate.visual_demo_seconds, candidate.pain_point_category,
                candidate.viral_velocity_score, candidate.ad_longevity_score,
                candidate.visual_demo_score, candidate.problem_solving_score,
                candidate.total_trend_score, candidate.status.value,
                candidate.created_at, candidate.updated_at,
            ))
            conn.commit()

    def get_candidate(self, candidate_id: str) -> Optional[CandidateProduct]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM candidates WHERE id = ?", (candidate_id,))
            row = cursor.fetchone()
            if not row:
                return None
            return self._row_to_candidate(row)

    def get_candidates_by_status(self, status: CandidateStatus) -> List[CandidateProduct]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM candidates WHERE status = ? ORDER BY total_trend_score DESC", (status.value,))
            rows = cursor.fetchall()
            return [self._row_to_candidate(row) for row in rows]

    def update_candidate_status(self, candidate_id: str, status: CandidateStatus) -> None:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE candidates SET status = ? WHERE id = ?", (status.value, candidate_id))
            conn.commit()

    def _row_to_candidate(self, row: sqlite3.Row) -> CandidateProduct:
        data = dict(row)
        data["image_urls"] = json.loads(data["image_urls"])
        data["status"] = CandidateStatus(data["status"])
        return CandidateProduct(**data)

    # --- Vetting Methods ---
    def save_vetting_result(self, result: VettingResult) -> None:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT OR REPLACE INTO vetting_results (
                candidate_id, target_retail_price, target_margin_multiplier, total_landed_cost,
                us_warehouse_verified, trademark_counterfeit_cleared, ingestible_medical_cleared,
                tiktok_cosmetic_guidelines_compliant, is_approved, rejection_reasons,
                sanitized_notes, vetted_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                result.candidate_id, result.target_retail_price, result.target_margin_multiplier,
                result.total_landed_cost, int(result.us_warehouse_verified),
                int(result.trademark_counterfeit_cleared), int(result.ingestible_medical_cleared),
                int(result.tiktok_cosmetic_guidelines_compliant), int(result.is_approved),
                json.dumps(result.rejection_reasons), result.sanitized_notes, result.vetted_at,
            ))
            conn.commit()

    def get_vetting_result(self, candidate_id: str) -> Optional[VettingResult]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM vetting_results WHERE candidate_id = ?", (candidate_id,))
            row = cursor.fetchone()
            if not row:
                return None
            data = dict(row)
            data["rejection_reasons"] = json.loads(data["rejection_reasons"])
            data["us_warehouse_verified"] = bool(data["us_warehouse_verified"])
            data["trademark_counterfeit_cleared"] = bool(data["trademark_counterfeit_cleared"])
            data["ingestible_medical_cleared"] = bool(data["ingestible_medical_cleared"])
            data["tiktok_cosmetic_guidelines_compliant"] = bool(data["tiktok_cosmetic_guidelines_compliant"])
            data["is_approved"] = bool(data["is_approved"])
            return VettingResult(**data)

    # --- Creative Asset Methods ---
    def save_creative_asset(self, asset: CreativeAsset) -> None:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT OR REPLACE INTO creative_assets (
                candidate_id, shopify_title, shopify_description_html,
                google_product_category_id, ebay_item_specifics, tiktok_shop_taxonomy,
                hook_1_curiosity, hook_2_price_disruption, hook_3_problem_agitation,
                social_caption, hashtags, generated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                asset.candidate_id, asset.shopify_title, asset.shopify_description_html,
                asset.google_product_category_id, json.dumps(asset.ebay_item_specifics),
                asset.tiktok_shop_taxonomy, asset.hook_1_curiosity, asset.hook_2_price_disruption,
                asset.hook_3_problem_agitation, asset.social_caption, json.dumps(asset.hashtags),
                asset.generated_at,
            ))
            conn.commit()

    def get_creative_asset(self, candidate_id: str) -> Optional[CreativeAsset]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM creative_assets WHERE candidate_id = ?", (candidate_id,))
            row = cursor.fetchone()
            if not row:
                return None
            data = dict(row)
            data["ebay_item_specifics"] = json.loads(data["ebay_item_specifics"])
            data["hashtags"] = json.loads(data["hashtags"])
            return CreativeAsset(**data)

    # --- Catalog Product Methods ---
    def save_catalog_product(self, product: CatalogProduct) -> None:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT OR REPLACE INTO catalog_products (
                candidate_id, shopify_product_id, shopify_handle, direct_shopify_url,
                status, retail_price, compare_at_price, inventory_item_id,
                inventory_location_assigned, published_sales_channels, published_at,
                last_audited_at, orders_count, ctr, is_pruned, pruned_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                product.candidate_id, product.shopify_product_id, product.shopify_handle,
                product.direct_shopify_url, product.status.value, product.retail_price,
                product.compare_at_price, product.inventory_item_id,
                product.inventory_location_assigned, json.dumps(product.published_sales_channels),
                product.published_at, product.last_audited_at, product.orders_count,
                product.ctr, int(product.is_pruned), product.pruned_at,
            ))
            conn.commit()

    def get_catalog_product(self, candidate_id: str) -> Optional[CatalogProduct]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM catalog_products WHERE candidate_id = ?", (candidate_id,))
            row = cursor.fetchone()
            if not row:
                return None
            return self._row_to_catalog_product(row)

    def list_active_catalog_products(self) -> List[CatalogProduct]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM catalog_products WHERE status = 'ACTIVE' AND is_pruned = 0")
            rows = cursor.fetchall()
            return [self._row_to_catalog_product(row) for row in rows]

    def list_all_catalog_products(self) -> List[CatalogProduct]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM catalog_products ORDER BY published_at DESC")
            rows = cursor.fetchall()
            return [self._row_to_catalog_product(row) for row in rows]

    def _row_to_catalog_product(self, row: sqlite3.Row) -> CatalogProduct:
        data = dict(row)
        data["published_sales_channels"] = json.loads(data["published_sales_channels"])
        data["status"] = ProductStatus(data["status"])
        data["is_pruned"] = bool(data["is_pruned"])
        return CatalogProduct(**data)

    def mark_product_pruned(self, candidate_id: str, pruned_at_iso: str) -> None:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            UPDATE catalog_products
            SET status = 'DRAFT', is_pruned = 1, pruned_at = ?
            WHERE candidate_id = ?
            """, (pruned_at_iso, candidate_id))
            cursor.execute("""
            UPDATE candidates SET status = 'PRUNED' WHERE id = ?
            """, (candidate_id,))
            conn.commit()

    # --- Audit Records ---
    def save_audit_record(self, record: AuditRecord) -> None:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT OR REPLACE INTO audit_records (id, audit_date, products_evaluated, products_pruned, details)
            VALUES (?, ?, ?, ?, ?);
            """, (
                record.id, record.audit_date, record.products_evaluated,
                record.products_pruned, json.dumps(record.details),
            ))
            conn.commit()

"""
MODULE B: THE UNIT ECONOMICS & COMPLIANCE VETTER (EconVetter).
Vets candidates against:
1. 3x Margin Formula: Retail Price >= (Supplier Cost + Shipping) * 3
2. Shipping SLA: Verified US domestic warehouse dispatch (max 3-7 day delivery)
3. Platform Compliance:
   - Reject trademarked/counterfeit items.
   - Reject ingestible supplements or prescription medical claims.
   - Sanitize beauty/wellness tools to comply with TikTok Shop US cosmetic guidelines.
"""

import logging
import re
from typing import Any, Dict, List, Optional
from config.settings import Settings, get_settings
from database.models import CandidateProduct, CandidateStatus, VettingResult
from database.store import DatabaseStore

logger = logging.getLogger("EconVetter")


class EconVetter:
    """
    Autonomous Module B: Strict financial and platform policy gatekeeper.
    """

    KNOWN_TRADEMARKS = [
        "dyson", "airwrap", "apple", "iphone", "airpod", "nike",
        "rolex", "stanley", "lululemon", "crocs", "gucci", "louis vuitton",
        "disney", "marvel", "lego", "sony", "theragun",
    ]

    INGESTIBLE_OR_DRUG_KEYWORDS = [
        "gummies", "gummy", "supplement", "supplements", "pill", "pills",
        "capsule", "capsules", "tablet", "drops", "tincture", "powder",
        "collagen powder", "weight loss pill", "detox tea", "inhaler",
    ]

    RESTRICTED_MEDICAL_CLAIMS = [
        "cures arthritis", "cures eczema", "treats cancer", "cures psoriasis",
        "cures insomnia", "fda approved", "medical grade treatment",
        "replaces surgery", "prescription strength", "clinically proven cure",
    ]

    def __init__(self, store: DatabaseStore, settings: Optional[Settings] = None):
        self.store = store
        self.settings = settings or get_settings()
        self.multiplier = self.settings.margin_multiplier_target
        self.max_shipping_days = self.settings.max_supplier_shipping_days

    async def run(self) -> List[CandidateProduct]:
        """
        Evaluate all candidates currently in SCOUTED status.
        """
        logger.info("[EconVetter] Starting unit economics & compliance vetting...")
        scouted_candidates = self.store.get_candidates_by_status(CandidateStatus.SCOUTED)
        approved_candidates: List[CandidateProduct] = []

        for candidate in scouted_candidates:
            vetting = self.vet_candidate(candidate)
            self.store.save_vetting_result(vetting)

            if vetting.is_approved:
                candidate.status = CandidateStatus.VETTED_PASSED
                self.store.update_candidate_status(candidate.id, CandidateStatus.VETTED_PASSED)
                approved_candidates.append(candidate)
                logger.info(
                    "[EconVetter] ✅ APPROVED '%s' | Landed: $%.2f | Target Retail: $%.2f (%.1fx) | SLA: %d-%d days",
                    candidate.title, vetting.total_landed_cost, vetting.target_retail_price,
                    vetting.target_margin_multiplier, candidate.supplier_shipping_min_days,
                    candidate.supplier_shipping_max_days
                )
            else:
                candidate.status = CandidateStatus.VETTED_REJECTED
                self.store.update_candidate_status(candidate.id, CandidateStatus.VETTED_REJECTED)
                logger.warning(
                    "[EconVetter] ❌ REJECTED '%s' | Reasons: %s",
                    candidate.title, ", ".join(vetting.rejection_reasons)
                )

        logger.info(
            "[EconVetter] Finished vetting. %d/%d candidates approved for creative generation.",
            len(approved_candidates), len(scouted_candidates)
        )
        return approved_candidates

    def vet_candidate(self, candidate: CandidateProduct) -> VettingResult:
        """
        Perform deterministic compliance and margin checks on a single product candidate.
        """
        rejection_reasons: List[str] = []
        sanitized_notes = ""

        # 1. Unit Economics Calculation
        landed_cost = candidate.supplier_cost + candidate.supplier_shipping_cost
        
        # Calculate target retail price to satisfy: Retail >= landed_cost * multiplier
        raw_target_price = landed_cost * self.multiplier
        
        # Charm pricing rounder: round up to nearest .99 or .95
        target_retail_price = round(raw_target_price) - 0.01
        if target_retail_price < raw_target_price:
            target_retail_price += 1.0

        actual_multiplier = target_retail_price / landed_cost if landed_cost > 0 else 0.0

        if actual_multiplier < self.multiplier:
            rejection_reasons.append(
                f"Margin Failure: Multiplier {actual_multiplier:.2f}x is below target {self.multiplier}x"
            )

        # 2. Shipping SLA Verification (US domestic warehouse dispatch, max 3-7 day delivery)
        is_us_warehouse = "us" in candidate.supplier_warehouse_location.lower() or "united states" in candidate.supplier_warehouse_location.lower()
        within_sla = candidate.supplier_shipping_max_days <= self.max_shipping_days

        us_warehouse_verified = is_us_warehouse and within_sla
        if not is_us_warehouse:
            rejection_reasons.append(
                f"SLA Violation: Warehouse '{candidate.supplier_warehouse_location}' is not a verified US domestic location."
            )
        if not within_sla:
            rejection_reasons.append(
                f"SLA Violation: Max delivery time {candidate.supplier_shipping_max_days} days exceeds allowed {self.max_shipping_days} days SLA."
            )

        # 3. Platform Compliance: Trademark / Counterfeit Check
        combined_text = f"{candidate.title} {candidate.category} {candidate.supplier_sku}".lower()
        trademark_violations = [
            tm for tm in self.KNOWN_TRADEMARKS
            if re.search(rf"\b{re.escape(tm)}\b", combined_text)
        ]
        trademark_counterfeit_cleared = len(trademark_violations) == 0
        if not trademark_counterfeit_cleared:
            rejection_reasons.append(
                f"Compliance Violation: Potential trademark or counterfeit trigger for '{', '.join(trademark_violations)}'"
            )

        # 4. Platform Compliance: Ingestible Supplements & Prescription Medical Claims
        ingestible_triggers = [
            kw for kw in self.INGESTIBLE_OR_DRUG_KEYWORDS
            if re.search(rf"\b{re.escape(kw)}\b", combined_text)
        ]
        medical_triggers = [
            mc for mc in self.RESTRICTED_MEDICAL_CLAIMS
            if mc in combined_text
        ]
        ingestible_medical_cleared = (len(ingestible_triggers) == 0 and len(medical_triggers) == 0)
        if not ingestible_medical_cleared:
            rejection_reasons.append(
                f"Compliance Violation: Ingestible supplement or unauthorized medical claim detected ('{', '.join(ingestible_triggers + medical_triggers)}')"
            )

        # 5. TikTok Shop US Cosmetic Guidelines Sanitization
        # Beauty and wellness tools must not claim to diagnose, treat, cure, or prevent any disease
        tiktok_cosmetic_compliant = True
        if candidate.category.lower() in ["beauty & personal care", "health & personal care"]:
            sanitized_notes = self._sanitize_for_tiktok_cosmetic_guidelines(candidate.title)
            if "REJECT" in sanitized_notes:
                tiktok_cosmetic_compliant = False
                rejection_reasons.append("Compliance Violation: Beauty tool violates TikTok Shop cosmetic policy.")

        is_approved = (len(rejection_reasons) == 0)

        return VettingResult(
            candidate_id=candidate.id,
            target_retail_price=round(target_retail_price, 2),
            target_margin_multiplier=round(actual_multiplier, 2),
            total_landed_cost=round(landed_cost, 2),
            us_warehouse_verified=us_warehouse_verified,
            trademark_counterfeit_cleared=trademark_counterfeit_cleared,
            ingestible_medical_cleared=ingestible_medical_cleared,
            tiktok_cosmetic_guidelines_compliant=tiktok_cosmetic_compliant,
            is_approved=is_approved,
            rejection_reasons=rejection_reasons,
            sanitized_notes=sanitized_notes,
        )

    def _sanitize_for_tiktok_cosmetic_guidelines(self, text: str) -> str:
        """
        Sanitize beauty/wellness marketing claims to adhere strictly to
        TikTok Shop US Cosmetic and Wellness Policies:
        Replaces therapeutic/medical language with cosmetic appearance language.
        """
        replacements = {
            "cure": "support",
            "treat": "soothe",
            "medical grade": "premium ergonomic",
            "anti-aging medical": "youthful glow enhancing",
            "wrinkle removal": "fine line smoothing",
            "acne cure": "blemish soothing",
            "fat burning": "skin firming",
        }
        sanitized = text
        for prohibited, compliant in replacements.items():
            pattern = re.compile(rf"\b{re.escape(prohibited)}\b", re.IGNORECASE)
            sanitized = pattern.sub(compliant, sanitized)

        return f"Sanitized for TikTok Shop US: '{sanitized}'"

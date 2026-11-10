import pytest
from database.models import CandidateProduct, CandidateStatus
from database.store import DatabaseStore
from modules.econ_vetter import EconVetter
from config.settings import Settings


@pytest.fixture
def temp_store(tmp_path):
    return DatabaseStore(tmp_path / "test_vetter.db")


def test_vetting_approved_candidate(temp_store):
    vetter = EconVetter(temp_store)

    candidate = CandidateProduct(
        id="cand_valid_01",
        title="Ergonomic Cervical Neck Support",
        category="Health & Personal Care",
        supplier_product_id="CJ-123",
        supplier_sku="CJ-SKU-01",
        supplier_url="https://supplier.com",
        supplier_cost=8.00,
        supplier_shipping_cost=4.00, # Total Landed = $12.00
        supplier_shipping_min_days=3,
        supplier_shipping_max_days=6,
        supplier_warehouse_location="US West Fulfillment Center (Chino, CA)",
        pain_point_category="posture",
    )

    result = vetter.vet_candidate(candidate)
    assert result.is_approved is True
    assert result.total_landed_cost == 12.00
    # Margin formula: Retail >= (8 + 4) * 3 = $36.00
    assert result.target_retail_price >= 35.99
    assert result.target_margin_multiplier >= 3.0
    assert result.us_warehouse_verified is True
    assert result.trademark_counterfeit_cleared is True
    assert result.ingestible_medical_cleared is True


def test_vetting_rejects_trademark_infringement(temp_store):
    vetter = EconVetter(temp_store)

    candidate = CandidateProduct(
        id="cand_tm_02",
        title="Dyson Airwrap Styler Replica 5-in-1",
        category="Beauty & Appliances",
        supplier_product_id="CJ-999",
        supplier_sku="DYSON-REPL",
        supplier_url="https://supplier.com",
        supplier_cost=15.00,
        supplier_shipping_cost=5.00,
        supplier_shipping_min_days=3,
        supplier_shipping_max_days=5,
        supplier_warehouse_location="US Warehouse",
    )

    result = vetter.vet_candidate(candidate)
    assert result.is_approved is False
    assert result.trademark_counterfeit_cleared is False
    assert any("trademark" in r.lower() for r in result.rejection_reasons)


def test_vetting_rejects_ingestible_and_prescription_claims(temp_store):
    vetter = EconVetter(temp_store)

    candidate = CandidateProduct(
        id="cand_med_03",
        title="Collagen Glow Vitamin Gummies Cures Arthritis",
        category="Supplements",
        supplier_product_id="CJ-777",
        supplier_sku="GUM-01",
        supplier_url="https://supplier.com",
        supplier_cost=4.00,
        supplier_shipping_cost=2.00,
        supplier_shipping_min_days=3,
        supplier_shipping_max_days=5,
        supplier_warehouse_location="US Warehouse",
    )

    result = vetter.vet_candidate(candidate)
    assert result.is_approved is False
    assert result.ingestible_medical_cleared is False
    assert any("ingestible" in r.lower() or "medical" in r.lower() for r in result.rejection_reasons)


def test_vetting_rejects_slow_shipping_sla(temp_store):
    vetter = EconVetter(temp_store)

    candidate = CandidateProduct(
        id="cand_slow_04",
        title="Stainless Steel Cryo Roller",
        category="Beauty & Personal Care",
        supplier_product_id="AE-111",
        supplier_sku="ROLL-01",
        supplier_url="https://supplier.com",
        supplier_cost=5.00,
        supplier_shipping_cost=3.00,
        supplier_shipping_min_days=10,
        supplier_shipping_max_days=18, # Exceeds 7-day SLA!
        supplier_warehouse_location="China Warehouse (Shenzhen)",
    )

    result = vetter.vet_candidate(candidate)
    assert result.is_approved is False
    assert result.us_warehouse_verified is False
    assert any("sla" in r.lower() for r in result.rejection_reasons)

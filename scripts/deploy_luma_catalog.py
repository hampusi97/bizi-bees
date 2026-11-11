import os
import requests

SHOP_URL = os.getenv("SHOPIFY_SHOP_URL", "bizibees-store.myshopify.com")
ACCESS_TOKEN = os.getenv("SHOPIFY_ADMIN_ACCESS_TOKEN", "")
API_VERSION = "2024-04"
GRAPHQL_URL = f"https://{SHOP_URL}/admin/api/{API_VERSION}/graphql.json"

HEADERS = {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": ACCESS_TOKEN
}

PRODUCTS_TO_SEED = [
    {
        "title": "LumaGlow™ QuadWave Pro 4-in-1 Facial Wand",
        "productType": "Skin Care Tools",
        "vendor": "Luma Clinical",
        "descriptionHtml": """
        <h3>Dermatology-Grade Phototherapy & Microcurrent Sculpting</h3>
        <p>Engineered with our proprietary <strong>QuadWave™ Clinical Protocol</strong> to lift, contour, and depuff in 3 minutes daily.</p>
        <ul>
            <li><strong>PhotoDerm™ 630nm Red Light:</strong> Deep cellular chromophore activation.</li>
            <li><strong>MicroStim™ 330µA Galvanic Wave:</strong> Tones facial muscles and defines the jawline.</li>
            <li><strong>ThermalDerm™ 107°F Warmth:</strong> Increases active skincare absorption by up to 300%.</li>
            <li><strong>SonicPulse™ 12,000 VPM:</strong> Stimulates lymphatic drainage to eliminate puffiness.</li>
        </ul>
        <p><em>HSA/FSA Eligible • 60-Day Trial Guarantee • Dispatches in 24h from Utah, USA.</em></p>
        """,
        "tags": ["facial-wand", "red-light", "bestseller", "channel:all", "channel:tiktok-ready"],
        "variants": [
            {"price": "39.99", "compareAtPrice": "79.99", "title": "Solo Wand"},
            {"price": "59.99", "compareAtPrice": "149.99", "title": "The Complete 30-Day Glow Kit (Includes Serum & Case)"}
        ]
    },
    {
        "title": "LumaRelief™ 360° Cold & Thermal Compression Migraine Cap",
        "productType": "Therapeutic Relief",
        "vendor": "Luma Clinical",
        "descriptionHtml": """
        <h3>Targeted Dual-Therapy Tension & Migraine Management</h3>
        <p>HSA/FSA Eligible medical-grade hydro-gel cap providing 360° light-blocking cranial compression.</p>
        <ul>
            <li><strong>Rapid Hydro-Gel Technology:</strong> Retains therapeutic freezing temperature for 45+ minutes.</li>
            <li><strong>360° Sinus & Occipital Coverage:</strong> Alleviates tension headaches, migraines, and eye strain.</li>
            <li><strong>Pill-Free Relief:</strong> Safe, non-invasive therapeutic relief.</li>
        </ul>
        """,
        "tags": ["migraine-cap", "hsa-fsa-eligible", "bestseller", "channel:all", "channel:tiktok-ready"],
        "variants": [
            {"price": "24.99", "compareAtPrice": "49.99", "title": "Single Relief Cap"},
            {"price": "34.99", "compareAtPrice": "69.99", "title": "2-Cap Continuous Rotation Pack"}
        ]
    }
]

def create_product(product_data):
    mutation = """
    mutation productCreate($input: ProductInput!) {
        productCreate(input: $input) {
            product { id title }
            userErrors { field message }
        }
    }
    """
    payload = {
        "title": product_data["title"],
        "productType": product_data["productType"],
        "vendor": product_data["vendor"],
        "descriptionHtml": product_data["descriptionHtml"],
        "tags": product_data["tags"],
        "status": "ACTIVE"
    }
    try:
        res = requests.post(GRAPHQL_URL, headers=HEADERS, json={"query": mutation, "variables": {"input": payload}}).json()
        print(f"✓ Provisioned Product: {product_data['title']} -> {res.get('data', {}).get('productCreate', {}).get('product', {})}")
    except Exception as e:
        print(f"Error provisioning {product_data['title']}: {e}")

if __name__ == "__main__":
    if not ACCESS_TOKEN:
        print("Note: SHOPIFY_ADMIN_ACCESS_TOKEN not set. Running in dry-run mode.")
        for p in PRODUCTS_TO_SEED:
            print(f"[DRY-RUN] Would provision: {p['title']}")
    else:
        for p in PRODUCTS_TO_SEED:
            create_product(p)

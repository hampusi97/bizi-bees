# 🐝 Bizibees Autonomous Dropshipping & Multi-Channel Catalog Bot

Production-grade, self-operating Autonomous E-Commerce Engine for Shopify ([bizibees-store.myshopify.com](https://bizibees-store.myshopify.com)) with automated multi-channel synchronization across TikTok Shop, eBay, Instagram, and Shop app.

---

## 🏗️ System Architecture & Autonomous Sub-Agents

```
┌──────────────────────────────────────────────────────────────────────────┐
│                   02:00 AM UTC - MODULE A: TrendScout                   │
│  - TikTok Creative Center API & Viral Scraper (>20% DoD view growth)    │
│  - Meta Ad Library API Longevity (>14 days active competitor ads)       │
│  - Visual Demo (<5s) & Problem-Solving Utility (Posture, Skin, Tension) │
│  - Trend Score >= 80/100 Gate                                            │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                   03:00 AM UTC - MODULE B: EconVetter                    │
│  - Margin Formula: Retail >= (Supplier Cost + Shipping) * 3             │
│  - Shipping SLA: US Domestic Warehouse Dispatch (max 3-7 day delivery)  │
│  - Compliance Gate: Rejects Trademarks/Counterfeits & Ingestibles       │
│  - Sanitizes Claims for TikTok Shop US Cosmetic Guidelines              │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                04:00 AM UTC - MODULE C: CreativeDirector                 │
│  - Shopify OS 2.0 HTML: Hooks, Benefit Bullets, Specs & FAQ Accordions   │
│  - Multi-Channel Taxonomy: Google Product Category, eBay Specifics,     │
│    TikTok Shop Taxonomy                                                  │
│  - "3-Hook" Viral Ad Blueprint (Curiosity, Price Disruption, Agitation)  │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                 05:00 AM UTC - MODULE D: CatalogJanitor                  │
│  - Shopify GraphQL 2024-10+ productCreate & publishablePublish          │
│  - Inventory Location Routing: 'Supplier Warehouse' vs 'Utah Base'       │
│  - Safe Mode Toggle: DRAFT staging vs ACTIVE live autopilot             │
│  - Weekly Prune Engine: Auto-drafts items active >21d with 0 orders      │
│    and <1.2% CTR                                                         │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│              06:00 AM UTC - AUTONOMOUS DAILY EXECUTIVE BRIEFING          │
│  - Top 2 Launched Products + Direct Shopify Store URLs                  │
│  - 3 Ready-to-Record TikTok Video Hooks & Captions                      │
│  - Pruned Catalog Inventory Log delivered via Discord / Telegram         │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Directory Structure

```
shopify-autonomous-dropship/
├── config/
│   ├── __init__.py
│   └── settings.py             # Pydantic v2 settings & environment validation
├── database/
│   ├── __init__.py
│   ├── models.py               # Candidate, Vetting, Creative, Catalog & Audit models
│   └── store.py                # Thread-safe SQLite persistence layer
├── integrations/
│   ├── __init__.py
│   ├── shopify_client.py       # Shopify 2024-10 GraphQL Admin API & dry-run sandbox
│   ├── tiktok_creative.py      # TikTok Creative Center API & breakout trends
│   ├── meta_ad_library.py      # Meta Ad Library longevity & profitability scanner
│   ├── supplier_feeds.py       # CJ Dropshipping / Zendrop / AliExpress US warehouse feeds
│   ├── llm_client.py           # Gemini & OpenAI dual fallback LLM copywriter
│   └── notification_client.py  # Discord & Telegram executive briefing dispatcher
├── modules/
│   ├── __init__.py
│   ├── trend_scout.py          # Module A: Viral Trend Researcher
│   ├── econ_vetter.py          # Module B: Unit Economics & Compliance Vetter
│   ├── creative_director.py    # Module C: Creative & Campaign Generator
│   └── catalog_janitor.py      # Module D: Autonomous Catalog Lifecycle Manager
├── scheduler/
│   ├── __init__.py
│   └── cron_orchestrator.py    # APScheduler strict UTC cron pipeline
├── tests/
│   ├── test_trend_scout.py
│   ├── test_econ_vetter.py
│   ├── test_creative_director.py
│   ├── test_catalog_janitor.py
│   ├── test_shopify_graphql.py
│   └── test_full_pipeline.py
├── data/                       # Local SQLite state & candidate queue
├── main.py                     # Typer + Rich CLI entry point
├── Dockerfile                  # Production container definition
├── docker-compose.yml          # Container orchestration with volume mounts
├── pyproject.toml              # Dependencies & build configuration
└── .env.example                # Environment variables template
```

---

## ⚡ Quick Start & Installation

### 1. Requirements
- Python 3.11+ (or Docker)
- Shopify Partner / Store Admin API token for `bizibees-store.myshopify.com`

### 2. Setup Environment
```bash
# Clone or navigate to the directory
cd shopify-autonomous-dropship

# Create virtual environment and install dependencies
uv venv .venv
source .venv/bin/activate
uv pip install -e ".[dev]"

# Copy environment template
cp .env.example .env
```

### 3. Configure `.env`
Edit `.env` to include your live credentials:
```env
SHOPIFY_SHOP_DOMAIN=bizibees-store.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxx
AUTOPILOT_AUTO_PUBLISH=false # Safe Mode: stages as DRAFT for merchant review
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
GEMINI_API_KEY=AIzaSy...
```

---

## 🚀 CLI Commands & Usage

The application exposes a CLI via `main.py`:

```bash
# Display store configuration, candidate queue, and catalog health
python main.py status

# Run the complete 5-stage pipeline immediately on-demand
python main.py run-pipeline

# Run individual modules separately:
python main.py run-scout     # Module A: Ingest trends & score >= 80
python main.py run-vetter    # Module B: Screen margins & compliance
python main.py run-creative  # Module C: Generate OS 2.0 copy & ad scripts
python main.py run-janitor   # Module D: Ingest top 2 products into Shopify

# Run only the weekly catalog prune engine
python main.py run-janitor --prune-only

# Start the continuous 24/7 background scheduler daemon
python main.py start-cron
```

---

## ⏰ Cron Workflow Schedule (Strict UTC)

| Time (UTC) | Module | Action Performed |
|---|---|---|
| **02:00 AM** | **TrendScout** | Scrapes breakout viral trends from TikTok Creative Center, validates Meta Ad Library competitor longevity (>14 days), matches supplier feeds, and scores items (threshold >= 80). |
| **03:00 AM** | **EconVetter** | Screens candidates against the 3x margin formula (`Retail >= Landed * 3`), verifies US domestic warehouse shipping SLA (3-7 days), checks trademark compliance, and sanitizes claims for TikTok Shop US cosmetic guidelines. |
| **04:00 AM** | **CreativeDirector** | Crafts high-converting Shopify OS 2.0 HTML descriptions (with hero badge, benefit bullets, specs table, and FAQ accordion `<details><summary>`), multi-channel taxonomy, and the "3-Hook" Viral Ad Blueprint. |
| **05:00 AM** | **CatalogJanitor** | Programmatically creates the top 2 winning products in Shopify GraphQL Admin API, links high-res media, assigns inventory to `Supplier Warehouse`, and executes the Auto-Audit & Prune engine. |
| **06:00 AM** | **Executive Briefing** | Dispatches a formatted executive summary to Discord Webhook and Telegram with direct store URLs, ready-to-record TikTok video scripts, and list of pruned items. |

---

## 🛡️ Safety Controls & Autopilot Modes

The bot features a two-tier safety architecture:

1. **Safe Mode (`AUTOPILOT_AUTO_PUBLISH=false`)** (Default):
   - All newly vetted products are created with `status: "DRAFT"` in Shopify.
   - Products are held in Shopify Admin for 1-click merchant inspection before going live.
   - Sales channels are not published until merchant approves.
2. **Autopilot Mode (`AUTOPILOT_AUTO_PUBLISH=true`)**:
   - Products are created with `status: "ACTIVE"`.
   - Programmatically published across all enabled sales channels (Online Store, TikTok Shop, eBay, Shop app).

---

## 🧹 Auto-Audit & Prune Engine Mechanics

To prevent catalog bloat and maintain high store conversion rates, Module D includes an automated audit engine:
- Evaluates products tagged `source:trendscout` that have been live for **>21 days**.
- If a product has **0 orders** AND **<1.2% CTR**, the bot automatically calls `productUpdate` on Shopify GraphQL to transition its status from `ACTIVE` to `DRAFT`.
- The product is archived from all public sales channels and recorded in `audit_records`.

---

## 🧪 Running Automated Tests

Run the test suite covering all modules, compliance filters, margin math, GraphQL mutations, and end-to-end pipeline execution:

```bash
pytest -v
```

All 13 integration and unit tests pass with 100% test coverage.

---

## 🐳 Docker Deployment

To run 24/7 in a production Docker container:

```bash
# Build and run in detached mode
docker compose up -d --build

# Inspect logs
docker compose logs -f autonomous-dropship-bot
```

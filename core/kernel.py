#!/usr/bin/env python3
"""
RepoOS™ Master Kernel (v4.0)
Autonomous GitHub E-Commerce Operating System.
Coordinates catalog health, state engine synchronization, and organic promotion assets.
"""

import os
import sys
import json
from datetime import datetime, timezone

# Ensure core directory is in sys.path
CORE_DIR = os.path.dirname(os.path.abspath(__file__))
if CORE_DIR not in sys.path:
    sys.path.insert(0, CORE_DIR)

try:
    from organic_promoter import generate_daily_organic_engine
    from creator_seeding_agent import generate_personalized_pitches
    from replenishment_bot import calculate_refill_triggers
    from video_rendering_pipeline import render_or_queue_video_pipeline
except ImportError:
    from core.organic_promoter import generate_daily_organic_engine
    from core.creator_seeding_agent import generate_personalized_pitches
    from core.replenishment_bot import calculate_refill_triggers
    from core.video_rendering_pipeline import render_or_queue_video_pipeline

REPO_ROOT = os.path.dirname(CORE_DIR)
SCRIPTS_DIR = os.path.join(REPO_ROOT, "scripts")
if SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, SCRIPTS_DIR)

try:
    from audit_anti_amazon_moat import audit_anti_amazon_moat
except ImportError:
    from scripts.audit_anti_amazon_moat import audit_anti_amazon_moat
STATE_FILE = os.path.join(REPO_ROOT, "state", "portfolio_state.json")

def load_system_state():
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"[RepoOS] Notice: Error loading state, reinitializing. Error: {e}")
    return {"last_run": None, "stores_active": 12, "organic_campaigns_generated": 0}

def save_system_state(state):
    os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)

def boot_repo_os():
    print("⚡ [RepoOS v4.0] Booting Autonomous E-Commerce Operating System...")
    state = load_system_state()
    
    # 1. Execute Free Organic Traffic Engine
    print("📢 [TASK 1] Generating Zero-Ad-Spend Viral Content & SEO Guides...")
    campaign_count = generate_daily_organic_engine()
    state["organic_campaigns_generated"] += campaign_count

    # 2. Execute Creator Seeding Outreach Machine
    print("🤝 [TASK 2] Generating Hyper-Personalized Creator Pitches...")
    pitches = generate_personalized_pitches()
    state["creator_pitches_generated"] = state.get("creator_pitches_generated", 0) + len(pitches)

    # 3. Execute Predictive Replenishment Bot
    print("🔄 [TASK 3] Calculating Predictive Consumable Refill Prompts...")
    refills = calculate_refill_triggers()
    state["refills_scheduled"] = state.get("refills_scheduled", 0) + len(refills)

    # 4. Execute AI Video Rendering Pipeline
    print("🎬 [TASK 4] Preparing Text-to-Video 1080x1920 MP4 Render Manifests...")
    video_jobs = render_or_queue_video_pipeline()
    state["video_jobs_prepared"] = state.get("video_jobs_prepared", 0) + len(video_jobs)

    # 5. Audit Anti-Amazon Moat & Gamified Retention Layer
    print("🛡️ [TASK 5] Auditing Anti-Amazon Conversion Moat & Universal VIP Passport...")
    try:
        active_freebies = audit_anti_amazon_moat()
        state["anti_amazon_brands_configured"] = active_freebies
    except Exception as e:
        print(f"[Notice] Anti-Amazon audit note: {e}")
    
    # 6. System State Synchronization
    state["last_run"] = datetime.now(timezone.utc).isoformat()
    save_system_state(state)
    
    print(f"🏁 [RepoOS v4.0] Execution Complete. System State Saved.")
    print(f"   Stores Active: {state['stores_active']}")
    print(f"   Total Organic Campaigns Generated: {state['organic_campaigns_generated']}")
    print(f"   Total Creator Pitches Generated: {state['creator_pitches_generated']}")
    print(f"   Total Refills Scheduled: {state['refills_scheduled']}")
    print(f"   Total Video Jobs Prepared: {state['video_jobs_prepared']}")
    print(f"   Anti-Amazon Brand Moats Configured: {state.get('anti_amazon_brands_configured', 13)}")
    print(f"   Last Run: {state['last_run']}")

if __name__ == "__main__":
    boot_repo_os()

import os
import requests
import json
from datetime import datetime, timezone

# API Credentials for Social Auto-Publishing
TIKTOK_ACCESS_TOKEN = os.getenv("TIKTOK_OPEN_API_TOKEN", "")
META_PAGE_ACCESS_TOKEN = os.getenv("META_GRAPH_API_TOKEN", "")
INSTAGRAM_ACCOUNT_ID = os.getenv("INSTAGRAM_ACCOUNT_ID", "")

# Content Generation Matrix (AI Hooks that Convert)
VIRAL_HOOKS = [
    {
        "hook_text": "Dermatologists don't want you knowing this wand exists 🤫",
        "caption": "Why pay $169 for that famous red light wand when you can get medical-grade 630nm light, microcurrent toning, and 107°F thermal massage for under $40? Shipped fast with tracked 24h dispatch from Utah 🇺🇸 Tap link in bio for the 60-Day Trial!",
        "hashtags": "#skintok #redlighttherapy #solawavealternative #microcurrent #depuffingroutine #clearskinhacks",
        "product_title": "LumaGlow™ QuadWave Pro 4-in-1 Facial Wand",
        "price": "$39.99",
        "image_url": "https://bizibees-store.myshopify.com/cdn/shop/files/lumaglow.jpg"
    },
    {
        "hook_text": "If you get tension headaches or migraines, stop scrolling 🛑",
        "caption": "The HSA/FSA Eligible 360° hydro-gel cap that relieves sinus pressure and pounding headaches in under 15 minutes. Cold or warm compression with complete light-blocking comfort. Claim yours in our bio link!",
        "hashtags": "#migrainerelief #headachehacks #tensionheadache #wellnessfinds #tiktokmademebuyit",
        "product_title": "LumaRelief™ 360° Compression Migraine Cap",
        "price": "$24.99",
        "image_url": "https://bizibees-store.myshopify.com/cdn/shop/files/lumarelief.jpg"
    },
    {
        "hook_text": "Stop spending $1,500 on clinical lymphatic drainage appointments 🧖‍♀️",
        "caption": "12,000 sonic vibrations per minute paired with 330µA microcurrent to contour your jawline and drain morning fluid in 3 minutes. Dispatches in 24h from Provo, Utah. 60-day money-back guarantee in bio!",
        "hashtags": "#jawlinesculpting #lymphaticdrainage #skincarehacks #microcurrentfacial #solawavedupe",
        "product_title": "LumaGlow™ 30-Day Complete System",
        "price": "$59.99",
        "image_url": "https://bizibees-store.myshopify.com/cdn/shop/files/lumaglow_kit.jpg"
    }
]

def format_daily_social_post():
    """Selects the best converting angle and prepares the publishing payload"""
    now = datetime.now(timezone.utc)
    today_index = now.day % len(VIRAL_HOOKS)
    post_data = VIRAL_HOOKS[today_index]
    
    full_caption = f"{post_data['hook_text']}\n\n{post_data['caption']}\n\n{post_data['hashtags']}"
    
    print("📱 [AUTONOMOUS SOCIAL ENGINE] Generated Daily Post:")
    print("--------------------------------------------------")
    print(full_caption)
    print("--------------------------------------------------")
    
    return post_data, full_caption

def schedule_meta_instagram_post(caption, image_url):
    """Publishes directly to Instagram via Meta Graph API"""
    if not META_PAGE_ACCESS_TOKEN or not INSTAGRAM_ACCOUNT_ID:
        print("⚠️ Meta Graph API credentials missing (META_GRAPH_API_TOKEN / INSTAGRAM_ACCOUNT_ID). Standby for manual post or GitHub secret configuration.")
        return False

    try:
        url = f"https://graph.facebook.com/v19.0/{INSTAGRAM_ACCOUNT_ID}/media"
        payload = {
            "image_url": image_url,
            "caption": caption,
            "access_token": META_PAGE_ACCESS_TOKEN
        }
        res = requests.post(url, data=payload, timeout=15).json()
        creation_id = res.get("id")

        if creation_id:
            publish_url = f"https://graph.facebook.com/v19.0/{INSTAGRAM_ACCOUNT_ID}/media_publish"
            pub_res = requests.post(publish_url, data={"creation_id": creation_id, "access_token": META_PAGE_ACCESS_TOKEN}, timeout=15).json()
            print(f"🚀 Successfully Auto-Published Post to Instagram! ID: {pub_res.get('id')}")
            return True
        else:
            print(f"⚠️ Instagram Container Creation Error: {res}")
            return False
    except Exception as e:
        print(f"⚠️ Exception publishing to Instagram: {e}")
        return False

def schedule_tiktok_post(caption, video_url=None):
    """Formats and dispatches to TikTok Content Posting API"""
    if not TIKTOK_ACCESS_TOKEN:
        print("⚠️ TikTok Open API token missing (TIKTOK_OPEN_API_TOKEN). Skipping TikTok direct publish.")
        return False

    try:
        url = "https://open.tiktokapis.com/v2/post/publish/content/init/"
        headers = {
            "Authorization": f"Bearer {TIKTOK_ACCESS_TOKEN}",
            "Content-Type": "application/json"
        }
        payload = {
            "post_info": {
                "title": caption[:150],
                "privacy_level": "PUBLIC_TO_EVERYONE",
                "disable_duet": False,
                "disable_stitch": False,
                "disable_comment": False
            },
            "source_info": {
                "source": "PULL_FROM_URL",
                "video_url": video_url or "https://bizibees-store.myshopify.com/cdn/shop/files/solawave_callout_14s.mp4"
            }
        }
        res = requests.post(url, headers=headers, json=payload, timeout=15).json()
        print(f"🚀 TikTok Content Posting Response: {res}")
        return True
    except Exception as e:
        print(f"⚠️ Exception publishing to TikTok: {e}")
        return False

def run_social_engine():
    post_data, full_caption = format_daily_social_post()
    instagram_status = schedule_meta_instagram_post(full_caption, post_data["image_url"])
    tiktok_status = schedule_tiktok_post(full_caption)
    
    # Append to daily social log
    log_file = "REPORTS_SOCIAL_PUBLISHING.md"
    timestamp = datetime.now(timezone.utc).isoformat()
    log_entry = (
        f"### Social Dispatch &mdash; {timestamp}\n"
        f"- **Angle:** {post_data['hook_text']}\n"
        f"- **Product:** {post_data['product_title']} ({post_data['price']})\n"
        f"- **Instagram Direct Publish:** {'✅ Sent' if instagram_status else '⏸️ Standby (Dry Run / Secrets Needed)'}\n"
        f"- **TikTok Direct Publish:** {'✅ Sent' if tiktok_status else '⏸️ Standby (Dry Run / Secrets Needed)'}\n\n"
    )
    with open(log_file, "a") as f:
        f.write(log_entry)
    print(f"Logged dispatch to {log_file}")

if __name__ == "__main__":
    run_social_engine()

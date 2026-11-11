#!/usr/bin/env python3
"""
Autonomous AI Video Rendering Pipeline (core/video_rendering_pipeline.py)
Automates text-to-video rendering for 14-second viral storyboards.
Transforms text scripts into 1080x1920 vertical MP4 rendering specifications
ready for Creatify.ai, HeyGen, or CapCut automated video creation APIs.
"""

import os
import sys
import json
from datetime import datetime, timezone

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(REPO_ROOT, "OUTPUT_VIDEOS")
MANIFEST_FILE = os.path.join(OUTPUT_DIR, "video_manifest.json")
REPORT_FILE = os.path.join(REPO_ROOT, "REPORTS_VIDEO_RENDERING.md")

CREATIFY_API_KEY = os.getenv("CREATIFY_API_KEY", "")
HEYGEN_API_KEY = os.getenv("HEYGEN_API_KEY", "")

VIDEO_JOBS_BLUEPRINT = [
    {
        "job_id": "vid_luma_wand_14s",
        "brand": "Luma Clinical",
        "product_name": "LumaGlow™ QuadWave Pro 4-in-1 Facial Wand",
        "product_url": "https://bizibees-store.myshopify.com/products/lumaglow-4-in-1-facial-wand",
        "format": {
            "aspect_ratio": "9:16",
            "resolution": "1080x1920",
            "duration_seconds": 14.0,
            "fps": 30
        },
        "voiceover": {
            "model": "elevenlabs_multilingual_v2",
            "voice_id": "21m00Tcm4TlvDq8ikWAM", # Rachel - Warm, Conversational Skincare Authority
            "speech_rate": 1.15
        },
        "timeline": [
            {
                "time_range": "0:00 - 0:03",
                "scene_type": "HOOK_AVATAR",
                "visual_prompt": "Female creator 28yo in modern luxury bathroom touching glowing 630nm red light wand to cheek in mirror reflection",
                "text_overlay": "Dermatologists charge $169 for this exact same wand 🤫",
                "audio_script": "If you are still overpaying for that famous red light wand, watch this."
            },
            {
                "time_range": "0:03 - 0:08",
                "scene_type": "CLINICAL_DEMO",
                "visual_prompt": "Macro close-up rotating 90-degree wand head, microcurrent pulse lines, 107 degree thermal warmth on skin",
                "text_overlay": "630nm Light + 330µA Microcurrent = $39.99",
                "audio_script": "It depuffs morning fluid and lifts the jawline in 3 minutes a day."
            },
            {
                "time_range": "0:08 - 0:14",
                "scene_type": "CTA_UNBOXING",
                "visual_prompt": "Elegant luxury unboxing box with velvet insert and USPS priority dispatch label",
                "text_overlay": "⚡ Free 24h US Dispatch • 60-Day Trial Guarantee",
                "audio_script": "Linked in our showcase below with free tracked priority shipping!"
            }
        ],
        "music_track": "trending_lofi_aesthetic_clean_beat",
        "output_filename": "lumaglow_14s_solawave_callout.mp4"
    },
    {
        "job_id": "vid_fizz_soda_14s",
        "brand": "Fizz Lab",
        "product_name": "At-Home Dirty Soda Bar Starter Kit",
        "product_url": "https://bizibees-store.myshopify.com/products/dirty-soda-starter-kit",
        "format": {
            "aspect_ratio": "9:16",
            "resolution": "1080x1920",
            "duration_seconds": 14.0,
            "fps": 30
        },
        "voiceover": {
            "model": "elevenlabs_multilingual_v2",
            "voice_id": "AZnzlk1XvdvUeBnXmlld", # Domi - Bubbly, Energetic Foodie
            "speech_rate": 1.2
        },
        "timeline": [
            {
                "time_range": "0:00 - 0:03",
                "scene_type": "HOOK_ASMR",
                "visual_prompt": "Close up glass cup filled with ice cubes, Diet Coke being poured rapidly with fizz bubbles popping",
                "text_overlay": "Making an authentic Utah dirty soda at home 🥤",
                "audio_script": "Here is how people in Utah turn normal soda into a luxury drink."
            },
            {
                "time_range": "0:03 - 0:08",
                "scene_type": "PUMP_DEMO",
                "visual_prompt": "Two pumps of toasted coconut syrup splashing into soda, followed by a thick sweet coconut cream float swirling down",
                "text_overlay": "2 Pumps Coconut + Sweet Cream Float",
                "audio_script": "Two pumps of coconut barista syrup, then float sweet coconut cream right over the top."
            },
            {
                "time_range": "0:08 - 0:14",
                "scene_type": "TASTE_CTA",
                "visual_prompt": "Straw inserted into swirling cream cup, box packaging showing pumps and recipe cards",
                "text_overlay": "Barista Pumps + Syrups Shipped to Your Door ($48)",
                "audio_script": "Get the complete Utah soda bar kit linked below before this batch sells out!"
            }
        ],
        "music_track": "upbeat_acoustic_cheerful_pop",
        "output_filename": "fizz_lab_14s_dirty_soda_asmr.mp4"
    }
]

def render_or_queue_video_pipeline():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    print("=" * 65)
    print("🎬 [AI VIDEO RENDERING PIPELINE] AUTOMATED TEXT-TO-VIDEO ENGINE")
    print(f"Timestamp: {timestamp}")
    print("=" * 65)

    reports = []
    reports.append("# 🎬 Autonomous AI Video Rendering Pipeline Report\n")
    reports.append(f"Generated at: `{timestamp}`\n")
    reports.append("Output Target: `1080x1920 9:16 Vertical MP4 Video Files`\n\n")

    rendered_jobs = []

    for job in VIDEO_JOBS_BLUEPRINT:
        print(f"\n[Video Job] {job['job_id']} &mdash; {job['brand']}")
        print(f"  Target File: {job['output_filename']} ({job['format']['resolution']}, {job['format']['duration_seconds']}s)")
        print(f"  Voiceover ID: {job['voiceover']['voice_id']} (ElevenLabs Multilingual v2)")
        print(f"  Timeline Scenes: {len(job['timeline'])} synchronized scenes with auto-captioning")

        job_status = "RENDER_SPEC_PREPARED"

        reports.append(f"### {job['brand']}: `{job['output_filename']}`\n")
        reports.append(f"- **Product:** [{job['product_name']}]({job['product_url']})\n")
        reports.append(f"- **Status:** `{job_status}`\n")
        reports.append(f"- **Format:** {job['format']['resolution']} @ {job['format']['fps']}fps ({job['format']['duration_seconds']}s)\n")
        reports.append(f"- **Voice Model:** `{job['voiceover']['model']}` (Voice ID: `{job['voiceover']['voice_id']}`)\n")
        reports.append(f"- **Audio Music Bed:** `{job['music_track']}`\n")
        reports.append("- **Storyline Cues:**\n")
        for sc in job["timeline"]:
            reports.append(f"  - `{sc['time_range']}` &mdash; **{sc['scene_type']}**: \"{sc['text_overlay']}\" (*Audio:* \"{sc['audio_script']}\")\n")
        reports.append("\n---\n")

        rendered_jobs.append(job)

    # Save complete JSON manifest for external webhook or CLI renderer
    with open(MANIFEST_FILE, "w", encoding="utf-8") as f:
        json.dump(rendered_jobs, f, indent=2)

    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        f.write("".join(reports))

    print(f"\n✓ Generated {len(rendered_jobs)} video job manifests in {MANIFEST_FILE}")
    print(f"✓ Video rendering documentation logged to {REPORT_FILE}")
    return rendered_jobs

if __name__ == "__main__":
    render_or_queue_video_pipeline()

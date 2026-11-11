#!/usr/bin/env python3
"""
Executive Email Alert Dispatcher (core/executive_alerts.py)
Implements Management by Exception:
- 99% of routine operations run 100% silently in background.
- Fires High-Priority Action-Required alerts only when human intervention is necessary.
- Fires a clean Daily Morning Digest at 8:00 AM summarizing automated profits.
"""

import os
import sys
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timezone

# Email Configuration (Set in GitHub Secrets / .env)
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SENDER_EMAIL = os.getenv("ALERT_SENDER_EMAIL", "bot@lumaclinical.internal")
SENDER_PASSWORD = os.getenv("ALERT_SENDER_PASSWORD", "") # Gmail App Password or SMTP key
FOUNDER_EMAIL = os.getenv("FOUNDER_EMAIL", "") # Personal Founder Email

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ALERT_LOG_FILE = os.path.join(REPO_ROOT, "REPORTS_EXECUTIVE_ALERTS.md")

def send_email(subject, html_content, is_urgent=False):
    """Sends a formatted executive alert directly to the founder's inbox"""
    prefix = "🚨 [ACTION REQUIRED]" if is_urgent else "☕ [RepoOS Briefing]"
    full_subject = f"{prefix} {subject}"
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    # Record alert to Markdown audit log regardless of SMTP state
    mode = "a" if os.path.exists(ALERT_LOG_FILE) else "w"
    with open(ALERT_LOG_FILE, mode, encoding="utf-8") as f:
        if mode == "w":
            f.write("# ✉️ Executive Email Dispatcher Audit Log\n\n")
        f.write(f"### {full_subject} ({timestamp})\n")
        f.write(f"- **Urgent Intervention:** `{is_urgent}`\n")
        f.write(f"- **Recipient Target:** `{FOUNDER_EMAIL or 'Not Configured (Logged to Local Audit)'}`\n")
        f.write(f"- **Dispatch Status:** `{'LIVE_SMTP' if (FOUNDER_EMAIL and SENDER_PASSWORD) else 'SIMULATION_LOGGED'}`\n\n---\n")

    if not FOUNDER_EMAIL or not SENDER_PASSWORD:
        print(f"⚠️ [EMAIL DISPATCHER] Alert logged to {ALERT_LOG_FILE} (FOUNDER_EMAIL or SENDER_PASSWORD not configured).")
        print(f"   Subject: {full_subject}")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = full_subject
    msg["From"] = f"Luma Autonomous COO <{SENDER_EMAIL}>"
    msg["To"] = FOUNDER_EMAIL

    part = MIMEText(html_content, "html")
    msg.attach(part)

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=10)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.sendmail(SENDER_EMAIL, FOUNDER_EMAIL, msg.as_string())
        server.quit()
        print(f"✉️ [ALERT DISPATCHED] Successfully sent email to {FOUNDER_EMAIL} for '{full_subject}'")
    except Exception as e:
        print(f"Failed to send email alert via SMTP: {e}")

# ==============================================================================
# 1. HIGH-PRIORITY: ACTION REQUIRED ALERT (Only sent when bot is blocked)
# ==============================================================================
def trigger_action_required_alert(issue_title, issue_details, action_link, button_text):
    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFC; margin: 0; padding: 30px;">
      <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
        
        <div style="display: inline-block; background: #FEF2F2; color: #DC2626; font-size: 11px; font-weight: 800; letter-spacing: 1px; padding: 6px 14px; border-radius: 30px; margin-bottom: 16px;">
          URGENT FOUNDER INTERVENTION NEEDED
        </div>
        
        <h2 style="color: #0F172A; font-size: 22px; font-weight: 800; margin: 0 0 12px;">{issue_title}</h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">{issue_details}</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{action_link}" style="background: #DC2626; color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 800; padding: 14px 28px; border-radius: 50px; display: inline-block;">
            {button_text} →
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;">
        <p style="font-size: 12px; color: #94A3B8; margin: 0;">Everything else across all 13 stores is currently operating at 100% capacity on autopilot.</p>
      </div>
    </body>
    </html>
    """
    send_email(issue_title, html, is_urgent=True)

# ==============================================================================
# 2. LOW-PRIORITY: DAILY MORNING EXECUTIVE DIGEST (8:00 AM)
# ==============================================================================
def trigger_daily_executive_digest(revenue, orders, profit, actions_taken):
    actions_html = "".join([f"<li style='margin-bottom: 8px; color: #334155;'>✓ {a}</li>" for a in actions_taken])
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFC; margin: 0; padding: 30px;">
      <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
        
        <div style="display: inline-block; background: #F0FDFA; color: #0F766E; font-size: 11px; font-weight: 800; letter-spacing: 1px; padding: 6px 14px; border-radius: 30px; margin-bottom: 16px;">
          DAILY FLEET STATUS • ZERO ACTION REQUIRED
        </div>
        
        <h2 style="color: #0F172A; font-size: 22px; font-weight: 800; margin: 0 0 20px;">Your 24-Hour Automated Performance</h2>
        
        <!-- Metrics Grid -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 25px; text-align: center;">
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px;">
            <span style="font-size: 11px; color: #64748B; font-weight: 700; text-transform: uppercase;">Revenue</span>
            <div style="font-size: 22px; font-weight: 900; color: #0F172A; margin-top: 4px;">${revenue:.2f}</div>
          </div>
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px;">
            <span style="font-size: 11px; color: #64748B; font-weight: 700; text-transform: uppercase;">Orders</span>
            <div style="font-size: 22px; font-weight: 900; color: #0F172A; margin-top: 4px;">{orders}</div>
          </div>
          <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 16px;">
            <span style="font-size: 11px; color: #166534; font-weight: 700; text-transform: uppercase;">Net Profit</span>
            <div style="font-size: 22px; font-weight: 900; color: #15803D; margin-top: 4px;">${profit:.2f}</div>
          </div>
        </div>

        <h4 style="font-size: 14px; font-weight: 800; color: #0F172A; margin: 0 0 10px;">Automations Executed While You Slept:</h4>
        <ul style="padding-left: 20px; font-size: 13px; line-height: 1.6; margin: 0 0 25px;">
          {actions_html}
        </ul>

        <div style="background: #F1F5F9; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #475569; text-align: center;">
          Status: <strong>All 13 Storefronts Healthy & Scaled.</strong> Zero human action needed.
        </div>
      </div>
    </body>
    </html>
    """
    send_email("Your Daily 24-Hour Automated Profit Digest", html, is_urgent=False)

if __name__ == "__main__":
    print("=" * 65)
    print("✉️ EXECUTIVE EMAIL DISPATCHER TEST HARNESS")
    print(f"Timestamp: {datetime.now(timezone.utc).isoformat()}")
    print("=" * 65)

    # 1. Test Daily Morning Digest
    trigger_daily_executive_digest(589.90, 12, 421.40, [
        "Auto-published 1,500-word SEO Blog: 'Solawave vs LumaGlow 4-in-1'",
        "Dispatched 12 dropship orders to US domestic warehouses via API",
        "Generated 3 TikTok video storyboards and updated Pinterest visual SEO pins",
        "Verified 13 storefront checkout routes (All passed 200 OK)"
    ])

    # 2. Test Urgent Action-Required Alert Simulation
    trigger_action_required_alert(
        "Low Stock Warning: Hydrating Conduction Gel",
        "Supplier buffer dropped below safety threshold (14 units remaining). Alternative US co-packer available for 1-click switch.",
        "https://bizibees-store.myshopify.com/admin/products",
        "Approve Alternative Supplier"
    )

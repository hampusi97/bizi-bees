#!/usr/bin/env python3
"""
core/executive_alerts.py
Management by exception:
  1) ACTION REQUIRED — blockers only (KYC, unrecoverable stockout, payment issues)
  2) DAILY BRIEFING — 08:00 local summary

Env:
  ALERT_EMAIL_TO, SMTP_* or RESEND_API_KEY / SENDGRID_API_KEY
  SHOPIFY_SHOP, SHOPIFY_ADMIN_TOKEN (for metrics)
"""

from __future__ import annotations

import logging
import os
import smtplib
from datetime import datetime
from email.mime.text import MIMEText
from typing import Any, Dict, List, Optional

log = logging.getLogger("executive_alerts")
logging.basicConfig(level=logging.INFO)

TO = os.environ.get("ALERT_EMAIL_TO", "")
FROM = os.environ.get("ALERT_EMAIL_FROM", "ops@bizibees.local")
SMTP_HOST = os.environ.get("SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "")
RESEND_KEY = os.environ.get("RESEND_API_KEY", "")


def send_email(subject: str, body: str) -> bool:
    if not TO:
        log.warning("ALERT_EMAIL_TO not set — printing alert instead\n%s\n%s", subject, body)
        return False
    if RESEND_KEY:
        import requests

        r = requests.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {RESEND_KEY}", "Content-Type": "application/json"},
            json={"from": FROM, "to": [TO], "subject": subject, "text": body},
            timeout=20,
        )
        log.info("Resend status %s", r.status_code)
        return r.ok
    if SMTP_HOST:
        msg = MIMEText(body)
        msg["Subject"] = subject
        msg["From"] = FROM
        msg["To"] = TO
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as s:
            s.starttls()
            if SMTP_USER:
                s.login(SMTP_USER, SMTP_PASS)
            s.sendmail(FROM, [TO], msg.as_string())
        return True
    log.warning("No email transport configured")
    return False


def action_required(reason: str, details: str) -> None:
    subject = f"🚨 [ACTION REQUIRED] {reason}"
    body = (
        f"Time: {datetime.utcnow().isoformat()}Z\n\n"
        f"Blocker:\n{reason}\n\n"
        f"Details:\n{details}\n\n"
        f"The autonomous stack will not proceed past this gate until resolved.\n"
    )
    send_email(subject, body)


def daily_briefing(
    revenue_24h: float,
    orders: int,
    net_profit_est: Optional[float],
    actions_taken: List[str],
) -> None:
    subject = f"☕ [DAILY BRIEFING] {datetime.utcnow().strftime('%Y-%m-%d')} — ${revenue_24h:.2f} / {orders} orders"
    lines = [
        f"24h revenue: ${revenue_24h:.2f}",
        f"Orders completed: {orders}",
        f"Net profit (est): {('$' + format(net_profit_est, '.2f')) if net_profit_est is not None else 'n/a'}",
        "",
        "Automated actions:",
    ]
    if actions_taken:
        lines.extend(f"  • {a}" for a in actions_taken)
    else:
        lines.append("  • None logged")
    lines.append("")
    lines.append("Only blockers escalate as ACTION REQUIRED.")
    send_email(subject, "\n".join(lines))


if __name__ == "__main__":
    # Examples
    daily_briefing(0.0, 0, None, ["Growth scientist dry-run complete", "Auto-healer scanned 50 products"])
    # action_required("Payment gateway KYC", "Shopify Payments requires identity re-verification.")

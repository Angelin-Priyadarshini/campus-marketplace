"""Email service — sends via SMTP or logs to console."""
from __future__ import annotations
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.config import settings


async def _send_email(to: str, subject: str, html_body: str) -> None:
    if not settings.smtp_host:
        print(f"[EMAIL] To: {to} | Subject: {subject}\n{html_body}\n")
        return
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from
    msg["To"] = to
    msg.attach(MIMEText(html_body, "html"))
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        server.starttls()
        if settings.smtp_user:
            server.login(settings.smtp_user, settings.smtp_password)
        server.sendmail(settings.smtp_from, [to], msg.as_string())


async def send_verification_email(email: str, token: str, base_url: str) -> None:
    link = f"{base_url}/verify-email?token={token}"
    subject = "Verify your CampusMart email"
    body = f"<p>Click <a href='{link}'>here</a> to verify your email.</p><p>Link: {link}</p>"
    print(f"[EMAIL] Verify email for {email}: {link}")
    await _send_email(email, subject, body)


async def send_password_reset_email(email: str, token: str, base_url: str) -> None:
    link = f"{base_url}/reset-password?token={token}"
    subject = "Reset your CampusMart password"
    body = f"<p>Click <a href='{link}'>here</a> to reset your password.</p><p>Link: {link}</p>"
    print(f"[EMAIL] Password reset for {email}: {link}")
    await _send_email(email, subject, body)

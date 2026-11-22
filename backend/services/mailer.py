"""
Transactional e-mail (sign-in codes, Premium restore links).

Resend (RESEND_API_KEY) is used when set, otherwise SendGrid
(SENDGRID_API_KEY). EMAIL_FROM sets the sender, e.g.
"BhriguWelt <noreply@bhriguwelt.app>" — its domain must be verified with
the provider.
"""
from __future__ import annotations

import os

import requests

from utils.logger import setup_logger

logger = setup_logger(__name__)


class MailNotConfigured(RuntimeError):
    pass


def configured() -> bool:
    return bool(os.getenv('RESEND_API_KEY') or os.getenv('SENDGRID_API_KEY'))


def sender() -> str:
    return os.getenv('EMAIL_FROM') or os.getenv('FROM_EMAIL') or 'BhriguWelt <noreply@bhriguwelt.app>'


def send(to: str, subject: str, html: str, text: str) -> None:
    if os.getenv('RESEND_API_KEY'):
        resp = requests.post(
            'https://api.resend.com/emails',
            headers={'Authorization': f"Bearer {os.environ['RESEND_API_KEY']}"},
            json={'from': sender(), 'to': [to], 'subject': subject, 'html': html, 'text': text},
            timeout=15,
        )
        if resp.status_code >= 300:
            logger.error('Resend send failed: %s %s', resp.status_code, resp.text[:200])
            raise RuntimeError('E-mail could not be sent')
        return
    if os.getenv('SENDGRID_API_KEY'):
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail
        SendGridAPIClient(os.environ['SENDGRID_API_KEY']).send(
            Mail(from_email=sender(), to_emails=to, subject=subject,
                 html_content=html, plain_text_content=text))
        return
    raise MailNotConfigured('No e-mail provider configured')


def button_html(intro: str, link: str, label: str, outro: str) -> str:
    return (
        f'<p>Namaste,</p><p>{intro}</p>'
        f'<p><a href="{link}" style="background:#C9A55C;color:#0B0E1C;padding:12px 20px;'
        f'border-radius:8px;text-decoration:none;font-weight:600">{label}</a></p>'
        f'<p>{outro}</p>'
    )

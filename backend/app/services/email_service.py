import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings


def send_otp_email(to_email: str, otp_code: str, full_name: str = "") -> None:
    """Send OTP password-reset email via SMTP."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        raise RuntimeError("SMTP credentials not configured. Set SMTP_USER and SMTP_PASSWORD in .env")

    subject = f"Your FINE SME Password Reset Code"
    greeting = f"Hi {full_name}," if full_name else "Hello,"

    html_body = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body {{ font-family: Arial, sans-serif; background: #f4f6f8; margin: 0; padding: 0; }}
    .container {{ max-width: 520px; margin: 40px auto; background: #ffffff; border-radius: 10px;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden; }}
    .header {{ background: #1d4ed8; padding: 28px 32px; }}
    .header h1 {{ color: #ffffff; margin: 0; font-size: 22px; }}
    .body {{ padding: 32px; color: #374151; line-height: 1.6; }}
    .otp-box {{ margin: 28px 0; text-align: center; }}
    .otp {{ display: inline-block; font-size: 42px; font-weight: 700; letter-spacing: 12px;
             color: #1d4ed8; background: #eff6ff; padding: 16px 28px; border-radius: 8px;
             border: 2px dashed #93c5fd; }}
    .footer {{ padding: 20px 32px; background: #f9fafb; text-align: center;
               color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; }}
    .warning {{ color: #ef4444; font-size: 13px; margin-top: 16px; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>FINE SME — Password Reset</h1>
    </div>
    <div class="body">
      <p>{greeting}</p>
      <p>We received a request to reset the password on your FINE SME account.
         Use the code below to continue. It expires in <strong>{settings.OTP_EXPIRE_MINUTES} minutes</strong>.</p>
      <div class="otp-box">
        <span class="otp">{otp_code}</span>
      </div>
      <p>If you did not request a password reset, you can safely ignore this email —
         your account remains secure and no changes have been made.</p>
      <p class="warning">Never share this code with anyone. FINE SME staff will never ask for it.</p>
    </div>
    <div class="footer">
      &copy; FINE SME &mdash; SME Financial Sustainability Prediction System
    </div>
  </div>
</body>
</html>
"""

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.EMAIL_FROM_NAME} <{settings.SMTP_USER}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_USER, to_email, msg.as_string())

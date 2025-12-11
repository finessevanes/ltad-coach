import resend
from app.core.config import settings
from typing import Optional

resend.api_key = settings.resend_api_key


class EmailService:
    """Email service using Resend"""

    def __init__(self):
        self.from_email = settings.resend_from_email

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """Send email via Resend"""
        try:
            params = {
                "from": self.from_email,
                "to": [to_email],
                "subject": subject,
                "html": html_content,
            }

            if text_content:
                params["text"] = text_content

            email = resend.Emails.send(params)
            return True

        except Exception as e:
            print(f"Email send failed: {e}")
            return False

    def send_consent_request(
        self,
        parent_email: str,
        athlete_name: str,
        consent_url: str
    ) -> bool:
        """Send parental consent request email"""
        subject = f"Parental Consent Required for {athlete_name}"

        html_content = f"""
        <h2>Parental Consent Request</h2>
        <p>Hello,</p>
        <p>Your child, <strong>{athlete_name}</strong>, has been added to an AI Coach athletic assessment program.</p>
        <p>Before we can begin assessments, we need your consent to record and analyze video of your child performing athletic tests.</p>
        <p><strong><a href="{consent_url}">Click here to review and provide consent</a></strong></p>
        <p>This link is unique to your child and will expire in 30 days.</p>
        <p>If you have questions, please contact your coach.</p>
        <p>Thank you,<br>AI Coach Team</p>
        """

        return self.send_email(parent_email, subject, html_content)

    def send_consent_confirmed(
        self,
        coach_email: str,
        athlete_name: str
    ) -> bool:
        """Notify coach that parent provided consent"""
        subject = f"Consent Received: {athlete_name}"

        html_content = f"""
        <h2>Consent Confirmed</h2>
        <p>Good news! Parental consent has been received for <strong>{athlete_name}</strong>.</p>
        <p>You can now begin assessments for this athlete.</p>
        <p>- AI Coach</p>
        """

        return self.send_email(coach_email, subject, html_content)

    def send_parent_report(
        self,
        parent_email: str,
        athlete_name: str,
        report_url: str,
        access_pin: str
    ) -> bool:
        """Send parent report with PIN"""
        subject = f"Progress Report: {athlete_name}"

        html_content = f"""
        <h2>Athletic Assessment Progress Report</h2>
        <p>Hello,</p>
        <p>A new progress report is available for <strong>{athlete_name}</strong>.</p>
        <p><strong><a href="{report_url}">View Report</a></strong></p>
        <p><strong>Access PIN:</strong> {access_pin}</p>
        <p>This report includes recent assessment results, progress trends, and development recommendations.</p>
        <p>Thank you,<br>AI Coach Team</p>
        """

        return self.send_email(parent_email, subject, html_content)


# Global instance
email_service = EmailService()

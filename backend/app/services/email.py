"""Email service for sending transactional emails via Resend."""

import logging
import resend
from app.config import get_settings

logger = logging.getLogger(__name__)


def _get_resend_api_key() -> str:
    """Get Resend API key from settings."""
    settings = get_settings()
    return settings.resend_api_key


def send_email(
    to: str,
    subject: str,
    html: str,
    from_email: str = "CoachLens <noreply@coachlens.laschicas.ai>",
) -> bool:
    """Send an email via Resend API.

    Args:
        to: Recipient email address
        subject: Email subject line
        html: HTML email body
        from_email: Sender email (verified domain)

    Returns:
        True if email sent successfully, False otherwise

    Note:
        Using onboarding@resend.dev for testing. Replace with verified domain in production.
    """
    try:
        resend.api_key = _get_resend_api_key()

        params = {
            "from": from_email,
            "to": [to],
            "subject": subject,
            "html": html,
        }

        response = resend.Emails.send(params)
        logger.info(f"Email sent successfully to {to}. Message ID: {response.get('id', 'unknown')}")
        return True
    except Exception as e:
        # Log error with full details
        logger.error(f"Failed to send email to {to}: {str(e)}", exc_info=True)
        return False


def send_consent_request(
    parent_email: str, athlete_name: str, coach_name: str, consent_token: str
) -> bool:
    """Send consent request email to parent/guardian.

    Args:
        parent_email: Parent's email address
        athlete_name: Name of the athlete
        coach_name: Name of the coach
        consent_token: UUID4 consent token for URL

    Returns:
        True if sent successfully
    """
    settings = get_settings()
    consent_url = f"{settings.frontend_url}/consent/{consent_token}"

    subject = f"Consent Request for {athlete_name} - CoachLens"

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }}
            .container {{ background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
            h1 {{ color: #1976d2; margin-bottom: 20px; }}
            .button {{ display: inline-block; padding: 12px 24px; background-color: #1976d2; color: #ffffff !important; text-decoration: none; border-radius: 4px; margin: 20px 0; font-weight: 500; }}
            .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Parental Consent Required</h1>

            <p>Hello,</p>

            <p>Coach <strong>{coach_name}</strong> has added <strong>{athlete_name}</strong> to their athletic assessment program using CoachLens.</p>

            <p>To proceed with video-based athletic assessments, we need your consent as a parent or legal guardian. The assessment includes:</p>

            <ul>
                <li>Recording video of fundamental movement tests (e.g., one-leg balance)</li>
                <li>Computer vision analysis of movement patterns</li>
                <li>AI-powered coaching feedback based on LTAD (Long-Term Athlete Development) benchmarks</li>
                <li>Secure storage of assessment data</li>
            </ul>

            <p>Please review the full consent form and provide your decision:</p>

            <a href="{consent_url}" class="button">Review & Provide Consent</a>

            <p>This consent link will expire in 30 days. If you have questions, please contact Coach {coach_name} directly.</p>

            <div class="footer">
                <p>CoachLens - Athletic Assessment Platform<br>
                If you did not expect this email, please disregard it.</p>
            </div>
        </div>
    </body>
    </html>
    """

    return send_email(parent_email, subject, html)


def send_consent_confirmed(
    coach_email: str, athlete_name: str, parent_email: str
) -> bool:
    """Send notification to coach when parent provides consent.

    Args:
        coach_email: Coach's email address
        athlete_name: Name of the athlete
        parent_email: Parent's email who provided consent

    Returns:
        True if sent successfully
    """
    settings = get_settings()
    athletes_url = f"{settings.frontend_url}/athletes"

    subject = f"Consent Received for {athlete_name}"

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }}
            .container {{ background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
            h1 {{ color: #4caf50; margin-bottom: 20px; }}
            .button {{ display: inline-block; padding: 12px 24px; background-color: #1976d2; color: #ffffff !important; text-decoration: none; border-radius: 4px; margin: 20px 0; font-weight: 500; }}
            .success-badge {{ background-color: #e8f5e9; color: #2e7d32; padding: 8px 16px; border-radius: 4px; display: inline-block; margin: 10px 0; }}
            .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>✓ Parental Consent Received</h1>

            <p>Great news! The parent/guardian for <strong>{athlete_name}</strong> has provided consent for athletic assessments.</p>

            <div class="success-badge">Status: Active - Ready for Assessment</div>

            <p><strong>Parent/Guardian:</strong> {parent_email}</p>

            <p>You can now proceed with video-based assessments for this athlete. All assessment results will be available in your dashboard.</p>

            <a href="{athletes_url}" class="button">View Athletes</a>

            <div class="footer">
                <p>CoachLens - Athletic Assessment Platform</p>
            </div>
        </div>
    </body>
    </html>
    """

    return send_email(coach_email, subject, html)


def send_consent_declined(
    coach_email: str, athlete_name: str, parent_email: str
) -> bool:
    """Send notification to coach when parent declines consent.

    Args:
        coach_email: Coach's email address
        athlete_name: Name of the athlete
        parent_email: Parent's email who declined

    Returns:
        True if sent successfully
    """
    settings = get_settings()
    athletes_url = f"{settings.frontend_url}/athletes"

    subject = f"Consent Declined for {athlete_name}"

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }}
            .container {{ background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
            h1 {{ color: #f44336; margin-bottom: 20px; }}
            .button {{ display: inline-block; padding: 12px 24px; background-color: #1976d2; color: #ffffff !important; text-decoration: none; border-radius: 4px; margin: 20px 0; font-weight: 500; }}
            .declined-badge {{ background-color: #ffebee; color: #c62828; padding: 8px 16px; border-radius: 4px; display: inline-block; margin: 10px 0; }}
            .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Consent Declined</h1>

            <p>The parent/guardian for <strong>{athlete_name}</strong> has declined consent for athletic assessments.</p>

            <div class="declined-badge">Status: Declined - Cannot Assess</div>

            <p><strong>Parent/Guardian:</strong> {parent_email}</p>

            <p>The athlete will remain in your roster with "declined" status. You cannot conduct video assessments for this athlete unless the parent changes their decision.</p>

            <p>If you wish to discuss this decision, please contact the parent/guardian directly at the email address above.</p>

            <a href="{athletes_url}" class="button">View Athletes</a>

            <div class="footer">
                <p>CoachLens - Athletic Assessment Platform</p>
            </div>
        </div>
    </body>
    </html>
    """

    return send_email(coach_email, subject, html)

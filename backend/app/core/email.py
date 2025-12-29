import logging
import time
from typing import List, Optional, Dict
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from app.core.config import settings
from app.core.translations import get_text

logger = logging.getLogger(__name__)

# Налаштування конфігурації SMTP (Gmail fallback)
gmail_conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=settings.USE_CREDENTIALS,
    VALIDATE_CERTS=settings.VALIDATE_CERTS
)


def get_email_template(content: str, language_code: str = "uk") -> str:
    """
    Базовий шаблон для всіх email листів
    Сучасний, мінімалістичний дизайн з градієнтами
    """
    t = lambda k, **kwargs: get_text(k, language_code, **kwargs)

    return f"""
    <!DOCTYPE html>
    <html lang="{language_code}">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>OhMyRevit</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f7; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
        <div style="width: 100%; background-color: #f5f5f7; padding: 40px 20px;">
            <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);">
                <!-- Header -->
                <tr>
                    <td style="background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 50%, #3B82F6 100%); padding: 48px 40px; text-align: center;">
                        <div style="background-color: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); border-radius: 16px; padding: 12px 24px; display: inline-block; margin-bottom: 20px;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                                OhMyRevit
                            </h1>
                        </div>
                        <p style="margin: 0; font-size: 16px; color: rgba(255, 255, 255, 0.9); font-weight: 400;">
                            Revit Content Marketplace
                        </p>
                    </td>
                </tr>

                <!-- Content -->
                <tr>
                    <td style="padding: 48px 40px;">
                        {content}
                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td style="background-color: #fafafa; padding: 32px 40px; border-top: 1px solid #e5e5e7;">
                        <table role="presentation" style="width: 100%;">
                            <tr>
                                <td style="text-align: center; padding-bottom: 16px;">
                                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #86868b; line-height: 1.6;">
                                        {t("email_footer_thanks")}
                                    </p>
                                    <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1d1d1f;">
                                        Команда OhMyRevit
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <td style="text-align: center; padding-top: 16px; border-top: 1px solid #e5e5e7;">
                                    <a href="https://t.me/{settings.TELEGRAM_BOT_USERNAME}" style="display: inline-block; margin: 0 8px; text-decoration: none; color: #8B5CF6; font-size: 13px; font-weight: 500;">
                                        Telegram Bot
                                    </a>
                                    <span style="color: #d2d2d7;">•</span>
                                    <a href="{settings.FRONTEND_URL}" style="display: inline-block; margin: 0 8px; text-decoration: none; color: #8B5CF6; font-size: 13px; font-weight: 500;">
                                        {t("email_footer_website")}
                                    </a>
                                    <span style="color: #d2d2d7;">•</span>
                                    <a href="{settings.FRONTEND_URL}/profile/support" style="display: inline-block; margin: 0 8px; text-decoration: none; color: #8B5CF6; font-size: 13px; font-weight: 500;">
                                        {t("email_footer_support")}
                                    </a>
                                </td>
                            </tr>
                            <tr>
                                <td style="text-align: center; padding-top: 16px;">
                                    <p style="margin: 0; font-size: 12px; color: #86868b; line-height: 1.5;">
                                        © 2025 OhMyRevit. {t("email_footer_rights")}
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </div>
    </body>
    </html>
    """


def get_button_html(text: str, url: str, color: str = "#8B5CF6") -> str:
    """Красива кнопка з градієнтом"""
    return f"""
    <div style="text-align: center; margin: 32px 0;">
        <a href="{url}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, {color} 0%, {color}dd 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3); transition: all 0.3s ease;">
            {text}
        </a>
    </div>
    """


class EmailService:
    def __init__(self):
        self.gmail_client = FastMail(gmail_conf)
        # Resend імпортується динамічно при використанні
        self._resend_client = None

    def _get_resend_client(self):
        """Lazy loading для Resend клієнта"""
        if self._resend_client is None and settings.RESEND_API_KEY:
            try:
                import resend
                resend.api_key = settings.RESEND_API_KEY
                self._resend_client = resend
                logger.info("Resend client initialized successfully")
            except ImportError:
                logger.warning("Resend library not installed, will use Gmail fallback only")
            except Exception as e:
                logger.error(f"Failed to initialize Resend client: {str(e)}")
        return self._resend_client

    async def send_email(
            self,
            to: str,
            subject: str,
            html_content: str,
            text_content: Optional[str] = None
    ) -> bool:
        """
        Універсальний метод відправки email з fallback механізмом.
        Спочатку пробує Resend, якщо не вдається - використовує Gmail SMTP.
        """
        # Спроба 1: Resend (primary)
        if settings.RESEND_API_KEY:
            try:
                resend = self._get_resend_client()
                if resend:
                    params = {
                        "from": f"OhMyRevit <{settings.FROM_EMAIL}>",
                        "to": [to],
                        "subject": subject,
                        "html": html_content,
                        "reply_to": "support@ohmyrevit.pp.ua",
                        "headers": {
                            "X-Entity-Ref-ID": f"ohmyrevit-{int(time.time())}",
                        }
                    }

                    response = resend.Emails.send(params)
                    logger.info(f"✅ Email sent successfully via Resend to {to} (ID: {response.get('id', 'unknown')})")
                    return True
            except Exception as e:
                logger.warning(f"⚠️ Resend failed: {str(e)}, falling back to Gmail SMTP")

        # Спроба 2: Gmail SMTP (fallback)
        try:
            message = MessageSchema(
                subject=subject,
                recipients=[to],
                body=html_content,
                subtype=MessageType.html
            )

            await self.gmail_client.send_message(message)
            logger.info(f"✅ Email sent successfully via Gmail SMTP to {to}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to send email via both Resend and Gmail: {str(e)}")
            return False

    async def send_verification_email(
            self,
            user_email: str,
            verification_token: str,
            language_code: str = "uk"
    ) -> bool:
        """Підтвердження email адреси"""
        t = lambda k, **kwargs: get_text(k, language_code, **kwargs)
        subject = f"OhMyRevit – {t('email_verify_subject')}"

        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"

        content = f"""
        <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); padding: 16px; border-radius: 16px; margin-bottom: 24px;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
            </div>
        </div>

        <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #1d1d1f; text-align: center; letter-spacing: -0.5px;">
            {t("email_verify_title")}
        </h2>

        <p style="margin: 0 0 24px 0; font-size: 16px; color: #6e6e73; line-height: 1.6; text-align: center;">
            {t("email_verify_body")}
        </p>

        {get_button_html(t("email_verify_button"), verification_url)}

        <div style="margin-top: 32px; padding: 20px; background-color: #f5f5f7; border-radius: 12px;">
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #86868b; text-align: center;">
                {t("email_verify_link_text")}
            </p>
            <p style="margin: 0; font-size: 12px; color: #6366F1; word-break: break-all; text-align: center;">
                {verification_url}
            </p>
        </div>

        <p style="margin: 24px 0 0 0; font-size: 13px; color: #86868b; text-align: center; line-height: 1.5;">
            {t("email_verify_expire")}
        </p>
        """

        html_content = get_email_template(content, language_code)
        return await self.send_email(to=user_email, subject=subject, html_content=html_content)

    async def send_password_reset_email(
            self,
            user_email: str,
            reset_token: str,
            language_code: str = "uk"
    ) -> bool:
        """Відновлення пароля"""
        t = lambda k, **kwargs: get_text(k, language_code, **kwargs)
        subject = f"OhMyRevit – {t('email_reset_subject')}"

        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"

        content = f"""
        <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #F59E0B 0%, #EF4444 100%); padding: 16px; border-radius: 16px; margin-bottom: 24px;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
            </div>
        </div>

        <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #1d1d1f; text-align: center; letter-spacing: -0.5px;">
            {t("email_reset_title")}
        </h2>

        <p style="margin: 0 0 24px 0; font-size: 16px; color: #6e6e73; line-height: 1.6; text-align: center;">
            {t("email_reset_body")}
        </p>

        {get_button_html(t("email_reset_button"), reset_url, "#EF4444")}

        <div style="margin-top: 32px; padding: 20px; background-color: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #92400E; line-height: 1.6;">
                <strong>{t("email_reset_warning_title")}</strong><br>
                {t("email_reset_warning_body")}
            </p>
        </div>

        <p style="margin: 24px 0 0 0; font-size: 13px; color: #86868b; text-align: center; line-height: 1.5;">
            {t("email_reset_expire")}
        </p>
        """

        html_content = get_email_template(content, language_code)
        return await self.send_email(to=user_email, subject=subject, html_content=html_content)

    async def send_new_password_email(
            self,
            user_email: str,
            new_password: str,
            language_code: str = "uk"
    ) -> bool:
        """Новий пароль (автогенерований)"""
        t = lambda k, **kwargs: get_text(k, language_code, **kwargs)
        subject = f"OhMyRevit – {t('email_new_password_subject')}"

        content = f"""
        <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 16px; border-radius: 16px; margin-bottom: 24px;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                    <path d="M2 17l10 5 10-5"></path>
                    <path d="M2 12l10 5 10-5"></path>
                </svg>
            </div>
        </div>

        <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #1d1d1f; text-align: center; letter-spacing: -0.5px;">
            {t("email_new_password_title")}
        </h2>

        <p style="margin: 0 0 24px 0; font-size: 16px; color: #6e6e73; line-height: 1.6; text-align: center;">
            {t("email_new_password_body")}
        </p>

        <div style="margin: 32px 0; padding: 24px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 16px; border: 2px dashed #10B981;">
            <p style="margin: 0 0 12px 0; font-size: 13px; color: #065f46; font-weight: 600; text-align: center; text-transform: uppercase; letter-spacing: 0.5px;">
                {t("email_new_password_label")}
            </p>
            <p style="margin: 0; font-size: 24px; color: #047857; font-weight: 700; text-align: center; font-family: 'Courier New', monospace; letter-spacing: 2px;">
                {new_password}
            </p>
        </div>

        {get_button_html(t("email_new_password_button"), f"{settings.FRONTEND_URL}/login", "#10B981")}

        <div style="margin-top: 32px; padding: 20px; background-color: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #92400E; line-height: 1.6;">
                <strong>{t("email_new_password_security_title")}</strong><br>
                {t("email_new_password_security_body")}
            </p>
        </div>
        """

        html_content = get_email_template(content, language_code)
        return await self.send_email(to=user_email, subject=subject, html_content=html_content)

    async def send_registration_email(
            self,
            user_email: str,
            temp_password: str,
            language_code: str = "uk"
    ) -> bool:
        """Реєстрація нового користувача"""
        t = lambda k, **kwargs: get_text(k, language_code, **kwargs)
        subject = f"OhMyRevit – {t('email_registration_subject')}"

        content = f"""
        <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); padding: 16px; border-radius: 16px; margin-bottom: 24px;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            </div>
        </div>

        <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #1d1d1f; text-align: center; letter-spacing: -0.5px;">
            {t("email_registration_title")}
        </h2>

        <p style="margin: 0 0 24px 0; font-size: 16px; color: #6e6e73; line-height: 1.6; text-align: center;">
            {t("email_registration_body")}
        </p>

        <div style="margin: 32px 0; padding: 24px; background-color: #f5f5f7; border-radius: 16px;">
            <table role="presentation" style="width: 100%;">
                <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e7;">
                        <p style="margin: 0; font-size: 13px; color: #86868b; font-weight: 500;">Email</p>
                        <p style="margin: 4px 0 0 0; font-size: 15px; color: #1d1d1f; font-weight: 600;">{user_email}</p>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 12px 0;">
                        <p style="margin: 0; font-size: 13px; color: #86868b; font-weight: 500;">{t("email_registration_temp_password")}</p>
                        <p style="margin: 4px 0 0 0; font-size: 18px; color: #8B5CF6; font-weight: 700; font-family: 'Courier New', monospace;">{temp_password}</p>
                    </td>
                </tr>
            </table>
        </div>

        {get_button_html(t("email_registration_button"), f"{settings.FRONTEND_URL}/login")}

        <div style="margin-top: 32px; padding: 20px; background-color: #DBEAFE; border-left: 4px solid #3B82F6; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #1E40AF; line-height: 1.6;">
                <strong>{t("email_registration_tip_title")}</strong><br>
                {t("email_registration_tip_body")}
            </p>
        </div>
        """

        html_content = get_email_template(content, language_code)
        return await self.send_email(to=user_email, subject=subject, html_content=html_content)

    async def send_link_account_email(
            self,
            user_email: str,
            verification_token: str,
            language_code: str = "uk"
    ) -> bool:
        """Підтвердження прив'язки email до Telegram акаунту"""
        t = lambda k, **kwargs: get_text(k, language_code, **kwargs)
        subject = f"OhMyRevit – {t('email_link_subject')}"

        verification_url = f"{settings.FRONTEND_URL}/verify-link?token={verification_token}"

        content = f"""
        <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #0088cc 0%, #0066aa 100%); padding: 16px; border-radius: 16px; margin-bottom: 24px;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect x="2" y="9" width="4" height="12"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                </svg>
            </div>
        </div>

        <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #1d1d1f; text-align: center; letter-spacing: -0.5px;">
            {t("email_link_title")}
        </h2>

        <p style="margin: 0 0 24px 0; font-size: 16px; color: #6e6e73; line-height: 1.6; text-align: center;">
            {t("email_link_body")}
        </p>

        {get_button_html(t("email_link_button"), verification_url, "#0088cc")}

        <div style="margin-top: 32px; padding: 20px; background-color: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #92400E; line-height: 1.6;">
                <strong>{t("email_link_warning_title")}</strong><br>
                {t("email_link_warning_body")}
            </p>
        </div>

        <p style="margin: 24px 0 0 0; font-size: 13px; color: #86868b; text-align: center; line-height: 1.5;">
            {t("email_link_expire")}
        </p>
        """

        html_content = get_email_template(content, language_code)
        return await self.send_email(to=user_email, subject=subject, html_content=html_content)

    async def send_order_confirmation(
            self,
            user_email: str,
            order_id: int,
            products: List[Dict],
            total_amount: float,
            language_code: str = "uk"
    ) -> bool:
        """Підтвердження замовлення"""
        t = lambda k, **kwargs: get_text(k, language_code, **kwargs)
        subject = f"OhMyRevit – {t('email_order_subject', order_id=order_id)}"

        products_html = ""
        for product in products:
            products_html += f"""
            <tr>
                <td style="padding: 16px 0; border-bottom: 1px solid #e5e5e7;">
                    <p style="margin: 0; font-size: 15px; color: #1d1d1f; font-weight: 600;">{product['title']}</p>
                    {f"<p style='margin: 4px 0 0 0; font-size: 13px; color: #86868b;'>{product.get('version', '')}</p>" if product.get('version') else ''}
                </td>
                <td style="padding: 16px 0; border-bottom: 1px solid #e5e5e7; text-align: right;">
                    <p style="margin: 0; font-size: 17px; color: #8B5CF6; font-weight: 700;">${product['price']}</p>
                </td>
            </tr>
            """

        content = f"""
        <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 16px; border-radius: 16px; margin-bottom: 24px;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>
        </div>

        <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #1d1d1f; text-align: center; letter-spacing: -0.5px;">
            {t("email_order_title")}
        </h2>

        <p style="margin: 0 0 32px 0; font-size: 14px; color: #86868b; text-align: center;">
            {t("email_order_number", order_id=order_id)}
        </p>

        <div style="margin: 32px 0; padding: 24px; background-color: #f5f5f7; border-radius: 16px;">
            <table role="presentation" style="width: 100%;">
                {products_html}
                <tr>
                    <td style="padding: 20px 0 0 0;">
                        <p style="margin: 0; font-size: 15px; color: #6e6e73; font-weight: 600;">{t("email_order_total")}</p>
                    </td>
                    <td style="padding: 20px 0 0 0; text-align: right;">
                        <p style="margin: 0; font-size: 24px; color: #8B5CF6; font-weight: 700;">${total_amount}</p>
                    </td>
                </tr>
            </table>
        </div>

        <p style="margin: 24px 0; font-size: 16px; color: #6e6e73; line-height: 1.6; text-align: center;">
            {t("email_order_access_info")}
        </p>

        {get_button_html(t("email_order_button"), f"https://t.me/{settings.TELEGRAM_BOT_USERNAME}", "#10B981")}

        <div style="margin-top: 32px; padding: 20px; background-color: #DBEAFE; border-left: 4px solid #3B82F6; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #1E40AF; line-height: 1.6;">
                💡 <strong>{t("email_order_tip_title")}</strong><br>
                {t("email_order_tip_body")}
            </p>
        </div>
        """

        html_content = get_email_template(content, language_code)
        return await self.send_email(to=user_email, subject=subject, html_content=html_content)

    async def send_subscription_confirmation(
            self,
            user_email: str,
            end_date: str,
            language_code: str = "uk"
    ) -> bool:
        """Підтвердження підписки"""
        t = lambda k, **kwargs: get_text(k, language_code, **kwargs)
        subject = f"OhMyRevit – {t('email_subscription_subject')}"

        features = [
            ("🎨", t("email_subscription_feature_1")),
            ("⚡", t("email_subscription_feature_2")),
            ("🎁", t("email_subscription_feature_3")),
            ("🔄", t("email_subscription_feature_4")),
            ("💎", t("email_subscription_feature_5")),
        ]

        features_html = ""
        for icon, text in features:
            features_html += f"""
            <div style="display: flex; align-items: start; margin-bottom: 12px;">
                <span style="font-size: 20px; margin-right: 12px;">{icon}</span>
                <p style="margin: 0; font-size: 15px; color: #6e6e73; line-height: 1.6;">{text}</p>
            </div>
            """

        content = f"""
        <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 16px; border-radius: 16px; margin-bottom: 24px;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                    <path d="M2 17l10 5 10-5"></path>
                    <path d="M2 12l10 5 10-5"></path>
                </svg>
            </div>
        </div>

        <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #1d1d1f; text-align: center; letter-spacing: -0.5px;">
            {t("email_subscription_title")}
        </h2>

        <p style="margin: 0 0 32px 0; font-size: 16px; color: #6e6e73; line-height: 1.6; text-align: center;">
            {t("email_subscription_body", end_date=end_date)}
        </p>

        <div style="margin: 32px 0; padding: 24px; background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-radius: 16px;">
            <p style="margin: 0 0 16px 0; font-size: 15px; color: #92400E; font-weight: 700; text-align: center;">
                {t("email_subscription_benefits_title")}
            </p>
            {features_html}
        </div>

        {get_button_html(t("email_subscription_button"), f"https://t.me/{settings.TELEGRAM_BOT_USERNAME}", "#F59E0B")}

        <div style="margin-top: 32px; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #86868b; line-height: 1.6;">
                {t("email_subscription_expiry", end_date=end_date)}
            </p>
        </div>
        """

        html_content = get_email_template(content, language_code)
        return await self.send_email(to=user_email, subject=subject, html_content=html_content)

    async def send_download_links(
            self,
            user_email: str,
            products: List[Dict],
            language_code: str = "uk"
    ) -> bool:
        """Посилання для завантаження продуктів"""
        t = lambda k, **kwargs: get_text(k, language_code, **kwargs)
        subject = f"OhMyRevit – {t('email_download_subject')}"

        products_html = ""
        for product in products:
            size_mb = product.get('file_size_mb', 0)
            products_html += f"""
            <div style="margin: 16px 0; padding: 20px; background-color: #ffffff; border: 2px solid #e5e5e7; border-radius: 12px; transition: all 0.3s ease;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                    <div>
                        <h3 style="margin: 0 0 8px 0; font-size: 17px; color: #1d1d1f; font-weight: 600;">{product['title']}</h3>
                        <p style="margin: 0; font-size: 13px; color: #86868b;">
                            {f"📦 {size_mb} MB" if size_mb else ""}
                        </p>
                    </div>
                </div>
                <a href="{product['download_url']}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px; margin-top: 12px;">
                    ⬇️ {t("email_download_button")}
                </a>
            </div>
            """

        content = f"""
        <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); padding: 16px; border-radius: 16px; margin-bottom: 24px;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
            </div>
        </div>

        <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #1d1d1f; text-align: center; letter-spacing: -0.5px;">
            {t("email_download_title")}
        </h2>

        <p style="margin: 0 0 32px 0; font-size: 16px; color: #6e6e73; line-height: 1.6; text-align: center;">
            {t("email_download_body")}
        </p>

        <div style="margin: 32px 0; padding: 24px; background-color: #f5f5f7; border-radius: 16px;">
            {products_html}
        </div>

        <div style="margin-top: 32px; padding: 20px; background-color: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #92400E; line-height: 1.6;">
                ⚠️ <strong>{t("email_download_warning_title")}</strong><br>
                {t("email_download_warning_body")}
            </p>
        </div>
        """

        html_content = get_email_template(content, language_code)
        return await self.send_email(to=user_email, subject=subject, html_content=html_content)


    async def send_creator_application_approved(
            self,
            user_email: str,
            language_code: str = "uk"
    ) -> bool:
        """Схвалення заявки креатора"""
        t = lambda k, **kwargs: get_text(k, language_code, **kwargs)
        subject = "OhMyRevit – Вашу заявку креатора схвалено! 🎉"

        content = """
        <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 16px; border-radius: 16px; margin-bottom: 24px;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>
        </div>

        <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #1d1d1f; text-align: center; letter-spacing: -0.5px;">
            Вітаємо! Ви стали креатором 🎨
        </h2>

        <p style="margin: 0 0 24px 0; font-size: 16px; color: #6e6e73; line-height: 1.6; text-align: center;">
            Ваша заявка на статус креатора була розглянута та схвалена. Тепер ви можете продавати свої плагіни на маркетплейсі OhMyRevit!
        </p>

        <div style="margin: 32px 0; padding: 24px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 16px;">
            <p style="margin: 0 0 16px 0; font-size: 15px; color: #065f46; font-weight: 700; text-align: center;">
                Що ви можете робити:
            </p>
            <div style="text-align: left; max-width: 400px; margin: 0 auto;">
                <p style="margin: 8px 0; font-size: 15px; color: #047857;">✅ Додавати свої товари</p>
                <p style="margin: 8px 0; font-size: 15px; color: #047857;">✅ Встановлювати ціни (мін. $2)</p>
                <p style="margin: 8px 0; font-size: 15px; color: #047857;">✅ Отримувати 85% від продажів</p>
                <p style="margin: 8px 0; font-size: 15px; color: #047857;">✅ Переглядати статистику</p>
                <p style="margin: 8px 0; font-size: 15px; color: #047857;">✅ Запитувати виплати</p>
            </div>
        </div>

        """ + get_button_html("Перейти до кабінету креатора", f"{settings.FRONTEND_URL}/creator/dashboard", "#10B981") + """

        <div style="margin-top: 32px; padding: 20px; background-color: #DBEAFE; border-left: 4px solid #3B82F6; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #1E40AF; line-height: 1.6;">
                💡 <strong>Порада:</strong><br>
                Перший товар пройде модерацію швидше, якщо ви додасте детальний опис та якісні скріншоти.
            </p>
        </div>
        """

        html_content = get_email_template(content, language_code)
        return await self.send_email(to=user_email, subject=subject, html_content=html_content)

    async def send_product_approved(
            self,
            user_email: str,
            product_title: str,
            product_id: int,
            language_code: str = "uk"
    ) -> bool:
        """Схвалення товару креатора"""
        t = lambda k, **kwargs: get_text(k, language_code, **kwargs)
        subject = f"OhMyRevit – Товар \"{product_title}\" схвалено!"

        content = f"""
        <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 16px; border-radius: 16px; margin-bottom: 24px;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>
        </div>

        <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #1d1d1f; text-align: center; letter-spacing: -0.5px;">
            Товар схвалено! ✅
        </h2>

        <p style="margin: 0 0 24px 0; font-size: 16px; color: #6e6e73; line-height: 1.6; text-align: center;">
            Ваш товар <strong style="color: #1d1d1f;">"{product_title}"</strong> пройшов модерацію та опублікований на маркетплейсі!
        </p>

        <div style="margin: 32px 0; padding: 24px; background-color: #f5f5f7; border-radius: 16px;">
            <p style="margin: 0; font-size: 15px; color: #6e6e73; text-align: center;">
                Тепер користувачі можуть знайти та придбати ваш плагін. Ви отримаєте 85% від кожного продажу.
            </p>
        </div>

        {get_button_html("Переглянути товар", f"{settings.FRONTEND_URL}/product/{product_id}", "#10B981")}

        <div style="margin-top: 32px; padding: 20px; background-color: #DBEAFE; border-left: 4px solid #3B82F6; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #1E40AF; line-height: 1.6;">
                💡 <strong>Поради для успішних продажів:</strong><br>
                • Оновлюйте опис товару зі зворотнім зв'язком<br>
                • Додавайте більше скріншотів<br>
                • Відповідайте на питання користувачів
            </p>
        </div>
        """

        html_content = get_email_template(content, language_code)
        return await self.send_email(to=user_email, subject=subject, html_content=html_content)

    async def send_product_rejected(
            self,
            user_email: str,
            product_title: str,
            rejection_reason: str,
            product_id: int,
            language_code: str = "uk"
    ) -> bool:
        """Відхилення товару креатора"""
        t = lambda k, **kwargs: get_text(k, language_code, **kwargs)
        subject = f"OhMyRevit – Товар \"{product_title}\" потребує доопрацювання"

        content = f"""
        <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 16px; border-radius: 16px; margin-bottom: 24px;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            </div>
        </div>

        <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #1d1d1f; text-align: center; letter-spacing: -0.5px;">
            Товар потребує доопрацювання
        </h2>

        <p style="margin: 0 0 24px 0; font-size: 16px; color: #6e6e73; line-height: 1.6; text-align: center;">
            Ваш товар <strong style="color: #1d1d1f;">"{product_title}"</strong> на жаль не пройшов модерацію.
        </p>

        <div style="margin: 32px 0; padding: 24px; background-color: #FEF3C7; border: 2px solid #F59E0B; border-radius: 16px;">
            <p style="margin: 0 0 12px 0; font-size: 14px; color: #92400E; font-weight: 700;">
                Причина відхилення:
            </p>
            <p style="margin: 0; font-size: 15px; color: #78350F; line-height: 1.6;">
                {rejection_reason}
            </p>
        </div>

        <p style="margin: 24px 0; font-size: 16px; color: #6e6e73; line-height: 1.6; text-align: center;">
            Будь ласка, виправте зазначені проблеми та відправте товар на модерацію знову.
        </p>

        {get_button_html("Редагувати товар", f"{settings.FRONTEND_URL}/creator/products/{product_id}/edit", "#F59E0B")}
        """

        html_content = get_email_template(content, language_code)
        return await self.send_email(to=user_email, subject=subject, html_content=html_content)

    async def send_payout_processed(
            self,
            user_email: str,
            amount: float,
            method: str,
            language_code: str = "uk"
    ) -> bool:
        """Виплата оброблена"""
        t = lambda k, **kwargs: get_text(k, language_code, **kwargs)
        subject = f"OhMyRevit – Виплата ${amount} оброблена"

        content = f"""
        <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 16px; border-radius: 16px; margin-bottom: 24px;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
            </div>
        </div>

        <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #1d1d1f; text-align: center; letter-spacing: -0.5px;">
            Виплата успішно оброблена! 💰
        </h2>

        <p style="margin: 0 0 32px 0; font-size: 16px; color: #6e6e73; line-height: 1.6; text-align: center;">
            Ваш запит на виплату був оброблений адміністрацією.
        </p>

        <div style="margin: 32px 0; padding: 24px; background-color: #f5f5f7; border-radius: 16px;">
            <table role="presentation" style="width: 100%;">
                <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e7;">
                        <p style="margin: 0; font-size: 13px; color: #86868b;">Сума</p>
                        <p style="margin: 4px 0 0 0; font-size: 24px; color: #10B981; font-weight: 700;">${amount}</p>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 12px 0;">
                        <p style="margin: 0; font-size: 13px; color: #86868b;">Метод</p>
                        <p style="margin: 4px 0 0 0; font-size: 15px; color: #1d1d1f; font-weight: 600;">{method}</p>
                    </td>
                </tr>
            </table>
        </div>

        <div style="margin-top: 32px; padding: 20px; background-color: #DBEAFE; border-left: 4px solid #3B82F6; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #1E40AF; line-height: 1.6;">
                ℹ️ <strong>Інформація:</strong><br>
                Кошти надійдуть протягом 1-3 робочих днів залежно від обраного способу виплати.
            </p>
        </div>

        {get_button_html("Переглянути статистику", f"{settings.FRONTEND_URL}/creator/dashboard", "#10B981")}
        """

        html_content = get_email_template(content, language_code)
        return await self.send_email(to=user_email, subject=subject, html_content=html_content)

    async def send_admin_new_application(
            self,
            admin_email: str,
            user_id: int,
            username: str,
            language_code: str = "uk"
    ) -> bool:
        """Нова заявка на модерацію для адміна"""
        t = lambda k, **kwargs: get_text(k, language_code, **kwargs)
        subject = f"OhMyRevit – Нова заявка креатора від @{username}"

        content = f"""
        <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); padding: 16px; border-radius: 16px; margin-bottom: 24px;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <polyline points="17 11 19 13 23 9"></polyline>
                </svg>
            </div>
        </div>

        <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #1d1d1f; text-align: center; letter-spacing: -0.5px;">
            Нова заявка креатора
        </h2>

        <p style="margin: 0 0 32px 0; font-size: 16px; color: #6e6e73; line-height: 1.6; text-align: center;">
            Користувач подав заявку на статус креатора та очікує модерації.
        </p>

        <div style="margin: 32px 0; padding: 24px; background-color: #f5f5f7; border-radius: 16px;">
            <table role="presentation" style="width: 100%;">
                <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e7;">
                        <p style="margin: 0; font-size: 13px; color: #86868b;">Username</p>
                        <p style="margin: 4px 0 0 0; font-size: 15px; color: #1d1d1f; font-weight: 600;">@{username}</p>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 12px 0;">
                        <p style="margin: 0; font-size: 13px; color: #86868b;">User ID</p>
                        <p style="margin: 4px 0 0 0; font-size: 15px; color: #1d1d1f; font-weight: 600;">{user_id}</p>
                    </td>
                </tr>
            </table>
        </div>

        {get_button_html("Переглянути заявку", f"{settings.FRONTEND_URL}/admin/creators/applications", "#8B5CF6")}
        """

        html_content = get_email_template(content, language_code)
        return await self.send_email(to=admin_email, subject=subject, html_content=html_content)


email_service = EmailService()

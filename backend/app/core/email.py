import httpx
import logging
from typing import List, Optional, Dict
from app.core.config import settings
from app.core.translations import get_text

logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self):
        self.api_key = settings.RESEND_API_KEY
        self.from_email = settings.FROM_EMAIL
        self.api_url = "https://api.resend.com/emails"

    async def send_email(
            self,
            to: str,
            subject: str,
            html_content: str,
            text_content: Optional[str] = None
    ) -> bool:
        if not self.api_key:
            logger.warning("Resend API key missing")
            return False

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        data = {
            "from": self.from_email,
            "to": to,
            "subject": subject,
            "html": html_content
        }

        if text_content:
            data["text"] = text_content

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.api_url,
                    json=data,
                    headers=headers
                )
                response.raise_for_status()
                logger.info(f"Email sent successfully to {to}")
                return True
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return False

    async def send_order_confirmation(
            self,
            user_email: str,
            order_id: int,
            products: List[Dict],
            total_amount: float,
            language_code: str = "uk"
    ) -> bool:
        subject = get_text("email_order_subject", language_code, order_id=order_id)
        t = lambda k, **kwargs: get_text(k, language_code, **kwargs)

        products_html = ""
        for product in products:
            products_html += f"""
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e5e5;">
                    {product['title']}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e5e5; text-align: right;">
                    ${product['price']}
                </td>
            </tr>
            """

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>{t("email_order_body_title", order_id=order_id)}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="margin: 0;">{t("email_order_header_title")}</h1>
                    <p style="margin: 10px 0 0 0;">{t("email_order_header_subtitle")}</p>
                </div>

                <div style="background: #fff; padding: 30px; border: 1px solid #e5e5e5; 
                            border-top: none; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #667eea;">{t("email_order_body_title", order_id=order_id)}</h2>

                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <thead>
                            <tr style="background: #f8f9fa;">
                                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e5e5;">
                                    {t("email_order_table_product")}
                                </th>
                                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e5e5e5;">
                                    {t("email_order_table_price")}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {products_html}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td style="padding: 10px; font-weight: bold;">
                                    {t("email_order_table_total")}
                                </td>
                                <td style="padding: 10px; text-align: right; font-weight: bold; color: #667eea;">
                                    ${total_amount}
                                </td>
                            </tr>
                        </tfoot>
                    </table>

                    <p style="margin: 20px 0;">
                        {t("email_order_access_text")}
                    </p>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://t.me/{settings.TELEGRAM_BOT_USERNAME}" 
                           style="display: inline-block; padding: 12px 30px; background: #667eea; 
                                  color: white; text-decoration: none; border-radius: 5px;">
                            {t("email_order_button")}
                        </a>
                    </div>

                    <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">

                    <p style="color: #999; font-size: 14px; text-align: center;">
                        {t("email_order_footer_regards")}<br>
                        {t("email_order_footer_team")}
                    </p>
                </div>
            </div>
        </body>
        </html>
        """

        return await self.send_email(to=user_email, subject=subject, html_content=html_content)

    async def send_subscription_confirmation(
            self,
            user_email: str,
            end_date: str,
            language_code: str = "uk"
    ) -> bool:
        subject = get_text("email_sub_subject", language_code)
        t = lambda k, **kwargs: get_text(k, language_code, **kwargs)

        features_html = ""
        features_list = [
            t("email_sub_feature_1"),
            t("email_sub_feature_2"),
            t("email_sub_feature_3"),
            t("email_sub_feature_4"),
            t("email_sub_feature_5")
        ]

        for feature in features_list:
            features_html += f"<li>{feature}</li>"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>{t("email_sub_header_title")}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); 
                            color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="margin: 0;">{t("email_sub_header_title")}</h1>
                </div>

                <div style="background: #fff; padding: 30px; border: 1px solid #e5e5e5; 
                            border-top: none; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #f5576c;">{t("email_sub_body_title")}</h2>

                    <p>{t("email_sub_body_text", end_date=end_date)}</p>

                    <h3>{t("email_sub_features_title")}</h3>
                    <ul style="line-height: 2;">
                        {features_html}
                    </ul>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://t.me/{settings.TELEGRAM_BOT_USERNAME}" 
                           style="display: inline-block; padding: 12px 30px; background: #f5576c; 
                                  color: white; text-decoration: none; border-radius: 5px;">
                            {t("email_sub_button")}
                        </a>
                    </div>

                    <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">

                    <p style="color: #999; font-size: 14px; text-align: center;">
                        {t("email_sub_footer_thanks")}<br>
                        {t("email_sub_footer_team")}
                    </p>
                </div>
            </div>
        </body>
        </html>
        """

        return await self.send_email(to=user_email, subject=subject, html_content=html_content)

    async def send_download_links(
            self,
            user_email: str,
            products: List[Dict],
            language_code: str = "uk"
    ) -> bool:
        subject = get_text("email_download_subject", language_code)
        t = lambda k, **kwargs: get_text(k, language_code, **kwargs)

        products_html = ""
        for product in products:
            size_text = t("email_download_item_size", file_size=product['file_size_mb'])
            btn_text = t("email_download_item_button")
            products_html += f"""
            <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 5px;">
                <h3 style="margin: 0 0 10px 0; color: #333;">{product['title']}</h3>
                <p style="margin: 5px 0; color: #666;">{size_text}</p>
                <a href="{product['download_url']}" 
                   style="display: inline-block; margin-top: 10px; padding: 8px 20px; 
                          background: #667eea; color: white; text-decoration: none; 
                          border-radius: 3px;">
                    {btn_text}
                </a>
            </div>
            """

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>{t("email_download_header_title")}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="margin: 0;">{t("email_download_header_title")}</h1>
                </div>

                <div style="background: #fff; padding: 30px; border: 1px solid #e5e5e5; 
                            border-top: none; border-radius: 0 0 10px 10px;">
                    <p>{t("email_download_body_text")}</p>

                    {products_html}

                    <p style="margin-top: 30px; padding: 15px; background: #fff3cd; 
                              border-left: 4px solid #ffc107; color: #856404;">
                        {t("email_download_warning")}
                    </p>

                    <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">

                    <p style="color: #999; font-size: 14px; text-align: center;">
                        {t("email_download_footer_text")}<br>
                        {t("email_download_footer_team")}
                    </p>
                </div>
            </div>
        </body>
        </html>
        """

        return await self.send_email(to=user_email, subject=subject, html_content=html_content)


email_service = EmailService()
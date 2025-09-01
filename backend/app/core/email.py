"""
Email сервіс для відправки повідомлень через Resend
"""
import httpx
import logging
from typing import List, Optional, Dict
from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Сервіс для роботи з email через Resend API"""

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
        """
        Відправка email

        Args:
            to: Email отримувача
            subject: Тема листа
            html_content: HTML версія листа
            text_content: Текстова версія (опціонально)

        Returns:
            True при успішній відправці
        """
        if not self.api_key:
            logger.warning("Resend API key не налаштовано")
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
                logger.info(f"Email успішно відправлено на {to}")
                return True
        except Exception as e:
            logger.error(f"Помилка відправки email: {str(e)}")
            return False

    async def send_order_confirmation(
            self,
            user_email: str,
            order_id: int,
            products: List[Dict],
            total_amount: float
    ) -> bool:
        """
        Відправка підтвердження замовлення

        Args:
            user_email: Email користувача
            order_id: ID замовлення
            products: Список товарів
            total_amount: Загальна сума

        Returns:
            True при успішній відправці
        """
        subject = f"Замовлення #{order_id} - OhMyRevit"

        # Формуємо список товарів
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
            <title>Підтвердження замовлення</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="margin: 0;">OhMyRevit</h1>
                    <p style="margin: 10px 0 0 0;">Дякуємо за ваше замовлення!</p>
                </div>

                <div style="background: #fff; padding: 30px; border: 1px solid #e5e5e5; 
                            border-top: none; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #667eea;">Замовлення #{order_id}</h2>

                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <thead>
                            <tr style="background: #f8f9fa;">
                                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e5e5;">
                                    Товар
                                </th>
                                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e5e5e5;">
                                    Ціна
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {products_html}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td style="padding: 10px; font-weight: bold;">
                                    Всього:
                                </td>
                                <td style="padding: 10px; text-align: right; font-weight: bold; color: #667eea;">
                                    ${total_amount}
                                </td>
                            </tr>
                        </tfoot>
                    </table>

                    <p style="margin: 20px 0;">
                        Після підтвердження оплати ви отримаєте доступ до товарів у вашому профілі.
                    </p>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://t.me/{settings.TELEGRAM_BOT_USERNAME}" 
                           style="display: inline-block; padding: 12px 30px; background: #667eea; 
                                  color: white; text-decoration: none; border-radius: 5px;">
                            Перейти в додаток
                        </a>
                    </div>

                    <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">

                    <p style="color: #999; font-size: 14px; text-align: center;">
                        З найкращими побажаннями,<br>
                        Команда OhMyRevit
                    </p>
                </div>
            </div>
        </body>
        </html>
        """

        return await self.send_email(
            to=user_email,
            subject=subject,
            html_content=html_content
        )

    async def send_subscription_confirmation(
            self,
            user_email: str,
            end_date: str
    ) -> bool:
        """
        Відправка підтвердження підписки

        Args:
            user_email: Email користувача
            end_date: Дата закінчення підписки

        Returns:
            True при успішній відправці
        """
        subject = "Premium підписка активована - OhMyRevit"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Premium підписка</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); 
                            color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="margin: 0;">🎉 Premium активовано!</h1>
                </div>

                <div style="background: #fff; padding: 30px; border: 1px solid #e5e5e5; 
                            border-top: none; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #f5576c;">Вітаємо з Premium підпискою!</h2>

                    <p>Ваша Premium підписка успішно активована та діє до <strong>{end_date}</strong>.</p>

                    <h3>Що входить в Premium:</h3>
                    <ul style="line-height: 2;">
                        <li>✅ Доступ до всіх преміум товарів</li>
                        <li>✅ Нові товари щотижня</li>
                        <li>✅ Товари залишаються назавжди</li>
                        <li>✅ Пріоритетна підтримка</li>
                        <li>✅ Ексклюзивні знижки</li>
                    </ul>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://t.me/{settings.TELEGRAM_BOT_USERNAME}" 
                           style="display: inline-block; padding: 12px 30px; background: #f5576c; 
                                  color: white; text-decoration: none; border-radius: 5px;">
                            Перейти до товарів
                        </a>
                    </div>

                    <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">

                    <p style="color: #999; font-size: 14px; text-align: center;">
                        Дякуємо за довіру!<br>
                        Команда OhMyRevit
                    </p>
                </div>
            </div>
        </body>
        </html>
        """

        return await self.send_email(
            to=user_email,
            subject=subject,
            html_content=html_content
        )

    async def send_download_links(
            self,
            user_email: str,
            products: List[Dict]
    ) -> bool:
        """
        Відправка посилань на завантаження

        Args:
            user_email: Email користувача
            products: Список товарів з посиланнями

        Returns:
            True при успішній відправці
        """
        subject = "Ваші товари готові до завантаження - OhMyRevit"

        # Формуємо список товарів з посиланнями
        products_html = ""
        for product in products:
            products_html += f"""
            <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 5px;">
                <h3 style="margin: 0 0 10px 0; color: #333;">{product['title']}</h3>
                <p style="margin: 5px 0; color: #666;">Розмір: {product['file_size_mb']} MB</p>
                <a href="{product['download_url']}" 
                   style="display: inline-block; margin-top: 10px; padding: 8px 20px; 
                          background: #667eea; color: white; text-decoration: none; 
                          border-radius: 3px;">
                    Завантажити
                </a>
            </div>
            """

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Товари готові до завантаження</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="margin: 0;">Ваші товари готові!</h1>
                </div>

                <div style="background: #fff; padding: 30px; border: 1px solid #e5e5e5; 
                            border-top: none; border-radius: 0 0 10px 10px;">
                    <p>Дякуємо за покупку! Ваші товари готові до завантаження:</p>

                    {products_html}

                    <p style="margin-top: 30px; padding: 15px; background: #fff3cd; 
                              border-left: 4px solid #ffc107; color: #856404;">
                        <strong>Важливо:</strong> Посилання для завантаження діють протягом 7 днів. 
                        Рекомендуємо зберегти файли на вашому пристрої.
                    </p>

                    <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">

                    <p style="color: #999; font-size: 14px; text-align: center;">
                        Якщо у вас виникли питання, зв'яжіться з нашою підтримкою.<br>
                        Команда OhMyRevit
                    </p>
                </div>
            </div>
        </body>
        </html>
        """

        return await self.send_email(
            to=user_email,
            subject=subject,
            html_content=html_content
        )


# Створюємо екземпляр сервісу
email_service = EmailService()
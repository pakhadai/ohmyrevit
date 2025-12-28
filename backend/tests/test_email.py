"""
Тестовий скрипт для перевірки відправки email через Resend з fallback на Gmail.
Використання: docker-compose exec backend python test_email.py <email>
"""
import asyncio
import sys
from app.core.email import email_service


async def test_email(recipient: str):
    """Тестування відправки email"""
    print(f"\n🧪 Тестування відправки email на {recipient}...")
    print("=" * 60)

    # Тест 1: Простий email
    print("\n1️⃣ Тестування базового методу send_email()...")
    result = await email_service.send_email(
        to=recipient,
        subject="🧪 Тест Email Системи - OhMyRevit",
        html_content="""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #8B5CF6;">Тестовий лист</h2>
                <p>Це тестове повідомлення від OhMyRevit.</p>
                <p><strong>Статус:</strong> Система відправки працює! ✅</p>
                <hr>
                <p style="color: #666; font-size: 12px;">
                    Якщо ви отримали цей лист через Resend, ви побачите це у логах backend.
                    Якщо через Gmail SMTP - побачите відповідне повідомлення про fallback.
                </p>
            </body>
        </html>
        """
    )
    print(f"   Результат: {'✅ Успішно' if result else '❌ Помилка'}")

    # Тест 2: Verification email
    print("\n2️⃣ Тестування send_verification_email()...")
    result = await email_service.send_verification_email(
        user_email=recipient,
        verification_token="test_token_123456",
        language_code="uk"
    )
    print(f"   Результат: {'✅ Успішно' if result else '❌ Помилка'}")

    # Тест 3: Password reset email
    print("\n3️⃣ Тестування send_password_reset_email()...")
    result = await email_service.send_password_reset_email(
        user_email=recipient,
        reset_token="reset_token_789",
        language_code="uk"
    )
    print(f"   Результат: {'✅ Успішно' if result else '❌ Помилка'}")

    print("\n" + "=" * 60)
    print("✅ Тестування завершено! Перевірте пошту та логи backend.")
    print("=" * 60)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("❌ Використання: python test_email.py <email>")
        print("   Приклад: python test_email.py test@example.com")
        sys.exit(1)

    recipient_email = sys.argv[1]
    asyncio.run(test_email(recipient_email))

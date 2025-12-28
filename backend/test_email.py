"""
Тестовий скрипт для перевірки відправки email через Resend з fallback на Gmail.
Відправляє ВСІ можливі типи листів, які є в проекті.

Використання: docker-compose exec backend python test_email.py <email>
"""
import asyncio
import sys
from datetime import datetime, timedelta
from app.core.email import email_service


async def test_all_emails(recipient: str):
    """Тестування відправки ВСІХ типів email з проекту"""
    print(f"\n🧪 Тестування ВСІХ типів email на {recipient}...")
    print("=" * 70)

    results = []

    # Тест 1: Базовий email
    print("\n1️⃣ Тестування базового методу send_email()...")
    result = await email_service.send_email(
        to=recipient,
        subject="🧪 Тест #1: Базовий Email - OhMyRevit",
        html_content="""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #8B5CF6;">Тестовий лист #1</h2>
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
    results.append(("Базовий email", result))
    print(f"   {'✅ Успішно' if result else '❌ Помилка'}")
    await asyncio.sleep(1)

    # Тест 2: Verification email
    print("\n2️⃣ Тестування send_verification_email()...")
    result = await email_service.send_verification_email(
        user_email=recipient,
        verification_token="test_verification_token_12345",
        language_code="uk"
    )
    results.append(("Підтвердження email", result))
    print(f"   {'✅ Успішно' if result else '❌ Помилка'}")
    await asyncio.sleep(1)

    # Тест 3: Password reset email
    print("\n3️⃣ Тестування send_password_reset_email()...")
    result = await email_service.send_password_reset_email(
        user_email=recipient,
        reset_token="test_reset_token_67890",
        language_code="uk"
    )
    results.append(("Відновлення пароля", result))
    print(f"   {'✅ Успішно' if result else '❌ Помилка'}")
    await asyncio.sleep(1)

    # Тест 4: New password email
    print("\n4️⃣ Тестування send_new_password_email()...")
    result = await email_service.send_new_password_email(
        user_email=recipient,
        new_password="TestPass123!",
        language_code="uk"
    )
    results.append(("Новий пароль", result))
    print(f"   {'✅ Успішно' if result else '❌ Помилка'}")
    await asyncio.sleep(1)

    # Тест 5: Registration email
    print("\n5️⃣ Тестування send_registration_email()...")
    result = await email_service.send_registration_email(
        user_email=recipient,
        temp_password="TempPass456!",
        language_code="uk"
    )
    results.append(("Реєстрація", result))
    print(f"   {'✅ Успішно' if result else '❌ Помилка'}")
    await asyncio.sleep(1)

    # Тест 6: Link account email
    print("\n6️⃣ Тестування send_link_account_email()...")
    result = await email_service.send_link_account_email(
        user_email=recipient,
        verification_token="test_link_token_abcdef",
        language_code="uk"
    )
    results.append(("Прив'язка акаунту", result))
    print(f"   {'✅ Успішно' if result else '❌ Помилка'}")
    await asyncio.sleep(1)

    # Тест 7: Order confirmation email
    print("\n7️⃣ Тестування send_order_confirmation()...")
    test_products = [
        {
            "title": "Revit Plugin Pro",
            "version": "v2.5.0",
            "price": 29.99
        },
        {
            "title": "Family Library Premium",
            "version": "v1.2.3",
            "price": 49.99
        },
        {
            "title": "Automation Tool",
            "price": 19.99
        }
    ]
    result = await email_service.send_order_confirmation(
        user_email=recipient,
        order_id=12345,
        products=test_products,
        total_amount=99.97,
        language_code="uk"
    )
    results.append(("Підтвердження замовлення", result))
    print(f"   {'✅ Успішно' if result else '❌ Помилка'}")
    await asyncio.sleep(1)

    # Тест 8: Subscription confirmation email
    print("\n8️⃣ Тестування send_subscription_confirmation()...")
    end_date = (datetime.now() + timedelta(days=30)).strftime("%d.%m.%Y")
    result = await email_service.send_subscription_confirmation(
        user_email=recipient,
        end_date=end_date,
        language_code="uk"
    )
    results.append(("Підтвердження підписки", result))
    print(f"   {'✅ Успішно' if result else '❌ Помилка'}")
    await asyncio.sleep(1)

    # Тест 9: Download links email
    print("\n9️⃣ Тестування send_download_links()...")
    test_download_products = [
        {
            "title": "Revit Plugin Pro",
            "file_size_mb": 45.8,
            "download_url": "https://dev.ohmyrevit.pp.ua/downloads/plugin-pro"
        },
        {
            "title": "Family Library Premium",
            "file_size_mb": 128.5,
            "download_url": "https://dev.ohmyrevit.pp.ua/downloads/family-library"
        },
        {
            "title": "Automation Tool",
            "file_size_mb": 12.3,
            "download_url": "https://dev.ohmyrevit.pp.ua/downloads/automation-tool"
        }
    ]
    result = await email_service.send_download_links(
        user_email=recipient,
        products=test_download_products,
        language_code="uk"
    )
    results.append(("Посилання для завантаження", result))
    print(f"   {'✅ Успішно' if result else '❌ Помилка'}")

    # Підсумок
    print("\n" + "=" * 70)
    print("📊 ПІДСУМОК ТЕСТУВАННЯ:")
    print("=" * 70)

    successful = sum(1 for _, r in results if r)
    total = len(results)

    for i, (name, result) in enumerate(results, 1):
        status = "✅ Успішно" if result else "❌ Помилка"
        print(f"{i}. {name:30} {status}")

    print("\n" + "=" * 70)
    print(f"Успішно відправлено: {successful}/{total} листів")

    if successful == total:
        print("🎉 ВСІ листи відправлено успішно!")
    elif successful > 0:
        print(f"⚠️  Частково успішно: {successful} з {total}")
    else:
        print("❌ Жоден лист не вдалося відправити")

    print("=" * 70)
    print("\n💡 Перевірте:")
    print("   1. Вашу поштову скриньку (може бути в спамі)")
    print("   2. Логи backend: docker-compose logs -f backend | grep -E '(✅|⚠️|❌)'")
    print("=" * 70)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("❌ Використання: python test_email.py <email>")
        print("   Приклад: python test_email.py test@example.com")
        sys.exit(1)

    recipient_email = sys.argv[1]

    # Валідація email
    if "@" not in recipient_email or "." not in recipient_email:
        print(f"❌ Некоректний email: {recipient_email}")
        sys.exit(1)

    asyncio.run(test_all_emails(recipient_email))

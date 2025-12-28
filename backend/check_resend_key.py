"""
Скрипт для перевірки валідності Resend API ключа
Використання: docker-compose exec backend python check_resend_key.py
"""
import sys


def check_resend_api_key():
    """Перевірка Resend API ключа"""
    try:
        import resend
        from app.core.config import settings

        print("\n" + "=" * 70)
        print("🔍 ПЕРЕВІРКА RESEND API КЛЮЧА")
        print("=" * 70)

        # Перевірка наявності ключа
        if not settings.RESEND_API_KEY:
            print("❌ RESEND_API_KEY не знайдено у .env файлі!")
            return False

        print(f"\n📋 API Key: {settings.RESEND_API_KEY[:10]}...{settings.RESEND_API_KEY[-5:]}")
        print(f"📧 FROM_EMAIL: {settings.FROM_EMAIL}")

        # Налаштування Resend
        resend.api_key = settings.RESEND_API_KEY

        # Спроба тестового запиту
        print("\n🧪 Тестування з'єднання з Resend API...")

        try:
            # Спроба відправити тестовий лист
            params = {
                "from": settings.FROM_EMAIL,
                "to": ["test@resend.dev"],  # Тестовий email від Resend
                "subject": "Test API Key Validation",
                "html": "<p>This is a test</p>",
            }

            response = resend.Emails.send(params)
            print(f"✅ API ключ ВАЛІДНИЙ!")
            print(f"📨 Тестовий лист відправлено. ID: {response.get('id', 'unknown')}")
            print("\n⚠️  УВАГА:")
            print(f"   Ваш FROM_EMAIL: {settings.FROM_EMAIL}")

            if settings.FROM_EMAIL == "onboarding@resend.dev":
                print("   ✅ Використовується тестовий домен Resend (onboarding@resend.dev)")
                print("   👉 Це працює без верифікації, але листи можуть потрапляти у спам")
            else:
                print(f"   ⚠️  Домен '{settings.FROM_EMAIL.split('@')[1]}' потребує верифікації!")
                print("   👉 Додайте DNS записи у Resend Dashboard → Domains")
                print("   👉 Або використайте 'onboarding@resend.dev' для тестування")

            return True

        except Exception as e:
            error_msg = str(e)
            print(f"\n❌ ПОМИЛКА при відправці:")
            print(f"   {error_msg}")

            if "API key is invalid" in error_msg:
                print("\n🔧 РІШЕННЯ:")
                print("   1. Перейдіть у Resend Dashboard → API Keys")
                print("   2. Створіть новий API ключ")
                print("   3. Оновіть RESEND_API_KEY у .env файлі")
                print("   4. Перезапустіть backend: docker-compose restart backend")

            elif "domain" in error_msg.lower() or "verify" in error_msg.lower():
                print("\n🔧 РІШЕННЯ:")
                print("   ВАРІАНТ 1 (для продакшну):")
                print("   1. Resend Dashboard → Domains → Add Domain")
                print("   2. Додайте ohmyrevit.pp.ua")
                print("   3. Скопіюйте DNS записи (TXT, MX, SPF, DKIM)")
                print("   4. Додайте їх у Cloudflare DNS")
                print("   5. Зачекайте верифікації")
                print("")
                print("   ВАРІАНТ 2 (для швидкого тестування):")
                print("   1. Змініть у .env: FROM_EMAIL=onboarding@resend.dev")
                print("   2. Перезапустіть: docker-compose restart backend")

            return False

    except ImportError:
        print("❌ Бібліотека 'resend' не встановлена!")
        print("   Запустіть: docker-compose build backend")
        return False
    except Exception as e:
        print(f"❌ Несподівана помилка: {str(e)}")
        return False
    finally:
        print("=" * 70)


if __name__ == "__main__":
    success = check_resend_api_key()
    sys.exit(0 if success else 1)

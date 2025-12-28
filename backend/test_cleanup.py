"""
Тестовий скрипт для перевірки автоматичного видалення неактивованих акаунтів
"""
import asyncio
from datetime import datetime, timezone, timedelta
from app.core.database import AsyncSessionLocal
from app.users.models import User
from app.collections.models import Collection  # Потрібно для зв'язку в User
from app.core.scheduler import cleanup_unverified_accounts
from sqlalchemy import select


async def test_cleanup():
    print("\n" + "=" * 70)
    print("🧪 ТЕСТ АВТОМАТИЧНОГО ВИДАЛЕННЯ НЕАКТИВОВАНИХ АКАУНТІВ")
    print("=" * 70)

    async with AsyncSessionLocal() as db:
        # Створюємо тестовий акаунт (старіший за 1 годину)
        old_time = datetime.now(timezone.utc) - timedelta(hours=2)

        test_user = User(
            email="test_old_user@test.com",
            first_name="Test Old",
            verification_token="test_token_123",
            is_email_verified=False,
            is_active=False,
            created_at=old_time,
            referral_code="TESTCODE"
        )

        db.add(test_user)
        await db.commit()
        await db.refresh(test_user)

        print(f"\n✅ Створено тестовий акаунт:")
        print(f"   ID: {test_user.id}")
        print(f"   Email: {test_user.email}")
        print(f"   Created: {test_user.created_at}")
        print(f"   Age: {datetime.now(timezone.utc) - test_user.created_at}")
        print(f"   is_email_verified: {test_user.is_email_verified}")
        print(f"   is_active: {test_user.is_active}")
        print(f"   has telegram_id: {test_user.telegram_id is not None}")

    # Запускаємо cleanup
    print("\n🔄 Запуск cleanup_unverified_accounts()...")
    deleted_count = await cleanup_unverified_accounts()

    print(f"\n📊 Результат: Видалено {deleted_count} акаунтів")

    # Перевіряємо чи видалено
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(User.email == "test_old_user@test.com")
        )
        found_user = result.scalar_one_or_none()

        if found_user:
            print(f"\n❌ ПОМИЛКА: Тестовий акаунт НЕ видалено!")
        else:
            print(f"\n✅ УСПІХ: Тестовий акаунт успішно видалено!")

    # Показуємо всіх користувачів з email
    print("\n📋 Поточні користувачі з email:")
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(User.email.isnot(None))
        )
        users = result.scalars().all()

        if not users:
            print("   Немає користувачів з email")
        else:
            for user in users:
                age = datetime.now(timezone.utc) - user.created_at
                print(f"\n   • ID: {user.id}")
                print(f"     Email: {user.email}")
                print(f"     Verified: {user.is_email_verified}")
                print(f"     Active: {user.is_active}")
                print(f"     Telegram ID: {user.telegram_id or 'None'}")
                print(f"     Age: {age}")
                print(f"     Has token: {user.verification_token is not None}")

    print("\n" + "=" * 70)


if __name__ == "__main__":
    asyncio.run(test_cleanup())

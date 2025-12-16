from datetime import date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.users.models import User
from app.wallet.models import Transaction, TransactionType
from app.core.config import settings
from app.core.translations import get_text


class BonusService:
    """Сервіс щоденних бонусів (нараховує OMR Coins)"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def claim_daily_bonus(self, user_id: int) -> dict:
        """
        Нараховує щоденний бонус у вигляді OMR Coins
        """
        query = select(User).where(User.id == user_id).with_for_update()
        result = await self.db.execute(query)
        user = result.scalar_one_or_none()

        if not user:
            raise ValueError(get_text("bonus_error_user_not_found", "uk"))

        lang = user.language_code or "uk"
        today = date.today()

        # Перевіряємо чи вже отримано сьогодні
        if user.last_bonus_claim_date == today:
            return {
                "success": False,
                "message": get_text("bonus_claim_error_already_claimed", lang),
                "next_claim_time": "00:00:00"
            }

        # Базовий бонус
        base_bonus = settings.DAILY_BONUS_BASE  # 10 монет

        # Обчислюємо streak
        if user.last_bonus_claim_date:
            days_diff = (today - user.last_bonus_claim_date).days

            if days_diff == 1:
                # Продовжуємо streak
                user.bonus_streak += 1
            elif days_diff > 1:
                # Streak скинувся
                user.bonus_streak = 1
        else:
            # Перший раз
            user.bonus_streak = 1

        # Множник за streak (максимум x7)
        streak_multiplier = min(user.bonus_streak, 7)
        bonus_amount = base_bonus * streak_multiplier

        # Бонус за кожні 7 днів streak
        if user.bonus_streak > 0 and user.bonus_streak % 7 == 0:
            bonus_amount += 50

        # Нараховуємо монети
        user.balance += bonus_amount
        user.last_bonus_claim_date = today
        new_balance = user.balance

        # Створюємо транзакцію
        transaction = Transaction(
            user_id=user_id,
            type=TransactionType.BONUS,
            amount=bonus_amount,
            balance_after=new_balance,
            description=f"Щоденний бонус (streak: {user.bonus_streak})"
        )
        self.db.add(transaction)

        await self.db.commit()
        await self.db.refresh(user)

        return {
            "success": True,
            "bonus_amount": bonus_amount,
            "new_balance": new_balance,
            "new_streak": user.bonus_streak,
            "message": get_text("bonus_claim_success_msg", lang, amount=bonus_amount)
        }

    async def get_bonus_info(self, user_id: int) -> dict:
        """Отримує інформацію про бонуси користувача"""
        user = await self.db.get(User, user_id)

        if not user:
            raise ValueError(get_text("bonus_error_user_not_found", "uk"))

        lang = user.language_code or "uk"

        today = date.today()
        can_claim = user.last_bonus_claim_date != today

        if not can_claim:
            tomorrow = today + timedelta(days=1)
            next_claim = tomorrow.strftime("%Y-%m-%d 00:00:00")
        else:
            next_claim = get_text("bonus_info_available_now", lang)

        # Обчислюємо скільки буде наступний бонус
        if can_claim:
            if user.last_bonus_claim_date and (today - user.last_bonus_claim_date).days == 1:
                next_streak = user.bonus_streak + 1
            else:
                next_streak = 1
        else:
            next_streak = user.bonus_streak

        streak_multiplier = min(next_streak, 7)
        next_bonus = settings.DAILY_BONUS_BASE * streak_multiplier

        # Бонус за 7 днів
        if next_streak > 0 and next_streak % 7 == 0:
            next_bonus += 50

        return {
            "balance": user.balance,
            "streak": user.bonus_streak,
            "can_claim_today": can_claim,
            "next_claim_time": next_claim,
            "last_claim_date": user.last_bonus_claim_date.isoformat() if user.last_bonus_claim_date else None,
            "next_bonus_amount": next_bonus if can_claim else None,
            "next_streak": next_streak if can_claim else user.bonus_streak
        }
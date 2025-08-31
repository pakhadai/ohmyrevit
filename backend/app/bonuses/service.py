"""
Сервіс для роботи з бонусною системою
"""
from datetime import date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.users.models import User
from app.core.config import settings


class BonusService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def claim_daily_bonus(self, user_id: int) -> dict:
        """
        Нарахування щоденного бонусу
        Повертає інформацію про нарахування
        """
        # Отримуємо користувача
        user = await self.db.get(User, user_id)
        if not user:
            raise ValueError("Користувач не знайдений")

        today = date.today()

        # Перевіряємо чи вже отримував бонус сьогодні
        if user.last_bonus_claim_date == today:
            return {
                "success": False,
                "message": "Бонус вже отримано сьогодні",
                "next_claim_time": "00:00:00"
            }

        # Визначаємо розмір бонусу на основі стріку
        base_bonus = settings.DAILY_BONUS_BASE  # 10 бонусів базово

        # Перевіряємо чи зберігається стрік
        if user.last_bonus_claim_date:
            days_diff = (today - user.last_bonus_claim_date).days

            if days_diff == 1:
                # Стрік продовжується
                user.bonus_streak += 1
            elif days_diff > 1:
                # Стрік обнуляється
                user.bonus_streak = 1
        else:
            # Перший бонус
            user.bonus_streak = 1

        # Розраховуємо бонус з урахуванням стріку
        streak_multiplier = min(user.bonus_streak, 7)  # Максимум x7
        bonus_amount = base_bonus * streak_multiplier

        # Додатковий бонус за тиждень без пропусків
        if user.bonus_streak % 7 == 0:
            bonus_amount += 50  # Бонус за тиждень

        # Нараховуємо бонуси
        user.bonus_balance += bonus_amount
        user.last_bonus_claim_date = today

        await self.db.commit()
        await self.db.refresh(user)

        return {
            "success": True,
            "bonus_amount": bonus_amount,
            "new_balance": user.bonus_balance,
            "streak": user.bonus_streak,
            "message": f"Отримано {bonus_amount} бонусів!"
        }

    async def get_bonus_info(self, user_id: int) -> dict:
        """
        Отримання інформації про бонусний статус
        """
        user = await self.db.get(User, user_id)
        if not user:
            raise ValueError("Користувач не знайдений")

        today = date.today()
        can_claim = user.last_bonus_claim_date != today

        # Розраховуємо наступний можливий час отримання
        if not can_claim:
            tomorrow = today + timedelta(days=1)
            next_claim = tomorrow.strftime("%Y-%m-%d 00:00:00")
        else:
            next_claim = "Доступно зараз"

        return {
            "balance": user.bonus_balance,
            "streak": user.bonus_streak,
            "can_claim_today": can_claim,
            "next_claim_time": next_claim,
            "last_claim_date": user.last_bonus_claim_date.isoformat() if user.last_bonus_claim_date else None
        }
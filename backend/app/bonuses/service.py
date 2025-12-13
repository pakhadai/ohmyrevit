from datetime import date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.users.models import User
from app.core.config import settings
from app.core.translations import get_text

class BonusService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def claim_daily_bonus(self, user_id: int) -> dict:
        query = select(User).where(User.id == user_id).with_for_update()
        result = await self.db.execute(query)
        user = result.scalar_one_or_none()

        if not user:
            raise ValueError(get_text("bonus_error_user_not_found", "uk"))

        lang = user.language_code or "uk"
        today = date.today()

        if user.last_bonus_claim_date == today:
            return {
                "success": False,
                "message": get_text("bonus_claim_error_already_claimed", lang),
                "next_claim_time": "00:00:00"
            }

        base_bonus = settings.DAILY_BONUS_BASE

        if user.last_bonus_claim_date:
            days_diff = (today - user.last_bonus_claim_date).days

            if days_diff == 1:
                user.bonus_streak += 1
            elif days_diff > 1:
                user.bonus_streak = 1
        else:
            user.bonus_streak = 1

        streak_multiplier = min(user.bonus_streak, 7)
        bonus_amount = base_bonus * streak_multiplier

        if user.bonus_streak > 0 and user.bonus_streak % 7 == 0:
            bonus_amount += 50

        user.bonus_balance += bonus_amount
        user.last_bonus_claim_date = today

        await self.db.commit()
        await self.db.refresh(user)

        return {
            "success": True,
            "bonus_amount": bonus_amount,
            "new_balance": user.bonus_balance,
            "new_streak": user.bonus_streak,
            "message": get_text("bonus_claim_success_msg", lang, amount=bonus_amount)
        }

    async def get_bonus_info(self, user_id: int) -> dict:
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

        return {
            "balance": user.bonus_balance,
            "streak": user.bonus_streak,
            "can_claim_today": can_claim,
            "next_claim_time": next_claim,
            "last_claim_date": user.last_bonus_claim_date.isoformat() if user.last_bonus_claim_date else None
        }
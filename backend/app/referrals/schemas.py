from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class ReferralUserResponse(BaseModel):
    """Коротка інформація про запрошеного користувача."""
    id: int
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReferralLogItem(BaseModel):
    """Один запис в історії нарахувань."""
    referred_user_name: str
    bonus_type: str
    bonus_amount: int
    purchase_amount: Optional[float] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ReferralInfoResponse(BaseModel):
    """Відповідь для сторінки реферальної програми."""
    referral_code: Optional[str]
    total_referrals: int
    total_bonuses_earned: int
    logs: List[ReferralLogItem]
    # ДОДАНО: Поле для списку запрошених користувачів
    referred_users: List[ReferralUserResponse] = []
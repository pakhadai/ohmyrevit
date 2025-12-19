"""
backend/app/wallet/utils.py
Утиліти для роботи з гаманцем
"""
from app.wallet.schemas import CoinPackResponse
from app.wallet.models import CoinPack
from app.core.config import settings


def coin_pack_to_response(pack: CoinPack) -> CoinPackResponse:
    """Конвертує CoinPack модель в response схему"""
    return CoinPackResponse(
        id=pack.id,
        name=pack.name,
        price_usd=pack.price_usd,
        coins_amount=pack.coins_amount,
        bonus_percent=pack.bonus_percent,
        gumroad_permalink=pack.gumroad_permalink,
        description=pack.description,
        is_active=pack.is_active,
        is_featured=pack.is_featured,
        sort_order=pack.sort_order,
        total_coins=pack.get_total_coins(),
        gumroad_url=f"{settings.GUMROAD_STORE_URL}/l/{pack.gumroad_permalink}",
        created_at=pack.created_at
    )
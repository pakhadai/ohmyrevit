from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.users.dependencies import get_current_user
from app.users.models import User
from app.core.config import settings
from app.creators.service import CreatorService
from app.creators import schemas


router = APIRouter(prefix="/creators", tags=["Creators"])


# Dependency для перевірки чи marketplace увімкнений
def check_marketplace_enabled():
    if not settings.MARKETPLACE_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Marketplace feature is currently disabled"
        )


# ============ Creator Application Endpoints ============

@router.post("/apply", response_model=schemas.CreatorApplicationResponse, dependencies=[Depends(check_marketplace_enabled)])
async def apply_to_become_creator(
    data: schemas.CreatorApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Подати заявку на статус креатора.

    Потрібно вказати посилання на портфоліо та мотиваційний лист.
    """
    service = CreatorService(db)

    try:
        application = await service.create_application(
            user_id=current_user.id,
            portfolio_url=data.portfolio_url,
            motivation=data.motivation
        )
        return application
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/status", response_model=schemas.CreatorStatusResponse, dependencies=[Depends(check_marketplace_enabled)])
async def get_creator_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Отримати статус креатора (чи є креатором, чи є заявка на розгляді)"""
    service = CreatorService(db)
    return await service.get_creator_status(current_user.id)


# ============ Creator Balance & Payouts ============

@router.get("/balance", response_model=schemas.CreatorBalanceResponse, dependencies=[Depends(check_marketplace_enabled)])
async def get_creator_balance(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Отримати баланс креатора та статистику заробітку.

    Доступно тільки для користувачів зі статусом креатора.
    """
    service = CreatorService(db)

    try:
        return await service.get_creator_balance_info(current_user.id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.post("/payouts/request", response_model=schemas.PayoutResponse, dependencies=[Depends(check_marketplace_enabled)])
async def request_payout(
    data: schemas.PayoutRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Створити запит на виплату в USDT.

    Мінімальна сума: ${settings.MIN_PAYOUT_AMOUNT_USD}
    Підтримувані мережі: TRC20, ERC20, BEP20
    """
    service = CreatorService(db)

    try:
        payout = await service.request_payout(
            user_id=current_user.id,
            amount_coins=data.amount_coins,
            usdt_address=data.usdt_address,
            usdt_network=data.usdt_network
        )
        return payout
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ============ Creator Transactions ============

@router.get("/transactions", response_model=List[schemas.CreatorTransactionResponse], dependencies=[Depends(check_marketplace_enabled)])
async def get_creator_transactions(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Отримати історію транзакцій креатора.

    Показує всі продажі, комісії, виплати та повернення.
    """
    service = CreatorService(db)
    transactions = await service.get_creator_transactions(current_user.id, limit, offset)
    return transactions


# ============ Creator Stats ============

@router.get("/stats/products", response_model=schemas.CreatorProductStats, dependencies=[Depends(check_marketplace_enabled)])
async def get_creator_product_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Отримати статистику товарів креатора.

    Показує кількість товарів за статусами, продажі та дохід.
    """
    service = CreatorService(db)
    return await service.get_creator_product_stats(current_user.id)

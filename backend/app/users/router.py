from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import EmailStr

from app.core.database import get_db
from app.users.models import User
from app.users.schemas import (
    TelegramAuthData, TokenResponse, UserResponse,
    UserRegister, UserLogin, ForgotPasswordRequest, UserChangePassword, UserUpdateProfile
)
from app.users.auth_service import AuthService
from app.users.dependencies import get_current_user

auth_router = APIRouter(prefix="/auth", tags=["Auth"])


@auth_router.post("/telegram", response_model=TokenResponse)
async def telegram_auth(
        auth_data: TelegramAuthData,
        db: AsyncSession = Depends(get_db)
):
    """
    Вхід через Telegram.
    Створює користувача автоматично, якщо його немає.
    Повертає токен.
    """
    user, is_new = await AuthService.authenticate_hybrid_telegram_user(db, auth_data)

    access_token = AuthService.create_access_token(user.id)

    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user),
        is_new_user=is_new,
        needs_registration=False  # Завжди False, бо вхід миттєвий
    )


@auth_router.post("/link-email")
async def link_email(
        email: EmailStr = Body(..., embed=True),
        user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Прив'язка Email до поточного акаунту (для користувачів Telegram).
    Відправляє лист підтвердження.
    """
    if user.is_email_verified and user.email == email:
        return {"message": "Email вже підтверджено"}

    await AuthService.initiate_email_linking(db, user, email)
    return {"message": "Лист підтвердження відправлено"}


@auth_router.post("/verify")
async def verify_email_token(
        token: str = Body(..., embed=True),
        db: AsyncSession = Depends(get_db)
):
    """
    Підтвердження Email (для реєстрації або прив'язки).
    Генерує пароль і відправляє його на пошту.
    """
    access_token, user, _ = await AuthService.verify_email_token(db, token)

    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user),
        is_new_user=False
    )


@auth_router.post("/register")
async def register_site(
        data: UserRegister,
        db: AsyncSession = Depends(get_db)
):
    """Реєстрація через сайт (ввід email)"""
    await AuthService.register_by_email(db, data.email)
    return {"message": "Перевірте пошту"}


@auth_router.post("/login", response_model=TokenResponse)
async def login_site(
        data: UserLogin,
        db: AsyncSession = Depends(get_db)
):
    """Вхід через сайт (email + password)"""
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not user.hashed_password or not AuthService.verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Невірний email або пароль")

    access_token = AuthService.create_access_token(user.id)
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )


@auth_router.post("/forgot-password")
async def forgot_password(
        data: ForgotPasswordRequest,
        db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if user and user.is_email_verified:
        # Генеруємо новий пароль
        password = AuthService.generate_strong_password()
        user.hashed_password = AuthService.get_password_hash(password)
        await db.commit()

        # ВІДПРАВЛЯЄМО ЛИСТ (Додано цей блок)
        html_content = f"""
        <h1>Відновлення пароля</h1>
        <p>Ваш новий тимчасовий пароль: <strong>{password}</strong></p>
        <p>Будь ласка, змініть його в налаштуваннях профілю після входу.</p>
        """
        from app.core.email import email_service
        await email_service.send_email(to=user.email, subject="Новий пароль - OhMyRevit", html_content=html_content)

    return {"message": "Якщо акаунт існує, ми відправили інструкції."}


@auth_router.post("/change-password")
async def change_password(
        data: UserChangePassword,
        user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    if not user.hashed_password or not AuthService.verify_password(data.old_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Невірний старий пароль")

    user.hashed_password = AuthService.get_password_hash(data.new_password)
    await db.commit()
    return {"message": "Пароль змінено"}


@auth_router.patch("/profile")
async def update_profile(
        data: UserUpdateProfile,
        user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    update_data = data.model_dump(exclude_unset=True)

    # Перевірка та об'єднання акаунтів при додаванні email
    if 'email' in update_data and update_data['email']:
        from sqlalchemy import select
        import re

        # Валідація email формату
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, update_data['email']):
            raise HTTPException(status_code=400, detail="Невірний формат email")

        existing_user_result = await db.execute(
            select(User).where(User.email == update_data['email'], User.id != user.id)
        )
        existing_user = existing_user_result.scalar_one_or_none()

        if existing_user:
            # Якщо існуючий користувач НЕ має telegram_id - об'єднати акаунти
            if not existing_user.telegram_id and user.telegram_id:
                # Зберігаємо дані для перенесення
                email_to_merge = existing_user.email
                is_verified = existing_user.is_email_verified
                password_hash = existing_user.hashed_password
                balance_to_add = existing_user.balance
                streak_to_merge = existing_user.bonus_streak

                # Переносимо замовлення, підписки, колекції
                from app.orders.models import Order
                from app.subscriptions.models import Subscription, UserProductAccess
                from app.collections.models import Collection
                from app.wallet.models import Transaction
                from app.referrals.models import ReferralLog

                # Оновлюємо user_id у всіх пов'язаних записах
                await db.execute(
                    Order.__table__.update().where(Order.user_id == existing_user.id).values(user_id=user.id)
                )
                await db.execute(
                    Subscription.__table__.update().where(Subscription.user_id == existing_user.id).values(user_id=user.id)
                )
                await db.execute(
                    Collection.__table__.update().where(Collection.user_id == existing_user.id).values(user_id=user.id)
                )
                await db.execute(
                    Transaction.__table__.update().where(Transaction.user_id == existing_user.id).values(user_id=user.id)
                )
                # Update referrer_id where old user was the referrer
                await db.execute(
                    ReferralLog.__table__.update().where(ReferralLog.referrer_id == existing_user.id).values(referrer_id=user.id)
                )
                # Update referred_user_id where old user was referred
                await db.execute(
                    ReferralLog.__table__.update().where(ReferralLog.referred_user_id == existing_user.id).values(referred_user_id=user.id)
                )
                await db.execute(
                    UserProductAccess.__table__.update().where(UserProductAccess.user_id == existing_user.id).values(user_id=user.id)
                )

                # Тимчасово очищаємо email у старого користувача (звільняємо constraint)
                import uuid
                existing_user.email = f"deleted_{uuid.uuid4()}@deleted.local"
                await db.flush()

                # Тепер оновлюємо дані поточного користувача
                user.email = email_to_merge
                user.is_email_verified = is_verified
                user.hashed_password = password_hash
                user.balance += balance_to_add
                user.bonus_streak = max(user.bonus_streak, streak_to_merge)
                await db.flush()

                # Видаляємо старий акаунт
                await db.delete(existing_user)

                await db.commit()
                await db.refresh(user)
                return UserResponse.model_validate(user)
            else:
                # Обидва користувачі мають telegram_id - не можна об'єднати
                raise HTTPException(status_code=400, detail="Цей email вже використовується іншим користувачем")
        else:
            # Email вільний - додаємо новий email і відправляємо лист для підтвердження
            from app.core.email import email_service
            import secrets

            # Створюємо токен для підтвердження
            verification_token = secrets.token_urlsafe(32)
            user.verification_token = verification_token
            user.is_email_verified = False

            # Відправляємо лист
            try:
                await email_service.send_verification_email(
                    user_email=update_data['email'],
                    verification_token=verification_token,
                    language_code=user.language_code or "uk"
                )
            except Exception as e:
                # Логуємо помилку, але не блокуємо оновлення
                print(f"Помилка відправки email: {e}")

    for key, value in update_data.items():
        setattr(user, key, value)

    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)


@auth_router.post("/verify-email")
async def verify_email(
        token: str = Body(..., embed=True),
        db: AsyncSession = Depends(get_db)
):
    """Підтвердження email адреси через токен"""
    from sqlalchemy import select

    # Шукаємо користувача з таким токеном
    result = await db.execute(
        select(User).where(User.verification_token == token)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Токен недійсний або застарів"
        )

    # Підтверджуємо email
    user.is_email_verified = True
    user.verification_token = None  # Очищаємо токен після використання

    await db.commit()
    await db.refresh(user)

    return {
        "message": "Email успішно підтверджено",
        "user": UserResponse.model_validate(user)
    }
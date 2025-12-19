"""
backend/app/core/exceptions.py
Кастомні виключення для уніфікованої обробки помилок
"""
from typing import Optional, Dict, Any


class AppException(Exception):
    """Базове виключення додатку"""
    def __init__(
        self,
        message: str,
        error_code: str,
        status_code: int = 400,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "error": self.error_code,
            "message": self.message,
            **self.details
        }


class InsufficientFundsError(AppException):
    """Недостатньо коштів на балансі"""
    def __init__(self, required: int, current: int):
        shortfall = required - current
        super().__init__(
            message=f"Недостатньо монет. Потрібно: {required}, у вас: {current}",
            error_code="insufficient_funds",
            status_code=402,
            details={
                "required_coins": required,
                "current_balance": current,
                "shortfall": shortfall
            }
        )


class ProductAccessExistsError(AppException):
    """Користувач вже має доступ до товару"""
    def __init__(self, product_names: list):
        super().__init__(
            message=f"Ви вже маєте доступ до: {', '.join(product_names)}",
            error_code="access_exists",
            status_code=409,
            details={"products": product_names}
        )


class ProductNotFoundError(AppException):
    """Товар не знайдено"""
    def __init__(self, product_id: int = None):
        super().__init__(
            message="Товар не знайдено",
            error_code="product_not_found",
            status_code=404,
            details={"product_id": product_id} if product_id else {}
        )


class UserNotFoundError(AppException):
    """Користувача не знайдено"""
    def __init__(self, user_id: int = None):
        super().__init__(
            message="Користувача не знайдено",
            error_code="user_not_found",
            status_code=404,
            details={"user_id": user_id} if user_id else {}
        )


class InvalidPromoCodeError(AppException):
    """Невалідний промокод"""
    def __init__(self, reason: str = "invalid"):
        messages = {
            "invalid": "Невалідний або неактивний промокод",
            "expired": "Термін дії промокоду закінчився",
            "max_uses": "Ліміт використання промокоду вичерпано"
        }
        super().__init__(
            message=messages.get(reason, messages["invalid"]),
            error_code="invalid_promo_code",
            status_code=400,
            details={"reason": reason}
        )


class SubscriptionNotFoundError(AppException):
    """Підписку не знайдено"""
    def __init__(self):
        super().__init__(
            message="Активну підписку не знайдено",
            error_code="subscription_not_found",
            status_code=404
        )
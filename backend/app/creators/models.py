from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum, func
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base


class CreatorApplicationStatus(str, enum.Enum):
    """Статуси заявки креатора"""
    PENDING = "pending"  # На розгляді
    APPROVED = "approved"  # Схвалено
    REJECTED = "rejected"  # Відхилено


class CreatorApplication(Base):
    """Заявка на статус креатора"""
    __tablename__ = "creator_applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)

    # Інформація від користувача
    portfolio_url = Column(String(500), nullable=True)  # Посилання на портфоліо
    motivation = Column(Text, nullable=True)  # Мотиваційний лист

    # Статус та рішення
    status = Column(SQLEnum(CreatorApplicationStatus), default=CreatorApplicationStatus.PENDING)
    rejection_reason = Column(Text, nullable=True)  # Причина відмови

    # Адмін хто розглянув
    reviewed_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", foreign_keys=[user_id], backref="creator_applications")
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])

    def __repr__(self):
        return f"<CreatorApplication(id={self.id}, user_id={self.user_id}, status={self.status})>"


class CreatorPayout(Base):
    """Виплати креаторам"""
    __tablename__ = "creator_payouts"

    id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(Integer, ForeignKey('users.id'), nullable=False)

    # Сума виплати
    amount_coins = Column(Integer, nullable=False)  # В coins
    amount_usd = Column(Integer, nullable=False)  # В доларах (цілих центів, наприклад 3000 = $30.00)

    # USDT адреса для виплати
    usdt_address = Column(String(100), nullable=False)
    usdt_network = Column(String(50), nullable=False)  # TRC20, ERC20, BEP20

    # Статус виплати
    status = Column(String(50), default="pending")  # pending, processing, completed, failed
    transaction_hash = Column(String(100), nullable=True)  # Hash транзакції в блокчейні

    # Примітки
    notes = Column(Text, nullable=True)

    # Адмін хто обробив
    processed_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    processed_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    creator = relationship("User", foreign_keys=[creator_id], backref="payouts")
    processed_by = relationship("User", foreign_keys=[processed_by_id])

    def __repr__(self):
        return f"<CreatorPayout(id={self.id}, creator_id={self.creator_id}, amount_usd=${self.amount_usd/100:.2f})>"


class CreatorTransaction(Base):
    """Історія транзакцій креатора (продажі, виплати, комісії)"""
    __tablename__ = "creator_transactions"

    id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(Integer, ForeignKey('users.id'), nullable=False)

    # Тип транзакції
    transaction_type = Column(String(50), nullable=False)  # sale, payout, commission, refund

    # Сума (може бути + або -)
    amount_coins = Column(Integer, nullable=False)

    # Опис
    description = Column(Text, nullable=True)

    # Зв'язок з продажем (якщо це sale)
    order_id = Column(Integer, ForeignKey('orders.id'), nullable=True)
    product_id = Column(Integer, ForeignKey('products.id'), nullable=True)

    # Зв'язок з виплатою (якщо це payout)
    payout_id = Column(Integer, ForeignKey('creator_payouts.id'), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    creator = relationship("User", foreign_keys=[creator_id], backref="creator_transactions")
    order = relationship("Order", foreign_keys=[order_id])
    product = relationship("Product", foreign_keys=[product_id])
    payout = relationship("CreatorPayout", foreign_keys=[payout_id])

    def __repr__(self):
        return f"<CreatorTransaction(id={self.id}, type={self.transaction_type}, amount={self.amount_coins})>"

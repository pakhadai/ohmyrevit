from sqlalchemy import (
    Column, Integer, String, ForeignKey, Table, UniqueConstraint, DateTime
)
from sqlalchemy.orm import relationship, Mapped
from sqlalchemy.sql import func
from typing import List
from app.core.database import Base

# Асоціативна таблиця для зв'язку "багато-до-багатьох" між колекціями та товарами
collection_products = Table(
    'collection_products',
    Base.metadata,
    Column('collection_id', Integer, ForeignKey('collections.id', ondelete="CASCADE"), primary_key=True),
    Column('product_id', Integer, ForeignKey('products.id', ondelete="CASCADE"), primary_key=True),
    Column('added_at', DateTime(timezone=True), server_default=func.now())
)

class Collection(Base):
    __tablename__ = "collections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    color = Column(String(20), default="default")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Зв'язки
    user: Mapped["User"] = relationship("User", back_populates="collections")
    products: Mapped[List["Product"]] = relationship(
        "Product",
        secondary=collection_products,
        back_populates="collections"
    )

    __table_args__ = (
        UniqueConstraint('user_id', 'name', name='uq_user_collection_name'),
    )

    def __repr__(self):
        return f"<Collection(id={self.id}, name='{self.name}', user_id={self.user_id})>"
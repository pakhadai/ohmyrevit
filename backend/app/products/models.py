"""
Моделі для товарів, категорій та системи перекладів
"""
from sqlalchemy import (
    Column, Integer, String, Text, Numeric, Boolean,
    ForeignKey, Table, DateTime, Enum, ARRAY, UniqueConstraint
)
from sqlalchemy.orm import relationship, Mapped
from sqlalchemy.sql import func
import enum
from typing import List, Optional
from app.core.database import Base


# Enum для типів товарів
class ProductType(str, enum.Enum):
    FREE = "free"
    PREMIUM = "premium"


# Таблиця для зв'язку Many-to-Many між товарами та категоріями
product_categories = Table(
    'product_categories',
    Base.metadata,
    Column('product_id', Integer, ForeignKey('products.id', ondelete='CASCADE')),
    Column('category_id', Integer, ForeignKey('categories.id', ondelete='CASCADE')),
    UniqueConstraint('product_id', 'category_id', name='uq_product_category')
)


class Category(Base):
    """Модель категорії товарів"""
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    # Поле 'name' видаляється, назва буде в таблиці перекладів
    slug = Column(String(100), unique=True, nullable=False, index=True)

    # Зв'язки
    products = relationship(
        "Product",
        secondary=product_categories,
        back_populates="categories"
    )
    translations: Mapped[List["CategoryTranslation"]] = relationship(
        "CategoryTranslation",
        back_populates="category",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    def get_translation(self, language_code: str = 'uk'):
        """Отримати переклад для конкретної мови"""
        for translation in self.translations:
            if translation.language_code == language_code:
                return translation
        # Fallback на українську
        for translation in self.translations:
            if translation.language_code == 'uk':
                return translation
        return None

    def __repr__(self):
        return f"<Category(slug={self.slug})>"


# ДОДАНО: Нова модель для перекладів категорій
class CategoryTranslation(Base):
    __tablename__ = "category_translations"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey('categories.id', ondelete='CASCADE'), nullable=False)
    language_code = Column(String(3), nullable=False) # 'uk', 'en', 'ru'
    name = Column(String(100), nullable=False)

    category = relationship("Category", back_populates="translations")

    __table_args__ = (
        UniqueConstraint('category_id', 'language_code', name='uq_category_language'),
    )

    def __repr__(self):
        return f"<CategoryTranslation(category_id={self.category_id}, lang={self.language_code})>"


class Product(Base):
    """Модель товару"""
    __tablename__ = "products"

    # Основні поля
    id = Column(Integer, primary_key=True, index=True)
    price = Column(Numeric(10, 2), nullable=False)
    product_type = Column(
        Enum(ProductType),
        nullable=False,
        default=ProductType.PREMIUM
    )

    # Медіа
    main_image_url = Column(String(500), nullable=False)
    gallery_image_urls = Column(ARRAY(String), default=list)

    # Файли
    zip_file_path = Column(String(500), nullable=False)
    file_size_mb = Column(Numeric(8, 2), nullable=False)

    # Додаткова інформація
    compatibility = Column(String(200))  # "Revit 2021-2024"

    # Знижки
    is_on_sale = Column(Boolean, default=False)
    sale_price = Column(Numeric(10, 2), nullable=True)

    # Лічильники (для статистики)
    views_count = Column(Integer, default=0)
    downloads_count = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Зв'язки
    categories = relationship(
        "Category",
        secondary=product_categories,
        back_populates="products"
    )
    translations = relationship(
        "ProductTranslation",
        back_populates="product",
        cascade="all, delete-orphan",
        lazy="selectin"  # Завжди завантажувати переклади
    )

    def get_translation(self, language_code: str = 'uk'):
        """
        Отримати переклад для конкретної мови
        Якщо переклад не знайдено - повертає українську версію
        """
        # Шукаємо потрібний переклад
        for translation in self.translations:
            if translation.language_code == language_code:
                return translation

        # Fallback на українську
        for translation in self.translations:
            if translation.language_code == 'uk':
                return translation

        return None

    def get_actual_price(self):
        """Повертає актуальну ціну з урахуванням знижки"""
        if self.is_on_sale and self.sale_price:
            return self.sale_price
        return self.price

    def __repr__(self):
        return f"<Product(id={self.id}, type={self.product_type})>"


class ProductTranslation(Base):
    """Модель для зберігання перекладів товару"""
    __tablename__ = "product_translations"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(
        Integer,
        ForeignKey('products.id', ondelete='CASCADE'),
        nullable=False
    )
    language_code = Column(String(3), nullable=False)  # 'uk', 'en', 'ru'

    # Поля для перекладу
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)

    # Метадані перекладу
    is_auto_translated = Column(Boolean, default=False)
    translated_at = Column(DateTime(timezone=True))

    # Зв'язки
    product = relationship("Product", back_populates="translations")

    # Унікальність комбінації product_id + language_code
    __table_args__ = (
        UniqueConstraint('product_id', 'language_code', name='uq_product_language'),
    )

    def __repr__(self):
        return f"<ProductTranslation(product_id={self.product_id}, lang={self.language_code})>"
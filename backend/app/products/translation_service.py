"""
Сервіс для автоматичного перекладу товарів через DeepL API
"""
import httpx
import logging
from typing import Dict, List, Optional
from datetime import datetime
from app.core.config import settings
from sqlalchemy.ext.asyncio import AsyncSession
from app.products.models import Product, ProductTranslation

logger = logging.getLogger(__name__)


class TranslationService:
    """Сервіс для роботи з перекладами"""

    def __init__(self):
        self.deepl_api_key = settings.DEEPL_API_KEY
        self.deepl_api_url = "https://api-free.deepl.com/v2/translate"  # або api.deepl.com для Pro
        self.target_languages = ['EN', 'RU']  # Мови для перекладу

    async def translate_text(
            self,
            text: str,
            target_lang: str,
            source_lang: str = 'UK'
    ) -> Optional[str]:
        """
        Переклад тексту через DeepL API

        Args:
            text: Текст для перекладу
            target_lang: Цільова мова (EN, RU)
            source_lang: Вихідна мова (UK)

        Returns:
            Перекладений текст або None при помилці
        """
        if not self.deepl_api_key:
            logger.error("DeepL API key не налаштовано!")
            return None

        # Підготовка параметрів запиту
        params = {
            'auth_key': self.deepl_api_key,
            'text': text,
            'source_lang': source_lang,
            'target_lang': target_lang,
            'preserve_formatting': '1'  # Зберігаємо форматування
        }

        try:
            # Асинхронний запит до DeepL
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.deepl_api_url,
                    data=params
                )
                response.raise_for_status()

                # Парсимо відповідь
                result = response.json()
                translated_text = result['translations'][0]['text']

                logger.info(f"Успішно перекладено текст на {target_lang}")
                return translated_text

        except httpx.HTTPStatusError as e:
            logger.error(f"Помилка DeepL API: {e.response.status_code} - {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"Помилка при перекладі: {str(e)}")
            return None

    async def translate_product(
            self,
            product_id: int,
            title_uk: str,
            description_uk: str,
            db: AsyncSession
    ) -> Dict[str, bool]:
        """
        Переклад товару на всі цільові мови

        Args:
            product_id: ID товару
            title_uk: Назва українською
            description_uk: Опис українською
            db: Сесія бази даних

        Returns:
            Словник з результатами перекладу для кожної мови
        """
        results = {}

        # Спочатку зберігаємо українську версію
        uk_translation = ProductTranslation(
            product_id=product_id,
            language_code='uk',
            title=title_uk,
            description=description_uk,
            is_auto_translated=False,
            translated_at=datetime.utcnow()
        )
        db.add(uk_translation)

        # Перекладаємо на кожну цільову мову
        for lang in self.target_languages:
            try:
                # Перекладаємо назву
                translated_title = await self.translate_text(
                    title_uk,
                    target_lang=lang
                )

                # Перекладаємо опис
                translated_description = await self.translate_text(
                    description_uk,
                    target_lang=lang
                )

                if translated_title and translated_description:
                    # Зберігаємо переклад
                    translation = ProductTranslation(
                        product_id=product_id,
                        language_code=lang.lower(),
                        title=translated_title,
                        description=translated_description,
                        is_auto_translated=True,
                        translated_at=datetime.utcnow()
                    )
                    db.add(translation)
                    results[lang] = True
                    logger.info(f"Товар {product_id} успішно перекладено на {lang}")
                else:
                    results[lang] = False
                    logger.warning(f"Не вдалося перекласти товар {product_id} на {lang}")

            except Exception as e:
                logger.error(f"Помилка при перекладі товару {product_id} на {lang}: {str(e)}")
                results[lang] = False

        # Зберігаємо всі переклади
        try:
            await db.commit()
        except Exception as e:
            logger.error(f"Помилка збереження перекладів: {str(e)}")
            await db.rollback()
            raise

        return results

    async def update_translation(
            self,
            product_id: int,
            language_code: str,
            title: str,
            description: str,
            db: AsyncSession
    ) -> bool:
        """
        Оновлення існуючого перекладу

        Args:
            product_id: ID товару
            language_code: Код мови
            title: Нова назва
            description: Новий опис
            db: Сесія бази даних

        Returns:
            True при успіху, False при помилці
        """
        try:
            # Шукаємо існуючий переклад
            translation = await db.query(ProductTranslation).filter(
                ProductTranslation.product_id == product_id,
                ProductTranslation.language_code == language_code
            ).first()

            if translation:
                # Оновлюємо
                translation.title = title
                translation.description = description
                translation.is_auto_translated = False
                translation.translated_at = datetime.utcnow()
            else:
                # Створюємо новий
                translation = ProductTranslation(
                    product_id=product_id,
                    language_code=language_code,
                    title=title,
                    description=description,
                    is_auto_translated=False,
                    translated_at=datetime.utcnow()
                )
                db.add(translation)

            await db.commit()
            return True

        except Exception as e:
            logger.error(f"Помилка оновлення перекладу: {str(e)}")
            await db.rollback()
            return False


# Створюємо екземпляр сервісу для використання
translation_service = TranslationService()
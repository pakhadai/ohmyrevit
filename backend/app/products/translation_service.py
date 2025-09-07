# ЗАМІНА БЕЗ ВИДАЛЕНЬ: старі рядки — закоментовано, нові — додано нижче
"""
Сервіс для автоматичного перекладу товарів через DeepL API
"""
import httpx
import logging
from typing import Dict, List, Optional
from datetime import datetime
from app.core.config import settings
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select # Додано
from app.products.models import Product, ProductTranslation

logger = logging.getLogger(__name__)


class TranslationService:
    """Сервіс для роботи з перекладами"""

    def __init__(self):
        self.deepl_api_key = settings.DEEPL_API_KEY
        self.deepl_api_url = "https://api-free.deepl.com/v2/translate"  # або api.deepl.com для Pro
        # OLD: self.target_languages = ['EN', 'RU']  # Мови для перекладу
        self.target_languages = settings.DEEPL_TARGET_LANGUAGES # Мови для перекладу беруться з конфігурації

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
        if not text:
            logger.warning("Спроба перекласти порожній текст.")
            return ""

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
        Переклад товару на всі цільові мови.
        Цей метод тепер є ідемпотентним: він оновить існуючі переклади або створить нові.
        """
        results = {}

        # === ВИРІШЕННЯ ПРОБЛЕМИ: Не створюємо український переклад повторно ===
        # Українська версія вже створюється в product_service, тому ми її тут не чіпаємо.

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

                if translated_title is not None and translated_description is not None:
                    # === ПОКРАЩЕННЯ: Оновлюємо існуючий переклад або створюємо новий ===
                    await self.update_translation(
                        product_id=product_id,
                        language_code=lang.lower(),
                        title=translated_title,
                        description=translated_description,
                        is_auto=True, # Позначаємо, що це авто-переклад
                        db=db
                    )
                    results[lang] = True
                    logger.info(f"Товар {product_id} успішно перекладено та збережено на {lang}")
                else:
                    results[lang] = False
                    logger.warning(f"Не вдалося перекласти товар {product_id} на {lang}")

            except Exception as e:
                logger.error(f"Помилка при перекладі товару {product_id} на {lang}: {str(e)}")
                results[lang] = False

        # Зберігаємо всі зміни
        try:
            await db.commit()
        except Exception as e:
            logger.error(f"Помилка збереження перекладів: {str(e)}")
            await db.rollback()
            # У фоновому завданні не варто піднімати виключення, просто логуємо

        return results

    async def update_translation(
            self,
            product_id: int,
            language_code: str,
            title: str,
            description: str,
            db: AsyncSession,
            is_auto: bool = False # Додано параметр для розрізнення ручного та авто-оновлення
    ) -> bool:
        """
        Оновлення або створення існуючого перекладу.
        """
        try:
            # Шукаємо існуючий переклад
            result = await db.execute(select(ProductTranslation).filter_by(
                product_id=product_id, language_code=language_code
            ))
            translation = result.scalar_one_or_none()

            if translation:
                # Оновлюємо
                translation.title = title
                translation.description = description
                # Якщо це ручне оновлення, знімаємо позначку авто-перекладу
                translation.is_auto_translated = is_auto
                translation.translated_at = datetime.utcnow()
            else:
                # Створюємо новий
                translation = ProductTranslation(
                    product_id=product_id,
                    language_code=language_code,
                    title=title,
                    description=description,
                    is_auto_translated=is_auto,
                    translated_at=datetime.utcnow()
                )
                db.add(translation)

            # Commit тут не робимо, він буде в головному методі translate_product
            await db.flush()
            return True

        except Exception as e:
            logger.error(f"Помилка оновлення/створення перекладу: {str(e)}")
            await db.rollback()
            return False


# Створюємо екземпляр сервісу для використання
translation_service = TranslationService()
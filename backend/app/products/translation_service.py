import httpx
import logging
from typing import Dict, List, Optional
# OLD: from datetime import datetime
from datetime import datetime, timezone
from app.core.config import settings
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select # Додано
from app.products.models import Product, ProductTranslation

logger = logging.getLogger(__name__)


class TranslationService:

    def __init__(self):
        self.deepl_api_key = settings.DEEPL_API_KEY
        self.deepl_api_url = "https://api-free.deepl.com/v2/translate"
        self.target_languages = settings.DEEPL_TARGET_LANGUAGES

    async def translate_text(
            self,
            text: str,
            target_lang: str,
            source_lang: str = 'UK'
    ) -> Optional[str]:

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
            'preserve_formatting': '1'
        }

        try:
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

        results = {}

        for lang in self.target_languages:
            try:
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
                    await self.update_translation(
                        product_id=product_id,
                        language_code=lang.lower(),
                        title=translated_title,
                        description=translated_description,
                        is_auto=True,
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

        try:
            await db.commit()
        except Exception as e:
            logger.error(f"Помилка збереження перекладів: {str(e)}")
            await db.rollback()

        return results

    async def update_translation(
            self,
            product_id: int,
            language_code: str,
            title: str,
            description: str,
            db: AsyncSession,
            is_auto: bool = False
    ) -> bool:

        try:
            result = await db.execute(select(ProductTranslation).filter_by(
                product_id=product_id, language_code=language_code
            ))
            translation = result.scalar_one_or_none()

            if translation:
                translation.title = title
                translation.description = description
                translation.is_auto_translated = is_auto
                translation.translated_at = datetime.now(timezone.utc)
            else:
                translation = ProductTranslation(
                    product_id=product_id,
                    language_code=language_code,
                    title=title,
                    description=description,
                    is_auto_translated=is_auto,
                    translated_at=datetime.now(timezone.utc)
                )
                db.add(translation)

            await db.flush()
            return True

        except Exception as e:
            logger.error(f"Помилка оновлення/створення перекладу: {str(e)}")
            await db.rollback()
            return False

translation_service = TranslationService()
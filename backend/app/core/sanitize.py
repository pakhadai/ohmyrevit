"""
HTML Sanitization utilities для захисту від XSS атак
"""
import bleach
from typing import Optional

# Дозволені HTML теги для опису товарів
ALLOWED_TAGS = [
    'p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'code', 'pre', 'a'
]

# Дозволені атрибути
ALLOWED_ATTRIBUTES = {
    'a': ['href', 'title'],
    'code': ['class'],
}

# Дозволені протоколи для посилань
ALLOWED_PROTOCOLS = ['http', 'https', 'mailto']


def sanitize_html(text: Optional[str], strip: bool = False) -> str:
    """
    Очищає HTML від шкідливого коду (XSS, script injection)

    Args:
        text: Текст для очищення
        strip: Якщо True - видалити всі HTML теги, інакше залишити дозволені

    Returns:
        Очищений текст
    """
    if not text:
        return ""

    if strip:
        # Видалити всі HTML теги
        return bleach.clean(
            text,
            tags=[],
            attributes={},
            strip=True
        )

    # Очистити з збереженням дозволених тегів
    cleaned = bleach.clean(
        text,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        protocols=ALLOWED_PROTOCOLS,
        strip=True  # Видалити заборонені теги замість екранування
    )

    # Додаткова перевірка: linkify для автоматичного перетворення URL в посилання
    # (але тільки якщо це безпечно)
    cleaned = bleach.linkify(
        cleaned,
        parse_email=False,  # Не перетворювати email в посилання
        skip_tags=['pre', 'code']  # Не linkify в блоках коду
    )

    return cleaned


def sanitize_text(text: Optional[str]) -> str:
    """
    Видалити всі HTML теги з тексту (для заголовків, коротких описів)

    Args:
        text: Текст для очищення

    Returns:
        Текст без HTML
    """
    return sanitize_html(text, strip=True)

# backend/app/core/logging_config.py
"""
Налаштування логування для додатку
"""
import logging
import sys
from app.core.config import settings


def setup_logging():
    """Налаштовує логування для всього додатку"""

    # Визначаємо рівень логування
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO

    # Формат логів
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    # Налаштовуємо базове логування
    logging.basicConfig(
        level=log_level,
        format=log_format,
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )

    # Налаштовуємо логери для різних модулів
    loggers = {
        "app.users": logging.DEBUG,
        "app.products": logging.INFO,
        "app.orders": logging.INFO,
        "sqlalchemy.engine": logging.WARNING,  # Занадто багато логів від SQLAlchemy
        "uvicorn": logging.INFO,
        "fastapi": logging.INFO,
    }

    for logger_name, level in loggers.items():
        logger = logging.getLogger(logger_name)
        logger.setLevel(level)

    # Додаємо кольори для консолі (опціонально)
    try:
        import colorlog
        handler = colorlog.StreamHandler()
        handler.setFormatter(
            colorlog.ColoredFormatter(
                "%(log_color)s%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                log_colors={
                    'DEBUG': 'cyan',
                    'INFO': 'green',
                    'WARNING': 'yellow',
                    'ERROR': 'red',
                    'CRITICAL': 'red,bg_white',
                }
            )
        )
        logging.root.handlers = [handler]
    except ImportError:
        pass  # colorlog не встановлено - використовуємо звичайне логування

    logging.info("✅ Logging configured successfully")
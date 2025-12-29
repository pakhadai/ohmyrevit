import aiofiles
import magic
import os
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from pathlib import Path
import logging

from app.core.config import settings
from app.users.dependencies import get_current_admin_user
from app.users.models import User
from app.core.translations import get_text

router = APIRouter()
logger = logging.getLogger(__name__)

UPLOAD_DIR = Path(settings.UPLOAD_PATH)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
ALLOWED_ARCHIVE_TYPES = ["application/zip", "application/x-rar-compressed", "application/x-7z-compressed"]

# Максимальні розміри файлів (в байтах)
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_ARCHIVE_SIZE = 500 * 1024 * 1024  # 500MB

# MIME-типи для реальної перевірки файлів
ALLOWED_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"]
ALLOWED_ARCHIVE_MIME = [
    "application/zip",
    "application/x-zip-compressed",
    "application/x-rar",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    "application/octet-stream"  # ZIP файли іноді визначаються як octet-stream
]


def validate_file_type(content: bytes, allowed_types: list[str], file_name: str) -> str:
    """
    Перевіряє реальний тип файлу за його вмістом (magic bytes).

    Args:
        content: Вміст файлу в байтах
        allowed_types: Список дозволених MIME-типів
        file_name: Ім'я файлу (для логування)

    Returns:
        Реальний MIME-тип файлу

    Raises:
        HTTPException: Якщо файл не відповідає дозволеним типам
    """
    try:
        # Отримуємо реальний MIME-тип за вмістом файлу
        real_mime = magic.from_buffer(content, mime=True)

        if real_mime not in allowed_types:
            logger.warning(f"File {file_name} has fake extension. Real type: {real_mime}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Підроблений тип файлу! Реальний тип: {real_mime}. Дозволені: {', '.join(allowed_types)}"
            )

        return real_mime
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        logger.error(f"Error validating file type for {file_name}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Помилка перевірки типу файлу"
        )


@router.post("/upload/image", response_model=dict)
async def upload_image(
    file: UploadFile = File(...),
    admin: User = Depends(get_current_admin_user)
):
    lang = admin.language_code or "uk"

    # Читаємо файл
    content = await file.read()

    # Перевірка розміру файлу
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image too large (max {MAX_IMAGE_SIZE // 1024 // 1024}MB)"
        )

    # Перевірка 1: Content-Type header (швидка, але ненадійна)
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=get_text("admin_upload_error_invalid_type", lang, allowed=', '.join(ALLOWED_IMAGE_TYPES))
        )

    # Перевірка 2: Реальний вміст файлу через magic bytes (надійна)
    validate_file_type(content, ALLOWED_IMAGE_MIME, file.filename)

    # Захист від Path Traversal: використовуємо тільки базове ім'я файлу
    safe_filename = os.path.basename(file.filename)
    file_path = UPLOAD_DIR / "images" / safe_filename
    file_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        async with aiofiles.open(file_path, 'wb') as out_file:
            await out_file.write(content)
    except Exception as e:
        logger.error(f"Error saving image {file.filename}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=get_text("admin_upload_error_save_generic", lang)
        )

    return {"file_path": f"/uploads/images/{safe_filename}"}


@router.post("/upload/archive", response_model=dict)
async def upload_archive(
    file: UploadFile = File(...),
    admin: User = Depends(get_current_admin_user)
):
    lang = admin.language_code or "uk"

    # Читаємо файл
    content = await file.read()

    # Перевірка розміру файлу
    if len(content) > MAX_ARCHIVE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Archive too large (max {MAX_ARCHIVE_SIZE // 1024 // 1024}MB)"
        )

    # Перевірка 1: Content-Type header (швидка, але ненадійна)
    if file.content_type not in ALLOWED_ARCHIVE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=get_text("admin_upload_error_invalid_type", lang, allowed=', '.join(ALLOWED_ARCHIVE_TYPES))
        )

    # Перевірка 2: Реальний вміст файлу через magic bytes (надійна)
    validate_file_type(content, ALLOWED_ARCHIVE_MIME, file.filename)

    # Захист від Path Traversal: використовуємо тільки базове ім'я файлу
    safe_filename = os.path.basename(file.filename)
    file_path = UPLOAD_DIR / "archives" / safe_filename
    file_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        async with aiofiles.open(file_path, 'wb') as out_file:
            await out_file.write(content)
    except Exception as e:
        logger.error(f"Error saving archive {file.filename}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=get_text("admin_upload_error_save_generic", lang)
        )

    return {"file_path": f"/uploads/archives/{safe_filename}"}
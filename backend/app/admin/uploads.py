"""
Роутер для завантаження файлів в адмін-панелі
"""
import aiofiles
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from pathlib import Path
import logging
from typing import List

from app.core.config import settings
from app.users.dependencies import get_current_admin_user
from app.users.models import User

router = APIRouter()
logger = logging.getLogger(__name__)

# Створюємо директорію для завантажень, якщо її немає
UPLOAD_DIR = Path(settings.UPLOAD_PATH)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
ALLOWED_ARCHIVE_TYPES = ["application/zip", "application/x-rar-compressed", "application/x-7z-compressed"]

@router.post("/upload/image", response_model=dict)
async def upload_image(
    file: UploadFile = File(...),
    admin: User = Depends(get_current_admin_user)
):
    """Завантаження одного зображення"""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Недопустимий тип файлу. Дозволено: {', '.join(ALLOWED_IMAGE_TYPES)}"
        )

    file_path = UPLOAD_DIR / "images" / file.filename
    file_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)
    except Exception as e:
        logger.error(f"Помилка збереження файлу {file.filename}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Не вдалося зберегти файл."
        )

    # Повертаємо відносний шлях, який буде використовуватись на фронтенді
    return {"file_path": f"/uploads/images/{file.filename}"}


@router.post("/upload/archive", response_model=dict)
async def upload_archive(
    file: UploadFile = File(...),
    admin: User = Depends(get_current_admin_user)
):
    """Завантаження одного архіву"""
    if file.content_type not in ALLOWED_ARCHIVE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Недопустимий тип файлу. Дозволено: {', '.join(ALLOWED_ARCHIVE_TYPES)}"
        )

    file_path = UPLOAD_DIR / "archives" / file.filename
    file_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)
    except Exception as e:
        logger.error(f"Помилка збереження архіву {file.filename}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Не вдалося зберегти файл."
        )

    return {"file_path": f"/uploads/archives/{file.filename}"}
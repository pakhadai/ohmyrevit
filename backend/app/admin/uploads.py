import aiofiles
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


@router.post("/upload/image", response_model=dict)
async def upload_image(
    file: UploadFile = File(...),
    admin: User = Depends(get_current_admin_user)
):
    lang = admin.language_code or "uk"

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=get_text("admin_upload_error_invalid_type", lang, allowed=', '.join(ALLOWED_IMAGE_TYPES))
        )

    file_path = UPLOAD_DIR / "images" / file.filename
    file_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)
    except Exception as e:
        logger.error(f"Error saving image {file.filename}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=get_text("admin_upload_error_save_generic", lang)
        )

    return {"file_path": f"/uploads/images/{file.filename}"}


@router.post("/upload/archive", response_model=dict)
async def upload_archive(
    file: UploadFile = File(...),
    admin: User = Depends(get_current_admin_user)
):
    lang = admin.language_code or "uk"

    if file.content_type not in ALLOWED_ARCHIVE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=get_text("admin_upload_error_invalid_type", lang, allowed=', '.join(ALLOWED_ARCHIVE_TYPES))
        )

    file_path = UPLOAD_DIR / "archives" / file.filename
    file_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)
    except Exception as e:
        logger.error(f"Error saving archive {file.filename}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=get_text("admin_upload_error_save_generic", lang)
        )

    return {"file_path": f"/uploads/archives/{file.filename}"}
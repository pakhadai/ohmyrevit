# ЗАМІНА БЕЗ ВИДАЛЕНЬ: старі рядки — закоментовано, нові — додано нижче
# backend/app/users/__init__.py
"""
Модуль користувачів
"""
# OLD: from app.users.router import router
from app.users.router import auth_router

# OLD: __all__ = ["router"]
__all__ = ["auth_router"]
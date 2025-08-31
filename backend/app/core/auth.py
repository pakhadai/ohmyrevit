"""
Централізована система авторизації
"""
from app.users.dependencies import get_current_user, get_current_admin_user

# Експортуємо для зручності
require_admin = get_current_admin_user
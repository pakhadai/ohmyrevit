// frontend/lib/api/admin.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://dev.ohmyrevit.pp.ua/api/v1';

class AdminAPI {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('auth-storage');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          this.token = parsed.state?.token || null;
        } catch {}
      }
    }
  }

  private async request(url: string, options: RequestInit = {}) {
    // Оновлюємо токен перед кожним запитом
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('auth-storage');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                this.token = parsed.state?.token || null;
            } catch {}
        }
    }

    const headers: Record<string, string> = {
      ...options.headers,
      'Authorization': this.token ? `Bearer ${this.token}` : '',
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers,
      body: options.body instanceof FormData
        ? options.body
        : options.body
          ? JSON.stringify(options.body)
          : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Мережева помилка' }));
      throw new Error(error.detail || `Помилка: ${response.status}`);
    }

    return response.json();
  }

  // Dashboard
  async getDashboardStats() {
    return this.request('/admin/dashboard/stats');
  }

  // Users
  async getUsers(params?: { search?: string, skip?: number, limit?: number }) {
    const defaultParams = { skip: 0, limit: 100 };
    const queryParams = { ...defaultParams, ...params };
    const queryString = new URLSearchParams(queryParams as any).toString();
    return this.request(`/admin/users?${queryString}`);
  }

  async getUserDetails(userId: number) {
    return this.request(`/admin/users/${userId}`);
  }

  async toggleUserAdmin(userId: number) {
    return this.request(`/admin/users/${userId}/toggle-admin`, { method: 'PATCH' });
  }

  async toggleUserActive(userId: number) {
    return this.request(`/admin/users/${userId}/toggle-active`, { method: 'PATCH' });
  }

  async addUserBonus(userId: number, amount: number, reason?: string) {
    const formData = new FormData();
    formData.append('amount', amount.toString());
    if (reason) formData.append('reason', reason);
    return this.request(`/admin/users/${userId}/add-bonus`, { method: 'POST', body: formData });
  }

  async giveSubscription(userId: number, days: number) {
    return this.request(`/admin/users/${userId}/subscription`, {
      method: 'POST',
      body: JSON.stringify({ days })
    });
  }

  // Products
  async createProduct(data: any) {
    return this.request('/admin/products', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateProduct(id: number, data: any) {
    return this.request(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async getProducts(params?: any) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/products?${queryString}`);
  }

  async deleteProduct(id: number) {
    return this.request(`/admin/products/${id}`, { method: 'DELETE' });
  }

  // ДОДАНО: Методи для завантаження файлів
  async uploadImage(file: File, oldPath?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (oldPath) {
      formData.append('old_path', oldPath);
    }
    return this.request(`/admin/upload/image`, { method: 'POST', body: formData });
  }

  async uploadArchive(file: File, oldPath?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (oldPath) {
      formData.append('old_path', oldPath);
    }
    return this.request(`/admin/upload/archive`, { method: 'POST', body: formData });
  }

  // Categories
  async getCategories() {
    return this.request('/admin/categories');
  }

  async createCategory(name: string, slug: string) {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('slug', slug);
    return this.request('/admin/categories', { method: 'POST', body: formData });
  }

  async updateCategory(id: number, name: string, slug: string) {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('slug', slug);
    return this.request(`/admin/categories/${id}`, { method: 'PUT', body: formData });
  }

  async deleteCategory(id: number) {
    return this.request(`/admin/categories/${id}`, { method: 'DELETE' });
  }

  // Promo Codes
  async getPromoCodes() {
    return this.request('/admin/promo-codes');
  }

  async getPromoCodeDetails(id: number) {
    return this.request(`/admin/promo-codes/${id}`);
  }

  async updatePromoCode(id: number, data: any) {
    return this.request(`/admin/promo-codes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async createPromoCode(data: any) {
    return this.request('/admin/promo-codes', { method: 'POST', body: data });
  }

  async togglePromoCode(id: number) {
    return this.request(`/admin/promo-codes/${id}/toggle`, { method: 'PATCH' });
  }

  async deletePromoCode(id: number) {
    return this.request(`/admin/promo-codes/${id}`, { method: 'DELETE' });
  }

  // Orders
  async getOrders(params?: any) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/admin/orders?${queryString}`);
  }

  async getOrderDetail(id: number) {
    return this.request(`/admin/orders/${id}`);
  }

  async updateOrderStatus(id: number, status: string) {
    const formData = new FormData();
    formData.append('status', status);
    return this.request(`/admin/orders/${id}/status`, { method: 'PATCH', body: formData });
  }
}

export const adminApi = new AdminAPI();
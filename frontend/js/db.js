// ==================== DATABASE (LOCAL STORAGE) ====================

class LocalDB {
    constructor() {
        this.prefix = 'skylight_';
    }

    // User Management
    setCurrentUser(user) {
        localStorage.setItem(this.prefix + 'currentUser', JSON.stringify(user));
    }

    getCurrentUser() {
        const user = localStorage.getItem(this.prefix + 'currentUser');
        return user ? JSON.parse(user) : null;
    }

    setAuthToken(token) {
        localStorage.setItem(this.prefix + 'authToken', token);
    }

    getAuthToken() {
        return localStorage.getItem(this.prefix + 'authToken');
    }

    logout() {
        localStorage.removeItem(this.prefix + 'currentUser');
        localStorage.removeItem(this.prefix + 'authToken');
    }

    // Cart Management
    getCart() {
        const cart = localStorage.getItem(this.prefix + 'cart');
        return cart ? JSON.parse(cart) : [];
    }

    addToCart(product) {
        const cart = this.getCart();
        const existing = cart.find(item => item.id === product.id);
        
        if (existing) {
            existing.quantity += product.quantity || 1;
        } else {
            cart.push({ ...product, quantity: product.quantity || 1 });
        }
        
        localStorage.setItem(this.prefix + 'cart', JSON.stringify(cart));
    }

    removeFromCart(productId) {
        const cart = this.getCart().filter(item => item.id !== productId);
        localStorage.setItem(this.prefix + 'cart', JSON.stringify(cart));
    }

    clearCart() {
        localStorage.removeItem(this.prefix + 'cart');
    }

    // Tournament Registration
    saveTournamentRegistration(registration) {
        const regs = localStorage.getItem(this.prefix + 'tournament_regs');
        const regsList = regs ? JSON.parse(regs) : [];
        regsList.push(registration);
        localStorage.setItem(this.prefix + 'tournament_regs', JSON.stringify(regsList));
    }

    getTournamentRegistrations() {
        const regs = localStorage.getItem(this.prefix + 'tournament_regs');
        return regs ? JSON.parse(regs) : [];
    }
}

const db = new LocalDB();

// ==================== API UTILITY ====================

class API {
    constructor(baseURL = 'http://localhost:5000/api') {
        this.baseURL = baseURL;
    }

    getHeaders(includeAuth = true) {
        const headers = { 'Content-Type': 'application/json' };
        
        if (includeAuth) {
            const token = db.getAuthToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }
        
        return headers;
    }

    async request(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            const response = await fetch(url, {
                headers: this.getHeaders(options.auth !== false),
                ...options
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP Error: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Authentication
    async register(email, password, role = 'user') {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, role }),
            auth: false
        });
    }

    async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            auth: false
        });
    }

    // Tournaments (User)
    async getTournaments() {
        return this.request('/tournaments', { auth: false });
    }

    async getTournament(id) {
        return this.request(`/tournaments/${id}`, { auth: false });
    }

    async joinTournament(tournamentId, data) {
        return this.request(`/tournaments/${tournamentId}/join`, {
            method: 'POST',
            body: JSON.stringify(data),
            auth: false
        });
    }

    // Tournaments (Admin)
    async createTournament(formData) {
        return fetch(`${this.baseURL}/admin/tournaments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${db.getAuthToken()}`
            },
            body: formData
        }).then(r => r.json());
    }

    async getAdminTournaments() {
        return this.request('/admin/tournaments');
    }

    async updateTournament(id, formData) {
        return fetch(`${this.baseURL}/admin/tournaments/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${db.getAuthToken()}`
            },
            body: formData
        }).then(r => r.json());
    }

    async deleteTournament(id) {
        return this.request(`/admin/tournaments/${id}`, { method: 'DELETE' });
    }

    async getTournamentRegistrations(tournamentId) {
        return this.request(`/admin/tournaments/${tournamentId}/registrations`);
    }

    async getTournamentEvents(tournamentId) {
        return this.request(`/tournaments/${tournamentId}/events`, { auth: false });
    }

    async createTournamentEvent(tournamentId, data) {
        return this.request(`/admin/tournaments/${tournamentId}/events`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateEvent(eventId, data) {
        return this.request(`/admin/events/${eventId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteEvent(eventId) {
        return this.request(`/admin/events/${eventId}`, {
            method: 'DELETE'
        });
    }


    // Products (User)
    async getProducts() {
        return this.request('/products', { auth: false });
    }

    // Products (Admin)
    async createProduct(formData) {
        return fetch(`${this.baseURL}/admin/products`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${db.getAuthToken()}`
            },
            body: formData
        }).then(r => r.json());
    }

    async getAdminProducts() {
        return this.request('/admin/products');
    }

    async updateProduct(id, formData) {
        return fetch(`${this.baseURL}/admin/products/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${db.getAuthToken()}`
            },
            body: formData
        }).then(r => r.json());
    }

    async deleteProduct(id) {
        return this.request(`/admin/products/${id}`, { method: 'DELETE' });
    }

    // Orders
    async createOrder(data) {
        return this.request('/orders', {
            method: 'POST',
            body: JSON.stringify(data),
            auth: false
        });
    }

    async getOrder(id) {
        return this.request(`/orders/${id}`, { auth: false });
    }

    // Payments
    async initiatePayment(data) {
        return this.request('/payments/initiate', {
            method: 'POST',
            body: JSON.stringify(data),
            auth: false
        });
    }

    async verifyPayment(paymentId) {
        return this.request(`/payments/${paymentId}/verify`, {
            method: 'POST',
            body: JSON.stringify({})
        });
    }

    async getPayment(id) {
        return this.request(`/payments/${id}`, { auth: false });
    }

    // Stats
    async getAdminStats() {
        return this.request('/admin/stats');
    }
}

const api = new API('http://localhost:5000/api');

// ==================== UTILITY FUNCTIONS ====================

function generateTransactionId() {
    const timestamp = new Date().getTime();
    const random = Math.random().toString(36).substr(2, 9);
    return `TXN-${timestamp}-${random}`;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateStr, timeStr) {
    if (!dateStr || !timeStr) return 'N/A';
    
    try {
        const date = new Date(`${dateStr}T${timeStr}`);
        return date.toLocaleString('en-IN');
    } catch {
        return 'N/A';
    }
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    const bgColor = {
        'success': '#10B981',
        'error': '#EF4444',
        'warning': '#F59E0B',
        'info': '#3B82F6'
    }[type] || '#3B82F6';
    
    alertDiv.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        background-color: ${bgColor};
        color: white;
        z-index: 9999;
        animation: slideIn 0.3s ease;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => alertDiv.remove(), 3000);
}

function showLoading(show = true) {
    let loader = document.getElementById('global-loader');
    
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 9998;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        loader.innerHTML = `
            <div style="
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #3498db;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            "></div>
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(loader);
    }
    
    loader.style.display = show ? 'flex' : 'none';
}

function redirectIfNotAuth() {
    const token = db.getAuthToken();
    if (!token) {
        window.location.href = 'index.html';
    }
}

function checkAdminAuth() {
    const user = db.getCurrentUser();
    if (!user || user.role !== 'admin') {
        window.location.href = 'index.html';
    }
}

function logout() {
    db.logout();
    showAlert('Logged out successfully', 'success');
    setTimeout(() => window.location.href = 'index.html', 1000);
}
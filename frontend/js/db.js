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

  // Payment Management
  savePayment(payment) {
    const payments = localStorage.getItem(this.prefix + 'payments');
    const paymentsList = payments ? JSON.parse(payments) : [];
    paymentsList.push(payment);
    localStorage.setItem(this.prefix + 'payments', JSON.stringify(paymentsList));
  }

  getPayments() {
    const payments = localStorage.getItem(this.prefix + 'payments');
    return payments ? JSON.parse(payments) : [];
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

  // Tournaments (Admin)
  saveTournaments(tournaments) {
    localStorage.setItem(this.prefix + 'tournaments', JSON.stringify(tournaments));
  }

  getTournaments() {
    const tournaments = localStorage.getItem(this.prefix + 'tournaments');
    return tournaments ? JSON.parse(tournaments) : [];
  }

  addTournament(tournament) {
    const tournaments = this.getTournaments();
    tournament.id = 'tourn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    tournaments.push(tournament);
    this.saveTournaments(tournaments);
    return tournament;
  }

  updateTournament(id, updates) {
    const tournaments = this.getTournaments();
    const index = tournaments.findIndex(t => t.id === id);
    if (index !== -1) {
      tournaments[index] = { ...tournaments[index], ...updates };
      this.saveTournaments(tournaments);
    }
  }

  deleteTournament(id) {
    const tournaments = this.getTournaments().filter(t => t.id !== id);
    this.saveTournaments(tournaments);
  }

  // Products (Admin)
  saveProducts(products) {
    localStorage.setItem(this.prefix + 'products', JSON.stringify(products));
  }

  getProducts() {
    const products = localStorage.getItem(this.prefix + 'products');
    return products ? JSON.parse(products) : [];
  }

  addProduct(product) {
    const products = this.getProducts();
    product.id = 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    products.push(product);
    this.saveProducts(products);
    return product;
  }

  updateProduct(id, updates) {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...updates };
      this.saveProducts(products);
    }
  }

  deleteProduct(id) {
    const products = this.getProducts().filter(p => p.id !== id);
    this.saveProducts(products);
  }

  // Orders
  saveOrder(order) {
    const orders = localStorage.getItem(this.prefix + 'orders');
    const ordersList = orders ? JSON.parse(orders) : [];
    order.id = 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    ordersList.push(order);
    localStorage.setItem(this.prefix + 'orders', JSON.stringify(ordersList));
    return order;
  }

  getOrders() {
    const orders = localStorage.getItem(this.prefix + 'orders');
    return orders ? JSON.parse(orders) : [];
  }

  updateOrder(id, updates) {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index !== -1) {
      orders[index] = { ...orders[index], ...updates };
      localStorage.setItem(this.prefix + 'orders', JSON.stringify(orders));
    }
  }

  // Brackets
  saveBracket(bracket) {
    const brackets = localStorage.getItem(this.prefix + 'brackets');
    const bracketsList = brackets ? JSON.parse(brackets) : [];
    bracketsList.push(bracket);
    localStorage.setItem(this.prefix + 'brackets', JSON.stringify(bracketsList));
    return bracket;
  }

  getBrackets() {
    const brackets = localStorage.getItem(this.prefix + 'brackets');
    return brackets ? JSON.parse(brackets) : [];
  }

  getBracketByTournament(tournamentId) {
    const brackets = this.getBrackets();
    return brackets.find(b => b.tournament_id === tournamentId);
  }
}

// Initialize global DB
const db = new LocalDB();

// ==================== API UTILITY ====================

class API {
  constructor(baseURL = 'http://localhost:5000/api') {
    this.baseURL = baseURL;
  }

  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json'
    };

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
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: this.getHeaders(options.auth !== false),
        ...options
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API Error');
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
    return this.request('/tournaments', {
      auth: false
    });
  }

  async getTournament(id) {
    return this.request(`/tournaments/${id}`, {
      auth: false
    });
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
    return this.request(`/admin/tournaments/${id}`, {
      method: 'DELETE'
    });
  }

  async getTournamentRegistrations(tournamentId) {
    return this.request(`/admin/tournaments/${tournamentId}/registrations`);
  }

  // Products (User)
  async getProducts() {
    return this.request('/products', {
      auth: false
    });
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
    return this.request(`/admin/products/${id}`, {
      method: 'DELETE'
    });
  }

  // Orders
  async createOrder(data) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
      auth: false
    });
  }

  // Payments
  async initiatePayment(data) {
    return this.request('/payments/initiate', {
      method: 'POST',
      body: JSON.stringify(data),
      auth: false
    });
  }

  async verifyPayment(data) {
    return this.request('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(data),
      auth: false
    });
  }

  async getPayment(id) {
    return this.request(`/payments/${id}`, {
      auth: false
    });
  }

  // Stats
  async getAdminStats() {
    return this.request('/admin/stats');
  }

  // Brackets
  async createBracket(data) {
    return this.request('/admin/brackets', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getBracket(tournamentId) {
    return this.request(`/admin/brackets/${tournamentId}`);
  }

  async updateBracketMatch(bracketId, match) {
    return this.request(`/admin/brackets/${bracketId}/match`, {
      method: 'PUT',
      body: JSON.stringify({ match })
    });
  }
}

// Initialize global API
const api = new API('http://localhost:5000/api');

// ==================== UTILITY FUNCTIONS ====================

function generateTransactionId() {
  const timestamp = new Date().getTime();
  const random = Math.random().toString(36).substr(2, 9);
  return `TXN-${timestamp}-${random}`;
}

function generateVerificationToken() {
  return Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
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

function formatDateTime(date, time) {
  const dateObj = new Date(date);
  const timeObj = new Date(`2000-01-01 ${time}`);
  return `${dateObj.toLocaleDateString('en-IN')} ${timeObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
}

function showAlert(message, type = 'info') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;
  alertDiv.style.cssText = `
    position: fixed;
    top: 80px;
    left: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    z-index: 9999;
    animation: slideIn 0.3s ease;
    max-width: 500px;
  `;

  const bgColor = type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6';
  alertDiv.style.backgroundColor = bgColor;
  alertDiv.style.color = 'white';

  document.body.appendChild(alertDiv);
  setTimeout(() => alertDiv.remove(), 3000);
}

function showLoading(show = true) {
  let loader = document.getElementById('global-loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'global-loader';
    loader.style.cssText = `
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9998;
      align-items: center;
      justify-content: center;
    `;
    loader.innerHTML = '<div style="width: 50px; height: 50px; border: 5px solid #10B981; border-top: 5px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>';
    document.body.appendChild(loader);

    const style = document.createElement('style');
    style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
  }
  loader.style.display = show ? 'flex' : 'none';
}

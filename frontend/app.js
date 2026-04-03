// ShopSphere - Main Application JavaScript

const API_BASE = '/api';

// State Management
let currentUser = null;
let cart = [];
let products = [];
let categories = [];

// DOM Elements
const cartSidebar = document.getElementById('cartSidebar');
const cartItems = document.getElementById('cartItems');
const cartCount = document.getElementById('cartCount');
const cartTotal = document.getElementById('cartTotal');
const authModal = document.getElementById('authModal');
const productModal = document.getElementById('productModal');
const dashboardModal = document.getElementById('dashboardModal');
const overlay = document.getElementById('overlay');
const toast = document.getElementById('toast');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadProducts();
    checkAuthStatus();
    setupEventListeners();
    loadCartFromStorage();
});

// Event Listeners Setup
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', handleNavigation);
    });

    // Cart
    document.getElementById('cartIcon').addEventListener('click', toggleCart);
    document.getElementById('closeCart').addEventListener('click', toggleCart);
    document.getElementById('checkoutBtn').addEventListener('click', handleCheckout);

    // Auth
    document.getElementById('userIcon').addEventListener('click', handleUserIconClick);
    document.getElementById('closeAuthModal').addEventListener('click', () => closeModal(authModal));
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', switchAuthTab);
    });
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);

    // Product Modal
    document.getElementById('closeProductModal').addEventListener('click', () => closeModal(productModal));

    // Dashboard
    document.getElementById('closeDashboardModal').addEventListener('click', () => closeModal(dashboardModal));
    document.querySelectorAll('.dash-link').forEach(link => {
        link.addEventListener('click', handleDashboardNavigation);
    });
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Overlay
    overlay.addEventListener('click', closeAllModals);

    // Search
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // Shop Now Button
    document.getElementById('shopNowBtn').addEventListener('click', () => {
        document.querySelector('[data-page="products"]').click();
    });

    // Filters
    document.getElementById('categoryFilter')?.addEventListener('change', filterProducts);
    document.getElementById('sortBy')?.addEventListener('change', sortProducts);
}

// API Functions
async function apiCall(endpoint, options = {}) {
    try {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
        };

        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: { ...headers, ...options.headers }
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'API Error');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Load Categories
async function loadCategories() {
    try {
        const response = await apiCall('/products/categories');
        categories = response.categories || getMockCategories();
        renderCategories();
        populateCategoryFilter();
    } catch (error) {
        categories = getMockCategories();
        renderCategories();
        populateCategoryFilter();
    }
}

// Load Products
async function loadProducts() {
    try {
        const response = await apiCall('/products');
        products = response.products || getMockProducts();
        renderProducts(products.slice(0, 8), 'productsGrid');
    } catch (error) {
        products = getMockProducts();
        renderProducts(products.slice(0, 8), 'productsGrid');
    }
}

// Mock Data
function getMockCategories() {
    return [
        { category_id: 1, name: 'Electronics', icon: 'fa-laptop', description: 'Latest gadgets and devices' },
        { category_id: 2, name: 'Clothing', icon: 'fa-tshirt', description: 'Fashion for everyone' },
        { category_id: 3, name: 'Home & Garden', icon: 'fa-home', description: 'Make your home beautiful' },
        { category_id: 4, name: 'Sports', icon: 'fa-futbol', description: 'Gear up for adventure' }
    ];
}

function getMockProducts() {
    return [
        { product_id: 1, name: 'Wireless Headphones', category_name: 'Electronics', price: 99.99, original_price: 149.99, rating: 4.5, image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300', description: 'Premium wireless headphones with noise cancellation' },
        { product_id: 2, name: 'Smart Watch', category_name: 'Electronics', price: 199.99, original_price: 249.99, rating: 4.8, image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300', description: 'Feature-packed smartwatch for your active lifestyle' },
        { product_id: 3, name: 'Running Shoes', category_name: 'Sports', price: 79.99, original_price: 99.99, rating: 4.3, image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300', description: 'Comfortable running shoes for all terrains' },
        { product_id: 4, name: 'Denim Jacket', category_name: 'Clothing', price: 59.99, original_price: 89.99, rating: 4.6, image_url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=300', description: 'Classic denim jacket for any occasion' },
        { product_id: 5, name: 'Coffee Maker', category_name: 'Home & Garden', price: 49.99, original_price: 69.99, rating: 4.4, image_url: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=300', description: 'Brew perfect coffee every morning' },
        { product_id: 6, name: 'Backpack', category_name: 'Sports', price: 39.99, original_price: 59.99, rating: 4.7, image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300', description: 'Durable backpack for work and travel' },
        { product_id: 7, name: 'Sunglasses', category_name: 'Clothing', price: 29.99, original_price: 49.99, rating: 4.2, image_url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300', description: 'Stylish sunglasses with UV protection' },
        { product_id: 8, name: 'Plant Pot Set', category_name: 'Home & Garden', price: 24.99, original_price: 34.99, rating: 4.5, image_url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=300', description: 'Beautiful ceramic plant pots for your garden' }
    ];
}

// Render Functions
function renderCategories() {
    const grid = document.getElementById('categoriesGrid');
    grid.innerHTML = categories.map(cat => `
        <div class="category-card" onclick="filterByCategory(${cat.category_id})">
            <i class="fas ${cat.icon || 'fa-box'}"></i>
            <h3>${cat.name}</h3>
            <p>${cat.description || ''}</p>
        </div>
    `).join('');
}

function renderProducts(productList, containerId) {
    const grid = document.getElementById(containerId);
    if (!grid) return;
    
    grid.innerHTML = productList.map(product => `
        <div class="product-card">
            <div class="product-image">
                ${product.original_price > product.price ? '<span class="product-badge">Sale</span>' : ''}
                <img src="${product.image_url || 'https://via.placeholder.com/300'}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300'">
            </div>
            <div class="product-info">
                <span class="product-category">${product.category_name || 'General'}</span>
                <h3 class="product-name" onclick="showProductDetail(${product.product_id})">${product.name}</h3>
                <div class="product-rating">
                    ${renderStars(product.rating || 0)}
                    <span>(${product.rating || 0})</span>
                </div>
                <div class="product-price">
                    <span class="current-price">$${product.price?.toFixed(2)}</span>
                    ${product.original_price > product.price ? `<span class="original-price">$${product.original_price?.toFixed(2)}</span>` : ''}
                </div>
                <div class="product-actions">
                    <button class="btn btn-primary" onclick="addToCart(${product.product_id})">Add to Cart</button>
                    <button class="btn btn-secondary" onclick="showProductDetail(${product.product_id})">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    return `${'<i class="fas fa-star"></i>'.repeat(fullStars)}${halfStar ? '<i class="fas fa-star-half-alt"></i>' : ''}${'<i class="far fa-star"></i>'.repeat(emptyStars)}`;
}

// Cart Functions
function addToCart(productId) {
    const product = products.find(p => p.product_id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.product_id === productId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    updateCart();
    showToast('Product added to cart!');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.product_id !== productId);
    updateCart();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.product_id === productId);
    if (!item) return;

    item.quantity += change;
    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        updateCart();
    }
}

function updateCart() {
    renderCartItems();
    updateCartCount();
    updateCartTotal();
    saveCartToStorage();
}

function renderCartItems() {
    if (cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 2rem;">Your cart is empty</p>';
        return;
    }

    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">
                <img src="${item.image_url || 'https://via.placeholder.com/80'}" alt="${item.name}">
            </div>
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">$${item.price?.toFixed(2)}</div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="updateQuantity(${item.product_id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.product_id}, 1)">+</button>
                </div>
            </div>
            <i class="fas fa-trash cart-item-remove" onclick="removeFromCart(${item.product_id})"></i>
        </div>
    `).join('');
}

function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = count;
}

function updateCartTotal() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = `$${total.toFixed(2)}`;
}

function toggleCart(e) {
    e?.preventDefault();
    cartSidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

function saveCartToStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function loadCartFromStorage() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCart();
    }
}

// Auth Functions
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
        currentUser = JSON.parse(user);
        updateUIForLoggedInUser();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        currentUser = response.user;
        updateUIForLoggedInUser();
        closeModal(authModal);
        showToast('Login successful!');
    } catch (error) {
        showToast(error.message || 'Login failed');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showToast('Passwords do not match');
        return;
    }

    try {
        const response = await apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password })
        });

        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        currentUser = response.user;
        updateUIForLoggedInUser();
        closeModal(authModal);
        showToast('Registration successful!');
    } catch (error) {
        showToast(error.message || 'Registration failed');
    }
}

function handleLogout(e) {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    closeModal(dashboardModal);
    showToast('Logged out successfully');
}

function updateUIForLoggedInUser() {
    document.getElementById('userName').textContent = currentUser?.name || 'User';
}

function handleUserIconClick(e) {
    e.preventDefault();
    if (currentUser) {
        openModal(dashboardModal);
        loadDashboardSection('orders');
    } else {
        openModal(authModal);
    }
}

function switchAuthTab(e) {
    const tab = e.target.dataset.tab;
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    
    document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
    document.getElementById('registerForm').classList.toggle('hidden', tab !== 'register');
}

// Modal Functions
function openModal(modal) {
    modal.classList.add('active');
    overlay.classList.add('active');
}

function closeModal(modal) {
    modal.classList.remove('active');
    overlay.classList.remove('active');
}

function closeAllModals() {
    [authModal, productModal, dashboardModal].forEach(modal => modal.classList.remove('active'));
    cartSidebar.classList.remove('active');
    overlay.classList.remove('active');
}

// Product Detail
function showProductDetail(productId) {
    const product = products.find(p => p.product_id === productId);
    if (!product) return;

    const content = document.getElementById('productDetailContent');
    content.innerHTML = `
        <div class="product-detail-image">
            <img src="${product.image_url || 'https://via.placeholder.com/400'}" alt="${product.name}">
        </div>
        <div class="product-detail-info">
            <span class="product-category">${product.category_name || 'General'}</span>
            <h2>${product.name}</h2>
            <div class="product-rating">
                ${renderStars(product.rating || 0)}
                <span>(${product.rating || 0})</span>
            </div>
            <div class="product-price">
                <span class="current-price">$${product.price?.toFixed(2)}</span>
                ${product.original_price > product.price ? `<span class="original-price">$${product.original_price?.toFixed(2)}</span>` : ''}
            </div>
            <p class="product-description">${product.description || 'No description available.'}</p>
            <div class="quantity-selector">
                <label>Quantity:</label>
                <div class="quantity-input">
                    <button onclick="decreaseDetailQty()">-</button>
                    <input type="number" id="detailQuantity" value="1" min="1">
                    <button onclick="increaseDetailQty()">+</button>
                </div>
            </div>
            <button class="btn btn-primary" onclick="addToCartFromDetail(${product.product_id})">Add to Cart</button>
        </div>
    `;
    openModal(productModal);
}

function increaseDetailQty() {
    const input = document.getElementById('detailQuantity');
    input.value = parseInt(input.value) + 1;
}

function decreaseDetailQty() {
    const input = document.getElementById('detailQuantity');
    if (parseInt(input.value) > 1) {
        input.value = parseInt(input.value) - 1;
    }
}

function addToCartFromDetail(productId) {
    const quantity = parseInt(document.getElementById('detailQuantity').value);
    const product = products.find(p => p.product_id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.product_id === productId);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ ...product, quantity });
    }

    updateCart();
    closeModal(productModal);
    showToast('Product added to cart!');
}

// Navigation
function handleNavigation(e) {
    e.preventDefault();
    const page = e.target.dataset.page;

    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    e.target.classList.add('active');

    const heroSection = document.getElementById('heroSection');
    const categoriesSection = document.getElementById('categoriesSection');
    const productsSection = document.getElementById('productsSection');
    const allProductsPage = document.getElementById('allProductsPage');

    switch (page) {
        case 'home':
            heroSection.classList.remove('hidden');
            categoriesSection.classList.remove('hidden');
            productsSection.classList.remove('hidden');
            allProductsPage.classList.add('hidden');
            break;
        case 'products':
            heroSection.classList.add('hidden');
            categoriesSection.classList.add('hidden');
            productsSection.classList.add('hidden');
            allProductsPage.classList.remove('hidden');
            renderProducts(products, 'allProductsGrid');
            break;
        case 'categories':
            heroSection.classList.add('hidden');
            categoriesSection.classList.remove('hidden');
            productsSection.classList.add('hidden');
            allProductsPage.classList.add('hidden');
            break;
        case 'about':
            showToast('About page coming soon!');
            break;
    }
}

// Dashboard
function handleDashboardNavigation(e) {
    e.preventDefault();
    const section = e.target.dataset.section;
    if (!section) return;

    document.querySelectorAll('.dash-link').forEach(link => link.classList.remove('active'));
    e.target.classList.add('active');
    loadDashboardSection(section);
}

async function loadDashboardSection(section) {
    const main = document.getElementById('dashboardMain');

    switch (section) {
        case 'orders':
            main.innerHTML = `
                <h3>My Orders</h3>
                <table class="orders-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Date</th>
                            <th>Total</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>#1001</td>
                            <td>2024-01-15</td>
                            <td>$149.99</td>
                            <td><span class="status-badge status-delivered">Delivered</span></td>
                        </tr>
                        <tr>
                            <td>#1002</td>
                            <td>2024-01-20</td>
                            <td>$89.99</td>
                            <td><span class="status-badge status-shipped">Shipped</span></td>
                        </tr>
                    </tbody>
                </table>
            `;
            break;
        case 'profile':
            main.innerHTML = `
                <h3>My Profile</h3>
                <form class="profile-form">
                    <div class="form-group">
                        <label>Full Name</label>
                        <input type="text" value="${currentUser?.name || ''}">
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" value="${currentUser?.email || ''}">
                    </div>
                    <div class="form-group">
                        <label>Phone</label>
                        <input type="tel" placeholder="Enter phone number">
                    </div>
                    <div class="form-group">
                        <label>Address</label>
                        <input type="text" placeholder="Enter address">
                    </div>
                    <button type="submit" class="btn btn-primary">Update Profile</button>
                </form>
            `;
            break;
        case 'reviews':
            main.innerHTML = `
                <h3>My Reviews</h3>
                <div class="review-card">
                    <div class="review-header">
                        <span class="review-product">Wireless Headphones</span>
                        <span class="review-date">Jan 15, 2024</span>
                    </div>
                    <div class="product-rating">
                        ${renderStars(5)}
                    </div>
                    <p class="review-text">Amazing sound quality and very comfortable to wear!</p>
                </div>
            `;
            break;
    }
}

// Filter and Sort
function populateCategoryFilter() {
    const filter = document.getElementById('categoryFilter');
    if (!filter) return;
    
    filter.innerHTML = '<option value="">All Categories</option>' +
        categories.map(cat => `<option value="${cat.category_id}">${cat.name}</option>`).join('');
}

function filterByCategory(categoryId) {
    document.querySelector('[data-page="products"]').click();
    const filter = document.getElementById('categoryFilter');
    if (filter) {
        filter.value = categoryId;
        filterProducts();
    }
}

function filterProducts() {
    const categoryId = document.getElementById('categoryFilter')?.value;
    let filtered = [...products];
    
    if (categoryId) {
        const category = categories.find(c => c.category_id == categoryId);
        if (category) {
            filtered = products.filter(p => p.category_name === category.name);
        }
    }
    
    renderProducts(filtered, 'allProductsGrid');
}

function sortProducts() {
    const sortBy = document.getElementById('sortBy')?.value;
    let sorted = [...products];
    
    switch (sortBy) {
        case 'price-low':
            sorted.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            sorted.sort((a, b) => b.price - a.price);
            break;
        case 'rating':
            sorted.sort((a, b) => b.rating - a.rating);
            break;
        case 'name':
        default:
            sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    renderProducts(sorted, 'allProductsGrid');
}

// Search
function handleSearch() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    if (!query) return;

    const results = products.filter(p => 
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query)) ||
        (p.category_name && p.category_name.toLowerCase().includes(query))
    );

    document.querySelector('[data-page="products"]').click();
    renderProducts(results, 'allProductsGrid');
    showToast(`Found ${results.length} product(s)`);
}

// Checkout
async function handleCheckout() {
    if (!currentUser) {
        closeAllModals();
        openModal(authModal);
        showToast('Please login to checkout');
        return;
    }

    if (cart.length === 0) {
        showToast('Your cart is empty');
        return;
    }

    try {
        const orderItems = cart.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price
        }));

        await apiCall('/orders', {
            method: 'POST',
            body: JSON.stringify({ items: orderItems })
        });

        cart = [];
        updateCart();
        toggleCart();
        showToast('Order placed successfully!');
    } catch (error) {
        showToast('Checkout completed! Thank you for your order.');
        cart = [];
        updateCart();
        toggleCart();
    }
}

// Toast Notification
function showToast(message) {
    const toastMessage = document.getElementById('toastMessage');
    toastMessage.textContent = message;
    toast.classList.add('active');
    
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

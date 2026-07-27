import { initialProducts } from './mockData.js';

// State management module for EasyBuy

class AppState {
  constructor() {
    this.listeners = [];
    
    this.products = [];
    this.cart = this.loadLocal('eb_cart', []);
    this.orders = [];
    this.userRole = 'customer'; 
    this.currentView = 'customer';
    
    // UI temporary states
    this.activeProduct = null;
    this.searchQuery = '';
    this.filters = {
      category: 'All',
      priceMin: 0,
      priceMax: 100000,
      minRating: 0,
      selectedColors: [],
      sortBy: 'popularity'
    };
    
    this.paymentSettings = { payeeName: 'EasyBuy Store', upiId: 'easybuy@okaxis' };
  }

  async initFromServer() {
    try {
      const res = await fetch('/api/db');
      const data = await res.json();
      this.products = data.products || initialProducts;
      this.orders = data.orders || [];
      if (data.paymentSettings) {
        this.paymentSettings = data.paymentSettings;
      }
    } catch (e) {
      console.error("Failed to load from server:", e);
      this.products = initialProducts;
    }
  }

  // --- Storage Helpers ---
  loadLocal(key, defaultValue) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }

  saveLocal(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {}
  }

  saveToServer() {
    fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        products: this.products,
        orders: this.orders,
        paymentSettings: this.paymentSettings
      })
    }).catch(e => console.error("Sync error:", e));
  }

  // --- Subscription / Reactivity ---
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notify() {
    this.listeners.forEach(cb => cb());
  }

  // --- View & Role Management ---
  setCurrentView(view) {
    this.currentView = view;
    this.notify();
  }

  getCurrentView() {
    return this.currentView;
  }

  setUserRole(role) {
    this.userRole = role;
    this.currentView = role === 'admin' ? 'admin' : 'customer';
    this.notify();
  }

  getUserRole() {
    return this.userRole;
  }

  // --- Payment Settings ---
  getPaymentSettings() {
    return this.paymentSettings;
  }

  updatePaymentSettings(settings) {
    this.paymentSettings = {
      payeeName: settings.payeeName || 'EasyBuy Store',
      upiId: settings.upiId || 'easybuy@okaxis'
    };
    this.saveToServer();
    this.notify();
  }

  // --- Product CRUD ---
  getProducts() {
    return this.products;
  }

  getProductById(id) {
    return this.products.find(p => p.id === id);
  }

  addProduct(product) {
    const newProduct = {
      id: 'p_' + Date.now(),
      title: product.title,
      category: product.category,
      price: Number(product.price),
      originalPrice: Number(product.originalPrice || product.price),
      colors: Array.isArray(product.colors) ? product.colors : product.colors.split(',').map(s => s.trim()).filter(Boolean),
      rating: Number(product.rating || 4.0),
      ratingCount: Number(product.ratingCount || 1),
      image: product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600',
      description: product.description || 'No description provided.',
      stock: Number(product.stock || 5)
    };
    this.products.unshift(newProduct);
    this.saveToServer();
    this.notify();
    return newProduct;
  }

  updateProduct(id, updatedFields) {
    const idx = this.products.findIndex(p => p.id === id);
    if (idx !== -1) {
      const colors = Array.isArray(updatedFields.colors) 
        ? updatedFields.colors 
        : updatedFields.colors.split(',').map(s => s.trim()).filter(Boolean);

      this.products[idx] = {
        ...this.products[idx],
        ...updatedFields,
        price: Number(updatedFields.price),
        originalPrice: Number(updatedFields.originalPrice || updatedFields.price),
        colors: colors,
        stock: Number(updatedFields.stock),
        rating: Number(updatedFields.rating || this.products[idx].rating)
      };
      
      this.saveToServer();
      this.notify();
      return true;
    }
    return false;
  }

  deleteProduct(id) {
    this.products = this.products.filter(p => p.id !== id);
    // Also remove from cart if present
    this.cart = this.cart.filter(item => item.productId !== id);
    this.saveToServer();
    this.saveLocal('eb_cart', this.cart);
    this.notify();
  }

  // --- Cart Management ---
  getCart() {
    return this.cart;
  }

  addToCart(productId, color) {
    const product = this.getProductById(productId);
    if (!product || product.stock <= 0) return false;

    // Check if item with this product AND color is already in cart
    const existingIndex = this.cart.findIndex(item => item.productId === productId && item.color === color);
    
    if (existingIndex !== -1) {
      // Check stock limit
      if (this.cart[existingIndex].quantity < product.stock) {
        this.cart[existingIndex].quantity += 1;
      } else {
        return false; // Out of stock limit
      }
    } else {
      this.cart.push({
        productId,
        color: color || (product.colors[0] || 'Default'),
        quantity: 1
      });
    }

    this.saveLocal('eb_cart', this.cart);
    this.notify();
    return true;
  }

  removeFromCart(productId, color) {
    this.cart = this.cart.filter(item => !(item.productId === productId && item.color === color));
    this.saveLocal('eb_cart', this.cart);
    this.notify();
  }

  updateCartQuantity(productId, color, quantity) {
    const product = this.getProductById(productId);
    if (!product) return;

    const idx = this.cart.findIndex(item => item.productId === productId && item.color === color);
    if (idx !== -1) {
      if (quantity <= 0) {
        this.cart.splice(idx, 1);
      } else {
        // Enforce stock limit
        this.cart[idx].quantity = Math.min(quantity, product.stock);
      }
      this.saveLocal('eb_cart', this.cart);
      this.notify();
    }
  }

  clearCart() {
    this.cart = [];
    this.saveLocal('eb_cart', this.cart);
    this.notify();
  }

  // --- Orders Management ---
  getOrders() {
    return this.orders;
  }

  placeOrder(shippingInfo, paymentMethod) {
    if (this.cart.length === 0) return null;

    // Compile items with snapshotted prices at the time of purchase
    const orderItems = this.cart.map(cartItem => {
      const product = this.getProductById(cartItem.productId);
      return {
        productId: cartItem.productId,
        title: product ? product.title : 'Deleted Product',
        image: product ? product.image : '',
        price: product ? product.price : 0,
        color: cartItem.color,
        quantity: cartItem.quantity
      };
    });

    // Deduct Stock
    this.cart.forEach(cartItem => {
      const product = this.getProductById(cartItem.productId);
      if (product) {
        product.stock = Math.max(0, product.stock - cartItem.quantity);
      }
    });
    this.saveToServer();

    const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const newOrder = {
      id: 'ord_' + Date.now(),
      date: new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      items: orderItems,
      shippingInfo,
      paymentMethod,
      totalAmount,
      status: 'Pending' // Pending, Shipped, Delivered
    };

    this.orders.unshift(newOrder);
    this.saveToServer();
    
    // Clear cart after order is placed
    this.cart = [];
    this.saveLocal('eb_cart', this.cart);
    
    this.notify();
    return newOrder;
  }

  updateOrderStatus(orderId, status) {
    const idx = this.orders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      this.orders[idx].status = status;
      this.saveToServer();
      this.notify();
      return true;
    }
    return false;
  }

  // --- Product Filter Actions ---
  setSearchQuery(query) {
    this.searchQuery = query;
    this.notify();
  }

  setFilter(filterKey, value) {
    this.filters[filterKey] = value;
    this.notify();
  }

  toggleColorFilter(color) {
    const index = this.filters.selectedColors.indexOf(color);
    if (index === -1) {
      this.filters.selectedColors.push(color);
    } else {
      this.filters.selectedColors.splice(index, 1);
    }
    this.notify();
  }

  resetFilters() {
    this.filters = {
      category: 'All',
      priceMin: 0,
      priceMax: 100000,
      minRating: 0,
      selectedColors: [],
      sortBy: 'popularity'
    };
    this.searchQuery = '';
    this.notify();
  }

  // Get filtered and sorted products
  getFilteredProducts() {
    return this.products
      .filter(product => {
        // 1. Search Query Filter
        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase();
          const matchTitle = product.title.toLowerCase().includes(query);
          const matchCategory = product.category.toLowerCase().includes(query);
          const matchDesc = product.description.toLowerCase().includes(query);
          if (!matchTitle && !matchCategory && !matchDesc) return false;
        }

        // 2. Category Filter
        if (this.filters.category !== 'All' && product.category !== this.filters.category) {
          return false;
        }

        // 3. Price Filter
        if (product.price < this.filters.priceMin || product.price > this.filters.priceMax) {
          return false;
        }

        // 4. Rating Filter
        if (product.rating < this.filters.minRating) {
          return false;
        }

        // 5. Colors Filter
        if (this.filters.selectedColors.length > 0) {
          const hasColorMatch = product.colors.some(c => 
            this.filters.selectedColors.some(sc => sc.toLowerCase() === c.toLowerCase())
          );
          if (!hasColorMatch) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Sort sorting
        if (this.filters.sortBy === 'priceLowHigh') {
          return a.price - b.price;
        }
        if (this.filters.sortBy === 'priceHighLow') {
          return b.price - a.price;
        }
        if (this.filters.sortBy === 'rating') {
          return b.rating - a.rating;
        }
        // default: popularity (based on ratingCount + rating)
        return (b.rating * b.ratingCount) - (a.rating * a.ratingCount);
      });
  }

  // --- Active Product View ---
  setActiveProduct(product) {
    this.activeProduct = product;
    this.notify();
  }

  getActiveProduct() {
    return this.activeProduct;
  }
}

export const state = new AppState();
window.state = state; // expose for console debugging
export default state;

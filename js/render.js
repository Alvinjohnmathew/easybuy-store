import { state } from './state.js';

// DOM Rendering Module for EasyBuy

// Toast notification helper
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'info-circle';
  if (type === 'success') icon = 'circle-check';
  if (type === 'error') icon = 'triangle-exclamation';

  toast.innerHTML = `
    <i class="fa-solid fa-${icon}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'toastFadeIn 0.3s ease reverse forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// Render sub-header categories
export function renderCategoryBar() {
  const categoryBar = document.getElementById('category-bar');
  if (!categoryBar) return;

  const categories = ['All', 'Gadgets', 'Fashion', 'Watch', 'Shoes', 'Gifts'];
  const activeCategory = state.filters.category;

  const icons = {
    'All': 'fa-border-all',
    'Gadgets': 'fa-mobile-screen',
    'Fashion': 'fa-shirt',
    'Watch': 'fa-stopwatch',
    'Shoes': 'fa-shoe-prints',
    'Gifts': 'fa-gift'
  };

  categoryBar.innerHTML = categories.map(cat => `
    <div class="category-item ${cat === activeCategory ? 'active' : ''}" data-category="${cat}">
      <div class="category-icon-box">
        <i class="fa-solid ${icons[cat] || 'fa-tag'}"></i>
      </div>
      <span>${cat}</span>
    </div>
  `).join('');

  // Add click listeners
  categoryBar.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('click', () => {
      const selectedCat = item.getAttribute('data-category');
      state.setFilter('category', selectedCat);
    });
  });
}

// Render color filter checkboxes
export function renderColorFilters() {
  const colorsContainer = document.getElementById('colors-filter-container');
  if (!colorsContainer) return;

  // Get all unique colors in current products list
  const allProducts = state.getProducts();
  const allColors = [...new Set(allProducts.flatMap(p => p.colors))];
  const selectedColors = state.filters.selectedColors;

  if (allColors.length === 0) {
    colorsContainer.innerHTML = '<p class="input-helper">No colors available</p>';
    return;
  }

  colorsContainer.innerHTML = allColors.map(color => `
    <label class="custom-checkbox">
      <input type="checkbox" value="${color}" ${selectedColors.includes(color) ? 'checked' : ''}>
      <span class="checkbox-checkmark"></span> ${color}
    </label>
  `).join('');

  // Add event listeners
  colorsContainer.querySelectorAll('input').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      state.toggleColorFilter(checkbox.value);
    });
  });
}

// Render product catalog
export function renderProductsGrid() {
  const gridContainer = document.getElementById('products-grid-container');
  const countBadge = document.getElementById('products-count-badge');
  const categoryLabel = document.getElementById('active-category-label');
  if (!gridContainer) return;

  const filteredProducts = state.getFilteredProducts();

  // Update counts and headers
  if (countBadge) countBadge.textContent = `(${filteredProducts.length} products)`;
  if (categoryLabel) categoryLabel.textContent = `Category: ${state.filters.category}`;

  if (filteredProducts.length === 0) {
    gridContainer.innerHTML = `
      <div class="empty-catalog-state" style="grid-column: 1 / -1;">
        <i class="fa-solid fa-basket-shopping"></i>
        <h3>No Products Found</h3>
        <p>We couldn't find any products matching your selected search or filters. Try adjusting your settings.</p>
        <button class="primary-btn small-btn" id="btn-reset-catalog-filters">Reset Filters</button>
      </div>
    `;
    const resetBtn = document.getElementById('btn-reset-catalog-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => state.resetFilters());
    }
    return;
  }

  gridContainer.innerHTML = filteredProducts.map(product => {
    const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    const hasDiscount = discount > 0;
    const isOutOfStock = product.stock <= 0;

    return `
      <div class="product-card" data-id="${product.id}">
        <!-- Image Box -->
        <div class="product-card-image">
          <img src="${product.image}" alt="${product.title}" loading="lazy">
        </div>
        
        <!-- Info Box -->
        <div class="product-card-info">
          <span class="product-card-title" title="${product.title}">${product.title}</span>
          
          <div class="product-card-rating-row">
            <span class="rating-badge">${product.rating} <i class="fa-solid fa-star"></i></span>
            <span class="rating-count">(${product.ratingCount.toLocaleString()})</span>
          </div>

          <div class="product-card-price-row">
            <span class="current-price">₹${product.price.toLocaleString()}</span>
            ${hasDiscount ? `<span class="original-price">₹${product.originalPrice.toLocaleString()}</span>` : ''}
            ${hasDiscount ? `<span class="discount-percentage">${discount}% off</span>` : ''}
          </div>

          <div class="colors-preview-row">
            ${product.colors.map(col => `<span class="color-dot-preview" style="background-color: ${col.replace(/\s+/g, '').toLowerCase()}" title="${col}"></span>`).join('')}
          </div>

          ${isOutOfStock ? `<span class="out-of-stock-label">Out of Stock</span>` : ''}
        </div>

        <!-- Action Overlay -->
        <div class="product-card-actions">
          <button class="card-add-cart" ${isOutOfStock ? 'disabled style="opacity: 0.6; cursor: not-allowed;"' : ''} data-id="${product.id}">
            <i class="fa-solid fa-cart-plus"></i> Add
          </button>
          <button class="card-buy-now" ${isOutOfStock ? 'disabled style="opacity: 0.6; cursor: not-allowed;"' : ''} data-id="${product.id}">
            Buy Now
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Setup click listeners on product cards (excluding action buttons)
  gridContainer.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // If clicked on buttons, skip detailed view modal
      if (e.target.closest('.product-card-actions')) return;
      const productId = card.getAttribute('data-id');
      const product = state.getProductById(productId);
      if (product) {
        state.setActiveProduct(product);
      }
    });
  });

  // Add to cart buttons
  gridContainer.querySelectorAll('.card-add-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const pId = btn.getAttribute('data-id');
      const product = state.getProductById(pId);
      if (product && product.colors.length > 0) {
        // default to first color
        const added = state.addToCart(pId, product.colors[0]);
        if (added) {
          showToast('Product added to cart!', 'success');
        } else {
          showToast('Product is out of stock or cart limit reached', 'error');
        }
      }
    });
  });

  // Buy now buttons (adds to cart and opens checkout)
  gridContainer.querySelectorAll('.card-buy-now').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const pId = btn.getAttribute('data-id');
      const product = state.getProductById(pId);
      if (product && product.colors.length > 0) {
        state.addToCart(pId, product.colors[0]);
        // Open cart drawer
        document.getElementById('cart-drawer-overlay').classList.add('open');
      }
    });
  });
}

// Render dynamic details of active product in details modal
export function renderActiveProductDetails() {
  const contentEl = document.getElementById('details-modal-content');
  const modalOverlay = document.getElementById('details-modal-overlay');
  const product = state.getActiveProduct();

  if (!product) {
    if (modalOverlay) modalOverlay.classList.add('hidden');
    return;
  }

  // Show modal
  modalOverlay.classList.remove('hidden');

  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 3;
  let stockMessage = `<span class="detail-stock-status in-stock">In Stock (${product.stock} available)</span>`;
  if (isOutOfStock) {
    stockMessage = `<span class="detail-stock-status out-of-stock">Temporarily Out of Stock</span>`;
  } else if (isLowStock) {
    stockMessage = `<span class="detail-stock-status low-stock">Only ${product.stock} left in stock - order soon!</span>`;
  }

  contentEl.innerHTML = `
    <div class="product-detail-grid">
      <!-- Image & Buy Row -->
      <div class="detail-image-panel">
        <div class="detail-img-box">
          <img src="${product.image}" id="main-detail-img" alt="${product.title}">
        </div>
        <div class="detail-btn-row">
          <button class="detail-add-cart" id="modal-add-cart-btn" ${isOutOfStock ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
            <i class="fa-solid fa-cart-shopping"></i> Add to Cart
          </button>
          <button class="detail-buy-now" id="modal-buy-now-btn" ${isOutOfStock ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
            <i class="fa-solid fa-bolt"></i> Buy Now
          </button>
        </div>
      </div>

      <!-- Specs & Info Row -->
      <div class="detail-info-panel">
        <h2 class="detail-title">${product.title}</h2>
        
        <div class="detail-rating-row">
          <span class="rating-badge">${product.rating} <i class="fa-solid fa-star"></i></span>
          <span class="rating-count">${product.ratingCount.toLocaleString()} ratings & reviews</span>
          <span class="active-category-indicator">${product.category}</span>
        </div>

        <div class="detail-price-box">
          <span class="current-price">₹${product.price.toLocaleString()}</span>
          ${discount > 0 ? `<span class="original-price">₹${product.originalPrice.toLocaleString()}</span>` : ''}
          ${discount > 0 ? `<span class="discount-percentage">${discount}% off</span>` : ''}
        </div>

        <!-- Color Options selector -->
        <div class="detail-options-section">
          <h4>Select Color:</h4>
          <div class="color-options-row" id="detail-color-options">
            ${product.colors.map((col, index) => `
              <button class="color-option-btn ${index === 0 ? 'selected' : ''}" data-color="${col}">
                ${col}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Stock Status -->
        <div class="detail-options-section">
          <h4>Availability:</h4>
          <div>${stockMessage}</div>
        </div>

        <!-- Product Description -->
        <div class="detail-desc-box">
          <h4>Product Description</h4>
          <p>${product.description}</p>
        </div>
      </div>
    </div>
  `;

  // Color selection click listener
  let selectedColor = product.colors[0] || 'Default';
  const colorBtns = contentEl.querySelectorAll('.color-option-btn');
  colorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      colorBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedColor = btn.getAttribute('data-color');
    });
  });

  // Modal actions
  const addCartBtn = document.getElementById('modal-add-cart-btn');
  if (addCartBtn) {
    addCartBtn.addEventListener('click', () => {
      const added = state.addToCart(product.id, selectedColor);
      if (added) {
        showToast('Product added to cart!', 'success');
        state.setActiveProduct(null); // close details modal
        // Open cart drawer
        document.getElementById('cart-drawer-overlay').classList.add('open');
      } else {
        showToast('Product out of stock or quantity limit reached', 'error');
      }
    });
  }

  const buyNowBtn = document.getElementById('modal-buy-now-btn');
  if (buyNowBtn) {
    buyNowBtn.addEventListener('click', () => {
      state.addToCart(product.id, selectedColor);
      state.setActiveProduct(null); // close details modal
      // Open cart drawer
      document.getElementById('cart-drawer-overlay').classList.add('open');
    });
  }
}

// Render slide-in Cart Drawer
export function renderCartDrawer() {
  const cartItemsCountEl = document.getElementById('cart-items-count');
  const cartBadgeCountEl = document.getElementById('cart-badge-count');
  const itemsContainer = document.getElementById('cart-items-container');
  const priceSummaryContainer = document.getElementById('cart-price-summary');

  if (!itemsContainer || !priceSummaryContainer) return;

  const cart = state.getCart();

  // Total quantity calculation for header badges
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartItemsCountEl) cartItemsCountEl.textContent = totalQty;
  if (cartBadgeCountEl) cartBadgeCountEl.textContent = totalQty;

  if (cart.length === 0) {
    itemsContainer.innerHTML = `
      <div class="empty-cart-view">
        <i class="fa-solid fa-cart-shopping"></i>
        <h3>Your Cart is Empty</h3>
        <p>Add products to your cart and make purchases here.</p>
      </div>
    `;
    priceSummaryContainer.innerHTML = '';
    return;
  }

  // Calculate costs based on current product pricing
  let totalMRP = 0;
  let totalSellingPrice = 0;
  
  itemsContainer.innerHTML = cart.map(cartItem => {
    const product = state.getProductById(cartItem.productId);
    if (!product) return ''; // fallback if deleted

    const discountPrice = product.price;
    const mrpPrice = product.originalPrice;
    
    totalMRP += mrpPrice * cartItem.quantity;
    totalSellingPrice += discountPrice * cartItem.quantity;

    return `
      <div class="cart-item">
        <div class="cart-item-image">
          <img src="${product.image}" alt="${product.title}">
        </div>
        <div class="cart-item-details">
          <div class="cart-item-title" title="${product.title}">${product.title}</div>
          <div class="cart-item-meta">Color: ${cartItem.color}</div>
          
          <div class="cart-item-prices">
            <span class="item-price">₹${discountPrice.toLocaleString()}</span>
            ${mrpPrice > discountPrice ? `<span class="item-original-price">₹${mrpPrice.toLocaleString()}</span>` : ''}
          </div>

          <div class="cart-item-actions">
            <!-- Quantity adjusters -->
            <div class="qty-selector">
              <button class="qty-btn minus" data-id="${cartItem.productId}" data-color="${cartItem.color}">-</button>
              <span class="qty-val">${cartItem.quantity}</span>
              <button class="qty-btn plus" data-id="${cartItem.productId}" data-color="${cartItem.color}">+</button>
            </div>
            
            <button class="remove-item-btn" data-id="${cartItem.productId}" data-color="${cartItem.color}">
              Remove
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Setup cart event listeners
  itemsContainer.querySelectorAll('.qty-btn.minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const pId = btn.getAttribute('data-id');
      const col = btn.getAttribute('data-color');
      const item = cart.find(i => i.productId === pId && i.color === col);
      if (item) {
        state.updateCartQuantity(pId, col, item.quantity - 1);
      }
    });
  });

  itemsContainer.querySelectorAll('.qty-btn.plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const pId = btn.getAttribute('data-id');
      const col = btn.getAttribute('data-color');
      const item = cart.find(i => i.productId === pId && i.color === col);
      if (item) {
        state.updateCartQuantity(pId, col, item.quantity + 1);
      }
    });
  });

  itemsContainer.querySelectorAll('.remove-item-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const pId = btn.getAttribute('data-id');
      const col = btn.getAttribute('data-color');
      state.removeFromCart(pId, col);
      showToast('Item removed from cart', 'info');
    });
  });

  // Price details
  const savings = totalMRP - totalSellingPrice;
  const deliveryCharge = totalSellingPrice > 500 ? 0 : 40;
  const finalPrice = totalSellingPrice + deliveryCharge;

  priceSummaryContainer.innerHTML = `
    <div class="price-summary-card">
      <h4>Price Details</h4>
      <div class="summary-row">
        <span>Price (${cart.length} items)</span>
        <span>₹${totalMRP.toLocaleString()}</span>
      </div>
      <div class="summary-row">
        <span>Discount</span>
        <span style="color: var(--price-green)">- ₹${savings.toLocaleString()}</span>
      </div>
      <div class="summary-row">
        <span>Delivery Charges</span>
        <span>${deliveryCharge === 0 ? '<span style="color: var(--price-green)">FREE</span>' : `₹${deliveryCharge}`}</span>
      </div>
      
      <div class="summary-row total-row">
        <span>Total Amount</span>
        <span>₹${finalPrice.toLocaleString()}</span>
      </div>

      ${savings > 0 ? `<div class="savings-label">You will save ₹${savings.toLocaleString()} on this order</div>` : ''}
      
      <button class="checkout-btn" id="drawer-checkout-btn">Place Order</button>
    </div>
  `;

  // Place order trigger
  document.getElementById('drawer-checkout-btn').addEventListener('click', () => {
    // Close drawer
    document.getElementById('cart-drawer-overlay').classList.remove('open');
    // Open checkout modal
    openCheckoutWizard(finalPrice);
  });
}

// Open and control the Checkout / Payment multi-step modal
function openCheckoutWizard(finalPrice) {
  const overlay = document.getElementById('checkout-modal-overlay');
  if (!overlay) return;

  overlay.classList.remove('hidden');
  document.getElementById('checkout-address-price').textContent = `₹${finalPrice.toLocaleString()}`;

  // Reset steps
  showCheckoutStep('address');
}

export function showCheckoutStep(step) {
  const panels = {
    'address': document.getElementById('checkout-address-form'),
    'payment': document.getElementById('checkout-payment-panel'),
    'processing': document.getElementById('checkout-processing-panel'),
    'success': document.getElementById('checkout-success-panel')
  };

  const navs = {
    'address': document.getElementById('step-nav-address'),
    'payment': document.getElementById('step-nav-payment'),
    'success': document.getElementById('step-nav-success')
  };

  // Toggle panels
  Object.keys(panels).forEach(key => {
    if (panels[key]) {
      if (key === step) panels[key].classList.remove('hidden');
      else panels[key].classList.add('hidden');
    }
  });

  if (step === 'payment') {
    const paymentSettings = state.getPaymentSettings();
    const upiQrImage = document.getElementById('upi-qr-image');
    const upiQrPayee = document.getElementById('upi-qr-payee');
    const upiQrId = document.getElementById('upi-qr-id');
    
    if (upiQrImage && paymentSettings.upiId) {
      const upiUri = `upi://pay?pa=${encodeURIComponent(paymentSettings.upiId)}&pn=${encodeURIComponent(paymentSettings.payeeName)}`;
      upiQrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUri)}`;
      if (upiQrPayee) upiQrPayee.textContent = paymentSettings.payeeName;
      if (upiQrId) upiQrId.textContent = paymentSettings.upiId;
    }
  }

  // Toggle active headers
  Object.keys(navs).forEach(key => {
    if (navs[key]) {
      if (key === step || (step === 'processing' && key === 'payment')) {
        navs[key].classList.add('active');
      } else {
        navs[key].classList.remove('active');
      }
    }
  });
}

// Render Admin View: Products table, Orders table, and metrics
export function renderAdminDashboard() {
  const productsTbody = document.getElementById('admin-products-tbody');
  const ordersTbody = document.getElementById('admin-orders-tbody');
  const metricsContainer = document.getElementById('admin-metrics-container');

  if (!productsTbody || !ordersTbody || !metricsContainer) return;

  const products = state.getProducts();
  const orders = state.getOrders();

  // 0. Populate Settings Form
  const paymentSettings = state.getPaymentSettings();
  const upiIdInput = document.getElementById('setting-upi-id');
  const payeeNameInput = document.getElementById('setting-payee-name');
  if (upiIdInput) upiIdInput.value = paymentSettings.upiId || '';
  if (payeeNameInput) payeeNameInput.value = paymentSettings.payeeName || '';

  // 1. Render Metrics Dashboard Card
  const totalSales = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  metricsContainer.innerHTML = `
    <div class="metric-card sales">
      <div class="metric-info">
        <h4>Total Sales</h4>
        <div class="metric-value">₹${totalSales.toLocaleString()}</div>
      </div>
      <i class="fa-solid fa-indian-rupee-sign metric-icon"></i>
    </div>
    <div class="metric-card orders">
      <div class="metric-info">
        <h4>Total Orders</h4>
        <div class="metric-value">${orders.length}</div>
      </div>
      <i class="fa-solid fa-box-open metric-icon"></i>
    </div>
    <div class="metric-card products">
      <div class="metric-info">
        <h4>Total Products</h4>
        <div class="metric-value">${products.length}</div>
      </div>
      <i class="fa-solid fa-warehouse metric-icon"></i>
    </div>
  `;

  // 2. Render Products Inventory CRUD table
  // Filter product list with potential admin search bar
  const adminSearchQuery = (document.getElementById('admin-product-search')?.value || '').toLowerCase();
  const adminProducts = products.filter(p => 
    p.title.toLowerCase().includes(adminSearchQuery) || 
    p.category.toLowerCase().includes(adminSearchQuery)
  );

  if (adminProducts.length === 0) {
    productsTbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center" style="padding: 40px; color: var(--text-muted);">
          <i class="fa-regular fa-folder-open" style="font-size: 24px; margin-bottom: 8px; display: block;"></i>
          No products in inventory matching query.
        </td>
      </tr>
    `;
  } else {
    productsTbody.innerHTML = adminProducts.map(p => {
      let stockClass = 'stock-in';
      if (p.stock <= 0) stockClass = 'stock-out';
      else if (p.stock <= 3) stockClass = 'stock-low';

      return `
        <tr>
          <td>
            <div class="table-img">
              <img src="${p.image}" alt="">
            </div>
          </td>
          <td>
            <div class="table-title" title="${p.title}">${p.title}</div>
            <div class="input-helper">ID: ${p.id}</div>
          </td>
          <td><span class="table-category">${p.category}</span></td>
          <td>
            <div class="table-price">₹${p.price.toLocaleString()}</div>
            ${p.originalPrice > p.price ? `<div class="original-price" style="font-size: 11px;">MRP: ₹${p.originalPrice.toLocaleString()}</div>` : ''}
          </td>
          <td>
            <span class="table-stock ${stockClass}">
              ${p.stock <= 0 ? 'Out of stock' : `${p.stock} units`}
            </span>
          </td>
          <td>
            <div class="table-colors-list">
              ${p.colors.map(col => `<span class="table-color-badge" title="${col}">${col}</span>`).join('')}
            </div>
          </td>
          <td>
            <span class="rating-badge">${p.rating} <i class="fa-solid fa-star"></i></span>
          </td>
          <td>
            <div class="action-btns">
              <button class="action-btn edit" data-id="${p.id}" title="Edit Product"><i class="fa-solid fa-pen-to-square"></i></button>
              <button class="action-btn delete" data-id="${p.id}" title="Delete Product"><i class="fa-solid fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Table edit/delete button listeners
    productsTbody.querySelectorAll('.action-btn.edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openAdminProductModal(id);
      });
    });

    productsTbody.querySelectorAll('.action-btn.delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const product = state.getProductById(id);
        if (confirm(`Are you sure you want to delete "${product.title}"?`)) {
          state.deleteProduct(id);
          showToast('Product deleted from inventory', 'info');
        }
      });
    });
  }

  // 3. Render Orders table
  if (orders.length === 0) {
    ordersTbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center" style="padding: 40px; color: var(--text-muted);">
          <i class="fa-regular fa-clipboard" style="font-size: 24px; margin-bottom: 8px; display: block;"></i>
          No customer orders placed yet.
        </td>
      </tr>
    `;
  } else {
    ordersTbody.innerHTML = orders.map(o => {
      return `
        <tr>
          <td><strong>${o.id.toUpperCase()}</strong></td>
          <td><span style="font-size: 11px; color: #555;">${o.date}</span></td>
          <td>
            <div class="order-customer-info">
              <strong>${o.shippingInfo.name}</strong>
              <span>${o.shippingInfo.phone}</span>
              <span style="font-size: 10px; color: var(--text-muted); max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${o.shippingInfo.address}, ${o.shippingInfo.city} - ${o.shippingInfo.pincode}">
                ${o.shippingInfo.address}, ${o.shippingInfo.city}
              </span>
            </div>
          </td>
          <td>
            <div class="order-items-purchased">
              ${o.items.map(item => `
                <div class="order-item-line">
                  • ${item.title} <span style="color: var(--text-muted)">(${item.color})</span> x ${item.quantity}
                </div>
              `).join('')}
            </div>
          </td>
          <td><strong>₹${o.totalAmount.toLocaleString()}</strong></td>
          <td><span class="table-color-badge">${o.paymentMethod}</span></td>
          <td>
            <select class="order-status-select ${o.status.toLowerCase()}" data-id="${o.id}">
              <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
              <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
              <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </td>
        </tr>
      `;
    }).join('');

    // Status change listener
    ordersTbody.querySelectorAll('.order-status-select').forEach(select => {
      select.addEventListener('change', () => {
        const orderId = select.getAttribute('data-id');
        const newStatus = select.value;
        state.updateOrderStatus(orderId, newStatus);
        showToast(`Order status updated to ${newStatus}`, 'success');
      });
    });
  }
}

// Open the Admin panel Add/Edit Modal
export function openAdminProductModal(productId = null) {
  const overlay = document.getElementById('admin-product-modal-overlay');
  const titleEl = document.getElementById('admin-modal-title');
  const form = document.getElementById('admin-product-form');

  if (!overlay || !form) return;

  // Clear previous values
  form.reset();
  document.getElementById('admin-form-product-id').value = '';

  if (productId) {
    // EDIT MODE
    titleEl.textContent = 'Edit Product Details';
    const product = state.getProductById(productId);
    if (product) {
      document.getElementById('admin-form-product-id').value = product.id;
      document.getElementById('prod-title').value = product.title;
      document.getElementById('prod-category').value = product.category;
      document.getElementById('prod-stock').value = product.stock;
      document.getElementById('prod-price').value = product.price;
      document.getElementById('prod-original-price').value = product.originalPrice;
      document.getElementById('prod-colors').value = product.colors.join(', ');
      document.getElementById('prod-image').value = product.image;
      document.getElementById('prod-desc').value = product.description;
    }
  } else {
    // ADD MODE
    titleEl.textContent = 'Add New Product';
  }

  overlay.classList.remove('hidden');
}

// Main overall UI refresh that runs on state notifications
export function updateUI() {
  const currentView = state.getCurrentView();

  // 1. Toggle Customer vs Admin view layouts
  const customerViewEl = document.getElementById('customer-view');
  const adminViewEl = document.getElementById('admin-view');
  const roleToggleText = document.getElementById('role-toggle-text');
  const cartToggleBtn = document.getElementById('cart-toggle-btn');

  if (currentView === 'admin') {
    if (customerViewEl) customerViewEl.classList.add('hidden');
    if (adminViewEl) adminViewEl.classList.remove('hidden');
    if (roleToggleText) roleToggleText.textContent = 'Customer Panel';
    if (cartToggleBtn) cartToggleBtn.style.display = 'none'; // hide cart button in admin panel
    
    // Render admin view
    renderAdminDashboard();
  } else {
    if (customerViewEl) customerViewEl.classList.remove('hidden');
    if (adminViewEl) adminViewEl.classList.add('hidden');
    if (roleToggleText) roleToggleText.textContent = 'Admin Panel';
    if (cartToggleBtn) cartToggleBtn.style.display = 'flex';

    // Render customer views
    renderCategoryBar();
    renderColorFilters();
    renderProductsGrid();
    renderActiveProductDetails();
    renderCartDrawer();
  }
}

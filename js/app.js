import { state } from './state.js';
import { updateUI, openAdminProductModal } from './render.js';
import { initCartEvents } from './cart.js';
import { initAdminEvents } from './admin.js';

// Application Controller & Initialization

document.addEventListener('DOMContentLoaded', async () => {
  await state.initFromServer();

  // 1. Initialize Event Modules
  initCartEvents();
  initAdminEvents();

  // 2. State Observers
  state.subscribe(() => {
    updateUI();
  });

  // 3. Setup Global UI Events
  setupGlobalEvents();

  // 4. Setup Interactive Banners Carousel
  setupCarousel();

  // 5. Initial Rendering
  updateUI();
});

// Setup global layout events (header, toggles, filters)
function setupGlobalEvents() {
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const headerLogoBtn = document.getElementById('header-logo-btn');
  const roleToggleBtn = document.getElementById('role-toggle-btn');
  
  // Cart Drawer open/close
  const cartToggleBtn = document.getElementById('cart-toggle-btn');
  const closeCartBtn = document.getElementById('close-cart-btn');
  const cartDrawerOverlay = document.getElementById('cart-drawer-overlay');
  
  // Modals overlays & close buttons
  const closeDetailsBtn = document.getElementById('close-details-btn');
  const detailsModalOverlay = document.getElementById('details-modal-overlay');

  const closeCheckoutBtn = document.getElementById('close-checkout-btn');
  const checkoutModalOverlay = document.getElementById('checkout-modal-overlay');

  const closeAdminProductBtn = document.getElementById('close-admin-product-btn');
  const btnCancelProduct = document.getElementById('btn-cancel-product');
  const adminProductModalOverlay = document.getElementById('admin-product-modal-overlay');

  const adminAddProductBtn = document.getElementById('admin-add-product-btn');

  // --- Header Navigation & Search ---
  searchInput?.addEventListener('input', (e) => {
    state.setSearchQuery(e.target.value);
  });

  searchBtn?.addEventListener('click', () => {
    state.setSearchQuery(searchInput.value);
  });

  // Logo acts as "Go Home" reset button
  headerLogoBtn?.addEventListener('click', () => {
    state.resetFilters();
    state.setCurrentView('customer');
    if (searchInput) searchInput.value = '';
    // Reset filters visual state
    resetVisualFilters();
  });

  // Role toggle: Admin vs Customer
  roleToggleBtn?.addEventListener('click', () => {
    const nextRole = state.getUserRole() === 'admin' ? 'customer' : 'admin';
    state.setUserRole(nextRole);
  });

  // --- Cart Drawer Toggles ---
  cartToggleBtn?.addEventListener('click', () => {
    cartDrawerOverlay?.classList.add('open');
  });

  closeCartBtn?.addEventListener('click', () => {
    cartDrawerOverlay?.classList.remove('open');
  });

  cartDrawerOverlay?.addEventListener('click', (e) => {
    // If clicked exactly on overlay background, close drawer
    if (e.target === cartDrawerOverlay) {
      cartDrawerOverlay.classList.remove('open');
    }
  });

  // --- Details Modal Close ---
  closeDetailsBtn?.addEventListener('click', () => {
    state.setActiveProduct(null);
  });

  detailsModalOverlay?.addEventListener('click', (e) => {
    if (e.target === detailsModalOverlay) state.setActiveProduct(null);
  });

  // --- Checkout Modal Close ---
  closeCheckoutBtn?.addEventListener('click', () => {
    checkoutModalOverlay?.classList.add('hidden');
  });

  checkoutModalOverlay?.addEventListener('click', (e) => {
    if (e.target === checkoutModalOverlay) {
      checkoutModalOverlay.classList.add('hidden');
    }
  });

  // --- Admin Modal Close ---
  const hideAdminModal = () => {
    adminProductModalOverlay?.classList.add('hidden');
  };
  closeAdminProductBtn?.addEventListener('click', hideAdminModal);
  btnCancelProduct?.addEventListener('click', hideAdminModal);
  adminProductModalOverlay?.addEventListener('click', (e) => {
    if (e.target === adminProductModalOverlay) hideAdminModal();
  });

  // Open add new product form
  adminAddProductBtn?.addEventListener('click', () => {
    openAdminProductModal(null);
  });

  // --- Filters Side Panel Events ---
  const priceSlider = document.getElementById('price-slider');
  const priceSliderLabel = document.getElementById('price-slider-label');
  const clearFiltersBtn = document.getElementById('clear-filters-btn');

  // Live price range updating
  priceSlider?.addEventListener('input', (e) => {
    const val = Number(e.target.value);
    priceSliderLabel.textContent = `₹${val.toLocaleString()}`;
    state.setFilter('priceMax', val);
  });

  // Sort radio buttons
  document.querySelectorAll('input[name="sort-by"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      state.setFilter('sortBy', e.target.value);
    });
  });

  // Rating radio filters
  document.querySelectorAll('input[name="rating-filter"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      state.setFilter('minRating', Number(e.target.value));
    });
  });

  // Reset Filters
  clearFiltersBtn?.addEventListener('click', () => {
    state.resetFilters();
    if (searchInput) searchInput.value = '';
    resetVisualFilters();
  });
}

// Reset filter UI controls to their original state values
function resetVisualFilters() {
  const priceSlider = document.getElementById('price-slider');
  const priceSliderLabel = document.getElementById('price-slider-label');
  
  if (priceSlider) priceSlider.value = 100000;
  if (priceSliderLabel) priceSliderLabel.textContent = '₹100,000';

  const defaultSort = document.querySelector('input[name="sort-by"][value="popularity"]');
  if (defaultSort) defaultSort.checked = true;

  const defaultRating = document.querySelector('input[name="rating-filter"][value="0"]');
  if (defaultRating) defaultRating.checked = true;
}

// Banner Slides Carousel Slider Logic
function setupCarousel() {
  const slides = document.querySelectorAll('.carousel-slide');
  const dotsContainer = document.getElementById('carousel-dots');
  const prevBtn = document.getElementById('carousel-prev-btn');
  const nextBtn = document.getElementById('carousel-next-btn');

  if (slides.length === 0) return;

  let currentSlide = 0;
  let autoTimer = null;

  function showSlide(index) {
    if (index >= slides.length) currentSlide = 0;
    else if (index < 0) currentSlide = slides.length - 1;
    else currentSlide = index;

    slides.forEach((slide, i) => {
      if (i === currentSlide) slide.classList.add('active');
      else slide.classList.remove('active');
    });

    // Update Dots indicator
    const dots = dotsContainer?.querySelectorAll('.dot');
    dots?.forEach((dot, i) => {
      if (i === currentSlide) dot.classList.add('active');
      else dot.classList.remove('active');
    });

    resetTimer();
  }

  // Create dot circles
  if (dotsContainer) {
    dotsContainer.innerHTML = Array.from({ length: slides.length }).map((_, i) => `
      <span class="dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>
    `).join('');

    dotsContainer.querySelectorAll('.dot').forEach(dot => {
      dot.addEventListener('click', () => {
        const index = Number(dot.getAttribute('data-index'));
        showSlide(index);
      });
    });
  }

  // Prev/Next handlers
  prevBtn?.addEventListener('click', () => showSlide(currentSlide - 1));
  nextBtn?.addEventListener('click', () => showSlide(currentSlide + 1));

  // Timer auto slider
  function startTimer() {
    autoTimer = setInterval(() => {
      showSlide(currentSlide + 1);
    }, 6000);
  }

  function resetTimer() {
    clearInterval(autoTimer);
    startTimer();
  }

  startTimer();
}

import { state } from './state.js';
import { renderAdminDashboard, showToast } from './render.js';

// Admin Control Panel Handlers

const categoryImages = {
  'Gadgets': [
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=600', // Smartwatch
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600', // Headphones
    'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?auto=format&fit=crop&q=80&w=600', // Smartphone
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600', // Gaming mouse
    'https://images.unsplash.com/photo-1496181130204-7552cc14ac1a?auto=format&fit=crop&q=80&w=600'  // Mac screen
  ],
  'Fashion': [
    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=600', // Shirt
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=600', // Sunglasses
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=600', // Sneakers
    'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=600', // Ladies Shoes
    'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&q=80&w=600'  // Hoodie
  ],
  'Watch': [
    'https://images.unsplash.com/photo-1507504038482-7621f21c60f8?auto=format&fit=crop&q=80&w=600', // Chair
    'https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&q=80&w=600', // Bread toaster
    'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&q=80&w=600', // Kettle
    'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=600', // Kitchen pots
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=600'  // Table lamp
  ],
  'Shoes': [
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=600', // Cosmetics pack
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=600', // Skin tube
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&q=80&w=600', // Perfume bottle
    'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=600'  // Hair wax
  ],
  'Gifts': [
    'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=600', // Gift box
    'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&q=80&w=600'  // Gifts
  ]
};

export function initAdminEvents() {
  const tabProductsBtn = document.getElementById('tab-products-btn');
  const tabOrdersBtn = document.getElementById('tab-orders-btn');
  const tabSettingsBtn = document.getElementById('tab-settings-btn');
  const tabProductsContent = document.getElementById('tab-products-content');
  const tabOrdersContent = document.getElementById('tab-orders-content');
  const tabSettingsContent = document.getElementById('tab-settings-content');
  
  const settingsForm = document.getElementById('admin-settings-form');
  const productForm = document.getElementById('admin-product-form');
  const btnCancelProduct = document.getElementById('btn-cancel-product');
  const btnRandomImg = document.getElementById('btn-random-img');
  
  const adminProductSearchInput = document.getElementById('admin-product-search');

  // --- Admin Tabs Navigation ---
  tabProductsBtn?.addEventListener('click', () => {
    tabProductsBtn.classList.add('active');
    tabOrdersBtn.classList.remove('active');
    tabSettingsBtn?.classList.remove('active');
    tabProductsContent.classList.remove('hidden');
    tabOrdersContent.classList.add('hidden');
    tabSettingsContent?.classList.add('hidden');
  });

  tabOrdersBtn?.addEventListener('click', () => {
    tabOrdersBtn.classList.add('active');
    tabProductsBtn.classList.remove('active');
    tabSettingsBtn?.classList.remove('active');
    tabOrdersContent.classList.remove('hidden');
    tabProductsContent.classList.add('hidden');
    tabSettingsContent?.classList.add('hidden');
  });

  tabSettingsBtn?.addEventListener('click', () => {
    tabSettingsBtn.classList.add('active');
    tabProductsBtn.classList.remove('active');
    tabOrdersBtn.classList.remove('active');
    tabSettingsContent?.classList.remove('hidden');
    tabProductsContent.classList.add('hidden');
    tabOrdersContent.classList.add('hidden');
  });

  // --- Save Store Settings ---
  settingsForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const upiId = document.getElementById('setting-upi-id').value.trim();
    const payeeName = document.getElementById('setting-payee-name').value.trim();
    
    state.updatePaymentSettings({ upiId, payeeName });
    showToast('Store settings saved successfully!', 'success');
  });

  // --- Live Table Search ---
  adminProductSearchInput?.addEventListener('input', () => {
    renderAdminDashboard();
  });

  // --- Random Image Helper ---
  btnRandomImg?.addEventListener('click', () => {
    const selectedCat = document.getElementById('prod-category').value;
    const imagesList = categoryImages[selectedCat] || categoryImages['Electronics'];
    const randomIndex = Math.floor(Math.random() * imagesList.length);
    const imageUrl = imagesList[randomIndex];

    const imageInput = document.getElementById('prod-image');
    if (imageInput) {
      imageInput.value = imageUrl;
      showToast('Random category image applied!', 'success');
    }
  });

  // --- Cancel Edit/Create ---
  btnCancelProduct?.addEventListener('click', () => {
    document.getElementById('admin-product-modal-overlay')?.classList.add('hidden');
  });

  // --- Save / Add Product form submission ---
  productForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    const productId = document.getElementById('admin-form-product-id').value;
    const title = document.getElementById('prod-title').value.trim();
    const category = document.getElementById('prod-category').value;
    const stock = Number(document.getElementById('prod-stock').value);
    const price = Number(document.getElementById('prod-price').value);
    const originalPrice = Number(document.getElementById('prod-original-price').value);
    const colors = document.getElementById('prod-colors').value;
    const image = document.getElementById('prod-image').value.trim();
    const description = document.getElementById('prod-desc').value.trim();

    if (price > originalPrice) {
      showToast('Selling price cannot exceed the original MRP price!', 'error');
      return;
    }

    const productFields = {
      title,
      category,
      stock,
      price,
      originalPrice,
      colors,
      image: image || undefined, // fallback inside state.js
      description
    };

    if (productId) {
      // EDIT PRODUCT
      const updated = state.updateProduct(productId, productFields);
      if (updated) {
        showToast('Product updated successfully!', 'success');
      } else {
        showToast('Error: Product not found', 'error');
      }
    } else {
      // ADD NEW PRODUCT
      state.addProduct(productFields);
      showToast('Product added to inventory!', 'success');
    }

    // Hide Modal
    document.getElementById('admin-product-modal-overlay')?.classList.add('hidden');
  });
}

import { state } from './state.js';
import { updateUI, openAdminProductModal } from './render.js';
import { initAdminEvents } from './admin.js';

// Application Controller & Initialization for Admin
document.addEventListener('DOMContentLoaded', async () => {
  await state.initFromServer();

  // Set role to admin
  state.setUserRole('admin');

  // Keep UI synced with state changes
  state.subscribe(() => {
    updateUI();
  });

  // Initialize admin events
  initAdminEvents();

  // Product Modal
  const closeAdminProductBtn = document.getElementById('close-admin-product-btn');
  const btnCancelProduct = document.getElementById('btn-cancel-product');
  const adminProductModalOverlay = document.getElementById('admin-product-modal-overlay');

  const hideAdminModal = () => {
    adminProductModalOverlay?.classList.add('hidden');
  };

  closeAdminProductBtn?.addEventListener('click', hideAdminModal);
  btnCancelProduct?.addEventListener('click', hideAdminModal);

  adminProductModalOverlay?.addEventListener('click', (e) => {
    if (e.target === adminProductModalOverlay) {
      hideAdminModal();
    }
  });

  // Add Product Button
  const adminAddProductBtn = document.getElementById('admin-add-product-btn');

  adminAddProductBtn?.addEventListener('click', () => {
    openAdminProductModal(null);
  });

  // Initial render
  updateUI();
});

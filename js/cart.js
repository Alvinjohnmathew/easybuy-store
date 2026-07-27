
import { state } from './state.js';
import { showCheckoutStep, showToast } from './render.js';
 
// Cart Checkout & Payment Handler
export function initCartEvents() {
  const addressForm = document.getElementById('checkout-address-form');
  const paymentPanel = document.getElementById('checkout-payment-panel');
  const payNowBtn = document.getElementById('pay-now-btn');
  const paymentBackBtn = document.getElementById('payment-back-btn');
 
  // Shipping details state cache
  let shippingDetails = null;
 
  // Step 1 Form Submission (Shipping details)
  addressForm?.addEventListener('submit', (e) => {
    e.preventDefault();
 
    // Save details
    shippingDetails = {
      name: document.getElementById('ship-name').value,
      phone: document.getElementById('ship-phone').value,
      address: document.getElementById('ship-address').value,
      city: document.getElementById('ship-city').value,
      pincode: document.getElementById('ship-pincode').value
    };
    // Progress to Step 2
    showCheckoutStep('payment');
  });
 
  // Back button in Payment Panel
  paymentBackBtn?.addEventListener('click', () => {
    showCheckoutStep('address');
  });
 
  // Pay Now Button (Submitting Payment)
  payNowBtn?.addEventListener('click', () => {
    const method = 'UPI';
    const upiId = document.getElementById('upi-id').value.trim();
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
 
    if (!upiId) {
      showToast('Please enter your UPI ID', 'error');
      return;
    }
    if (!upiRegex.test(upiId)) {
      showToast('Please enter a valid UPI ID (e.g. name@bank)', 'error');
      return;
    }
 
    // Trigger simulated payment processing
    showCheckoutStep('processing');
    setTimeout(() => {
      // Create order in state
      const placedOrder = state.placeOrder(shippingDetails, method);
      if (placedOrder) {
        // Success panel updates
        document.getElementById('success-order-id').textContent = placedOrder.id.toUpperCase();
        showCheckoutStep('success');
        showToast('Order placed successfully!', 'success');
 
        // Reset inputs
        addressForm.reset();
        document.getElementById('upi-id').value = '';
      } else {
        showToast('Failed to place order. Cart is empty.', 'error');
        showCheckoutStep('address');
      }
    }, 2000);
  });
 
  // Success screen actions
  document.getElementById('success-continue-shopping')?.addEventListener('click', () => {
    // Hide modal
    document.getElementById('checkout-modal-overlay').classList.add('hidden');
  });
 
  document.getElementById('success-view-orders')?.addEventListener('click', () => {
    // Hide modal
    document.getElementById('checkout-modal-overlay').classList.add('hidden');
    // Switch to Admin view
    state.setCurrentView('admin');
 
    // Switch admin tab to orders
    document.querySelectorAll('.admin-tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById('tab-orders-btn')?.classList.add('active');
 
    document.querySelectorAll('.admin-tab-content').forEach(panel => panel.classList.add('hidden'));
    document.getElementById('tab-orders-content')?.classList.remove('hidden');
  });
}
 

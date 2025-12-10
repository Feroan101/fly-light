// ==================== E-COMMERCE PAGE (USER) ====================

document.addEventListener('DOMContentLoaded', async () => {
  await loadProducts();
  updateCartCount();
});

async function loadProducts() {
  try {
    showLoading(true);
    const products = await api.getProducts();
    displayProducts(products);
  } catch (error) {
    console.error('Error loading products:', error);
    showAlert('Failed to load products', 'error');
  } finally {
    showLoading(false);
  }
}

function displayProducts(products) {
  const container = document.getElementById('products-container') || document.body;
  
  if (products.length === 0) {
    container.innerHTML = '<p style="text-align: center; padding: 40px;">No products available yet.</p>';
    return;
  }

  let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">';

  products.forEach(product => {
    const inStock = product.stock > 0;
    html += `
      <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.3s ease;">
        <div style="height: 200px; background: #f8f9fa; position: relative; overflow: hidden;">
          ${product.image_url ? `<img src="${product.image_url}" style="width: 100%; height: 100%; object-fit: cover;">` : '<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #ccc;">No Image</div>'}
          ${!inStock ? '<div style="position: absolute; top: 10px; right: 10px; background: #EF4444; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">Out of Stock</div>' : ''}
        </div>
        <div style="padding: 20px;">
          <h3 style="margin: 0 0 5px 0; color: #2C3E50; font-size: 18px; height: 50px; overflow: hidden;">${product.name}</h3>
          <p style="color: #666; margin: 0 0 10px 0; font-size: 13px; height: 40px; overflow: hidden;">${product.description || 'No description'}</p>
          <p style="color: #999; margin: 0 0 10px 0; font-size: 12px;">Category: ${product.category || 'N/A'}</p>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <span style="font-size: 24px; color: #10B981; font-weight: bold;">${formatCurrency(product.price)}</span>
            <span style="font-size: 12px; color: #999;">Stock: ${product.stock}</span>
          </div>
          <button onclick="addProductToCart('${product.id}', '${product.name}', ${product.price})" ${!inStock ? 'disabled' : ''} style="width: 100%; background: ${inStock ? '#10B981' : '#ccc'}; color: white; border: none; padding: 12px; border-radius: 6px; cursor: ${inStock ? 'pointer' : 'not-allowed'}; font-weight: 600;">
            ${inStock ? '🛒 Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
}

function addProductToCart(productId, productName, price) {
  const product = {
    id: productId,
    name: productName,
    price: price,
    quantity: 1
  };

  db.addToCart(product);
  updateCartCount();
  showAlert(`${productName} added to cart!`, 'success');
}

function updateCartCount() {
  const cart = db.getCart();
  const cartCount = document.getElementById('cart-count');
  if (cartCount) {
    cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
  }
}

function viewCart() {
  const modal = createCartModal();
  modal.show();
}

function createCartModal() {
  const cart = db.getCart();
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  `;

  let cartHtml = '';
  let total = 0;

  if (cart.length === 0) {
    cartHtml = '<p style="text-align: center; padding: 20px;">Your cart is empty</p>';
  } else {
    cartHtml = `
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background: #f8f9fa; border-bottom: 2px solid #ddd;">
            <th style="text-align: left; padding: 10px;">Product</th>
            <th style="padding: 10px;">Price</th>
            <th style="padding: 10px;">Qty</th>
            <th style="padding: 10px;">Total</th>
            <th style="padding: 10px;">Action</th>
          </tr>
        </thead>
        <tbody>
    `;

    cart.forEach(item => {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;
      cartHtml += `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px;">${item.name}</td>
          <td style="padding: 10px; text-align: center;">${formatCurrency(item.price)}</td>
          <td style="padding: 10px; text-align: center;">
            <input type="number" min="1" value="${item.quantity}" onchange="updateCartQuantity('${item.id}', this.value)" style="width: 50px; padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
          </td>
          <td style="padding: 10px; text-align: center;">${formatCurrency(itemTotal)}</td>
          <td style="padding: 10px; text-align: center;">
            <button onclick="removeFromCart('${item.id}')" style="background: #EF4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Remove</button>
          </td>
        </tr>
      `;
    });

    cartHtml += `
        </tbody>
      </table>
      <div style="text-align: right; padding: 20px; background: #f8f9fa; border-radius: 8px;">
        <p style="font-size: 18px; font-weight: bold; color: #2C3E50; margin: 0;">Total: ${formatCurrency(total)}</p>
      </div>
    `;
  }

  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: white;
    padding: 30px;
    border-radius: 12px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
  `;

  modalContent.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2 style="margin: 0;">Shopping Cart</h2>
      <button onclick="this.closest('div').parentElement.parentElement.remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">×</button>
    </div>
    ${cartHtml}
    <div style="display: flex; gap: 10px; margin-top: 20px;">
      <button onclick="this.closest('div').parentElement.parentElement.remove()" style="flex: 1; background: #999; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer; font-weight: 600;">Continue Shopping</button>
      ${cart.length > 0 ? `<button onclick="proceedToCheckout()" style="flex: 1; background: #10B981; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer; font-weight: 600;">Proceed to Checkout</button>` : ''}
    </div>
  `;

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  return {
    show: () => {},
    close: () => modal.remove()
  };
}

function updateCartQuantity(productId, quantity) {
  const cart = db.getCart();
  const item = cart.find(item => item.id === productId);
  if (item) {
    item.quantity = parseInt(quantity);
    localStorage.setItem('skylight_cart', JSON.stringify(cart));
    updateCartCount();
  }
}

function removeFromCart(productId) {
  db.removeFromCart(productId);
  updateCartCount();
  // Refresh cart modal
  viewCart();
}

async function proceedToCheckout() {
  const cart = db.getCart();
  if (cart.length === 0) {
    showAlert('Cart is empty', 'error');
    return;
  }

  const modal = createCheckoutModal(cart);
  modal.show();
}

function createCheckoutModal(cart) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  `;

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: white;
    padding: 30px;
    border-radius: 12px;
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
  `;

  modalContent.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2 style="margin: 0;">Checkout</h2>
      <button onclick="this.closest('div').parentElement.parentElement.remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">×</button>
    </div>

    <form id="checkout-form" style="display: flex; flex-direction: column; gap: 15px;">
      <div>
        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Full Name *</label>
        <input type="text" name="customer_name" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
      </div>
      <div>
        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Email *</label>
        <input type="email" name="email" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
      </div>
      <div>
        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Phone *</label>
        <input type="tel" name="phone" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
      </div>
      <div>
        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Address *</label>
        <input type="text" name="address" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
      </div>
      <div>
        <label style="display: block; margin-bottom: 5px; font-weight: 600;">City *</label>
        <input type="text" name="city" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
      </div>
      <div>
        <label style="display: block; margin-bottom: 5px; font-weight: 600;">ZIP Code *</label>
        <input type="text" name="zip_code" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
      </div>

      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; font-weight: 600;">Order Summary</p>
        ${cart.map(item => `
          <p style="margin: 5px 0; font-size: 14px; color: #666;">
            ${item.name} x${item.quantity} = ${formatCurrency(item.price * item.quantity)}
          </p>
        `).join('')}
        <p style="margin: 10px 0 0 0; padding-top: 10px; border-top: 1px solid #ddd; font-weight: 600;">
          Total: ${formatCurrency(total)}
        </p>
      </div>

      <button type="button" onclick="submitCheckout(this.closest('form'), ${total})" style="background: #10B981; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 16px;">Proceed to Payment</button>
    </form>
  `;

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  return {
    show: () => {},
    close: () => modal.remove()
  };
}

async function submitCheckout(form, total) {
  const formData = new FormData(form);
  const cart = db.getCart();

  try {
    showLoading(true);

    // Create order
    const order = await api.createOrder({
      customer_name: formData.get('customer_name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      city: formData.get('city'),
      zip_code: formData.get('zip_code'),
      items: cart.map(item => ({
        product_id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      total_amount: total
    });

    // Store order info for payment
    sessionStorage.setItem('pendingOrder', JSON.stringify({
      order_id: order.order_id,
      amount: total,
      user_email: formData.get('email'),
      reference_type: 'order'
    }));

    // Clear cart
    db.clearCart();
    updateCartCount();

    // Proceed to payment
    window.location.href = 'payment.html?type=order';
  } catch (error) {
    showAlert(error.message, 'error');
  } finally {
    showLoading(false);
  }
}

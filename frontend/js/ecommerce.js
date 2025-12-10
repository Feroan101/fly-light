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
        showAlert(`Failed to load products: ${error.message}`, 'error');
        const container = document.getElementById('products-container');
        if (container) container.innerHTML = '<p>Failed to load products. Please refresh.</p>';
    } finally {
        showLoading(false);
    }
}

function displayProducts(products) {
    const container = document.getElementById('products-container');
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px;">No products available yet.</p>';
        return;
    }
    
    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px;">';
    
    products.forEach(product => {
        const imageStyle = product.image_url 
            ? `background-image: url('${product.image_url}'); background-size: cover; background-position: center;`
            : `background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);`;
        
        html += `
            <div style="
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                background: white;
                transition: transform 0.3s ease;
            ">
                <div style="
                    height: 200px;
                    ${imageStyle}
                "></div>
                
                <div style="padding: 15px;">
                    <h4 style="margin: 0 0 5px 0; color: #1f2937;">${escapeHtml(product.name)}</h4>
                    
                    ${product.category ? `
                        <p style="margin: 5px 0; color: #6b7280; font-size: 12px;">
                            ${escapeHtml(product.category)}
                        </p>
                    ` : ''}
                    
                    <p style="margin: 8px 0; color: #1f2937; font-weight: bold; font-size: 18px;">
                        ₹${product.price}
                    </p>
                    
                    <p style="margin: 5px 0; color: #6b7280; font-size: 12px;">
                        Stock: ${product.stock}
                    </p>
                    
                    ${product.description ? `
                        <p style="margin: 8px 0; color: #6b7280; font-size: 12px; line-height: 1.4;">
                            ${escapeHtml(product.description.substring(0, 80))}${product.description.length > 80 ? '...' : ''}
                        </p>
                    ` : ''}
                    
                    <div style="margin-top: 12px; display: flex; gap: 8px;">
                        <button onclick="addToCart('${product.id}', '${escapeHtml(product.name)}', ${product.price})" 
                                style="flex: 1; padding: 8px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 12px;"
                                ${product.stock <= 0 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                            ${product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function addToCart(productId, productName, price) {
    const product = {
        id: productId,
        name: productName,
        price: price,
        quantity: 1
    };
    
    db.addToCart(product);
    showAlert(`${productName} added to cart!`, 'success');
    updateCartCount();
}

function updateCartCount() {
    const cart = db.getCart();
    const count = cart.length;
    
    const cartBadge = document.getElementById('cart-count');
    if (cartBadge) {
        cartBadge.textContent = count;
        cartBadge.style.display = count > 0 ? 'inline' : 'none';
    }
}

function viewCart() {
    const cart = db.getCart();
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;
    
    if (cart.length === 0) {
        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 8px;
                padding: 30px;
                max-width: 400px;
                width: 90%;
                text-align: center;
            ">
                <h2 style="margin-top: 0; color: #1f2937;">Your Cart</h2>
                <p style="color: #6b7280; font-size: 16px; margin: 20px 0;">Your cart is empty</p>
                <button onclick="this.closest('[style*=position]').remove()" 
                        style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                    Close
                </button>
            </div>
        `;
        document.body.appendChild(modal);
        return;
    }
    
    let total = 0;
    let cartHtml = '';
    
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        cartHtml += `
            <div style="
                padding: 15px;
                border-bottom: 1px solid #e5e7eb;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <div style="flex: 1;">
                    <p style="margin: 0; color: #1f2937; font-weight: bold;">${escapeHtml(item.name)}</p>
                    <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 12px;">
                        ₹${item.price} x ${item.quantity}
                    </p>
                </div>
                <div style="text-align: right; margin: 0 15px;">
                    <p style="margin: 0; color: #1f2937; font-weight: bold;">₹${itemTotal}</p>
                </div>
                <button onclick="removeFromCart('${item.id}'); this.closest('[style*=position]').remove(); viewCart();" 
                        style="padding: 6px 12px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                    Remove
                </button>
            </div>
        `;
    });
    
    modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 8px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
        ">
            <div style="padding: 20px; border-bottom: 2px solid #e5e7eb;">
                <h2 style="margin: 0; color: #1f2937;">Your Cart (${cart.length} items)</h2>
            </div>
            
            <div style="flex: 1; overflow-y: auto;">
                ${cartHtml}
            </div>
            
            <div style="padding: 20px; border-top: 2px solid #e5e7eb; background: #f3f4f6;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <span style="color: #6b7280; font-weight: bold;">Total:</span>
                    <span style="color: #1f2937; font-weight: bold; font-size: 20px;">₹${total}</span>
                </div>
                
                <div style="display: flex; gap: 10px;">
                    <button onclick="this.closest('[style*=position]').remove()" 
                            style="flex: 1; padding: 10px; background: #e5e7eb; color: #374151; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                        Continue Shopping
                    </button>
                    <button onclick="proceedToCheckout()" 
                            style="flex: 1; padding: 10px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                        Checkout
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function removeFromCart(productId) {
    db.removeFromCart(productId);
    updateCartCount();
    showAlert('Item removed from cart', 'info');
}

function proceedToCheckout() {
    const cart = db.getCart();
    
    if (cart.length === 0) {
        showAlert('Your cart is empty', 'warning');
        return;
    }
    
    // Store cart in session and redirect to checkout
    sessionStorage.setItem('checkoutCart', JSON.stringify(cart));
    window.location.href = 'checkout.html';
}

// Remove item from cart by product ID (called from inline onclick)
function removeItemFromCart(productId) {
    db.removeFromCart(productId);
    updateCartCount();
}
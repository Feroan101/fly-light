// ==================== ADMIN PRODUCTS MANAGEMENT ====================

document.addEventListener('DOMContentLoaded', async () => {
    checkAdminAuth();
    await loadProducts();
    setupEventListeners();
});

async function loadProducts() {
    try {
        showLoading(true);
        const products = await api.getAdminProducts();
        displayProducts(products);
    } catch (error) {
        showAlert(`Failed to load products: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

function displayProducts(products) {
    const container = document.getElementById('products-table');
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = '<p>No products yet. Add one!</p>';
        return;
    }
    
    let html = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
                    <th style="padding: 12px; text-align: left;">Name</th>
                    <th style="padding: 12px; text-align: left;">Category</th>
                    <th style="padding: 12px; text-align: left;">Price</th>
                    <th style="padding: 12px; text-align: left;">Stock</th>
                    <th style="padding: 12px; text-align: left;">Image</th>
                    <th style="padding: 12px; text-align: left;">Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    products.forEach(product => {
        html += `
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px;">${escapeHtml(product.name)}</td>
                <td style="padding: 12px;">${escapeHtml(product.category || 'N/A')}</td>
                <td style="padding: 12px;">₹${product.price}</td>
                <td style="padding: 12px;">${product.stock}</td>
                <td style="padding: 12px;">
                    ${product.image_url 
                        ? `<img src="${product.image_url}" alt="${escapeHtml(product.name)}" style="max-width: 50px; max-height: 50px; border-radius: 4px;">` 
                        : 'No image'}
                </td>
                <td style="padding: 12px;">
                    <button onclick="editProduct('${product.id}')" style="padding: 6px 12px; margin-right: 4px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">Edit</button>
                    <button onclick="deleteProduct('${product.id}')" style="padding: 6px 12px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">Delete</button>
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function editProduct(id) {
    try {
        showLoading(true);
        // Get all products to find the one we need
        const products = await api.getAdminProducts();
        const product = products.find(p => p.id === id);
        
        if (!product) {
            showAlert('Product not found', 'error');
            return;
        }
        
        // Populate form
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-category').value = product.category || '';
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-stock').value = product.stock;
        document.getElementById('product-description').value = product.description || '';
        
        // Store ID for update
        document.getElementById('add-product-btn').dataset.editId = id;
        document.getElementById('add-product-btn').textContent = 'Update Product';
        
        // Scroll to form
        document.getElementById('product-form').scrollIntoView({ behavior: 'smooth' });
        
        showLoading(false);
    } catch (error) {
        showAlert(`Failed to load product: ${error.message}`, 'error');
        showLoading(false);
    }
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
        showLoading(true);
        await api.deleteProduct(id);
        showAlert('Product deleted successfully', 'success');
        await loadProducts();
    } catch (error) {
        showAlert(`Failed to delete product: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

function setupEventListeners() {
    const form = document.getElementById('product-form');
    const btn = document.getElementById('add-product-btn');
    
    if (!form || !btn) return;
    
    btn.addEventListener('click', async (e) => {
        e.preventDefault();
        await saveProduct();
    });
}

async function saveProduct() {
    try {
        const editId = document.getElementById('add-product-btn').dataset.editId;
        
        // Validate required fields
        const name = document.getElementById('product-name').value.trim();
        const price = document.getElementById('product-price').value.trim();
        
        if (!name || !price) {
            showAlert('Please fill in name and price (required fields)', 'warning');
            return;
        }
        
        const formData = new FormData();
        formData.append('name', name);
        formData.append('category', document.getElementById('product-category').value);
        formData.append('price', price);
        formData.append('stock', document.getElementById('product-stock').value);
        formData.append('description', document.getElementById('product-description').value);
        
        const imageFile = document.getElementById('product-image').files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }
        
        showLoading(true);
        
        if (editId) {
            await api.updateProduct(editId, formData);
            showAlert('Product updated successfully', 'success');
            delete document.getElementById('add-product-btn').dataset.editId;
            document.getElementById('add-product-btn').textContent = 'Add Product';
        } else {
            await api.createProduct(formData);
            showAlert('Product created successfully', 'success');
        }
        
        // Reset form
        document.getElementById('product-form').reset();
        
        // Reload products
        await loadProducts();
        
    } catch (error) {
        showAlert(`Failed to save product: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}
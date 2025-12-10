// ==================== ADMIN PRODUCTS MANAGEMENT ====================

document.addEventListener('DOMContentLoaded', async () => {
  checkAdminAuth();
  await loadProducts();
  setupEventListeners();
});

function checkAdminAuth() {
  const user = db.getCurrentUser();
  if (!user || user.role !== 'admin') {
    window.location.href = 'index.html';
  }
}

async function loadProducts() {
  try {
    showLoading(true);
    const products = await api.getAdminProducts();
    displayProducts(products);
  } catch (error) {
    showAlert('Failed to load products', 'error');
  } finally {
    showLoading(false);
  }
}

function displayProducts(products) {
  const container = document.getElementById('products-table') || document.body;
  
  if (products.length === 0) {
    container.innerHTML = '<p>No products yet. Add one!</p>';
    return;
  }

  let html = `
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #f8f9fa;">
          <th style="padding: 12px; text-align: left;">Name</th>
          <th style="padding: 12px;">Category</th>
          <th style="padding: 12px;">Price</th>
          <th style="padding: 12px;">Stock</th>
          <th style="padding: 12px;">Image</th>
          <th style="padding: 12px;">Actions</th>
        </tr>
      </thead>
      <tbody>
  `;

  products.forEach(product => {
    html += `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px;">${product.name}</td>
        <td style="padding: 12px;">${product.category || 'N/A'}</td>
        <td style="padding: 12px;">₹${product.price}</td>
        <td style="padding: 12px;">
          <span style="background: ${product.stock > 10 ? '#10B981' : product.stock > 0 ? '#FF6B35' : '#EF4444'}; color: white; padding: 4px 8px; border-radius: 4px;">
            ${product.stock}
          </span>
        </td>
        <td style="padding: 12px;">
          ${product.image_url ? `<img src="${product.image_url}" style="max-height: 40px; border-radius: 4px;">` : 'No image'}
        </td>
        <td style="padding: 12px;">
          <button onclick="editProduct('${product.id}')" style="background: #3B82F6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-right: 5px;">Edit</button>
          <button onclick="deleteProduct('${product.id}')" style="background: #EF4444; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Delete</button>
        </td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}

function setupEventListeners() {
  const form = document.getElementById('product-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await saveProduct();
    });
  }
}

async function saveProduct() {
  const form = document.getElementById('product-form');
  const formData = new FormData(form);

  try {
    showLoading(true);
    
    const id = formData.get('product_id');
    
    if (id) {
      await api.updateProduct(id, formData);
      showAlert('Product updated successfully!', 'success');
    } else {
      await api.createProduct(formData);
      showAlert('Product created successfully!', 'success');
    }

    form.reset();
    document.getElementById('product_id').value = '';
    await loadProducts();
  } catch (error) {
    showAlert(error.message, 'error');
  } finally {
    showLoading(false);
  }
}

async function editProduct(id) {
  try {
    const products = await api.getAdminProducts();
    const product = products.find(p => p.id === id);
    
    if (!product) {
      showAlert('Product not found', 'error');
      return;
    }

    // Populate form
    document.getElementById('product_id').value = product.id;
    document.getElementById('name').value = product.name;
    document.getElementById('category').value = product.category || '';
    document.getElementById('price').value = product.price;
    document.getElementById('stock').value = product.stock;
    document.getElementById('description').value = product.description || '';

    // Scroll to form
    document.getElementById('product-form').scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    showAlert('Failed to load product', 'error');
  }
}

async function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product?')) {
    return;
  }

  try {
    showLoading(true);
    await api.deleteProduct(id);
    showAlert('Product deleted successfully!', 'success');
    await loadProducts();
  } catch (error) {
    showAlert(error.message, 'error');
  } finally {
    showLoading(false);
  }
}

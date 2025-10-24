// Admin Panel JavaScript
// ========== Quản lý khách hàng ==========
function loadCustomers() {
    const grid = document.getElementById('customers-grid');
    if (!grid) return;
    let users = JSON.parse(localStorage.getItem('users')) || [];
    if (!users.length) {
        grid.innerHTML = '<div class="empty-state">Chưa có khách hàng nào đăng ký.</div>';
        return;
    }
    grid.innerHTML = `
        <table class=\"customers-table\">
            <thead>
                <tr>
                    <th style='width:56px;'></th>
                    <th>Họ tên</th>
                    <th>Email</th>
                    <th>Điện thoại</th>
                    <th>Ngày sinh</th>
                    <th>Tỉnh/TP</th>
                    <th>Hành động</th>
                </tr>
            </thead>
            <tbody>
                ${users.map((u, idx) => `
                    <tr>
                        <td>
                          ${u.avatar ? `<img src='${u.avatar}' alt='avatar' style='width:48px;height:48px;border-radius:50%;object-fit:cover;border:1px solid #eee;'>` : `<span style='display:inline-block;width:48px;height:48px;border-radius:50%;background:#eee;text-align:center;line-height:48px;color:#888;font-size:1.5em;'>👤</span>`}
                        </td>
                        <td>${u.firstName} ${u.lastName}</td>
                        <td>${u.email}</td>
                        <td>${u.phone || ''}</td>
                        <td>${u.birthDate ? formatDateVN(u.birthDate) : ''}</td>
                        <td>${u.province || ''}</td>
                        <td>
                            <button onclick="resetUserPassword(${idx})" class="reset-btn" style="padding:4px 10px;font-size:0.95em;border-radius:6px;min-width:0;line-height:1.2;display:inline-flex;align-items:center;gap:4px;"><i class="fas fa-key"></i> Đặt lại mật khẩu</button>
                            <button onclick="toggleLockUser(${idx})" class="lock-btn">
                                <i class="fas ${u.locked ? 'fa-lock-open' : 'fa-lock'}"></i> ${u.locked ? 'Mở khóa' : 'Khóa'}
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function resetUserPassword(idx) {
    let users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users[idx];
    if (!user) return;
    const newPass = prompt(`Nhập mật khẩu mới cho ${user.email}:`, '123456');
    if (!newPass) return;
    user.password = newPass;
    localStorage.setItem('users', JSON.stringify(users));
    showNotification('Đã đặt lại mật khẩu cho khách hàng!', 'success');
}

function toggleLockUser(idx) {
    let users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users[idx];
    if (!user) return;
    user.locked = !user.locked;
    localStorage.setItem('users', JSON.stringify(users));
    loadCustomers();
    showNotification(user.locked ? 'Đã khóa tài khoản khách hàng!' : 'Đã mở khóa tài khoản!', 'success');
}

// Đảm bảo có thể gọi từ HTML
window.resetUserPassword = resetUserPassword;
window.toggleLockUser = toggleLockUser;

// Dữ liệu sản phẩm và loại sản phẩm được lưu trong localStorage
let products = JSON.parse(localStorage.getItem('products')) || [];
let categories = JSON.parse(localStorage.getItem('categories')) || [];

// Hiển thị/ẩn các section
function showSection(sectionName) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    document.querySelectorAll('.sidebar-nav li').forEach(item => {
        item.classList.remove('active');
    });
    const sec = document.getElementById(sectionName + '-section');
    if (sec) {
        sec.classList.add('active');
        sec.style.display = '';
        if (sectionName === 'customers') loadCustomers();
        if (sectionName === 'orders') loadAdminOrders();
        if (sectionName === 'imports') loadImports();
        if (sectionName === 'stock') initStockSection();
    }
    event.target.closest('li').classList.add('active');
}

// Đăng xuất
function logout() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminUsername');
        localStorage.removeItem('adminViewingHome');
        window.location.href = 'admin-login.html';
    }
}

// Hiển thị modal thêm sản phẩm
function showAddProductModal() {
    document.getElementById('addProductModal').style.display = 'block';
    updateCategorySelect();
}

// Đóng modal thêm sản phẩm
function closeAddProductModal() {
    document.getElementById('addProductModal').style.display = 'none';
    document.getElementById('addProductForm').reset();
    // Ẩn preview ảnh
    document.getElementById('imagePreview').style.display = 'none';
}

// Preview ảnh khi chọn file
function previewImage(input) {
    const preview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
        
        // Xóa URL nếu có file upload
        document.getElementById('productImageUrl').value = '';
    } else {
        preview.style.display = 'none';
    }
}

// Preview ảnh khi nhập URL
function previewUrlImage(input) {
    const preview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    
    if (input.value) {
        previewImg.src = input.value;
        preview.style.display = 'block';
        
        // Xóa file nếu có URL
        document.getElementById('productImage').value = '';
    } else {
        preview.style.display = 'none';
    }
}

// Đóng modal khi click bên ngoài
window.onclick = function(event) {
    const modal = document.getElementById('addProductModal');
    if (event.target == modal) {
        closeAddProductModal();
    }
}

// Thêm sản phẩm mới
document.getElementById('addProductForm').addEventListener('submit', function(e) {
    e.preventDefault();

    // Nếu đang ở chế độ chỉnh sửa, để listener phía dưới xử lý
    if (this.dataset.editId) return;

    const formData = new FormData(this);
    const imageFile = formData.get('productImage');
    const imageUrl = formData.get('productImageUrl');

    function processProduct(finalImageUrl) {
        const newProduct = {
            id: Date.now(),
            name: formData.get('productName'),
            brand: formData.get('productBrand'),
            price: parseInt(formData.get('productPrice')),
            year: parseInt(formData.get('productYear')),
            fuel: formData.get('productFuel'),
            transmission: formData.get('productTransmission'),
            category: formData.get('productCategory') || '',
            image: finalImageUrl,
            description: formData.get('productDescription') || 'Xe chất lượng cao, đáng tin cậy',
            dateAdded: new Date().toISOString(),
            hidden: false
        };

        products.push(newProduct);
        localStorage.setItem('products', JSON.stringify(products));
        loadProducts();
        updateStats();
        closeAddProductModal();
        showNotification('Đã thêm sản phẩm thành công!', 'success');
    }

    if (imageUrl) {
        processProduct(imageUrl);
    } else if (imageFile && imageFile.size > 0) {
        const reader = new FileReader();
        reader.onload = function(e) {
            processProduct(e.target.result);
        };
        reader.readAsDataURL(imageFile);
    } else {
        const brand = formData.get('productBrand');
        const finalImageUrl = `assets/images/logo-${brand}.png`;
        processProduct(finalImageUrl);
    }
});

// Tải và hiển thị danh sách sản phẩm
function loadProducts() {
    const productsGrid = document.getElementById('products-grid');

    if (!productsGrid) return;

    if (products.length === 0) {
        productsGrid.innerHTML = '<div class="empty-state">Chưa có sản phẩm nào. Hãy thêm hoặc nhập từ trang chủ!</div>';
        return;
    }

    productsGrid.innerHTML = products.map(product => `
        <div class="product-card" data-id="${product.id}">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" onerror="this.src='assets/images/logo-${product.brand}.png'">
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="brand">${product.brand.toUpperCase()}</p>
                <p class="price">${formatPrice(product.price)} VNĐ</p>
                <div class="product-details">
                    <span><i class="fas fa-calendar"></i> ${product.year || ''}</span>
                    <span><i class="fas fa-gas-pump"></i> ${product.fuel || ''}</span>
                    <span><i class="fas fa-cogs"></i> ${product.transmission || ''}</span>
                    ${product.category ? `<span><i class="fas fa-tags"></i> ${product.category}</span>` : ''}
                </div>
                <div class="product-actions">
                    <button onclick="editProduct(${product.id})" class="edit-btn" style="padding:4px 10px;font-size:0.95em;border-radius:6px;min-width:0;line-height:1.2;display:inline-flex;align-items:center;gap:4px;"><i class="fas fa-edit"></i> Sửa</button>
                    <button onclick="toggleHideProduct(${product.id})" class="${product.hidden ? 'unhide-btn' : 'hide-btn'}" style="padding:4px 10px;font-size:0.95em;border-radius:6px;min-width:0;line-height:1.2;display:inline-flex;align-items:center;gap:4px;">
                        <i class="fas ${product.hidden ? 'fa-eye' : 'fa-eye-slash'}"></i> ${product.hidden ? 'Hiện' : 'Ẩn'}
                    </button>
                    <button onclick="deleteProduct(${product.id})" class="delete-btn" style="padding:4px 10px;font-size:0.95em;border-radius:6px;min-width:0;line-height:1.2;display:inline-flex;align-items:center;gap:4px;"><i class="fas fa-trash"></i> Xóa</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Xóa sản phẩm
function deleteProduct(productId) {
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
        products = products.filter(product => product.id !== productId);
        localStorage.setItem('products', JSON.stringify(products));
        loadProducts();
        updateStats();
        showNotification('Xóa sản phẩm thành công!', 'success');
    }
}

// Sửa sản phẩm (chức năng cơ bản)
function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        // Điền thông tin vào form
        document.getElementById('productName').value = product.name;
        document.getElementById('productBrand').value = product.brand;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productYear').value = product.year;
        document.getElementById('productFuel').value = product.fuel;
        document.getElementById('productTransmission').value = product.transmission;
    document.getElementById('productImageUrl').value = product.image;
    document.getElementById('productCategory').value = product.category || '';
        document.getElementById('productDescription').value = product.description;
        
        // Thay đổi form để chế độ chỉnh sửa
        const form = document.getElementById('addProductForm');
        form.dataset.editId = productId;
        
        // Thay đổi nút submit
        const submitBtn = form.querySelector('.save-btn');
        submitBtn.textContent = 'Cập nhật sản phẩm';
        
        // Thay đổi tiêu đề modal
        document.querySelector('.modal-header h3').textContent = 'Chỉnh sửa sản phẩm';
        
        showAddProductModal();
    }
}

// Ẩn/Hiện sản phẩm
function toggleHideProduct(productId) {
    const idx = products.findIndex(p => p.id === productId);
    if (idx === -1) return;
    products[idx].hidden = !products[idx].hidden;
    localStorage.setItem('products', JSON.stringify(products));
    loadProducts();
    loadCustomers();
    showNotification(products[idx].hidden ? 'Đã ẩn sản phẩm' : 'Đã hiển thị sản phẩm', 'success');
}

// Cập nhật thống kê
function updateStats() {
    document.getElementById('total-products').textContent = products.length;
    
    // Tính tổng lượt xem (giả lập)
    const totalViews = products.reduce((sum, product) => sum + (product.views || Math.floor(Math.random() * 100)), 0);
    document.getElementById('total-views').textContent = totalViews;
}

// Format giá tiền
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN').format(price);
}

// Định dạng ngày về dd/mm/yyyy
function formatDateVN(dateStr) {
    if (!dateStr) return '';
    // Nếu đã đúng định dạng dd/mm/yyyy thì trả về luôn
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
    // Nếu là yyyy-mm-dd hoặc yyyy/mm/dd
    let d = dateStr.split(/[-\/]/);
    if (d.length === 3) {
        // yyyy-mm-dd -> dd/mm/yyyy
        return `${d[2].padStart(2,'0')}/${d[1].padStart(2,'0')}/${d[0]}`;
    }
    return dateStr;
}

// Lightweight accessor for orders used by stock helpers
function loadOrders() {
    return JSON.parse(localStorage.getItem('orders')) || [];
}


// ========== Quản lý đơn hàng cho admin ==========
function loadAdminOrders() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const grid = document.getElementById('adminOrdersGrid');
    if (!grid) return;
    if (!orders.length) {
        grid.innerHTML = '<div class="empty-state">Chưa có đơn hàng nào.</div>';
        return;
    }
    grid.innerHTML = renderAdminOrdersTable(orders);
}

function filterAdminOrders() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const from = document.getElementById('orderDateFrom').value;
    const to = document.getElementById('orderDateTo').value;
    const status = document.getElementById('orderStatusFilter').value;
    let filtered = orders;
    if (from) {
        filtered = filtered.filter(o => new Date(o.date.split(',')[0].split(' ')[0].split('/').reverse().join('-')) >= new Date(from));
    }
    if (to) {
        filtered = filtered.filter(o => new Date(o.date.split(',')[0].split(' ')[0].split('/').reverse().join('-')) <= new Date(to));
    }
    if (status) {
        filtered = filtered.filter(o => o.status === status);
    }
    document.getElementById('adminOrdersGrid').innerHTML = renderAdminOrdersTable(filtered);
}

function renderAdminOrdersTable(orders) {
    if (!orders.length) return '<div class="empty-state">Không có đơn hàng phù hợp.</div>';
    return `<table class='admin-orders-table' style='width:100%;border-collapse:collapse;'>
        <thead>
            <tr style='background:#007bff;color:#fff;'>
                <th style='padding:12px 8px;text-align:center;'>Mã đơn</th>
                <th style='padding:12px 8px;text-align:center;'>Ngày đặt</th>
                <th style='padding:12px 8px;text-align:center;'>Người nhận</th>
                <th style='padding:12px 8px;text-align:center;'>Địa chỉ</th>
                <th style='padding:12px 8px;text-align:center;'>Thanh toán</th>
                <th style='padding:12px 8px;text-align:center;'>Tình trạng</th>
                <th style='padding:12px 8px;text-align:center;'>Chi tiết</th>
            </tr>
        </thead>
        <tbody>
            ${orders.slice().reverse().map(order => `
                <tr style='border-bottom:1px solid #e0e0e0;'>
                    <td style='padding:10px 8px;text-align:center;font-weight:600;'>${order.id}</td>
                    <td style='padding:10px 8px;text-align:center;'>${order.date}</td>
                    <td style='padding:10px 8px;text-align:left;'>
                        <div><strong>${order.name}</strong></div>
                        <div style='font-size:0.95em;color:#888;margin-top:2px;'>${order.phone}</div>
                    </td>
                    <td style='padding:10px 8px;text-align:left;'>${order.address}</td>
                    <td style='padding:10px 8px;text-align:center;'>${order.payment === 'cod' ? 'Tiền mặt' : (order.payment === 'bank' ? 'Chuyển khoản' : 'Online')}</td>
                    <td style='padding:10px 8px;text-align:center;'>${renderOrderStatusSelect(order)}</td>
                    <td style='padding:10px 8px;text-align:center;'><button onclick='showOrderDetail(${order.id})' class='detail-btn' style='padding:6px 14px;border-radius:6px;background:#007bff;color:#fff;border:none;cursor:pointer;'>Xem</button></td>
                </tr>
            `).join('')}
        </tbody>
    </table>`;
}

function renderOrderStatusSelect(order) {
    const status = order.status || 'new';
    return `<select onchange='updateOrderStatus(${order.id}, this.value)' style='padding:4px 8px;border-radius:6px;'>
        <option value='new' ${status==='new'?'selected':''}>Mới đặt</option>
        <option value='processing' ${status==='processing'?'selected':''}>Đã xử lý</option>
        <option value='delivered' ${status==='delivered'?'selected':''}>Đã giao</option>
        <option value='cancelled' ${status==='cancelled'?'selected':''}>Hủy</option>
    </select>`;
}

function updateOrderStatus(orderId, newStatus) {
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
        orders[idx].status = newStatus;
        localStorage.setItem('orders', JSON.stringify(orders));
        loadAdminOrders();
        showNotification('Đã cập nhật trạng thái đơn hàng!', 'success');
    }
}

function showOrderDetail(orderId) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    let html = `<div class='order-detail-modal' style='position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.18);z-index:9999;display:flex;align-items:center;justify-content:center;'>
        <div style='background:#fff;padding:32px 24px;border-radius:12px;max-width:600px;width:100%;box-shadow:0 2px 16px rgba(0,0,0,0.12);position:relative;'>
            <button onclick='this.parentElement.parentElement.remove()' style='position:absolute;top:12px;right:12px;background:#dc3545;color:#fff;border:none;border-radius:50%;width:32px;height:32px;font-size:1.2em;cursor:pointer;'>&times;</button>
            <h3 style='margin-bottom:12px;'>Chi tiết đơn hàng #${order.id}</h3>
            <div style='margin-bottom:8px;'><strong>Ngày đặt:</strong> ${order.date}</div>
            <div style='margin-bottom:8px;'><strong>Người nhận:</strong> ${order.name} | <strong>ĐT:</strong> ${order.phone}</div>
            <div style='margin-bottom:8px;'><strong>Địa chỉ:</strong> ${order.address}</div>
            <div style='margin-bottom:8px;'><strong>Thanh toán:</strong> ${order.payment === 'cod' ? 'Tiền mặt khi nhận hàng' : (order.payment === 'bank' ? 'Chuyển khoản' : 'Thanh toán trực tuyến')}</div>
            <div style='margin-bottom:8px;'><strong>Tình trạng:</strong> ${renderOrderStatusSelect(order)}</div>
            <table style='width:100%;border-collapse:collapse;margin-top:12px;'>
                <thead><tr style='background:#007bff;color:#fff;'><th>Ảnh</th><th>Tên xe</th><th>Giá</th><th>Số lượng</th></tr></thead>
                <tbody>
                    ${order.items.map(item => `<tr><td><img src='${item.img}' alt='${item.name}' style='width:60px;border-radius:8px;'></td><td>${item.name}</td><td>${formatPrice(item.price)} VNĐ</td><td>${item.quantity}</td></tr>`).join('')}
                </tbody>
            </table>
            <div style='text-align:right;font-weight:600;font-size:1.1rem;margin-top:12px;'>Tổng cộng: ${formatPrice(order.total)} VNĐ</div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

// Hiển thị thông báo
function showNotification(message, type = 'info') {
    // Tạo element thông báo
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Thêm vào body
    document.body.appendChild(notification);
    
    // Hiển thị với animation
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Ẩn sau 3 giây
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}

// Xử lý form submit để phân biệt thêm mới và chỉnh sửa
document.getElementById('addProductForm').addEventListener('submit', function(e) {
    if (this.dataset.editId) {
        e.preventDefault();
        
        const productId = parseInt(this.dataset.editId);
        const formData = new FormData(this);
        const imageFile = formData.get('productImage');
        const imageUrl = formData.get('productImageUrl');
        
        // Tìm sản phẩm cần cập nhật
        const productIndex = products.findIndex(p => p.id === productId);
        if (productIndex !== -1) {
            // Tạo URL hình ảnh
            let finalImageUrl = products[productIndex].image; // Giữ ảnh cũ nếu không có ảnh mới
            if (imageUrl) {
                finalImageUrl = imageUrl;
            } else if (imageFile && imageFile.size > 0) {
                finalImageUrl = URL.createObjectURL(imageFile);
            }
            
            // Cập nhật thông tin sản phẩm
            products[productIndex] = {
                ...products[productIndex],
                name: formData.get('productName'),
                brand: formData.get('productBrand'),
                price: parseInt(formData.get('productPrice')),
                year: parseInt(formData.get('productYear')),
                fuel: formData.get('productFuel'),
                transmission: formData.get('productTransmission'),
                category: formData.get('productCategory') || '',
                image: finalImageUrl,
                description: formData.get('productDescription') || 'Xe chất lượng cao, đáng tin cậy'
            };
            
            // Lưu vào localStorage
            localStorage.setItem('products', JSON.stringify(products));
            
            // Cập nhật hiển thị
            loadProducts();
            updateStats();
            
            // Reset form
            delete this.dataset.editId;
            document.querySelector('.save-btn').textContent = 'Lưu sản phẩm';
            document.querySelector('.modal-header h3').textContent = 'Thêm sản phẩm mới';
            
            // Đóng modal
            closeAddProductModal();
            
            // Hiển thị thông báo
            showNotification('Cập nhật sản phẩm thành công!', 'success');
        }
    }
});

// Export dữ liệu cho trang index
function exportProductsForIndex() {
    return products;
}

// Làm cho function có thể truy cập globally
window.exportProductsForIndex = exportProductsForIndex;

// ========== Quản lý loại sản phẩm ==========

function initCategories() {
    // Nếu lần đầu chưa có categories thì tạo vài loại cơ bản
    if (!categories || !categories.length) {
        categories = [
            { id: 1, name: 'SUV', slug: 'suv', hidden: false },
            { id: 2, name: 'Sedan', slug: 'sedan', hidden: false },
            { id: 3, name: 'MPV', slug: 'mpv', hidden: false },
            { id: 4, name: 'Hatchback', slug: 'hatchback', hidden: false },
            { id: 5, name: 'Bán tải', slug: 'pickup', hidden: false }
        ];
        localStorage.setItem('categories', JSON.stringify(categories));
    }
}

function loadCategories() {
    const grid = document.getElementById('categories-grid');
    if (!grid) return;
    if (!categories.length) {
        grid.innerHTML = '<div class="empty-state">Chưa có loại sản phẩm nào.</div>';
        return;
    }
    grid.innerHTML = categories.map(c => `
        <div class="product-card" data-id="${c.id}">
            <div class="product-info">
                <h3>${c.name}</h3>
                <p class="brand">/${c.slug}</p>
                <div class="product-actions">
                    <button onclick="editCategory(${c.id})" class="edit-btn">
                        <i class="fas fa-edit"></i> Sửa
                    </button>
                    <button onclick="toggleHideCategory(${c.id})" class="${c.hidden ? 'unhide-btn' : 'hide-btn'}">
                        <i class="fas ${c.hidden ? 'fa-eye' : 'fa-eye-slash'}"></i> ${c.hidden ? 'Hiện' : 'Ẩn'}
                    </button>
                    <button onclick="deleteCategory(${c.id})" class="delete-btn">
                        <i class="fas fa-trash"></i> Xóa
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function showAddCategoryModal() {
    const modal = document.getElementById('addCategoryModal');
    if (!modal) return;
    document.getElementById('addCategoryForm').reset();
    delete document.getElementById('addCategoryForm').dataset.editId;
    modal.style.display = 'block';
}

function closeAddCategoryModal() {
    const modal = document.getElementById('addCategoryModal');
    if (modal) modal.style.display = 'none';
}

document.addEventListener('click', (e) => {
    const modal = document.getElementById('addCategoryModal');
    if (modal && e.target === modal) closeAddCategoryModal();
});

document.getElementById('addCategoryForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const name = formData.get('categoryName').trim();
    let slug = (formData.get('categorySlug') || '').trim();
    const hidden = !!formData.get('categoryHidden');
    if (!slug) slug = name.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/\s+/g,'-');

    if (this.dataset.editId) {
        const id = Number(this.dataset.editId);
        const idx = categories.findIndex(c => c.id === id);
        if (idx !== -1) {
            categories[idx] = { ...categories[idx], name, slug, hidden };
        }
    } else {
        const id = Date.now();
        categories.push({ id, name, slug, hidden });
    }
    localStorage.setItem('categories', JSON.stringify(categories));
    loadCategories();
    updateCategorySelect();
    closeAddCategoryModal();
    showNotification('Lưu loại sản phẩm thành công!', 'success');
});

function editCategory(id) {
    const c = categories.find(x => x.id === id);
    if (!c) return;
    const form = document.getElementById('addCategoryForm');
    form.dataset.editId = String(id);
    document.getElementById('categoryName').value = c.name;
    document.getElementById('categorySlug').value = c.slug;
    document.getElementById('categoryHidden').checked = !!c.hidden;
    showAddCategoryModal();
}

function deleteCategory(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa loại sản phẩm này?')) return;
    categories = categories.filter(c => c.id !== id);
    localStorage.setItem('categories', JSON.stringify(categories));
    loadCategories();
    updateCategorySelect();
    showNotification('Xóa loại sản phẩm thành công!', 'success');
}

function toggleHideCategory(id) {
    const idx = categories.findIndex(c => c.id === id);
    if (idx === -1) return;
    categories[idx].hidden = !categories[idx].hidden;
    localStorage.setItem('categories', JSON.stringify(categories));
    loadCategories();
}

function updateCategorySelect() {
    const sel = document.getElementById('productCategory');
    if (!sel) return;
    const visible = (categories || []).filter(c => !c.hidden);
    sel.innerHTML = '<option value="">Chọn loại</option>' + visible.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
}

// ========== Nhập xe đã có từ trang chủ ==========
function importHomepageCars(silent = false) {
    const cached = JSON.parse(localStorage.getItem('homepageCars') || '[]');
    if (!cached.length) {
        if (!silent) showNotification('Không tìm thấy dữ liệu xe trang chủ để nhập.', 'info');
        return 0;
    }
    let imported = 0;
    cached.forEach(item => {
        // Bỏ qua nếu đã tồn tại theo name+brand
        if (products.some(p => p.name === item.name && p.brand === item.brand)) return;
        products.push({
            id: Date.now() + Math.floor(Math.random()*1000),
            name: item.name,
            brand: item.brand,
            price: item.price || 0,
            year: item.year || new Date().getFullYear(),
            fuel: item.fuel || 'Xăng',
            transmission: item.transmission || 'Tự động (AT)',
            image: item.image,
            description: item.description || '',
            category: item.category || '',
            dateAdded: new Date().toISOString(),
            hidden: false
        });
        imported++;
    });
    localStorage.setItem('products', JSON.stringify(products));
    loadProducts();
    updateStats();
    if (!silent) showNotification(`Đã nhập ${imported} sản phẩm từ trang chủ`, 'success');
    return imported;
}

// Gắn import vào window để gọi từ HTML nếu cần
window.importHomepageCars = importHomepageCars;

// ========== Quản lý phiếu nhập (imports) ==========
let importsData = JSON.parse(localStorage.getItem('imports')) || [];

function saveImports() {
    localStorage.setItem('imports', JSON.stringify(importsData));
}

function loadImports() {
    importsData = JSON.parse(localStorage.getItem('imports')) || [];
    const grid = document.getElementById('importsGrid');
    if (!grid) return;
    if (!importsData.length) {
        grid.innerHTML = '<div class="empty-state">Chưa có phiếu nhập nào.</div>';
        return;
    }
    grid.innerHTML = renderImportsTable(importsData);
}

function renderImportsTable(list) {
    if (!list || !list.length) return '<div class="empty-state">Không có phiếu nhập phù hợp.</div>';
    return `<table class='admin-imports-table' style='width:100%;border-collapse:collapse;'>
        <thead>
            <tr style='background:#007bff;color:#fff;'>
                <th style='padding:10px;'>Mã phiếu</th>
                <th style='padding:10px;'>Ngày nhập</th>
                <th style='padding:10px;'>Sản phẩm</th>
                <th style='padding:10px;text-align:center;'>Tổng SL</th>
                <th style='padding:10px;text-align:right;'>Tổng tiền (VNĐ)</th>
                <th style='padding:10px;text-align:center;'>Trạng thái</th>
                <th style='padding:10px;text-align:center;'>Hành động</th>
            </tr>
        </thead>
        <tbody>
            ${list.slice().reverse().map(i => `
                <tr style='border-bottom:1px solid #e0e0e0;'>
                    <td style='padding:8px;text-align:center;font-weight:600;'>${i.code || i.id}</td>
                    <td style='padding:8px;text-align:center;'>${formatDateVN(i.date)}</td>
                    <td style='padding:8px;'>${i.items.map(it => `<div>${(it.brand? it.brand + ' - ' : '')}${it.name || (it.productId ? ((products.find(p=>String(p.id)===String(it.productId))||{}).name || '') : '')} <small style="color:#666;">x${it.qty} @ ${formatPrice(it.price)}</small></div>`).join('')}</td>
                    <td style='padding:8px;text-align:center;'>${i.items.reduce((s,it)=>s+Number(it.qty||0),0)}</td>
                    <td style='padding:8px;text-align:right;'>${formatPrice(i.items.reduce((s,it)=>s+ (Number(it.price)||0)*Number(it.qty),0))}</td>
                    <td style='padding:8px;text-align:center;'>${i.completed ? '<span style="color:green;font-weight:600;">Đã hoàn thành</span>' : '<span style="color:#ff9800;font-weight:600;">Chưa</span>'}</td>
                    <td style='padding:8px;text-align:center;'>
                        <button onclick='viewImportDetail(${i.id})' class='detail-btn' style='padding:6px 12px;margin-right:6px;'>Xem</button>
                        <button onclick='deleteImport(${i.id})' class='delete-btn' style='padding:6px 12px;margin-right:6px;background:#dc3545;color:#fff;border:none;border-radius:6px;cursor:pointer;'>Xóa</button>
                        ${i.completed ? '' : `<button onclick='editImport(${i.id})' class='edit-btn' style='padding:6px 12px;margin-right:6px;'>Sửa</button><button onclick='completeImport(${i.id})' class='save-btn' style='padding:6px 12px;'>Hoàn thành</button>`}
                    </td>
                </tr>
            `).join('')}
        </tbody>
    </table>`;
}

function filterImports() {
    const q = (document.getElementById('importSearchId')?.value || '').trim().toLowerCase();
    const from = (document.getElementById('importDateFrom')?.value || '').trim();
    const to = (document.getElementById('importDateTo')?.value || '').trim();
    const status = document.getElementById('importStatusFilter')?.value;
    let filtered = (JSON.parse(localStorage.getItem('imports')) || []).slice();
    if (q) {
        filtered = filtered.filter(i => String(i.code || i.id).toLowerCase().includes(q) || i.items.some(it => (it.name || '').toLowerCase().includes(q)));
    }
    // helper to parse dd/mm/yyyy or yyyy-mm-dd
    function parseDateFlex(s) {
        if (!s) return null;
        s = String(s).trim();
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
            const parts = s.split('/'); // dd/mm/yyyy
            return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
            return new Date(s);
        }
        const d = new Date(s);
        return isNaN(d) ? null : d;
    }

    if (from) {
        const fromDate = parseDateFlex(from);
        if (fromDate) filtered = filtered.filter(i => {
            const d = parseDateFlex(i.date);
            return d && d >= fromDate;
        });
    }
    if (to) {
        const toDate = parseDateFlex(to);
        if (toDate) filtered = filtered.filter(i => {
            const d = parseDateFlex(i.date);
            return d && d <= toDate;
        });
    }
    if (status) {
        if (status === 'pending') filtered = filtered.filter(i => !i.completed);
        if (status === 'completed') filtered = filtered.filter(i => !!i.completed);
    }
    document.getElementById('importsGrid').innerHTML = renderImportsTable(filtered);
}

// Modal / form handlers
function showAddImportModal() {
    const modal = document.getElementById('addImportModal');
    const form = document.getElementById('addImportForm');
    form.reset();
    delete form.dataset.editId;
    document.getElementById('importCode').value = 'PN' + Date.now();
    document.getElementById('importDate').value = new Date().toISOString().slice(0,10);
    const container = document.getElementById('importItemsContainer');
    container.innerHTML = '';
    addImportItemRow();
    modal.style.display = 'block';
    populateAllBrandSelects();
}

function closeAddImportModal() {
    const modal = document.getElementById('addImportModal');
    if (modal) modal.style.display = 'none';
    const form = document.getElementById('addImportForm');
    if (form) form.reset();
}

function addImportItemRow(item) {
    const container = document.getElementById('importItemsContainer');
    if (!container) return;
    const row = document.createElement('div');
    row.className = 'import-item-row';
    row.style = 'display:flex;gap:8px;align-items:center;margin-bottom:8px;';
    row.innerHTML = `
        <select class="import-brand-select" style="flex:1.2;padding:8px;border-radius:6px;border:1px solid #ccc;"></select>
        <input type="text" class="import-name-input" placeholder="Nhập tên xe đầy đủ" style="flex:2;padding:8px;border-radius:6px;border:1px solid #ccc;">
        <input type="number" class="import-price" placeholder="Giá nhập" min="0" style="flex:1;padding:8px;border-radius:6px;border:1px solid #ccc;">
        <input type="number" class="import-qty" placeholder="Số lượng" min="1" value="1" style="width:100px;padding:8px;border-radius:6px;border:1px solid #ccc;">
        <button type="button" class="remove-item-btn" onclick="removeImportItemRow(this)" style="padding:8px 10px;border-radius:6px;background:#dc3545;color:#fff;border:none;">Xóa</button>
    `;
    container.appendChild(row);
    populateBrandSelect(row.querySelector('.import-brand-select'));
    if (item) {
        // If old format with productId
        if (item.productId) {
            const prod = (products || []).find(p => String(p.id) === String(item.productId));
            if (prod) {
                row.querySelector('.import-brand-select').value = prod.brand || '';
                row.querySelector('.import-name-input').value = prod.name || '';
            }
        }
        // If new format with brand/name
        if (item.brand) row.querySelector('.import-brand-select').value = item.brand;
        if (item.name) row.querySelector('.import-name-input').value = item.name;
        row.querySelector('.import-price').value = item.price || '';
        row.querySelector('.import-qty').value = item.qty || 1;
    }
}

function removeImportItemRow(btn) {
    const container = document.getElementById('importItemsContainer');
    if (!container) return;
    if (container.querySelectorAll('.import-item-row').length <= 1) {
        // nếu chỉ còn 1 dòng, chỉ reset giá trị
        const row = btn.closest('.import-item-row');
        row.querySelector('.import-brand-select').value = '';
        row.querySelector('.import-name-input').value = '';
        row.querySelector('.import-price').value = '';
        row.querySelector('.import-qty').value = 1;
        return;
    }
    btn.closest('.import-item-row').remove();
}

function populateBrandSelect(sel) {
    if (!sel) return;
    const brands = Array.from(new Set((products || []).map(p => p.brand).filter(Boolean)));
    sel.innerHTML = '<option value="">-- Chọn hãng --</option>' + brands.map(b => `<option value="${b}">${b}</option>`).join('');
}

function populateAllBrandSelects() {
    document.querySelectorAll('.import-brand-select').forEach(sel => populateBrandSelect(sel));
}

// Submit handler
document.getElementById('addImportForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = this;
    const date = document.getElementById('importDate').value;
    const code = document.getElementById('importCode').value || ('PN' + Date.now());
    const rows = Array.from(document.querySelectorAll('.import-item-row'));
    const items = [];
    for (const r of rows) {
        const brand = r.querySelector('.import-brand-select')?.value;
        const name = (r.querySelector('.import-name-input')?.value || '').trim();
        const price = Number(r.querySelector('.import-price')?.value || 0);
        const qty = Number(r.querySelector('.import-qty')?.value || 0);
        // allow older items with productId stored (when editing old imports)
        const pidElem = r.querySelector('.import-product-select');
        if (pidElem) {
            const pid = pidElem.value;
            if (pid) {
                const prod = (products || []).find(p => String(p.id) === String(pid));
                items.push({ productId: pid, name: prod ? prod.name : name, brand: prod ? prod.brand : brand, price: price, qty: qty });
                continue;
            }
        }
        if (!brand && !name) continue; // skip empty row
        items.push({ brand: brand || '', name: name || '', price: price, qty: qty });
    }
    if (!items.length) { alert('Vui lòng thêm ít nhất 1 sản phẩm vào phiếu nhập.'); return; }

    if (form.dataset.editId) {
        const id = Number(form.dataset.editId);
        const idx = importsData.findIndex(x => x.id === id);
        if (idx === -1) return;
        if (importsData[idx].completed) { alert('Phiếu đã hoàn thành, không thể sửa.'); return; }
        importsData[idx] = { ...importsData[idx], code, date, items };
        saveImports();
        loadImports();
        closeAddImportModal();
        showNotification('Cập nhật phiếu nhập thành công!', 'success');
        return;
    }

    const newImport = {
        id: Date.now(),
        code,
        date,
        items,
        completed: false
    };
    importsData.push(newImport);
    saveImports();
    loadImports();
    closeAddImportModal();
    showNotification('Đã thêm phiếu nhập!', 'success');
});

function editImport(id) {
    const imp = (JSON.parse(localStorage.getItem('imports')) || []).find(x => x.id === id);
    if (!imp) return;
    if (imp.completed) { alert('Phiếu đã hoàn thành, không thể sửa.'); return; }
    const modal = document.getElementById('addImportModal');
    const form = document.getElementById('addImportForm');
    form.dataset.editId = String(id);
    document.getElementById('importCode').value = imp.code || imp.id;
    document.getElementById('importDate').value = imp.date;
    const container = document.getElementById('importItemsContainer');
    container.innerHTML = '';
    (imp.items || []).forEach(it => addImportItemRow(it));
    populateAllBrandSelects();
    modal.style.display = 'block';
}

function completeImport(id) {
    if (!confirm('Xác nhận hoàn thành phiếu nhập này? Sau khi hoàn thành sẽ không thể chỉnh sửa.')) return;
    const arr = JSON.parse(localStorage.getItem('imports')) || [];
    const idx = arr.findIndex(x => x.id === id);
    if (idx === -1) return;
    arr[idx].completed = true;
    localStorage.setItem('imports', JSON.stringify(arr));
    importsData = arr;
    loadImports();
    showNotification('Đã hoàn thành phiếu nhập.', 'success');
}

function deleteImport(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa phiếu nhập này?')) return;
    let arr = JSON.parse(localStorage.getItem('imports')) || [];
    arr = arr.filter(x => x.id !== id);
    localStorage.setItem('imports', JSON.stringify(arr));
    importsData = arr;
    loadImports();
    showNotification('Đã xóa phiếu nhập.', 'success');
}

function viewImportDetail(id) {
    const arr = JSON.parse(localStorage.getItem('imports')) || [];
    const imp = arr.find(x => x.id === id);
    if (!imp) return;
    let html = `<div class='import-detail-modal' style='position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.18);z-index:9999;display:flex;align-items:center;justify-content:center;'>
        <div style='background:#fff;padding:24px;border-radius:12px;max-width:900px;width:100%;box-shadow:0 2px 16px rgba(0,0,0,0.12);position:relative;'>
            <button onclick='this.parentElement.parentElement.remove()' style='position:absolute;top:12px;right:12px;background:#dc3545;color:#fff;border:none;border-radius:50%;width:32px;height:32px;font-size:1.2em;cursor:pointer;'>&times;</button>
            <h3 style='margin-bottom:12px;'>Chi tiết phiếu nhập ${imp.code || imp.id}</h3>
            <div style='margin-bottom:8px;'><strong>Ngày nhập:</strong> ${formatDateVN(imp.date)}</div>
            <div style='margin-top:12px;'><table style='width:100%;border-collapse:collapse;'><thead><tr style='background:#f4f4f4;'><th>Ảnh</th><th>Tên</th><th>Giá</th><th>Số lượng</th><th>Tiền</th></tr></thead><tbody>
            ${imp.items.map(it => {
                const prod = it.productId ? (products.find(p=>String(p.id)===String(it.productId))||null) : (products.find(p => p.brand === it.brand && p.name === it.name) || null);
                const img = prod ? prod.image : (it.image || '');
                const displayName = (it.brand ? it.brand + ' - ' : '') + (it.name || (prod ? prod.name : ''));
                return `<tr><td style='padding:8px;'><img src='${img}' style='width:64px;border-radius:8px;'></td><td style='padding:8px;'>${displayName}</td><td style='padding:8px;text-align:right;'>${formatPrice(it.price)}</td><td style='padding:8px;text-align:center;'>${it.qty}</td><td style='padding:8px;text-align:right;'>${formatPrice((it.price||0)*it.qty)}</td></tr>`;
            }).join('')}
            </tbody></table></div>
            <div style='text-align:right;margin-top:12px;font-weight:600;'>Tổng: ${formatPrice(imp.items.reduce((s,it)=>s+(Number(it.price)||0)*Number(it.qty),0))} VNĐ</div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

// Exports
window.loadImports = loadImports;
window.showAddImportModal = showAddImportModal;
window.addImportItemRow = addImportItemRow;
window.removeImportItemRow = removeImportItemRow;
window.editImport = editImport;
window.completeImport = completeImport;
window.filterImports = filterImports;
window.viewImportDetail = viewImportDetail;
window.deleteImport = deleteImport;
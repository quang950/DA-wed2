document.addEventListener('DOMContentLoaded', () => {
    // Tìm kiếm sản phẩm theo nhiều tiêu chí
    function filterProducts() {
        const name = document.getElementById('searchName').value.trim().toLowerCase();
        const brand = document.getElementById('searchBrand').value;
        const priceFrom = Number(document.getElementById('searchPriceFrom').value) || 0;
        const priceTo = Number(document.getElementById('searchPriceTo').value) || Infinity;
        let found = false;
        document.querySelectorAll('.brand-container').forEach(brandSection => {
            let brandId = brandSection.id;
            let anyVisible = false;
            brandSection.querySelectorAll('.car-card').forEach(card => {
                // Bỏ qua thẻ đã ẩn/bị xóa do admin
                if (card.classList?.contains('hidden-by-admin')) { card.style.display = 'none'; return; }
                const carName = card.querySelector('h3')?.textContent?.trim().toLowerCase() || '';
                const carPrice = parseCurrencyToNumber(card.querySelector('.price')?.textContent);
                let match = true;
                if (name && !carName.includes(name)) match = false;
                if (brand && brandId !== brand) match = false;
                if (carPrice < priceFrom || carPrice > priceTo) match = false;
                card.style.display = match ? '' : 'none';
                if (match) anyVisible = true;
            });
            brandSection.style.display = anyVisible ? 'block' : 'none';
            if (anyVisible) found = true;
        });
        // Cuộn xuống phần xe
        const productsSection = document.getElementById('products');
        if (productsSection) {
            productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        // Ẩn/hiện tiêu đề khi tìm kiếm
        const sectionTitle = productsSection?.querySelector('.section-title');
        const isFiltering = name || brand || (priceFrom > 0) || (priceTo !== Infinity);
        if (sectionTitle) {
            sectionTitle.style.display = isFiltering ? 'none' : 'block';
        }
        // Hiện thông báo nếu không tìm thấy
        let noti = document.getElementById('noCarFound');
        if (!found) {
            if (!noti) {
                noti = document.createElement('div');
                noti.id = 'noCarFound';
                noti.textContent = 'Không tìm thấy mẫu xe';
                noti.style = 'text-align:center;color:#fff;font-size:2rem;font-weight:700;margin:40px auto;letter-spacing:1px;text-shadow:0 2px 8px rgba(0,0,0,0.18);';
                productsSection?.parentNode?.insertBefore(noti, productsSection.nextSibling);
            } else {
                noti.style.color = '#fff';
            }
        } else {
            if (noti) noti.remove();
        }
    }

    document.getElementById('searchBtn')?.addEventListener('click', filterProducts);
    ['searchName','searchBrand','searchPriceFrom','searchPriceTo'].forEach(id => {
        document.getElementById(id)?.addEventListener('keydown', function(e){
            if(e.key==='Enter') filterProducts();
        });
    });
    // Hiển thị avatar trên navbar nếu có (luôn chạy khi load trang)
    try {
        const email = localStorage.getItem('userEmail');
        let users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.email === email);
        if (user && user.avatar) {
            const userAvatar = document.getElementById('userAvatar');
            if (userAvatar) userAvatar.src = user.avatar;
        }
    } catch (e) {}
    // Xử lý chọn file avatar và preview
    document.getElementById('personalAvatar')?.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            document.getElementById('personalAvatarPreview').src = ev.target.result;
        };
        reader.readAsDataURL(file);
    });
    // ...existing code...
        // ...existing code...
        setTimeout(() => {
            window.showPersonalInfoModal = function() {
                const modal = document.getElementById('personalInfoModal');
                const form = document.getElementById('personalInfoForm');
                if (!modal || !form) {
                    showToast('Không tìm thấy modal thông tin cá nhân!', 'error');
                    return;
                }
                // Lấy user hiện tại
                const email = localStorage.getItem('userEmail');
                let users = JSON.parse(localStorage.getItem('users')) || [];
                const user = users.find(u => u.email === email);
                if (!user) {
                    showToast('Không tìm thấy thông tin cá nhân!', 'error');
                    return;
                }
                // Đổ dữ liệu vào form
                form.personalFirstName.value = user.firstName || '';
                form.personalLastName.value = user.lastName || '';
                form.personalEmail.value = user.email || '';
                form.personalPhone.value = user.phone || '';
                form.personalBirthDate.value = user.birthDate || '';
                form.personalProvince.value = user.province || '';
                // Hiển thị avatar preview
                const avatarPreview = document.getElementById('personalAvatarPreview');
                avatarPreview.src = user.avatar || '';
                modal.style.display = 'block';
            };
        }, 0);

    window.closePersonalInfoModal = function() {
        const modal = document.getElementById('personalInfoModal');
        if (modal) modal.style.display = 'none';
    };

    document.getElementById('personalInfoForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = localStorage.getItem('userEmail');
        let users = JSON.parse(localStorage.getItem('users')) || [];
        const idx = users.findIndex(u => u.email === email);
        if (idx === -1) {
            showToast('Không tìm thấy thông tin cá nhân!', 'error');
            return;
        }
        users[idx].firstName = this.personalFirstName.value.trim();
        users[idx].lastName = this.personalLastName.value.trim();
        users[idx].phone = this.personalPhone.value.trim();
        users[idx].birthDate = this.personalBirthDate.value;
        users[idx].province = this.personalProvince.value.trim();
        // Nếu có file avatar mới
        const avatarInput = this.personalAvatar;
        if (avatarInput && avatarInput.files && avatarInput.files[0]) {
            const reader = new FileReader();
            reader.onload = function(ev) {
                users[idx].avatar = ev.target.result;
                localStorage.setItem('users', JSON.stringify(users));
                closePersonalInfoModal();
                showToast('Đã cập nhật thông tin cá nhân!', 'success');
                // Cập nhật avatar trên navbar
                const userAvatar = document.getElementById('userAvatar');
                if (userAvatar) userAvatar.src = users[idx].avatar;
            };
            reader.readAsDataURL(avatarInput.files[0]);
        } else {
            localStorage.setItem('users', JSON.stringify(users));
            closePersonalInfoModal();
            showToast('Đã cập nhật thông tin cá nhân!', 'success');
            // Cập nhật avatar trên navbar
            const userAvatar = document.getElementById('userAvatar');
            if (userAvatar) userAvatar.src = users[idx].avatar || '';
        }
    // Hiển thị avatar trên navbar nếu có
    try {
        const email = localStorage.getItem('userEmail');
        let users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.email === email);
        if (user && user.avatar) {
            const userAvatar = document.getElementById('userAvatar');
            if (userAvatar) userAvatar.src = user.avatar;
        }
    } catch (e) {}
    });

    // Đóng modal khi click ra ngoài
    document.getElementById('personalInfoModal')?.addEventListener('click', function(e) {
        if (e.target === this) closePersonalInfoModal();
    });
    // Nếu admin đang đăng nhập, hiển thị nút quay lại Admin trên navbar
    try {
        const isAdmin = localStorage.getItem('adminLoggedIn') === 'true';
        const actions = document.querySelector('.user-actions');
        if (isAdmin) {
            // Thêm nút quay lại admin nếu chưa có
            if (actions && !actions.querySelector('.admin-return-btn')) {
                const btn = document.createElement('a');
                btn.href = 'admin-themsanpham.html';
                btn.className = 'admin-return-btn blob-btn login-btn';
                btn.innerHTML = '<span class="blob-btn__inner"><span class="blob-btn__blobs"><span class="blob-btn__blob"></span><span class="blob-btn__blob"></span><span class="blob-btn__blob"></span><span class="blob-btn__blob"></span></span></span>Quay lại Admin';
                actions.insertBefore(btn, actions.firstChild);
            }
            // Ẩn nút giỏ hàng khi là admin
            const cartIcon = document.querySelector('.cart-icon');
            if (cartIcon) cartIcon.style.display = 'none';
        }
    } catch (e) { /* ignore */ }
    // Load sản phẩm từ admin trước
    loadAdminProducts();
    
    // Xử lý điều hướng mượt mà khi click vào menuhttp://127.0.0.1:3000/login.html
    document.querySelectorAll('.dropdown-content a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            // Ẩn tất cả các section
            document.querySelectorAll('.brand-container').forEach(container => {
                container.style.display = 'none';
            });
            
            // Hiển thị section được chọn với animation
            if (targetSection) {
                targetSection.style.display = 'block';
                targetSection.style.opacity = '0';
                
                // Animation hiển thị mượt mà
                setTimeout(() => {
                    targetSection.style.transition = 'opacity 0.5s ease';
                    targetSection.style.opacity = '1';
                    
                    // Cuộn đến section được chọn
                    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
        });
    });

    // Hiển thị tất cả section khi load trang
    function showAllSections() {
        document.querySelectorAll('.brand-container').forEach(container => {
            container.style.display = 'block';
            container.style.opacity = '1';
        });
    }

    // Nút "Xem tất cả" trong dropdown (chỉ trên trang có dropdown)
    // const dropdown = document.querySelector('.dropdown-content');
    // if (dropdown) {
    //     const showAllLink = document.createElement('a');
    //     showAllLink.href = '#';
    //     showAllLink.textContent = 'Xem tất cả';
    //     showAllLink.classList.add('show-all');
    //     showAllLink.addEventListener('click', (e) => {
    //         e.preventDefault();
    //         showAllSections();
    //     });
    //     dropdown.appendChild(showAllLink);
    // }

    // Hiển thị tất cả section mặc định (chỉ trang có brand)
    if (document.querySelector('.brand-container')) {
        showAllSections();
        // Cache dữ liệu xe trên trang chủ để admin có thể nhập vào trang quản trị
        try {
            const cars = [];
            document.querySelectorAll('.brand-container').forEach(brand => {
                const brandId = brand.id || '';
                brand.querySelectorAll('.car-card').forEach(card => {
                    const name = card.querySelector('h3')?.textContent?.trim() || '';
                    const price = parseCurrencyToNumber(card.querySelector('.price')?.textContent || '');
                    const img = card.querySelector('img')?.getAttribute('src') || '';
                    const data = card.dataset || {};
                    const item = {
                        id: `home-${brandId}-${name}`,
                        name,
                        brand: brandId,
                        price,
                        year: data.year ? Number(data.year) : undefined,
                        fuel: data.fuel || undefined,
                        transmission: data.transmission || undefined,
                        origin: data.origin || undefined,
                        engine: data.engine || undefined,
                        seats: data.seats || undefined,
                        image: img,
                        description: data.description || data.desc || '',
                        source: 'homepage'
                    };
                    cars.push(item);
                });
            });
            localStorage.setItem('homepageCars', JSON.stringify(cars));
        } catch (e) {
            console.warn('Không thể cache dữ liệu xe trang chủ:', e);
        }
    }

    // Slider theo trang: ">" lướt sang trái để hiển thị 5 mẫu xe kế tiếp, "Xem thêm" hiển thị toàn bộ
    function initBrandPagination() {
        document.querySelectorAll('.brand-container').forEach(brand => {
            const container = brand.querySelector('.car-container');
            if (!container) return;
            const cards = Array.from(container.querySelectorAll('.car-card')).filter(c => !c.classList?.contains('hidden-by-admin'));
            const step = 5;
            const total = cards.length;
            const totalPages = Math.max(1, Math.ceil(total / step));
            let page = 0;
            let expanded = false;

            function showPage(p, animate = true) {
                if (expanded) {
                    cards.forEach(c => c.style.display = '');
                    return;
                }
                const newPage = ((p % totalPages) + totalPages) % totalPages;
                const start = newPage * step;
                const end = Math.min(start + step, total);

                if (animate) {
                    container.classList.remove('slide-in-right');
                    container.classList.add('slide-out-left');
                    const onOut = () => {
                        container.removeEventListener('animationend', onOut);
                        // cập nhật trang sau khi out
                        cards.forEach((card, idx) => {
                            card.style.display = (idx >= start && idx < end) ? '' : 'none';
                        });
                        container.classList.remove('slide-out-left');
                        container.classList.add('slide-in-right');
                        container.addEventListener('animationend', () => {
                            container.classList.remove('slide-in-right');
                        }, { once: true });
                    };
                    container.addEventListener('animationend', onOut);
                } else {
                    cards.forEach((card, idx) => {
                        card.style.display = (idx >= start && idx < end) ? '' : 'none';
                    });
                }
                page = newPage;
            }

            function setMoreLinkLabel(moreLink) {
                if (!moreLink) return;
                const icon = moreLink.querySelector('i');
                moreLink.textContent = expanded ? 'Thu gọn ' : 'Xem thêm ';
                if (icon) moreLink.appendChild(icon);
            }

            // Khởi tạo: nếu tổng <= 5 hiển thị tất cả, ngược lại hiển thị trang 0
            if (total <= step) {
                cards.forEach(c => c.style.display = '');
                return;
            } else {
                showPage(0, false);
            }

            const nextBtn = brand.querySelector('.slider-arrow.next');
            const moreLink = brand.querySelector('.view-more');

            nextBtn?.addEventListener('click', (e) => {
                e.preventDefault();
                if (expanded) {
                    expanded = false;
                    setMoreLinkLabel(moreLink);
                    if (nextBtn) nextBtn.style.display = '';
                    showPage(0, false);
                } else {
                    showPage(page + 1, true);
                }
            });

            moreLink?.addEventListener('click', (e) => {
                e.preventDefault();
                expanded = !expanded;
                setMoreLinkLabel(moreLink);
                if (expanded) {
                    cards.forEach(c => c.style.display = '');
                    if (nextBtn) nextBtn.style.display = 'none';
                } else {
                    showPage(page, false);
                    if (nextBtn) nextBtn.style.display = '';
                }
            });

            setMoreLinkLabel(moreLink);
            if (nextBtn) nextBtn.style.display = '';
        });
    }
    initBrandPagination();

    // Xử lý active menu
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Xóa class active từ tất cả các link
            navLinks.forEach(l => l.classList.remove('active'));
            // Thêm class active vào link được click
            e.target.classList.add('active');
        });
    });

    // Xử lý active menu dựa trên vị trí scroll
    window.addEventListener('scroll', () => {
        const scrollPosition = window.scrollY;
        const sections = document.querySelectorAll('section[id]');
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href').includes(sectionId)) {
                        link.classList.add('active');
                    }
                });
            }
        });

        // Kiểm tra nếu ở đầu trang thì active menu Trang chủ
        if (scrollPosition < 100) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === 'index.html') {
                    link.classList.add('active');
                }
            });
        }
    });

        // Cập nhật số lượng giỏ hàng trên navbar khi load trang
        updateCartCount();

        // Nếu đang ở trang giỏ hàng thì load dữ liệu
        if (document.getElementById('cart-body')) {
                loadCart();
        }

        // Thiết lập hành vi cho nút xem chi tiết -> mở modal
        setupCarDetailsModal();

        // Gán lại sự kiện cho nút Mua hàng để đảm bảo lấy đúng ảnh/tên/giá
        document.querySelectorAll('.car-card').forEach(card => {
            const btn = card.querySelector('.buy-btn');
            if (!btn) return;
            const name = card.querySelector('h3')?.textContent?.trim() || '';
            const price = parseCurrencyToNumber(card.querySelector('.price')?.textContent);
            const img = card.querySelector('img')?.getAttribute('src') || '';
            btn.onclick = (e) => {
                e?.preventDefault?.();
                addToCart(name, price, img);
            };
        });

        // Nút Thanh toán trên cart.html
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                const stored = JSON.parse(localStorage.getItem('cart')) || [];
                if (!stored.length) {
                    showToast('Giỏ hàng trống!', 'error');
                    return;
                }

                // Giả lập thanh toán thành công
                showToast('Thanh toán thành công! Cảm ơn bạn.');
                localStorage.removeItem('cart');
                cart = [];
                loadCart();
                updateCartCount();
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1200);
            });
        }
});

// Giỏ hàng (nếu có trong localStorage thì lấy ra, nếu chưa thì mảng rỗng)
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Định dạng tiền VNĐ
function formatCurrency(value) {
    try {
        return new Intl.NumberFormat('vi-VN').format(value) + ' VNĐ';
    } catch (e) {
        return value + ' VNĐ';
    }
}

// Parse chuỗi tiền tệ thành số
function parseCurrencyToNumber(text) {
    if (!text) return 0;
    return Number(String(text).replace(/[^0-9]/g, '')) || 0;
}

// Cập nhật badge số lượng giỏ hàng
function updateCartCount() {
    const stored = JSON.parse(localStorage.getItem('cart')) || [];
    const count = stored.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
    const badge = document.querySelector('.cart-count');
    if (badge) badge.textContent = count;
}

// Toast thông báo
function getToastContainer() {
    let c = document.getElementById('toast-container');
    if (!c) {
        c = document.createElement('div');
        c.id = 'toast-container';
        document.body.appendChild(c);
    }
    return c;
}

function showToast(message, type = 'success') {
    const container = getToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    // Tự động ẩn
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 220);
    }, 1800);
}

// Hàm thêm vào giỏ hàng
function addToCart(name, price, img) {
    // Kiểm tra đăng nhập trước khi thêm vào giỏ hàng
    const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
    if (!isLoggedIn) {
        showLoginRequiredModal();
        return;
    }
    
    // Cố gắng lấy thông tin trực tiếp từ thẻ sản phẩm nếu có
    const activeEl = typeof document !== 'undefined' ? document.activeElement : null;
    const card = activeEl && activeEl.closest ? activeEl.closest('.car-card') : null;

    if (card) {
        const titleFromDOM = card.querySelector('h3')?.textContent?.trim();
        const priceFromDOM = parseCurrencyToNumber(card.querySelector('.price')?.textContent);
        const imgFromDOM = card.querySelector('img')?.getAttribute('src');
        if (titleFromDOM) name = titleFromDOM;
        if (priceFromDOM) price = priceFromDOM;
        if (imgFromDOM) img = imgFromDOM;
    }

    // Fallback tên/giá
    if (!name) name = 'Sản phẩm';
    if (!price || isNaN(price)) price = 0;

    // Fallback ảnh
    if (!img) img = 'assets/images/hero-bg.jpg';

    let existing = cart.find(product => product.name === name);
    if (existing) {
        existing.quantity = (existing.quantity || 0) + 1;
    } else {
        cart.push({ name, price, img, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
        showToast('Đã thêm vào giỏ hàng!');
}

// Hàm xóa sản phẩm trong giỏ
function removeFromCart(index) {
  cart.splice(index, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
    updateCartCount();
}

// Hàm load giỏ hàng (dùng trong cart.html)
function loadCart() {
    const tbody = document.getElementById('cart-body');
    const totalEl = document.getElementById('cart-total');
    const stored = JSON.parse(localStorage.getItem('cart')) || [];

    if (!tbody) return; // không phải trang giỏ hàng

    if (stored.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">Giỏ hàng trống</td></tr>';
        if (totalEl) totalEl.textContent = 'Tổng cộng: 0 VNĐ';
        updateCartCount();
        return;
    }

    let rows = '';
    let total = 0;
    stored.forEach((item, idx) => {
        const lineTotal = (Number(item.price) || 0) * (Number(item.quantity) || 0);
        total += lineTotal;
        const imgSrc = item.img || 'assets/images/hero-bg.jpg';
        rows += `
            <tr>
                <td><img src="${imgSrc}" alt="${item.name}"></td>
                <td>${item.name}</td>
                <td>${formatCurrency(item.price)}</td>
                <td>
                    <button class="remove-btn" onclick="changeQuantity(${idx}, -1)">-</button>
                    <span style="display:inline-block;min-width:32px;">${item.quantity}</span>
                    <button class="remove-btn" style="background:#28a745" onclick="changeQuantity(${idx}, 1)">+</button>
                    <button class="remove-btn" style="margin-left:8px" onclick="removeFromCart(${idx})">Xóa</button>
                </td>
            </tr>`;
    });
    tbody.innerHTML = rows;
    if (totalEl) totalEl.textContent = `Tổng cộng: ${formatCurrency(total)}`;
    updateCartCount();
}

// Tăng/giảm số lượng
function changeQuantity(index, delta) {
    const stored = JSON.parse(localStorage.getItem('cart')) || [];
    if (!stored[index]) return;
    stored[index].quantity = (Number(stored[index].quantity) || 0) + delta;
    if (stored[index].quantity <= 0) stored.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(stored));
    cart = stored;
    loadCart();
}

// Modal chi tiết xe
function setupCarDetailsModal() {
    const modal = document.getElementById('carModal');
    if (!modal) return; // không ở index
    const modalImg = document.getElementById('modalImg');
    const modalTitle = document.getElementById('modalTitle');
    const modalPrice = document.getElementById('modalPrice');
    const modalDesc = document.getElementById('modalDesc');
    const addBtn = document.getElementById('addToCartBtn');
    const buyBtn = document.getElementById('buyNowBtn'); // Có thể không tồn tại nếu ẩn nút "Mua ngay"
    const closeBtn = modal.querySelector('.close-btn');

    const open = () => modal.classList.add('show');
    const close = () => modal.classList.remove('show');

    // Chuẩn hóa hiển thị thông tin chi tiết từ data-*
    function normalizeTransmission(t) {
        if (!t) return '';
        let out = t.trim();
        // e-CVT giữ nguyên
        out = out.replace(/\be[-\s]?cvt\b/i, 'e-CVT');
        // CVT
        if (/\bcvt\b/i.test(out) && !/e-CVT/i.test(out)) {
            out = 'CVT tự động';
        }
        // AT
        if (/\bAT\b/.test(out) || /Tự động\s*\(AT\)/i.test(out) || /Số tự động/i.test(out)) {
            out = 'Tự động (AT)';
        }
        return out;
    }

    function formatSeats(s) {
        if (!s) return '';
        const m = String(s).match(/\d+/);
        if (m && !/chỗ/i.test(String(s))) return `${m[0]} chỗ`;
        return s;
    }

    function inferOrigin(brandId) {
        const map = {
            toyota: 'Nhật Bản', lexus: 'Nhật Bản', honda: 'Nhật Bản',
            mercedes: 'Đức', bmw: 'Đức', audi: 'Đức',
            hyundai: 'Hàn Quốc', kia: 'Hàn Quốc',
            vinfast: 'Việt Nam'
        };
        return map[(brandId || '').toLowerCase()] || '';
    }

    // Gán sự kiện cho các link "Chi tiết"
    document.querySelectorAll('.car-card .view-details').forEach(a => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            const card = a.closest('.car-card');
            const title = card.querySelector('h3')?.textContent?.trim() || '';
            const img = card.querySelector('img')?.getAttribute('src') || '';
            const priceText = card.querySelector('.price')?.textContent || '';
            const price = parseCurrencyToNumber(priceText);

            const brandId = card.closest('.brand-container')?.id || '';
            const ds = card.dataset || {};
            const origin = ds.origin || inferOrigin(brandId);
            const year = ds.year || '';
            const fuel = ds.fuel || '';
            const transmission = normalizeTransmission(ds.transmission || '');
            const seats = formatSeats(ds.seats || '');
            const engine = ds.engine || '';
            const desc = ds.description || ds.desc || `${title} ${year ? `(${year})` : ''} ${fuel ? `| ${fuel}` : ''} ${seats ? `| ${seats}` : ''}`.trim();

            modalImg.src = img;
            modalTitle.textContent = title;
            modalPrice.textContent = formatCurrency(price);
            // Render thông số + mô tả
            const specs = [
                origin && `<li><strong>Xuất xứ:</strong> ${origin}</li>`,
                year && `<li><strong>Năm:</strong> ${year}</li>`,
                fuel && `<li><strong>Nhiên liệu:</strong> ${fuel}</li>`,
                seats && `<li><strong>Số chỗ:</strong> ${seats}</li>`,
                transmission && `<li><strong>Hộp số:</strong> ${transmission}</li>`,
                engine && `<li><strong>Động cơ:</strong> ${engine}</li>`
            ].filter(Boolean).join('');
            modalDesc.innerHTML = `${specs ? `<ul class="specs">${specs}</ul>` : ''}${desc ? `<p class="desc">${desc}</p>` : ''}` || 'Thông tin chi tiết đang cập nhật.';

            // Gán hành vi nút
            addBtn.onclick = () => {
                addToCart(title, price, img);
                close();
            };
            if (buyBtn) {
                buyBtn.onclick = () => {
                    addToCart(title, price, img);
                    window.location.href = 'cart.html';
                };
            }

            open();
        });
    });

    closeBtn?.addEventListener('click', () => close());
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}

// Hàm load sản phẩm từ admin
function loadAdminProducts() {
    const adminProducts = JSON.parse(localStorage.getItem('products')) || [];

    if (adminProducts.length === 0) {
        return; // Không có sản phẩm từ admin
    }

    // Nhóm sản phẩm theo thương hiệu
    const productsByBrand = {};
    adminProducts.forEach(product => {
        const brand = (product.brand || '').toLowerCase();
        if (!brand) return;
        if (!productsByBrand[brand]) {
            productsByBrand[brand] = [];
        }
        productsByBrand[brand].push(product);
    });

    // Cập nhật/đồng bộ vào từng section thương hiệu
    Object.keys(productsByBrand).forEach(brand => {
        const brandSection = document.getElementById(brand);
        const carContainer = brandSection?.querySelector('.car-container');

        // Fallback hàm lấy tên card dạng chuẩn để so khớp
        const getCardName = (el) => (el.querySelector('h3')?.textContent?.trim() || '').toLowerCase();

        // Nếu không tìm thấy section theo brand, vẫn xử lý ẩn toàn cục theo tên
        if (!brandSection || !carContainer) {
            productsByBrand[brand].forEach(product => {
                if (product.hidden) {
                    const allCards = Array.from(document.querySelectorAll('.car-card'));
                    const match = allCards.find(c => getCardName(c) === String(product.name || '').toLowerCase());
                    if (match) match.remove();
                }
            });
            return; // Không thể đồng bộ thêm nếu không có container đúng brand
        }

        const cards = Array.from(carContainer.querySelectorAll('.car-card'));

        productsByBrand[brand].forEach(product => {
            // Tìm card trùng tên
            const existing = cards.find(c => getCardName(c) === String(product.name || '').toLowerCase());

            // Nếu sản phẩm bị ẩn -> loại bỏ khỏi DOM để không bị các logic khác hiển thị lại
            if (product.hidden) {
                if (existing) existing.remove();
                return;
            }

            if (existing) {
                existing.style.display = '';
                // Cập nhật ảnh, giá, và data-*
                const imgEl = existing.querySelector('img');
                const priceEl = existing.querySelector('.price');
                if (imgEl) {
                    const imageSrc = product.image || `assets/images/logo-${product.brand}.png`;
                    imgEl.setAttribute('src', imageSrc);
                    imgEl.setAttribute('onerror', `this.src='assets/images/logo-${product.brand}.png'`);
                }
                if (priceEl) priceEl.textContent = formatCurrency(product.price);
                // Ghi data-* cho modal
                existing.dataset.description = product.description || existing.dataset.description || '';
                if (product.year) existing.dataset.year = String(product.year);
                if (product.fuel) existing.dataset.fuel = product.fuel;
                if (product.transmission) existing.dataset.transmission = product.transmission;
            } else {
                // Thêm mới nếu chưa có
                const carCard = createCarCard(product);
                // Ghi data-* cho modal
                carCard.dataset.description = product.description || '';
                if (product.year) carCard.dataset.year = String(product.year);
                if (product.fuel) carCard.dataset.fuel = product.fuel;
                if (product.transmission) carCard.dataset.transmission = product.transmission;
                carContainer.appendChild(carCard);
            }
        });
    });

    // Khởi tạo lại pagination và modal sau khi đồng bộ
    setTimeout(() => {
        initBrandPagination();
        setupCarDetailsModal();
    }, 100);
}

// Hàm tạo card sản phẩm
function createCarCard(product) {
    const carCard = document.createElement('div');
    carCard.className = 'car-card';
    
    const imageSrc = product.image || `assets/images/logo-${product.brand}.png`;
    
    carCard.innerHTML = `
        <img src="${imageSrc}" alt="${product.name}" onerror="this.src='assets/images/logo-${product.brand}.png'">
        <h3>${product.name}</h3>
        <p class="price">${formatCurrency(product.price)}</p>
        <button onclick="addToCart('${product.name}', ${product.price}, '${imageSrc}')" class="buy-btn">Mua hàng</button>
        <a href="#" class="view-details">Chi tiết</a>
    `;
    
    return carCard;
}

// Function hiển thị modal yêu cầu đăng nhập
function showLoginRequiredModal() {
    // Tạo modal HTML
    const modalHTML = `
        <div id="loginRequiredModal" class="modal" style="display: block;">
            <div class="modal-content" style="max-width: 400px; text-align: center;">
                <div class="modal-header">
                    <h2><i class="fas fa-lock"></i> Yêu cầu đăng nhập</h2>
                    <span class="close" onclick="closeLoginRequiredModal()">&times;</span>
                </div>
                <div class="modal-body" style="padding: 30px 20px;">
                    <i class="fas fa-shopping-cart" style="font-size: 4rem; color: #4CAF50; margin-bottom: 20px;"></i>
                    <p style="font-size: 18px; margin-bottom: 25px; color: rgba(255,255,255,0.9);">
                        Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng
                    </p>
                    <div style="display: flex; gap: 15px; justify-content: center;">
                        <button onclick="goToLogin()" class="login-required-btn primary">
                            <i class="fas fa-sign-in-alt"></i> Đăng nhập
                        </button>
                        <button onclick="closeLoginRequiredModal()" class="login-required-btn secondary">
                            <i class="fas fa-times"></i> Hủy
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Thêm modal vào body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Đóng modal khi click ra ngoài
    document.getElementById('loginRequiredModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeLoginRequiredModal();
        }
    });
}

// Function đóng modal yêu cầu đăng nhập
function closeLoginRequiredModal() {
    const modal = document.getElementById('loginRequiredModal');
    if (modal) {
        modal.remove();
    }
}

// Function chuyển đến trang đăng nhập
function goToLogin() {
    closeLoginRequiredModal();
    window.location.href = 'login.html';
}

// Function kiểm tra đăng nhập trước khi vào giỏ hàng
function checkLoginAndGoToCart() {
    const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
    if (!isLoggedIn) {
        showLoginRequiredModal();
    } else {
        window.location.href = 'cart.html';
    }
}




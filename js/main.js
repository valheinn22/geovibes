let destinations = [];
let currentUser = null;
let bookings = [];

document.addEventListener('DOMContentLoaded', function() {
    loadDestinations();
    checkAuth();
    setupNavigation();
});

function loadDestinations() {
    fetch('data/destinations.json')
        .then(response => response.json())
        .then(data => {
            destinations = data;
            if (document.getElementById('destinations-grid')) {
                renderDestinations(destinations);
            }
            if (document.getElementById('featured-destinations')) {
                renderFeaturedDestinations();
            }
        })
        .catch(error => console.error('Error loading destinations:', error));
}

function renderDestinations(dests) {
    const grid = document.getElementById('destinations-grid');
    if (!grid) return;
    
    if (dests.length === 0) {
        grid.innerHTML = `
            <div style="text-align: center; padding: 60px; grid-column: 1/-1;">
                <i class="fas fa-search" style="font-size: 4rem; color: #ddd;"></i>
                <h3 style="margin-top: 20px; color: #666;">Destinasi tidak ditemukan</h3>
                <p style="color: #999;">Coba gunakan kata kunci lain atau pilih kategori lain</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = dests.map(dest => `
        <div class="destination-card">
            <div class="destination-image">
                <img src="${dest.gambar}" alt="${dest.nama_destinasi}">
                <span class="destination-badge">${dest.kategori}</span>
            </div>
            <div class="destination-content">
                <h3>${dest.nama_destinasi}</h3>
                <p class="destination-location">
                    <i class="fas fa-map-marker-alt"></i> ${dest.lokasi}
                </p>
                <p>${dest.deskripsi.substring(0, 80)}...</p>
                <div class="destination-price">
                    <span class="price">Rp ${formatPrice(dest.harga)}<span>/org</span></span>
                    <a href="booking.html?dest=${dest.id}" class="btn-primary">Pesan</a>
                </div>
            </div>
        </div>
    `).join('');
}

function renderFeaturedDestinations() {
    const grid = document.getElementById('featured-destinations');
    if (!grid) return;
    
    const featured = destinations.slice(0, 8);
    grid.innerHTML = featured.map(dest => `
        <div class="destination-card">
            <div class="destination-image">
                <img src="${dest.gambar}" alt="${dest.nama_destinasi}">
                <span class="destination-badge">${dest.kategori}</span>
            </div>
            <div class="destination-content">
                <h3>${dest.nama_destinasi}</h3>
                <p class="destination-location">
                    <i class="fas fa-map-marker-alt"></i> ${dest.lokasi}
                </p>
                <p>${dest.deskripsi.substring(0, 80)}...</p>
                <div class="destination-price">
                    <span class="price">Rp ${formatPrice(dest.harga)}<span>/org</span></span>
                    <a href="booking.html?dest=${dest.id}" class="btn-primary">Pesan</a>
                </div>
            </div>
        </div>
    `).join('');
}

function formatPrice(price) {
    if (price === 0) return 'Gratis';
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function filterDestinations(category, search) {
    let filtered = destinations;
    
    if (category && category !== 'all') {
        filtered = filtered.filter(d => d.kategori === category);
    }
    
    if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(d => 
            d.nama_destinasi.toLowerCase().includes(searchLower) ||
            d.lokasi.toLowerCase().includes(searchLower)
        );
    }
    
    renderDestinations(filtered);
}

function checkAuth() {
    const user = localStorage.getItem('geovibes_user');
    if (user) {
        currentUser = JSON.parse(user);
        updateAuthUI();
    }
    
    const savedBookings = localStorage.getItem('geovibes_bookings');
    if (savedBookings) {
        bookings = JSON.parse(savedBookings);
    }
}

function updateAuthUI() {
    const authLinks = document.getElementById('auth-links');
    if (!authLinks) return;
    
    if (currentUser) {
        authLinks.innerHTML = `
            <li><a href="dashboard.html">Dashboard</a></li>
            <li><a href="#" onclick="logout()" class="btn-primary">Logout</a></li>
        `;
    } else {
        authLinks.innerHTML = `
            <li><a href="login.html">Login</a></li>
            <li><a href="register.html" class="btn-primary">Daftar</a></li>
        `;
    }
}

function setupNavigation() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
}

function login(email, password) {
    const users = JSON.parse(localStorage.getItem('geovibes_users') || '[]');
    const user = users.find(u => u.email === email);
    
    if (user && user.password === password) {
        currentUser = user;
        localStorage.setItem('geovibes_user', JSON.stringify(user));
        return { success: true };
    }
    return { success: false, message: 'Email atau password salah' };
}

function register(userData) {
    const users = JSON.parse(localStorage.getItem('geovibes_users') || '[]');
    
    if (users.find(u => u.email === userData.email)) {
        return { success: false, message: 'Email sudah terdaftar' };
    }
    
    userData.id = Date.now();
    userData.createdAt = new Date().toISOString();
    users.push(userData);
    localStorage.setItem('geovibes_users', JSON.stringify(users));
    
    currentUser = userData;
    localStorage.setItem('geovibes_user', JSON.stringify(userData));
    
    return { success: true };
}

function logout() {
    currentUser = null;
    localStorage.removeItem('geovibes_user');
    window.location.href = 'index.html';
}

function createBooking(bookingData) {
    const booking = {
        id: Date.now(),
        ...bookingData,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    bookings.push(booking);
    localStorage.setItem('geovibes_bookings', JSON.stringify(bookings));
    
    return { success: true, booking };
}

function getBookingById(id) {
    return bookings.find(b => b.id === parseInt(id));
}

function getUserBookings() {
    if (!currentUser) return [];
    return bookings.filter(b => b.userId === currentUser.id);
}

function getDestinationById(id) {
    return destinations.find(d => d.id === parseInt(id));
}

function showAlert(message, type = 'success') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(alert, container.firstChild);
    
    setTimeout(() => alert.remove(), 3000);
}

function handleFormSubmit(formId, callback) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        const result = callback(data);
        
        if (result.success) {
            showAlert(result.message || 'Berhasil!');
            setTimeout(() => {
                if (result.redirect) {
                    window.location.href = result.redirect;
                }
            }, 1000);
        } else {
            showAlert(result.message, 'error');
        }
    });
}

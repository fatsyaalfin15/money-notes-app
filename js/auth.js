const USERS_KEY = 'money-notes-users';
const CURRENT_USER_KEY = 'money-notes-current-user';

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getUsers() {
    const saved = localStorage.getItem(USERS_KEY);
    return saved ? JSON.parse(saved) : [];
}

function isEmailExists(email) {
    return getUsers().some(user => user.email === email.toLowerCase());
}

// ✅ DIPERBAIKI: Redirect ke main.html
function redirectToMain() {
    window.location.href = 'main.html';
}

// ✅ DIPERBAIKI: Redirect ke index.html (halaman login)
function redirectToLogin() {
    window.location.href = 'index.html';
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// REGISTER
document.getElementById('register-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    
    let valid = true;
    
    document.getElementById('error-name').textContent = '';
    document.getElementById('error-reg-email').textContent = '';
    document.getElementById('error-reg-password').textContent = '';
    
    if (!name) {
        document.getElementById('error-name').textContent = 'Nama wajib diisi';
        valid = false;
    }
    
    if (!email) {
        document.getElementById('error-reg-email').textContent = 'Email wajib diisi';
        valid = false;
    } else if (!isValidEmail(email)) {
        document.getElementById('error-reg-email').textContent = 'Format email tidak valid';
        valid = false;
    } else if (isEmailExists(email)) {
        document.getElementById('error-reg-email').textContent = 'Email sudah terdaftar';
        valid = false;
    }
    
    if (!password) {
        document.getElementById('error-reg-password').textContent = 'Kata sandi wajib diisi';
        valid = false;
    } else if (password.length < 6) {
        document.getElementById('error-reg-password').textContent = 'Kata sandi minimal 6 karakter';
        valid = false;
    }
    
    if (valid) {
        const users = getUsers();
        users.push({
            id: Date.now(),
            name: name,
            email: email.toLowerCase(),
            password: password
        });
        saveUsers(users);
        alert('Pendaftaran berhasil! Silakan login.');
        redirectToLogin(); // ✅ INI YANG DIPERBAIKI!
    }
});

// LOGIN
document.getElementById('login-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    let valid = true;
    
    document.getElementById('error-email').textContent = '';
    document.getElementById('error-password').textContent = '';
    
    if (!email) {
        document.getElementById('error-email').textContent = 'Email wajib diisi';
        valid = false;
    } else if (!isValidEmail(email)) {
        document.getElementById('error-email').textContent = 'Format email tidak valid';
        valid = false;
    }
    
    if (!password) {
        document.getElementById('error-password').textContent = 'Kata sandi wajib diisi';
        valid = false;
    }
    
    if (valid) {
        const users = getUsers();
        const user = users.find(u => 
            u.email === email.toLowerCase() && u.password === password
        );
        
        if (user) {
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({
                id: user.id,
                name: user.name,
                email: user.email
            }));
            redirectToMain(); // ✅ Redirect ke main.html
        } else {
            document.getElementById('error-password').textContent = 'Email atau kata sandi salah';
        }
    }
});

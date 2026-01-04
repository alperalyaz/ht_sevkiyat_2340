// Authentication and User Management

const Auth = {
    currentUser: null,
    currentUserEmail: null,
    
    // Initialize authentication
    init() {
        this.loadUser();
        this.setupEventListeners();
        this.loadPersonel();
    },
    
    // Load personel list for dropdown
    async loadPersonel() {
        try {
            // Check if CONFIG is set
            if (!CONFIG || CONFIG.SHEET_ID === 'YOUR_SHEET_ID_HERE' || CONFIG.API_KEY === 'YOUR_API_KEY_HERE') {
                // Silently use hardcoded personel list as fallback
                // CONFIG ayarlanmamışsa hardcoded liste kullanılacak
                this.loadHardcodedPersonel();
                return;
            }
            
            const personel = await SheetsAPI.getPersonel();
            const userSelect = document.getElementById('userSelect');
            const dagitimciSelect = document.getElementById('dagitimci');
            
            if (!userSelect) {
                console.error('userSelect elementi bulunamadı');
                return;
            }
            
            // Clear existing options (except first option)
            userSelect.innerHTML = '<option value="">-- Kullanıcı Seçiniz --</option>';
            
            if (dagitimciSelect) {
                dagitimciSelect.innerHTML = '<option value="">-- Dağıtımcı Seçiniz --</option>';
            }
            
            personel.forEach(person => {
                if (person.Aktif === 'TRUE' || person.Aktif === true || person.Aktif === 'true') {
                    // User select
                    const option1 = document.createElement('option');
                    option1.value = person.İsim;
                    option1.textContent = person.İsim;
                    userSelect.appendChild(option1);
                    
                    // Dağıtımcı select (if exists)
                    if (dagitimciSelect) {
                        const option2 = document.createElement('option');
                        option2.value = person.İsim;
                        option2.textContent = person.İsim;
                        dagitimciSelect.appendChild(option2);
                    }
                }
            });
        } catch (error) {
            console.error('Personel yüklenirken hata:', error);
            // Fallback to hardcoded list
            this.loadHardcodedPersonel();
        }
    },
    
    // Load hardcoded personel list as fallback
    loadHardcodedPersonel() {
        const hardcodedPersonel = [
            { İsim: 'NUR YILDIZ DURAN', Aktif: true },
            { İsim: 'EMRE İRİŞ', Aktif: true },
            { İsim: 'FERİDE BEYTEMİR', Aktif: true },
            { İsim: 'ÖZKAN UMUT DEDEK', Aktif: true },
            { İsim: 'HASAN HÜSEYİN YILMAZ', Aktif: true },
            { İsim: 'ALİ AKAGÜNDÜZ', Aktif: true },
            { İsim: 'AYNUR AĞIR', Aktif: true },
            { İsim: 'SERKAN YAVUZ MERCAN', Aktif: true },
            { İsim: 'SIDIKA KARAKAYA', Aktif: true }
        ];
        
        const userSelect = document.getElementById('userSelect');
        const dagitimciSelect = document.getElementById('dagitimci');
        
        if (userSelect) {
            userSelect.innerHTML = '<option value="">-- Kullanıcı Seçiniz --</option>';
            hardcodedPersonel.forEach(person => {
                const option1 = document.createElement('option');
                option1.value = person.İsim;
                option1.textContent = person.İsim;
                userSelect.appendChild(option1);
            });
        }
        
        if (dagitimciSelect) {
            dagitimciSelect.innerHTML = '<option value="">-- Dağıtımcı Seçiniz --</option>';
            hardcodedPersonel.forEach(person => {
                const option2 = document.createElement('option');
                option2.value = person.İsim;
                option2.textContent = person.İsim;
                dagitimciSelect.appendChild(option2);
            });
        }
    },
    
    // Setup event listeners
    setupEventListeners() {
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const userSelect = document.getElementById('userSelect');
        
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.login());
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
        
        // Enter key support for login
        const userEmailInput = document.getElementById('userEmail');
        if (userSelect) {
            userSelect.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.login();
                }
            });
        }
        if (userEmailInput) {
            userEmailInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.login();
                }
            });
        }
    },
    
    // Login
    async login() {
        const selectedUser = document.getElementById('userSelect').value;
        const userEmail = document.getElementById('userEmail').value;
        
        if (!selectedUser) {
            alert('Lütfen bir kullanıcı seçiniz!');
            return;
        }
        
        if (!userEmail) {
            alert('Lütfen mail adresinizi giriniz!');
            return;
        }
        
        // Mail adresini doğrula (Personel tablosundan kontrol et)
        // Google Sheets gizli olduğu için sadece mail kontrolü yeterli
        try {
            const userInfo = await SheetsAPI.webAppRequest('verifyEmail', { email: userEmail });
            if (!userInfo.isValid) {
                alert(userInfo.error || 'Bu mail adresi ile erişim yetkiniz yok. Lütfen Personel tablosundaki mail adresinizi giriniz.');
                return;
            }
            
            // Mail adresi geçerli, giriş yap
            this.currentUser = selectedUser;
            this.currentUserEmail = userEmail;
            localStorage.setItem('currentUser', selectedUser);
            localStorage.setItem('currentUserEmail', userEmail);
            this.showDashboard();
        } catch (error) {
            console.error('Giriş hatası:', error);
            alert('Giriş yapılamadı. Lütfen tekrar deneyiniz.');
        }
    },
    
    // Logout
    logout() {
        this.currentUser = null;
        this.currentUserEmail = null;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentUserEmail');
        this.showLogin();
    },
    
    // Load user from localStorage
    loadUser() {
        const savedUser = localStorage.getItem('currentUser');
        const savedEmail = localStorage.getItem('currentUserEmail');
        if (savedUser && savedEmail) {
            this.currentUser = savedUser;
            this.currentUserEmail = savedEmail;
            this.showDashboard();
        } else {
            this.showLogin();
        }
    },
    
    // Show login screen
    showLogin() {
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('dashboard').classList.add('hidden');
        // Mail alanını temizle
        const userEmailInput = document.getElementById('userEmail');
        if (userEmailInput) {
            userEmailInput.value = '';
        }
    },
    
    // Show dashboard
    showDashboard() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        // Kullanıcı adı ve mail adresini göster
        const userDisplay = this.currentUser + (this.currentUserEmail ? ` (${this.currentUserEmail})` : '');
        document.getElementById('currentUser').textContent = userDisplay;
        
        // Load data when dashboard is shown
        if (typeof App !== 'undefined') {
            App.loadData();
        }
    },
    
    // Get current user
    getCurrentUser() {
        return this.currentUser;
    },
    
    // Get current user email
    getCurrentUserEmail() {
        return this.currentUserEmail || localStorage.getItem('currentUserEmail');
    },
    
    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    }
};


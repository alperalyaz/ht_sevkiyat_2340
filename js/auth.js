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
    
    // Load personel list (sadece dağıtımcı dropdown için, güvenlik için kullanıcı isimleri gösterilmiyor)
    async loadPersonel() {
        try {
            // Check if CONFIG is set
            if (!CONFIG || CONFIG.SHEET_ID === 'YOUR_SHEET_ID_HERE' || CONFIG.API_KEY === 'YOUR_API_KEY_HERE') {
                // Silently use hardcoded personel list as fallback
                this.loadHardcodedPersonel();
                return;
            }
            
            const personel = await SheetsAPI.getPersonel();
            const dagitimciSelect = document.getElementById('dagitimci');
            
            // Sadece dağıtımcı dropdown'u doldur (kullanıcı seçimi yok artık)
            if (dagitimciSelect) {
                dagitimciSelect.innerHTML = '<option value="">-- Dağıtımcı Seçiniz --</option>';
                
                personel.forEach(person => {
                    if (person.Aktif === 'TRUE' || person.Aktif === true || person.Aktif === 'true') {
                        const option = document.createElement('option');
                        option.value = person.İsim;
                        option.textContent = person.İsim;
                        dagitimciSelect.appendChild(option);
                    }
                });
            }
        } catch (error) {
            console.error('Personel yüklenirken hata:', error);
            // Fallback to hardcoded list
            this.loadHardcodedPersonel();
        }
    },
    
    // Load hardcoded personel list as fallback (sadece dağıtımcı için)
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
        
        const dagitimciSelect = document.getElementById('dagitimci');
        
        if (dagitimciSelect) {
            dagitimciSelect.innerHTML = '<option value="">-- Dağıtımcı Seçiniz --</option>';
            hardcodedPersonel.forEach(person => {
                const option = document.createElement('option');
                option.value = person.İsim;
                option.textContent = person.İsim;
                dagitimciSelect.appendChild(option);
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
        const userEmail = document.getElementById('userEmail').value;
        
        if (!userEmail) {
            alert('Lütfen mail adresinizi giriniz!');
            return;
        }
        
        // Mail adresini doğrula (Personel tablosundan kontrol et)
        // Google Sheets gizli olduğu için sadece mail kontrolü yeterli
        try {
            const userInfo = await SheetsAPI.webAppRequest('verifyEmail', { email: userEmail });
            if (!userInfo.isValid) {
                alert(userInfo.error || 'Bu mail adresi ile erişim yetkiniz yok.');
                return;
            }
            
            // Mail adresinden kullanıcı adını al (mail'in @ öncesi kısmı veya tam mail)
            // Personel tablosundan isim almak için getPersonel kullanabiliriz ama güvenlik için sadece mail gösterelim
            const displayName = userEmail.split('@')[0]; // Mail'in @ öncesi kısmı
            
            // Mail adresi geçerli, giriş yap
            this.currentUser = displayName; // Mail'in @ öncesi kısmını kullanıcı adı olarak göster
            this.currentUserEmail = userEmail;
            localStorage.setItem('currentUser', displayName);
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


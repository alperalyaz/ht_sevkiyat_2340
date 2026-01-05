// Google Sheets API Configuration
// NOT: Bu dosya .gitignore'a eklenmelidir!

const CONFIG = {
    // Google Sheets API Configuration
    // Service Account JSON key'i buraya yapıştırılacak veya environment variable olarak kullanılacak
    // Production'da güvenlik için environment variable kullanın!
    
    // Google Sheet ID (Sheet URL'den alınır: https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit)
    SHEET_ID: '1hU_I2xrJt28tsum7TkmzOMZJq5LaI67v17dU65S5wjY',
    
    // Service Account Email (Google Cloud Console'dan alınır)
    SERVICE_ACCOUNT_EMAIL: 'YOUR_SERVICE_ACCOUNT_EMAIL@project-id.iam.gserviceaccount.com',
    
    // API Key (Google Cloud Console'dan alınır - OAuth için)
    // NOT: API Key yazma işlemleri için yeterli değil, sadece okuma için kullanılabilir
    API_KEY: 'AIzaSyBT8BMiBKiJMqmi7rjAdiGlHT70bAwf9M4',
    
    // Google Apps Script Web App URL (yazma işlemleri için)
    // Bu URL'yi Google Apps Script'te web app deploy ettikten sonra buraya yapıştırın
    WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbwkNJspUg8staJR-WumM5oZJHipSHXujR-qGcJ0AVtWYd30Q3vGIFa8W-COJ7kaoSEuKA/exec',
    
    // Sheet Names
    SHEETS: {
        SEVKIYATLAR: 'Sevkiyatlar',
        PERSONEL: 'Personel'
    },
    
    // App URL (mail hatırlatmaları için)
    APP_URL: 'https://alperalyaz.github.io/ht_sevkiyat_2340',
    
    // Pagination
    RECORDS_PER_PAGE: 20,
    
    // Performance Optimization
    // Son kaç kayıt yüklenecek (0 = tüm kayıtlar, önerilen: 2000-5000)
    MAX_RECORDS_TO_LOAD: 2000,
    
    // Cache ayarları
    CACHE_ENABLED: true,
    CACHE_DURATION_MINUTES: 5 // 5 dakika cache
};

// Service Account JSON Key (güvenlik için ayrı dosyada tutulmalı)
// Bu dosya .gitignore'a eklenmelidir!
// const SERVICE_ACCOUNT_KEY = { ... };


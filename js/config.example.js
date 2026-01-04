// Google Sheets API Configuration - Example
// Bu dosyayı config.js olarak kopyalayın ve değerleri doldurun

const CONFIG = {
    // Google Sheet ID (Sheet URL'den alınır: https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit)
    SHEET_ID: 'YOUR_SHEET_ID_HERE',
    
    // Service Account Email (Google Cloud Console'dan alınır)
    SERVICE_ACCOUNT_EMAIL: 'YOUR_SERVICE_ACCOUNT_EMAIL@project-id.iam.gserviceaccount.com',
    
    // API Key (Google Cloud Console'dan alınır)
    API_KEY: 'YOUR_API_KEY_HERE',
    
    // Sheet Names
    SHEETS: {
        SEVKIYATLAR: 'Sevkiyatlar',
        PERSONEL: 'Personel'
    },
    
    // App URL (mail hatırlatmaları için)
    APP_URL: 'https://your-domain.com',
    
    // Pagination
    RECORDS_PER_PAGE: 20
};


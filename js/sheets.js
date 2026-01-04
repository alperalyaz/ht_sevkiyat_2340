// Google Sheets API Integration

const SheetsAPI = {
    // Use Web App URL if available, otherwise use direct API
    useWebApp() {
        return CONFIG.WEB_APP_URL && CONFIG.WEB_APP_URL !== 'YOUR_WEB_APP_URL_HERE';
    },
    
    // Base URL for Google Sheets API
    getBaseUrl() {
        return `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}`;
    },
    
    // Web App API call
    async webAppRequest(action, data = {}) {
        if (!this.useWebApp()) {
            throw new Error('Web App URL ayarlanmamış. Lütfen Google Apps Script\'te web app deploy edin ve URL\'yi CONFIG\'e ekleyin.');
        }
        
        try {
            // Use text/plain to avoid CORS preflight (Google Apps Script workaround)
            const response = await fetch(CONFIG.WEB_APP_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    action: action,
                    ...data
                })
            });
            
            // Response'u text olarak al (bazen JSON parse hatası olabilir)
            const responseText = await response.text();
            
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (e) {
                // Eğer JSON değilse, HTML hata sayfası veya başka bir hata olabilir
                console.error('Web App Response (text):', responseText);
                throw new Error('Web App yanıtı geçersiz. Web App\'in doğru deploy edildiğinden ve yetkilendirildiğinden emin olun. Yanıt: ' + responseText.substring(0, 200));
            }
            
            if (!result.success) {
                throw new Error(result.error || 'Web App hatası');
            }
            
            return result.data;
        } catch (error) {
            console.error('Web App Request Error:', error);
            console.error('Action:', action);
            console.error('Data:', data);
            console.error('URL:', CONFIG.WEB_APP_URL);
            
            // Daha açıklayıcı hata mesajı
            if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
                throw new Error('Web App\'e bağlanılamıyor. Lütfen:\n1. Web App URL\'inin doğru olduğundan emin olun\n2. Web App\'in "Anyone" veya "Anyone with Google account" olarak deploy edildiğinden emin olun\n3. Web App\'in yetkilendirildiğinden emin olun');
            }
            throw error;
        }
    },
    
    // Get authorization header
    // NOT: Bu basit bir örnek. Production'da OAuth2 veya Service Account kullanılmalı!
    // Google Sheets API için authentication gereklidir.
    // Bu örnekte, public sheet veya API key kullanımı varsayılmıştır.
    // Gerçek uygulamada Google OAuth2 veya Service Account JSON key kullanılmalıdır.
    
    async makeRequest(endpoint, options = {}) {
        // Check if CONFIG is properly set
        if (!CONFIG || !CONFIG.SHEET_ID || CONFIG.SHEET_ID === 'YOUR_SHEET_ID_HERE') {
            throw new Error('Google Sheets API yapılandırması eksik. Lütfen js/config.js dosyasında SHEET_ID değerini girin.');
        }
        
        if (!CONFIG.API_KEY || CONFIG.API_KEY === 'YOUR_API_KEY_HERE') {
            throw new Error('Google Sheets API yapılandırması eksik. Lütfen js/config.js dosyasında API_KEY değerini girin.');
        }
        
        const url = `${this.getBaseUrl()}${endpoint}${endpoint.includes('?') ? '&' : '?'}key=${CONFIG.API_KEY}`;
        
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `API Error: ${response.status} ${response.statusText}`;
                
                try {
                    const errorJson = JSON.parse(errorText);
                    if (errorJson.error && errorJson.error.message) {
                        errorMessage = errorJson.error.message;
                    }
                } catch (e) {
                    // If not JSON, use the text
                    if (errorText) {
                        errorMessage += ` - ${errorText}`;
                    }
                }
                
                throw new Error(errorMessage);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Request Error:', error);
            
            // Re-throw with more context
            if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
                throw new Error('CORS Hatası: Tarayıcıdan Google Sheets API\'ye erişim engelleniyor. Google Cloud Console\'da API Key kısıtlamalarını kaldırın veya backend proxy kullanın.');
            }
            
            // API hata mesajlarını daha anlaşılır hale getir
            if (error.message) {
                if (error.message.includes('403')) {
                    throw new Error('Yetki Hatası (403): API Key\'in bu Sheet\'e erişim yetkisi yok. Sheet\'i herkese açık yapın veya Service Account kullanın.');
                }
                if (error.message.includes('401')) {
                    throw new Error('Kimlik Doğrulama Hatası (401): API Key geçersiz veya Google Sheets API etkinleştirilmemiş.');
                }
                if (error.message.includes('400')) {
                    throw new Error('İstek Hatası (400): Sheet yapısı hatalı olabilir. "Sevkiyatlar" sheet\'inin başlık satırını kontrol edin.');
                }
            }
            
            throw error;
        }
    },
    
    // Get all records from Sevkiyatlar sheet
    async getSevkiyatlar() {
        try {
            // Use Web App if available (more reliable)
            if (this.useWebApp()) {
                return await this.webAppRequest('getSevkiyatlar');
            }
            
            // Fallback to direct API (read-only)
            const range = `${CONFIG.SHEETS.SEVKIYATLAR}!A:M`;
            const response = await this.makeRequest(`/values/${encodeURIComponent(range)}`);
            
            if (!response.values || response.values.length < 2) {
                return [];
            }
            
            // First row is headers
            const headers = response.values[0];
            const rows = response.values.slice(1);
            
            // Convert to objects
            return rows.map((row, index) => {
                const record = {
                    rowIndex: index + 2 // +2 because of header row and 1-based indexing
                };
                
                headers.forEach((header, colIndex) => {
                    const colLetter = this.numberToColumnLetter(colIndex);
                    record[header] = row[colIndex] || '';
                    record[`_col_${colLetter}`] = colIndex; // Store column index
                });
                
                return record;
            });
        } catch (error) {
            console.error('Sevkiyatlar yüklenirken hata:', error);
            throw error;
        }
    },
    
    // Get personel list
    async getPersonel() {
        try {
            // Use Web App if available
            if (this.useWebApp()) {
                return await this.webAppRequest('getPersonel');
            }
            
            // Fallback to direct API (read-only)
            const range = `${CONFIG.SHEETS.PERSONEL}!A:C`;
            const response = await this.makeRequest(`/values/${encodeURIComponent(range)}`);
            
            if (!response.values || response.values.length < 2) {
                return [];
            }
            
            const headers = response.values[0];
            const rows = response.values.slice(1);
            
            return rows.map(row => {
                const person = {};
                headers.forEach((header, colIndex) => {
                    person[header] = row[colIndex] || '';
                });
                return person;
            });
        } catch (error) {
            console.error('Personel yüklenirken hata:', error);
            throw error;
        }
    },
    
    // Add new record
    async addRecord(recordData) {
        try {
            // Must use Web App for write operations
            if (!this.useWebApp()) {
                throw new Error('Yazma işlemleri için Web App URL gerekli. Lütfen Google Apps Script\'te web app deploy edin.');
            }
            
            // Add current user to record data
            recordData.kaydiGiren = Auth.getCurrentUser();
            const userEmail = Auth.getCurrentUserEmail();
            
            return await this.webAppRequest('addRecord', { recordData, email: userEmail });
        } catch (error) {
            console.error('Kayıt eklenirken hata:', error);
            throw error;
        }
    },
    
    // Update record
    async updateRecord(rowIndex, recordData) {
        try {
            // Must use Web App for write operations
            if (!this.useWebApp()) {
                throw new Error('Yazma işlemleri için Web App URL gerekli. Lütfen Google Apps Script\'te web app deploy edin.');
            }
            
            const userEmail = Auth.getCurrentUserEmail();
            return await this.webAppRequest('updateRecord', { 
                rowIndex: rowIndex,
                recordData: recordData,
                email: userEmail
            });
        } catch (error) {
            console.error('Kayıt güncellenirken hata:', error);
            throw error;
        }
    },
    
    // Delete record
    async deleteRecord(rowIndex) {
        try {
            // Must use Web App for write operations
            if (!this.useWebApp()) {
                throw new Error('Yazma işlemleri için Web App URL gerekli. Lütfen Google Apps Script\'te web app deploy edin.');
            }
            
            const userEmail = Auth.getCurrentUserEmail();
            return await this.webAppRequest('deleteRecord', { rowIndex: rowIndex, email: userEmail });
        } catch (error) {
            console.error('Kayıt silinirken hata:', error);
            throw error;
        }
    },
    
    // Update status
    async updateStatus(rowIndex, newStatus) {
        try {
            // Must use Web App for write operations
            if (!this.useWebApp()) {
                throw new Error('Yazma işlemleri için Web App URL gerekli. Lütfen Google Apps Script\'te web app deploy edin.');
            }
            
            const userEmail = Auth.getCurrentUserEmail();
            return await this.webAppRequest('updateStatus', { 
                rowIndex: rowIndex,
                newStatus: newStatus,
                email: userEmail
            });
        } catch (error) {
            console.error('Durum güncellenirken hata:', error);
            throw error;
        }
    },
    
    // Helper: Convert column number to letter (1 -> A, 2 -> B, etc.)
    numberToColumnLetter(num) {
        let result = '';
        while (num >= 0) {
            result = String.fromCharCode(65 + (num % 26)) + result;
            num = Math.floor(num / 26) - 1;
        }
        return result;
    },
    
    // Get sheet ID by name (requires metadata)
    async getSheetId(sheetName) {
        try {
            // Get spreadsheet metadata
            const response = await this.makeRequest('?fields=sheets.properties');
            const sheet = response.sheets.find(s => s.properties.title === sheetName);
            return sheet ? sheet.properties.sheetId : 0;
        } catch (error) {
            console.error('Sheet ID alınırken hata:', error);
            // Fallback: return 0 (first sheet)
            return 0;
        }
    }
};


// Main Application Logic

const App = {
    records: [],
    
    // Initialize application
    init() {
        // Wait for auth to be ready
        if (Auth.isLoggedIn()) {
            this.loadData();
        }
    },
    
    // Load all data
    async loadData() {
        try {
            // Check if CONFIG is set
            if (!CONFIG || CONFIG.SHEET_ID === 'YOUR_SHEET_ID_HERE' || CONFIG.API_KEY === 'YOUR_API_KEY_HERE') {
                // Show user-friendly message only once
                const tbody = document.getElementById('recordsTableBody');
                if (tbody) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="9" class="px-6 py-4 text-center">
                                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <p class="text-yellow-800 font-semibold mb-2">⚠️ Yapılandırma Gerekli</p>
                                    <p class="text-yellow-700 text-sm">
                                        Lütfen <code class="bg-yellow-100 px-2 py-1 rounded">js/config.js</code> dosyasını düzenleyin ve 
                                        <strong>SHEET_ID</strong> ile <strong>API_KEY</strong> değerlerini girin.
                                    </p>
                                    <p class="text-yellow-600 text-xs mt-2">
                                        Detaylı kurulum talimatları için README.md dosyasına bakın.
                                    </p>
                                </div>
                            </td>
                        </tr>
                    `;
                }
                return;
            }
            
            UI.showLoading('recordsTableBody');
            UI.showLoading('todayShipments');
            UI.showLoading('overdueShipments');
            
            this.records = await SheetsAPI.getSevkiyatlar();
            
            // Sort by date (newest first), then by ID (newest first) for same dates
            this.records.sort((a, b) => {
                const dateA = new Date(a.Tarih || 0);
                const dateB = new Date(b.Tarih || 0);
                const dateDiff = dateB - dateA;
                
                // If dates are the same, sort by ID (newest first - descending)
                if (dateDiff === 0) {
                    const idA = a.ID || '';
                    const idB = b.ID || '';
                    return idB.localeCompare(idA);
                }
                
                return dateDiff;
            });
            
            // Render UI
            UI.renderTodayShipments(this.records);
            UI.renderOverdueShipments(this.records);
            UI.renderRecordsTable(this.records);
            
        } catch (error) {
            console.error('Veri yüklenirken hata:', error);
            const errorMessage = error.message || 'Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.';
            UI.showError(errorMessage);
            
            // Show empty state
            const tbody = document.getElementById('recordsTableBody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="9" class="px-6 py-4 text-center text-red-500">Veri yüklenemedi. Lütfen CONFIG ayarlarını kontrol edin.</td></tr>';
            }
        }
    },
    
    // Handle form submit
    async handleFormSubmit() {
        try {
            const formData = {
                tarih: document.getElementById('tarih').value,
                kaynak: document.getElementById('kaynak').value,
                hedef: document.getElementById('hedef').value,
                hedefBolge: document.getElementById('hedefBolge').value,
                aciklama: document.getElementById('aciklama').value,
                kaynakMuhatap: document.getElementById('kaynakMuhatap').value,
                hedefMuhatap: document.getElementById('hedefMuhatap').value,
                dagitimci: document.getElementById('dagitimci').value
            };
            
            const recordId = document.getElementById('recordId').value;
            
            if (recordId) {
                // Update existing record
                await SheetsAPI.updateRecord(parseInt(recordId), formData);
                UI.showSuccess('Kayıt güncellendi');
            } else {
                // Add new record
                await SheetsAPI.addRecord(formData);
                UI.showSuccess('Kayıt eklendi');
            }
            
            UI.closeModal();
            await this.loadData();
            
        } catch (error) {
            console.error('Form gönderilirken hata:', error);
            
            // Daha detaylı hata mesajı göster
            let errorMessage = 'Kayıt kaydedilirken bir hata oluştu.';
            
            if (error.message) {
                errorMessage += '\n\nDetay: ' + error.message;
                
                // CORS hatası kontrolü
                if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('CORS')) {
                    errorMessage += '\n\nBu bir CORS (Cross-Origin) hatası. Çözüm:\n';
                    errorMessage += '1. Google Cloud Console > Credentials > API Key\n';
                    errorMessage += '2. "Application restrictions" kısmını "None" yapın\n';
                    errorMessage += '3. "SAVE" butonuna tıklayın';
                }
                
                // API Key hatası kontrolü
                if (error.message.includes('API key') || error.message.includes('403') || error.message.includes('401')) {
                    errorMessage += '\n\nAPI Key sorunu. Kontrol edin:\n';
                    errorMessage += '1. Google Sheets API etkinleştirildi mi?\n';
                    errorMessage += '2. API Key doğru mu?\n';
                    errorMessage += '3. Sheet\'e erişim yetkisi var mı?';
                }
            }
            
            UI.showError(errorMessage);
        }
    },
    
    // Complete record
    async completeRecord(rowIndex) {
        if (!confirm('Bu sevkiyatı tamamlandı olarak işaretlemek istediğinize emin misiniz?')) {
            return;
        }
        
        try {
            await SheetsAPI.updateStatus(rowIndex, 'Tamamlandı');
            UI.showSuccess('Sevkiyat tamamlandı olarak işaretlendi');
            await this.loadData();
        } catch (error) {
            console.error('Durum güncellenirken hata:', error);
            UI.showError('Durum güncellenirken bir hata oluştu.');
        }
    },
    
    // Edit record
    editRecord(rowIndex) {
        const record = this.records.find(r => r.rowIndex === rowIndex);
        if (record) {
            UI.openEditModal(record);
        } else {
            UI.showError('Kayıt bulunamadı.');
        }
    },
    
    // Delete record
    async deleteRecord(rowIndex) {
        if (!confirm('Bu kaydı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
            return;
        }
        
        try {
            await SheetsAPI.deleteRecord(rowIndex);
            UI.showSuccess('Kayıt silindi');
            await this.loadData();
        } catch (error) {
            console.error('Kayıt silinirken hata:', error);
            UI.showError('Kayıt silinirken bir hata oluştu.');
        }
    },
    
    // Check if user can edit record
    canEditRecord(record) {
        const currentUserName = Auth.getCurrentUserName();
        // Hem tam isim hem de eski format (email kısa adı) ile karşılaştır
        const currentUser = Auth.getCurrentUser();
        return record['Kaydı Giren'] === currentUserName || record['Kaydı Giren'] === currentUser;
    },
    
    // Check if user can delete record
    canDeleteRecord(record) {
        const currentUserName = Auth.getCurrentUserName();
        // Hem tam isim hem de eski format (email kısa adı) ile karşılaştır
        const currentUser = Auth.getCurrentUser();
        return record['Kaydı Giren'] === currentUserName || record['Kaydı Giren'] === currentUser;
    },
    
    // Check if user can complete record
    canCompleteRecord(record) {
        const currentUserName = Auth.getCurrentUserName();
        const kaydiGiren = record['Kaydı Giren'];
        const dagitimci = record.Dağıtımcı;
        
        // Kaydı giren veya dağıtımcı tamamlandı işaretleyebilir
        // Hem tam isim hem de eski format (email kısa adı) ile karşılaştır
        return kaydiGiren === currentUserName || kaydiGiren === Auth.getCurrentUser() || dagitimci === currentUserName;
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
    UI.init();
    App.init();
});


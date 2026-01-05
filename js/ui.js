// UI Management and DOM Manipulation

const UI = {
    currentPage: 1,
    recordsPerPage: (typeof CONFIG !== 'undefined' && CONFIG.RECORDS_PER_PAGE) ? CONFIG.RECORDS_PER_PAGE : 20,
    allRecords: [],
    
    // Initialize UI
    init() {
        this.setupEventListeners();
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Modal controls
        const addRecordBtn = document.getElementById('addRecordBtn');
        const closeModal = document.getElementById('closeModal');
        const cancelBtn = document.getElementById('cancelBtn');
        const recordModal = document.getElementById('recordModal');
        const recordForm = document.getElementById('recordForm');
        const tarih = document.getElementById('tarih');
        const printBtn = document.getElementById('printBtn');
        
        if (addRecordBtn) {
            addRecordBtn.addEventListener('click', () => this.openAddModal());
        }
        
        if (printBtn) {
            printBtn.addEventListener('click', () => this.printPendingRecords());
        }
        
        if (closeModal) {
            closeModal.addEventListener('click', () => this.closeModal());
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeModal());
        }
        
        // Click outside modal to close
        if (recordModal) {
            recordModal.addEventListener('click', (e) => {
                if (e.target.id === 'recordModal') {
                    this.closeModal();
                }
            });
        }
        
        // Form submit
        if (recordForm) {
            recordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                App.handleFormSubmit();
            });
        }
        
        // Set today's date as default (Yerel saat)
        if (tarih) {
            const now = new Date();
            const yil = now.getFullYear();
            const ay = (now.getMonth() + 1).toString().padStart(2, '0');
            const gun = now.getDate().toString().padStart(2, '0');
            const today = `${yil}-${ay}-${gun}`;
            tarih.value = today;
        }
    },
    
    // Open add record modal
    openAddModal() {
        const modalTitle = document.getElementById('modalTitle');
        const recordForm = document.getElementById('recordForm');
        const recordId = document.getElementById('recordId');
        const tarih = document.getElementById('tarih');
        const recordModal = document.getElementById('recordModal');
        
        if (!recordModal) {
            console.error('Modal elementi bulunamadı');
            return;
        }
        
        if (modalTitle) modalTitle.textContent = 'Yeni Kayıt Ekle';
        if (recordForm) recordForm.reset();
        if (recordId) recordId.value = '';
        
        // Set today's date (Yerel saat)
        if (tarih) {
            const now = new Date();
            const yil = now.getFullYear();
            const ay = (now.getMonth() + 1).toString().padStart(2, '0');
            const gun = now.getDate().toString().padStart(2, '0');
            const today = `${yil}-${ay}-${gun}`;
            tarih.value = today;
        }
        
        recordModal.classList.remove('hidden');
    },
    
    // Open edit record modal
    openEditModal(record) {
        const modalTitle = document.getElementById('modalTitle');
        const recordId = document.getElementById('recordId');
        const tarih = document.getElementById('tarih');
        const kaynak = document.getElementById('kaynak');
        const hedef = document.getElementById('hedef');
        const hedefBolge = document.getElementById('hedefBolge');
        const aciklama = document.getElementById('aciklama');
        const kaynakMuhatap = document.getElementById('kaynakMuhatap');
        const hedefMuhatap = document.getElementById('hedefMuhatap');
        const dagitimci = document.getElementById('dagitimci');
        const recordModal = document.getElementById('recordModal');
        
        if (!recordModal) {
            console.error('Modal elementi bulunamadı');
            return;
        }
        
        if (modalTitle) modalTitle.textContent = 'Kayıt Düzenle';
        if (recordId) recordId.value = record.rowIndex || '';
        
        // Fill form with record data
        if (tarih) tarih.value = record.Tarih || '';
        if (kaynak) kaynak.value = record.Kaynak || '';
        if (hedef) hedef.value = record.Hedef || '';
        if (hedefBolge) hedefBolge.value = record['Hedef Bölge'] || '';
        if (aciklama) aciklama.value = record.Açıklama || '';
        if (kaynakMuhatap) kaynakMuhatap.value = record['Kaynak Muhatap'] || '';
        if (hedefMuhatap) hedefMuhatap.value = record['Hedef Muhatap'] || '';
        if (dagitimci) dagitimci.value = record.Dağıtımcı || '';
        
        recordModal.classList.remove('hidden');
    },
    
    // Close modal
    closeModal() {
        const recordModal = document.getElementById('recordModal');
        if (recordModal) {
            recordModal.classList.add('hidden');
        }
    },
    
    // Render today's shipments
    renderTodayShipments(records) {
        const container = document.getElementById('todayShipments');
        // Bugünün tarihini al (Yerel saat)
        const now = new Date();
        const yil = now.getFullYear();
        const ay = (now.getMonth() + 1).toString().padStart(2, '0');
        const gun = now.getDate().toString().padStart(2, '0');
        const today = `${yil}-${ay}-${gun}`;
        
        // Helper function to normalize date
        const normalizeDate = (dateValue) => {
            if (!dateValue) return null;
            
            // If it's already in YYYY-MM-DD format
            if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                return dateValue;
            }
            
            // Try to parse as Date
            try {
                const date = new Date(dateValue);
                if (!isNaN(date.getTime())) {
                    const year = date.getFullYear();
                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                    const day = date.getDate().toString().padStart(2, '0');
                    return `${year}-${month}-${day}`;
                }
            } catch (e) {
                // If parsing fails, try to extract date from string
                const dateMatch = String(dateValue).match(/(\d{4})-(\d{2})-(\d{2})/);
                if (dateMatch) {
                    return `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
                }
            }
            
            return null;
        };
        
        const todayRecords = records.filter(r => {
            const normalizedDate = normalizeDate(r.Tarih);
            return normalizedDate === today && r.Durum !== 'Tamamlandı' && r.Durum !== 'İptal';
        });
        
        if (todayRecords.length === 0) {
            container.innerHTML = '<p class="text-gray-500">Bugün için sevkiyat bulunmamaktadır.</p>';
            return;
        }
        
        container.innerHTML = todayRecords.map(record => `
            <div class="record-card">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-semibold text-gray-800">${record.Kaynak || ''} → ${record.Hedef || ''}</p>
                        <p class="text-sm text-gray-600">${record['Hedef Bölge'] || ''}</p>
                        <p class="text-xs text-gray-500 mt-1">Dağıtımcı: ${record.Dağıtımcı || 'Atanmamış'}</p>
                    </div>
                    <span class="status-badge status-${record.Durum?.toLowerCase() || 'bekliyor'}">${record.Durum || 'Bekliyor'}</span>
                </div>
            </div>
        `).join('');
    },
    
    // Tarih formatını Türkçe olarak göster (05 Ocak 2026 Pazartesi gibi)
    formatSadeceTarih(tarihStr) {
        if (!tarihStr) return '';
        try {
            const tarihString = String(tarihStr);
            let tarihObj = null;
            
            // ISO formatında gelirse (2026-01-05T21:00:00.000Z gibi) - sadece tarih kısmını al
            if (tarihString.includes('T')) {
                const tarihPart = tarihString.split('T')[0]; // "2026-01-05"
                const [yil, ay, gun] = tarihPart.split('-').map(Number);
                tarihObj = new Date(yil, ay - 1, gun);
            }
            // YYYY-MM-DD formatındaysa
            else if (tarihString.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const [yil, ay, gun] = tarihString.split('-').map(Number);
                tarihObj = new Date(yil, ay - 1, gun);
            }
            // Diğer formatlar için Date objesi oluştur
            else {
                tarihObj = new Date(tarihStr);
                if (isNaN(tarihObj.getTime())) {
                    return tarihString;
                }
            }
            
            // Türkçe format: 05 Ocak 2026 Pazartesi
            const ayIsimleri = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
            const gunIsimleri = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
            
            const gun = tarihObj.getDate().toString().padStart(2, '0');
            const ay = ayIsimleri[tarihObj.getMonth()];
            const yil = tarihObj.getFullYear();
            const gunAdi = gunIsimleri[tarihObj.getDay()];
            
            return `${gun} ${ay} ${yil} ${gunAdi}`;
        } catch (e) {
            return String(tarihStr || '');
        }
    },
    
    // Render overdue shipments
    renderOverdueShipments(records) {
        const container = document.getElementById('overdueShipments');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const overdueRecords = records.filter(r => {
            if (!r.Tarih || r.Durum === 'Tamamlandı' || r.Durum === 'İptal') return false;
            
            const recordDate = new Date(r.Tarih);
            recordDate.setHours(0, 0, 0, 0);
            
            return recordDate < today;
        });
        
        if (overdueRecords.length === 0) {
            container.innerHTML = '<p class="text-gray-500">Geciken sevkiyat bulunmamaktadır.</p>';
            return;
        }
        
        container.innerHTML = overdueRecords.map(record => `
            <div class="record-card border-l-4 border-red-500">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-semibold text-gray-800">${record.Kaynak || ''} → ${record.Hedef || ''}</p>
                        <p class="text-sm text-gray-600">${record['Hedef Bölge'] || ''}</p>
                        <p class="text-xs text-red-600 mt-1">Tarih: ${this.formatSadeceTarih(record.Tarih)}</p>
                        <p class="text-xs text-gray-500 mt-1">Dağıtımcı: ${record.Dağıtımcı || 'Atanmamış'}</p>
                    </div>
                    <span class="status-badge status-${record.Durum?.toLowerCase() || 'bekliyor'}">${record.Durum || 'Bekliyor'}</span>
                </div>
            </div>
        `).join('');
    },
    
    // Tarih formatını Türkçe'ye çevir
    formatTarihTürkçe(tarihStr) {
        if (!tarihStr) return '';
        try {
            const tarih = new Date(tarihStr);
            if (isNaN(tarih.getTime())) return tarihStr;
            
            // Türkiye saatine çevir (UTC+3)
            const turkiyeSaati = new Date(tarih.getTime() + (tarih.getTimezoneOffset() * 60 * 1000) + (3 * 60 * 60 * 1000));
            
            const ayIsimleri = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
            const gun = turkiyeSaati.getUTCDate();
            const ay = ayIsimleri[turkiyeSaati.getUTCMonth()];
            const yil = turkiyeSaati.getUTCFullYear();
            const saat = turkiyeSaati.getUTCHours().toString().padStart(2, '0');
            const dakika = turkiyeSaati.getUTCMinutes().toString().padStart(2, '0');
            
            return `${gun} ${ay} ${yil} ${saat}:${dakika}`;
        } catch (e) {
            return tarihStr;
        }
    },
    
    // Render records table
    renderRecordsTable(records) {
        this.allRecords = records;
        this.renderTablePage(1);
    },
    
    // Render table page
    renderTablePage(page) {
        this.currentPage = page;
        const start = (page - 1) * this.recordsPerPage;
        const end = start + this.recordsPerPage;
        const pageRecords = this.allRecords.slice(start, end);
        
        const tbody = document.getElementById('recordsTableBody');
        
        if (pageRecords.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="px-6 py-4 text-center text-gray-500">Kayıt bulunamadı.</td></tr>';
            this.renderPagination();
            return;
        }
        
        tbody.innerHTML = pageRecords.map(record => {
            const canEdit = App.canEditRecord(record);
            const canDelete = App.canDeleteRecord(record);
            const canComplete = App.canCompleteRecord(record);
            
            // Açıklama varsa tooltip için title attribute ekle
            const aciklamaTooltip = record.Açıklama ? `title="${record.Açıklama.replace(/"/g, '&quot;')}"` : '';
            
            // Satır rengini belirle
            let rowBgClass = '';
            const durum = record.Durum || 'Bekliyor';
            
            if (durum === 'Tamamlandı' || durum === 'İptal') {
                // Tamamlanan satırlar: yeşil
                rowBgClass = 'bg-green-50 hover:bg-green-100';
            } else {
                // Geciken kayıtları kontrol et
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (record.Tarih) {
                    const recordDate = new Date(record.Tarih);
                    recordDate.setHours(0, 0, 0, 0);
                    
                    if (recordDate < today) {
                        // Geciken satırlar: kırmızı
                        rowBgClass = 'bg-red-50 hover:bg-red-100';
                    } else {
                        // Bekleyen satırlar: sarı
                        rowBgClass = 'bg-yellow-50 hover:bg-yellow-100';
                    }
                } else {
                    // Tarih yoksa sarı (bekliyor)
                    rowBgClass = 'bg-yellow-50 hover:bg-yellow-100';
                }
            }
            
            return `
                <tr ${aciklamaTooltip} class="${rowBgClass} cursor-pointer">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.ID || ''}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${this.formatSadeceTarih(record.Tarih)}</td>
                    <td class="px-6 py-4 text-sm text-gray-900">${record.Kaynak || ''}</td>
                    <td class="px-6 py-4 text-sm text-gray-900">${record.Hedef || ''}</td>
                    <td class="px-6 py-4 text-sm text-gray-900">${record['Hedef Bölge'] || ''}</td>
                    <td class="px-6 py-4 text-sm text-gray-900">${record.Dağıtımcı || 'Atanmamış'}</td>
                    <td class="px-6 py-4 text-sm text-gray-900">${record['Kaydı Giren'] || ''}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="status-badge status-${record.Durum?.toLowerCase() || 'bekliyor'}">${record.Durum || 'Bekliyor'}</span>
                    </td>
                    <td class="px-2 py-4 whitespace-nowrap text-sm font-medium">
                        <div class="flex gap-1 flex-wrap">
                            ${canComplete && record.Durum !== 'Tamamlandı' && record.Durum !== 'İptal' ? 
                                `<button onclick="App.completeRecord(${record.rowIndex})" class="px-4 py-0.5 bg-green-100 text-green-700 border border-green-300 rounded hover:bg-green-200 transition-colors text-xs font-medium">Tamamla</button>` : ''}
                            ${canEdit ? 
                                `<button onclick="App.editRecord(${record.rowIndex})" class="px-2 py-0.5 bg-blue-100 text-blue-700 border border-blue-300 rounded hover:bg-blue-200 transition-colors text-xs font-medium">Düzenle</button>` : ''}
                            ${canDelete ? 
                                `<button onclick="App.deleteRecord(${record.rowIndex})" class="px-2 py-0.5 bg-red-100 text-red-700 border border-red-300 rounded hover:bg-red-200 transition-colors text-xs font-medium">Sil</button>` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        this.renderPagination();
    },
    
    // Render pagination
    renderPagination() {
        const totalPages = Math.ceil(this.allRecords.length / this.recordsPerPage);
        const pagination = document.getElementById('pagination');
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let html = '<div class="flex gap-2 items-center">';
        
        // Previous button
        html += `<button onclick="UI.renderTablePage(${this.currentPage - 1})" 
                 class="pagination-btn" 
                 ${this.currentPage === 1 ? 'disabled' : ''}>Önceki</button>`;
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                html += `<button onclick="UI.renderTablePage(${i})" 
                         class="pagination-btn ${i === this.currentPage ? 'active' : ''}">${i}</button>`;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                html += '<span class="px-2">...</span>';
            }
        }
        
        // Next button
        html += `<button onclick="UI.renderTablePage(${this.currentPage + 1})" 
                 class="pagination-btn" 
                 ${this.currentPage === totalPages ? 'disabled' : ''}>Sonraki</button>`;
        
        html += '</div>';
        html += `<div class="text-sm text-gray-600">Toplam ${this.allRecords.length} kayıt</div>`;
        
        pagination.innerHTML = html;
    },
    
    // Show loading state
    showLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = '<div class="flex justify-center"><div class="spinner"></div></div>';
        }
    },
    
    // Show error message
    showError(message) {
        // Daha kullanıcı dostu hata mesajı göster
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 right-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-lg z-50 max-w-md';
        errorDiv.innerHTML = `
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-3 flex-1">
                    <h3 class="text-sm font-medium text-red-800">Hata</h3>
                    <div class="mt-2 text-sm text-red-700 whitespace-pre-line">${message}</div>
                </div>
                <div class="ml-4 flex-shrink-0">
                    <button onclick="this.parentElement.parentElement.remove()" class="text-red-400 hover:text-red-500">
                        <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(errorDiv);
        
        // 10 saniye sonra otomatik kapat
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 10000);
        
        // Ayrıca konsola da yazdır
        console.error('Hata:', message);
    },
    
    // Show success message
    showSuccess(message) {
        // Simple alert for now, can be enhanced with toast notifications
        alert('Başarılı: ' + message);
    },
    
    // Print pending records (only Bekliyor and Yolda status)
    printPendingRecords() {
        // Filter only pending records (not completed or cancelled)
        const pendingRecords = this.allRecords.filter(record => {
            const durum = record.Durum || 'Bekliyor';
            return durum !== 'Tamamlandı' && durum !== 'İptal';
        });
        
        if (pendingRecords.length === 0) {
            alert('Yazdırılacak bekleyen kayıt bulunamadı.');
            return;
        }
        
        // Create print-friendly HTML
        const printDate = new Date().toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        let printHTML = `
            <div id="printArea" style="font-family: Arial, sans-serif;">
                <div class="print-header" style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #ddd; padding-bottom: 15px;">
                    <img src="https://files.cdn-files-a.com/uploads/5644137/400_6865986816fbc.png" alt="Hidroteknik Logo" style="max-width: 150px; height: auto; margin-bottom: 10px;">
                    <h1 style="font-size: 18px; margin: 10px 0 5px 0; font-weight: bold;">Hidroteknik Sevkiyat Takip Sistemi</h1>
                    <p style="font-size: 14px; margin: 5px 0; font-weight: 600;">Bekleyen Sevkiyatlar Listesi</p>
                    <p style="font-size: 10px; color: #666; margin: 5px 0;">Yazdırma Tarihi: ${printDate}</p>
                    <p style="font-size: 10px; color: #666; margin: 5px 0;">Toplam Kayıt: ${pendingRecords.length}</p>
                </div>
                <div style="background-color: #fff3cd; border: 2px solid #ffc107; border-radius: 5px; padding: 12px; margin-bottom: 20px; text-align: center;">
                    <p style="font-size: 11px; font-weight: bold; color: #856404; margin: 0; line-height: 1.5;">
                        ⚠️ UYARI: Bu evrak gizli bilgiler içermektedir. Kullanımdan sonra imha ediniz. Üçüncü kişilere gösterilmemesi ve paylaşılmaması gerekmektedir.
                    </p>
                </div>
                <table class="print-table" style="width: 100%; border-collapse: collapse; font-size: 9px; margin-top: 10px;">
                    <thead>
                        <tr style="background-color: #f3f4f6;">
                            <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold; width: 10%;">ID</th>
                            <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold; width: 12%;">Tarih</th>
                            <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold; width: 15%;">Kaynak</th>
                            <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold; width: 15%;">Hedef</th>
                            <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold; width: 12%;">Hedef Bölge</th>
                            <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold; width: 15%;">Dağıtımcı</th>
                            <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold; width: 10%;">Durum</th>
                            <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold; width: 11%;">Açıklama</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        pendingRecords.forEach((record, index) => {
            const rowColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
            const durum = record.Durum || 'Bekliyor';
            
            // Determine if overdue
            let statusText = durum;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (record.Tarih) {
                const recordDate = new Date(record.Tarih);
                recordDate.setHours(0, 0, 0, 0);
                if (recordDate < today && durum !== 'Tamamlandı' && durum !== 'İptal') {
                    statusText = durum + ' (Gecikmiş)';
                }
            }
            
            printHTML += `
                <tr style="background-color: ${rowColor};">
                    <td style="border: 1px solid #ddd; padding: 4px 6px;">${record.ID || ''}</td>
                    <td style="border: 1px solid #ddd; padding: 4px 6px;">${this.formatSadeceTarih(record.Tarih)}</td>
                    <td style="border: 1px solid #ddd; padding: 4px 6px;">${record.Kaynak || ''}</td>
                    <td style="border: 1px solid #ddd; padding: 4px 6px;">${record.Hedef || ''}</td>
                    <td style="border: 1px solid #ddd; padding: 4px 6px;">${record['Hedef Bölge'] || ''}</td>
                    <td style="border: 1px solid #ddd; padding: 4px 6px;">${record.Dağıtımcı || 'Atanmamış'}</td>
                    <td style="border: 1px solid #ddd; padding: 4px 6px;">${statusText}</td>
                    <td style="border: 1px solid #ddd; padding: 4px 6px; font-size: 8px; word-wrap: break-word; max-width: 200px;">${record.Açıklama || ''}</td>
                </tr>
            `;
        });
        
        printHTML += `
                    </tbody>
                </table>
                <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center;">
                    <p style="font-size: 9px; color: #666; margin: 5px 0;">Bu belge Hidroteknik Sevkiyat Takip Sistemi tarafından otomatik olarak oluşturulmuştur.</p>
                    <p style="font-size: 9px; color: #666; margin: 5px 0;">Gizlilik uyarısı: Bu evrak gizli bilgiler içermektedir. Kullanımdan sonra imha ediniz.</p>
                </div>
            </div>
        `;
        
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Bekleyen Sevkiyatlar - Yazdır</title>
                <style>
                    @media print {
                        @page {
                            margin: 1cm;
                            size: A4;
                        }
                        body {
                            margin: 0;
                            padding: 0;
                        }
                    }
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                    }
                    .print-header {
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    .print-header h1 {
                        font-size: 18px;
                        margin: 0 0 5px 0;
                        font-weight: bold;
                    }
                    .print-header p {
                        font-size: 11px;
                        margin: 3px 0;
                        color: #666;
                    }
                    .print-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 9px;
                        margin-top: 10px;
                    }
                    .print-table th,
                    .print-table td {
                        border: 1px solid #ddd;
                        padding: 4px 6px;
                        text-align: left;
                    }
                    .print-table th {
                        background-color: #f3f4f6;
                        font-weight: bold;
                    }
                    .print-table tr:nth-child(even) {
                        background-color: #f9fafb;
                    }
                </style>
            </head>
            <body>
                ${printHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        
        // Wait for content to load, then print
        printWindow.onload = function() {
            setTimeout(() => {
                printWindow.print();
            }, 250);
        };
    }
};


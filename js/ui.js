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
        
        if (addRecordBtn) {
            addRecordBtn.addEventListener('click', () => this.openAddModal());
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
        
        const todayRecords = records.filter(r => r.Tarih === today && r.Durum !== 'Tamamlandı' && r.Durum !== 'İptal');
        
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
    
    // Tarih formatını sadece tarih olarak göster (saat olmadan)
    formatSadeceTarih(tarihStr) {
        if (!tarihStr) return '';
        try {
            // String'e çevir
            const tarihString = String(tarihStr);
            
            // ISO formatında gelirse (2026-01-03T21:00:00.000Z gibi)
            if (tarihString.includes('T')) {
                return tarihString.split('T')[0];
            }
            // Zaten YYYY-MM-DD formatındaysa
            if (tarihString.match(/^\d{4}-\d{2}-\d{2}$/)) {
                return tarihString;
            }
            // Date objesi oluşturup sadece tarihi al
            const tarih = new Date(tarihStr);
            if (isNaN(tarih.getTime())) return tarihString;
            const yil = tarih.getFullYear();
            const ay = (tarih.getMonth() + 1).toString().padStart(2, '0');
            const gun = tarih.getDate().toString().padStart(2, '0');
            return `${yil}-${ay}-${gun}`;
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
            
            return `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.ID || ''}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.Tarih || ''}</td>
                    <td class="px-6 py-4 text-sm text-gray-900">${record.Kaynak || ''}</td>
                    <td class="px-6 py-4 text-sm text-gray-900">${record.Hedef || ''}</td>
                    <td class="px-6 py-4 text-sm text-gray-900">${record['Hedef Bölge'] || ''}</td>
                    <td class="px-6 py-4 text-sm text-gray-900">${record.Dağıtımcı || 'Atanmamış'}</td>
                    <td class="px-6 py-4 text-sm text-gray-900">${record['Kaydı Giren'] || ''}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="status-badge status-${record.Durum?.toLowerCase() || 'bekliyor'}">${record.Durum || 'Bekliyor'}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div class="flex gap-2">
                            ${canComplete && record.Durum !== 'Tamamlandı' && record.Durum !== 'İptal' ? 
                                `<button onclick="App.completeRecord(${record.rowIndex})" class="text-green-600 hover:text-green-900">Tamamlandı</button>` : ''}
                            ${canEdit ? 
                                `<button onclick="App.editRecord(${record.rowIndex})" class="text-blue-600 hover:text-blue-900">Düzenle</button>` : ''}
                            ${canDelete ? 
                                `<button onclick="App.deleteRecord(${record.rowIndex})" class="text-red-600 hover:text-red-900">Sil</button>` : ''}
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
    }
};


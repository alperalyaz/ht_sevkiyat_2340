/**
 * Hidroteknik Sevkiyat Takip Sistemi - Web App API
 * 
 * Bu script Google Apps Script Web App olarak deploy edilecek ve
 * frontend'den API endpoint'leri sağlayacak.
 * 
 * Deploy:
 * 1. Tools > Script editor
 * 2. Bu kodu yapıştır
 * 3. Deploy > New deployment
 * 4. Type: Web app
 * 5. Execute as: Me
 * 6. Who has access: Anyone (veya Anyone with Google account)
 * 7. Deploy
 * 8. Web app URL'ini kopyala ve frontend'de kullan
 */

// Sheet ID - Buraya Sheet ID'nizi yazın
const SHEET_ID = '1hU_I2xrJt28tsum7TkmzOMZJq5LaI67v17dU65S5wjY';
const SEVKIYATLAR_SHEET = 'Sevkiyatlar';
const PERSONEL_SHEET = 'Personel';

// İzin verilen email listesi Personel tablosundan otomatik alınacak

// Note: Google Apps Script ContentService doesn't support setHeaders()
// CORS is handled by deployment settings: "Who has access: Anyone"

/**
 * Personel tablosundan izin verilen email listesini al
 * Basit sistem: Sadece mail kontrolü (Google Sheets gizli olduğu için yeterli)
 */
function getAllowedEmails() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName(PERSONEL_SHEET);
    
    if (!sheet) {
      Logger.log('Personel sheet\'i bulunamadı');
      return [];
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      return [];
    }
    
    const headers = data[0];
    const mailIndex = headers.findIndex(h => h.toLowerCase().includes('mail') || h.toLowerCase().includes('e-posta') || h.toLowerCase().includes('email'));
    const aktifIndex = headers.findIndex(h => h.toLowerCase().includes('aktif'));
    
    if (mailIndex === -1) {
      Logger.log('Mail sütunu bulunamadı');
      return [];
    }
    
    const allowedEmails = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const mail = row[mailIndex];
      const aktif = aktifIndex !== -1 ? row[aktifIndex] : true;
      
      // Aktif personelin mail adresini ekle
      if (mail && mail.toString().trim() !== '' && (aktif === true || aktif === 'TRUE' || aktif === 'true' || aktifIndex === -1)) {
        allowedEmails.push(mail.toString().trim().toLowerCase());
      }
    }
    
    return allowedEmails;
  } catch (error) {
    Logger.log('getAllowedEmails hatası: ' + error.toString());
    return [];
  }
}

/**
 * Kullanıcı doğrulama fonksiyonu
 * Personel tablosundaki mail adresini kontrol eder
 * Google Sheets gizli olduğu için sadece mail kontrolü yeterli
 */
function checkUserAuth(email) {
  try {
    if (!email) {
      return { authorized: false, error: 'Mail adresi gerekli' };
    }
    
    // Email'i küçük harfe çevir
    const emailLower = email.toLowerCase().trim();
    
    // Personel tablosundan izin verilen email listesini al
    const allowedEmails = getAllowedEmails();
    
    if (allowedEmails.length === 0) {
      Logger.log('İzin verilen email listesi boş');
      return { authorized: false, error: 'Personel listesi bulunamadı' };
    }
    
    // Email'in listede olup olmadığını kontrol et
    const isAllowed = allowedEmails.includes(emailLower);
    
    if (!isAllowed) {
      return { authorized: false, error: 'Bu mail adresi ile erişim yetkiniz yok. Lütfen yönetici ile iletişime geçin.' };
    }
    
    return { authorized: true, email: emailLower };
  } catch (error) {
    Logger.log('Auth hatası: ' + error.toString());
    return { authorized: false, error: 'Kimlik doğrulama hatası: ' + error.toString() };
  }
}

/**
 * Main doGet/doPost handler
 */
function doPost(e) {
  try {
    // Parse request data - support both JSON and form data
    let requestData = {};
    if (e.postData && e.postData.contents) {
      try {
        requestData = JSON.parse(e.postData.contents);
      } catch (e) {
        // If not JSON, try form data
        requestData = e.parameter || {};
      }
    } else if (e.parameter && e.parameter.data) {
      try {
        requestData = JSON.parse(e.parameter.data);
      } catch (e) {
        requestData = e.parameter;
      }
    } else if (e.parameter) {
      requestData = e.parameter;
      // If data is a string, try to parse it
      if (requestData.data && typeof requestData.data === 'string') {
        try {
          requestData = { ...requestData, ...JSON.parse(requestData.data) };
        } catch (e) {
          // Keep as is
        }
      }
    }
    
    const action = requestData.action || e.parameter.action;
    
    if (!action) {
      throw new Error('Action parametresi gerekli');
    }
    
    // Kullanıcı doğrulaması (sadece yazma işlemleri için)
    const writeActions = ['addRecord', 'updateRecord', 'deleteRecord', 'updateStatus'];
    if (writeActions.includes(action)) {
      // Mail adresini request'ten al
      const userEmail = requestData.email || requestData.userEmail || e.parameter.email;
      
      if (!userEmail) {
        return ContentService
          .createTextOutput(JSON.stringify({ 
            success: false, 
            error: 'Mail adresi gerekli. Lütfen mail adresinizi giriniz.',
            requiresAuth: true
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const authCheck = checkUserAuth(userEmail);
      if (!authCheck.authorized) {
        return ContentService
          .createTextOutput(JSON.stringify({ 
            success: false, 
            error: authCheck.error || 'Yetkilendirme gerekli',
            requiresAuth: true
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    let result;
    
    switch(action) {
      case 'getSevkiyatlar':
        result = getSevkiyatlar();
        break;
      case 'getPersonel':
        result = getPersonel();
        break;
      case 'addRecord':
        result = addRecord(requestData.recordData || requestData);
        break;
      case 'updateRecord':
        result = updateRecord(requestData);
        break;
      case 'deleteRecord':
        result = deleteRecord(requestData);
        break;
      case 'updateStatus':
        result = updateStatus(requestData);
        break;
      default:
        throw new Error('Geçersiz action: ' + action);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, data: result }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    // GET istekleri için (opsiyonel)
    const action = e.parameter.action;
    
    // Mail adresi doğrulama (şifre gerekmez, Google Sheets gizli olduğu için)
    if (action === 'verifyEmail') {
      const email = e.parameter.email;
      const authCheck = checkUserAuth(email);
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: true, 
          data: {
            isValid: authCheck.authorized,
            email: authCheck.email || null,
            error: authCheck.error || null
          }
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'getSevkiyatlar') {
      const result = getSevkiyatlar();
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, data: result }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'getPersonel') {
      const result = getPersonel();
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, data: result }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Test için: action yoksa bilgi mesajı döndür
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        message: 'Web App çalışıyor! POST isteği ile action parametresi gönderin.',
        availableActions: ['getSevkiyatlar', 'getPersonel', 'addRecord', 'updateRecord', 'deleteRecord', 'updateStatus']
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get all sevkiyatlar
 */
function getSevkiyatlar() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const sheet = spreadsheet.getSheetByName(SEVKIYATLAR_SHEET);
  
  if (!sheet) {
    throw new Error('Sevkiyatlar sheet\'i bulunamadı');
  }
  
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    return [];
  }
  
  const headers = data[0];
  const rows = data.slice(1);
  
  return rows.map((row, index) => {
    const record = {
      rowIndex: index + 2 // +2 because of header row and 1-based indexing
    };
    
    headers.forEach((header, colIndex) => {
      record[header] = row[colIndex] || '';
    });
    
    return record;
  });
}

/**
 * Get personel list
 */
function getPersonel() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName(PERSONEL_SHEET);
    
    if (!sheet) {
      // Tüm sheet isimlerini logla
      const allSheets = spreadsheet.getSheets().map(s => s.getName());
      Logger.log('Mevcut sheet\'ler: ' + allSheets.join(', '));
      Logger.log('Aranan sheet: ' + PERSONEL_SHEET);
      throw new Error('Personel sheet\'i bulunamadı. Mevcut sheet\'ler: ' + allSheets.join(', '));
    }
    
    const data = sheet.getDataRange().getValues();
    Logger.log('Personel verisi satır sayısı: ' + data.length);
    
    if (data.length < 2) {
      return [];
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    
    Logger.log('Headers: ' + headers.join(', '));
    Logger.log('Satır sayısı: ' + rows.length);
    
    const result = rows.map(row => {
      const person = {};
      headers.forEach((header, colIndex) => {
        person[header] = row[colIndex] || '';
      });
      return person;
    });
    
    Logger.log('Dönen personel sayısı: ' + result.length);
    return result;
  } catch (error) {
    Logger.log('getPersonel hatası: ' + error.toString());
    throw error;
  }
}

/**
 * Add new record
 */
function addRecord(recordData) {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const sheet = spreadsheet.getSheetByName(SEVKIYATLAR_SHEET);
  
  if (!sheet) {
    throw new Error('Sevkiyatlar sheet\'i bulunamadı');
  }
  
  // Generate ID
  const id = 'SEV-' + Date.now();
  const now = new Date().toISOString();
  
  // Prepare row data
  const row = [
    id,                                    // A: ID
    recordData.tarih || '',                // B: Tarih
    recordData.kaynak || '',               // C: Kaynak
    recordData.hedef || '',                // D: Hedef
    recordData.hedefBolge || '',           // E: Hedef Bölge
    recordData.aciklama || '',             // F: Açıklama
    recordData.kaynakMuhatap || '',        // G: Kaynak Muhatap
    recordData.hedefMuhatap || '',         // H: Hedef Muhatap
    recordData.dagitimci || '',            // I: Dağıtımcı
    recordData.kaydiGiren || '',           // J: Kaydı Giren
    'Bekliyor',                            // K: Durum
    now,                                   // L: Kayıt Zamanı
    ''                                     // M: Tamamlanma Zamanı
  ];
  
  sheet.appendRow(row);
  
  return { success: true, id: id };
}

/**
 * Update record
 */
function updateRecord(data) {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const sheet = spreadsheet.getSheetByName(SEVKIYATLAR_SHEET);
  
  if (!sheet) {
    throw new Error('Sevkiyatlar sheet\'i bulunamadı');
  }
  
  const rowIndex = parseInt(data.rowIndex);
  if (!rowIndex || rowIndex < 2) {
    throw new Error('Geçersiz rowIndex');
  }
  
  // Get existing record
  const row = sheet.getRange(rowIndex, 1, 1, 13).getValues()[0];
  
  // Update row data
  const updatedRow = [
    row[0] || '',                           // A: ID (preserve)
    data.recordData.tarih || row[1] || '',           // B: Tarih
    data.recordData.kaynak || row[2] || '',         // C: Kaynak
    data.recordData.hedef || row[3] || '',          // D: Hedef
    data.recordData.hedefBolge || row[4] || '',     // E: Hedef Bölge
    data.recordData.aciklama || row[5] || '',       // F: Açıklama
    data.recordData.kaynakMuhatap || row[6] || '',  // G: Kaynak Muhatap
    data.recordData.hedefMuhatap || row[7] || '',   // H: Hedef Muhatap
    data.recordData.dagitimci || row[8] || '',      // I: Dağıtımcı
    row[9] || '',                          // J: Kaydı Giren (preserve)
    row[10] || 'Bekliyor',                  // K: Durum (preserve)
    row[11] || '',                          // L: Kayıt Zamanı (preserve)
    row[12] || ''                           // M: Tamamlanma Zamanı (preserve)
  ];
  
  sheet.getRange(rowIndex, 1, 1, 13).setValues([updatedRow]);
  
  return { success: true };
}

/**
 * Delete record
 */
function deleteRecord(data) {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const sheet = spreadsheet.getSheetByName(SEVKIYATLAR_SHEET);
  
  if (!sheet) {
    throw new Error('Sevkiyatlar sheet\'i bulunamadı');
  }
  
  const rowIndex = parseInt(data.rowIndex);
  if (!rowIndex || rowIndex < 2) {
    throw new Error('Geçersiz rowIndex');
  }
  
  sheet.deleteRow(rowIndex);
  
  return { success: true };
}

/**
 * Update status
 */
function updateStatus(data) {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const sheet = spreadsheet.getSheetByName(SEVKIYATLAR_SHEET);
  
  if (!sheet) {
    throw new Error('Sevkiyatlar sheet\'i bulunamadı');
  }
  
  const rowIndex = parseInt(data.rowIndex);
  if (!rowIndex || rowIndex < 2) {
    throw new Error('Geçersiz rowIndex');
  }
  
  const newStatus = data.newStatus || 'Bekliyor';
  const now = new Date().toISOString();
  
  // Update status (column K = 11)
  sheet.getRange(rowIndex, 11).setValue(newStatus);
  
  // Update completion time if completed (column M = 13)
  if (newStatus === 'Tamamlandı') {
    sheet.getRange(rowIndex, 13).setValue(now);
  }
  
  return { success: true };
}


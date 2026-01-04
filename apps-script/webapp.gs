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

/**
 * Main doGet/doPost handler
 */
function doPost(e) {
  try {
    // Parse request data
    let requestData = {};
    if (e.postData && e.postData.contents) {
      requestData = JSON.parse(e.postData.contents);
    } else if (e.parameter && e.parameter.data) {
      requestData = JSON.parse(e.parameter.data);
    } else if (e.parameter) {
      requestData = e.parameter;
    }
    
    const action = requestData.action || e.parameter.action;
    
    if (!action) {
      throw new Error('Action parametresi gerekli');
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


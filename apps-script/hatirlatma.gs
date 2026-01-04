/**
 * Hidroteknik Sevkiyat Takip Sistemi - Otomatik Hatırlatma Maili
 * 
 * Bu script her gün 14:00'da çalışacak şekilde trigger kurulmalıdır.
 * 
 * Kurulum:
 * 1. Google Sheets'te Tools > Script editor
 * 2. Bu kodu yapıştır
 * 3. Triggers > Add Trigger
 *    - Function: sendDailyReminders
 *    - Event source: Time-driven
 *    - Type: Day timer
 *    - Time: 2pm to 3pm
 */

// Sheet ID ve isimleri
const SHEET_ID = '1hU_I2xrJt28tsum7TkmzOMZJq5LaI67v17dU65S5wjY';
const SEVKIYATLAR_SHEET = 'Sevkiyatlar';
const PERSONEL_SHEET = 'Personel';

// App URL (mail içinde kullanılacak)
const APP_URL = 'https://alperalyaz.github.io/ht_sevkiyat_2340';

/**
 * Ana fonksiyon: Günlük hatırlatma maillerini gönder
 */
function sendDailyReminders() {
  try {
    // Sheet'i aç
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sevkiyatlarSheet = spreadsheet.getSheetByName(SEVKIYATLAR_SHEET);
    const personelSheet = spreadsheet.getSheetByName(PERSONEL_SHEET);
    
    if (!sevkiyatlarSheet || !personelSheet) {
      Logger.log('Sheet bulunamadı!');
      return;
    }
    
    // Bugünün tarihi
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    
    // Personel listesini al
    const personelData = personelSheet.getDataRange().getValues();
    const personelHeaders = personelData[0];
    const personelList = [];
    
    for (let i = 1; i < personelData.length; i++) {
      const row = personelData[i];
      const person = {};
      personelHeaders.forEach((header, index) => {
        person[header] = row[index];
      });
      
      // Sadece aktif personeli ekle
      if (person['Aktif'] === true || person['Aktif'] === 'TRUE') {
        personelList.push(person);
      }
    }
    
    // Sevkiyatları al
    const sevkiyatData = sevkiyatlarSheet.getDataRange().getValues();
    const sevkiyatHeaders = sevkiyatData[0];
    const sevkiyatlar = [];
    
    for (let i = 1; i < sevkiyatData.length; i++) {
      const row = sevkiyatData[i];
      const sevkiyat = {};
      sevkiyatHeaders.forEach((header, index) => {
        sevkiyat[header] = row[index];
      });
      
      // Bugünün tarihine sahip ve durumu "Bekliyor" veya "Yolda" olanları filtrele
      if (sevkiyat['Tarih'] && sevkiyat['Durum']) {
        const sevkiyatTarih = new Date(sevkiyat['Tarih']);
        sevkiyatTarih.setHours(0, 0, 0, 0);
        const sevkiyatTarihStr = Utilities.formatDate(sevkiyatTarih, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        
        if (sevkiyatTarihStr === todayStr && 
            (sevkiyat['Durum'] === 'Bekliyor' || sevkiyat['Durum'] === 'Yolda')) {
          sevkiyatlar.push(sevkiyat);
        }
      }
    }
    
    // Dağıtımcılara göre grupla
    const sevkiyatlarByDagitimci = {};
    
    sevkiyatlar.forEach(sevkiyat => {
      const dagitimci = sevkiyat['Dağıtımcı'] || 'Atanmamış';
      if (!sevkiyatlarByDagitimci[dagitimci]) {
        sevkiyatlarByDagitimci[dagitimci] = [];
      }
      sevkiyatlarByDagitimci[dagitimci].push(sevkiyat);
    });
    
    // Her dağıtımcıya mail gönder
    for (const [dagitimci, sevkiyatList] of Object.entries(sevkiyatlarByDagitimci)) {
      // Personel bilgisini bul
      const personel = personelList.find(p => p['İsim'] === dagitimci);
      
      if (personel && personel['Mail']) {
        const email = personel['Mail'];
        const isim = personel['İsim'];
        
        // Mail içeriğini oluştur
        const subject = 'Hidroteknik - Bugünkü Sevkiyat Hatırlatması';
        const body = createEmailBody(isim, sevkiyatList);
        
        // Mail gönder
        try {
          GmailApp.sendEmail(email, subject, body, {
            from: 'hidroteknikas@gmail.com',
            name: 'Hidroteknik Sevkiyat Takip Sistemi'
          });
          
          Logger.log(`Mail gönderildi: ${email}`);
        } catch (error) {
          Logger.log(`Mail gönderilemedi (${email}): ${error.toString()}`);
        }
      } else if (dagitimci !== 'Atanmamış') {
        Logger.log(`Personel bulunamadı veya mail adresi yok: ${dagitimci}`);
      }
    }
    
    // Atanmamış sevkiyatlar için yöneticilere mail (opsiyonel)
    if (sevkiyatlarByDagitimci['Atanmamış'] && sevkiyatlarByDagitimci['Atanmamış'].length > 0) {
      // Tüm aktif personellere bildirim gönderilebilir
      Logger.log(`${sevkiyatlarByDagitimci['Atanmamış'].length} adet atanmamış sevkiyat bulundu.`);
    }
    
  } catch (error) {
    Logger.log('Hata: ' + error.toString());
    // Hata durumunda yöneticiye mail gönderilebilir
  }
}

/**
 * Mail içeriğini oluştur
 */
function createEmailBody(isim, sevkiyatList) {
  let body = `Merhaba ${isim},\n\n`;
  body += `Bugün için atanmış ve henüz tamamlanmamış sevkiyatların:\n\n`;
  
  sevkiyatList.forEach((sevkiyat, index) => {
    body += `${index + 1}. ${sevkiyat['Kaynak'] || ''} → ${sevkiyat['Hedef'] || ''} (${sevkiyat['Hedef Bölge'] || ''})\n`;
    if (sevkiyat['Açıklama']) {
      body += `   Açıklama: ${sevkiyat['Açıklama']}\n`;
    }
    if (sevkiyat['Kaynak Muhatap']) {
      body += `   Kaynak Muhatap: ${sevkiyat['Kaynak Muhatap']}\n`;
    }
    if (sevkiyat['Hedef Muhatap']) {
      body += `   Hedef Muhatap: ${sevkiyat['Hedef Muhatap']}\n`;
    }
    body += `   Durum: ${sevkiyat['Durum'] || 'Bekliyor'}\n`;
    body += `\n`;
  });
  
  body += `Sevkiyat takip sistemine girmek için: ${APP_URL}\n\n`;
  body += `---\n`;
  body += `Bu otomatik bir hatırlatma mailidir.\n`;
  body += `Hidroteknik Sevkiyat Takip Sistemi`;
  
  return body;
}

/**
 * Test fonksiyonu (manuel çalıştırma için)
 */
function testSendDailyReminders() {
  sendDailyReminders();
}


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
    Logger.log('Script başlatıldı. Sheet ID: ' + SHEET_ID);
    
    // Sheet'i aç
    let spreadsheet;
    try {
      spreadsheet = SpreadsheetApp.openById(SHEET_ID);
      Logger.log('Sheet başarıyla açıldı: ' + spreadsheet.getName());
    } catch (error) {
      Logger.log('HATA: Sheet açılamadı! Hata: ' + error.toString());
      Logger.log('Sheet ID kontrol edin: ' + SHEET_ID);
      Logger.log('Sheet\'e erişim yetkiniz olduğundan emin olun.');
      return;
    }
    
    const sevkiyatlarSheet = spreadsheet.getSheetByName(SEVKIYATLAR_SHEET);
    const personelSheet = spreadsheet.getSheetByName(PERSONEL_SHEET);
    
    if (!sevkiyatlarSheet) {
      Logger.log('HATA: "' + SEVKIYATLAR_SHEET + '" sheet\'i bulunamadı!');
      Logger.log('Mevcut sheet\'ler: ' + spreadsheet.getSheets().map(s => s.getName()).join(', '));
      return;
    }
    
    if (!personelSheet) {
      Logger.log('HATA: "' + PERSONEL_SHEET + '" sheet\'i bulunamadı!');
      Logger.log('Mevcut sheet\'ler: ' + spreadsheet.getSheets().map(s => s.getName()).join(', '));
      return;
    }
    
    Logger.log('Sheet\'ler başarıyla açıldı');
    
    // Bugünün tarihi
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    Logger.log('Bugünün tarihi: ' + todayStr);
    
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
        Logger.log('Aktif personel bulundu: ' + person['İsim'] + ' - Mail: ' + (person['Mail'] || 'YOK'));
      }
    }
    
    Logger.log('Toplam aktif personel sayısı: ' + personelList.length);
    
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
          Logger.log('Bugünkü sevkiyat bulundu: ' + (sevkiyat['Kaynak'] || '') + ' → ' + (sevkiyat['Hedef'] || '') + ' (Dağıtımcı: ' + (sevkiyat['Dağıtımcı'] || 'Atanmamış') + ')');
        }
      }
    }
    
    Logger.log('Toplam bugünkü sevkiyat sayısı: ' + sevkiyatlar.length);
    
    if (sevkiyatlar.length === 0) {
      Logger.log('UYARI: Bugün için sevkiyat bulunamadı! Mail gönderilmeyecek.');
      Logger.log('Not: Sadece bugünün tarihine sahip ve durumu "Bekliyor" veya "Yolda" olan sevkiyatlar için mail gönderilir.');
      return;
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
    Logger.log('Dağıtımcılara göre gruplanmış sevkiyat sayısı: ' + Object.keys(sevkiyatlarByDagitimci).length);
    
    for (const [dagitimci, sevkiyatList] of Object.entries(sevkiyatlarByDagitimci)) {
      Logger.log(`İşleniyor: ${dagitimci} (${sevkiyatList.length} sevkiyat)`);
      
      // Personel bilgisini bul
      const personel = personelList.find(p => p['İsim'] === dagitimci);
      
      if (personel && personel['Mail']) {
        const email = personel['Mail'];
        const isim = personel['İsim'];
        
        Logger.log(`Mail gönderiliyor: ${email} (${isim})`);
        
        // Mail içeriğini oluştur
        const subject = 'Hidroteknik - Bugünkü Sevkiyat Hatırlatması';
        const body = createEmailBody(isim, sevkiyatList);
        
        // Mail gönder
        try {
          GmailApp.sendEmail(email, subject, body, {
            from: 'hidroteknikas@gmail.com',
            name: 'Hidroteknik Sevkiyat Takip Sistemi'
          });
          
          Logger.log(`✓ Mail başarıyla gönderildi: ${email}`);
        } catch (error) {
          Logger.log(`✗ Mail gönderilemedi (${email}): ${error.toString()}`);
        }
      } else if (dagitimci !== 'Atanmamış') {
        Logger.log(`✗ Personel bulunamadı veya mail adresi yok: ${dagitimci}`);
        if (personel) {
          Logger.log(`  Personel bulundu ama mail adresi yok. Mail sütunu: ${personel['Mail']}`);
        } else {
          Logger.log(`  Personel sheet'inde "${dagitimci}" isimli personel bulunamadı.`);
        }
      }
    }
    
    // Atanmamış sevkiyatlar için yöneticilere mail gönder
    if (sevkiyatlarByDagitimci['Atanmamış'] && sevkiyatlarByDagitimci['Atanmamış'].length > 0) {
      Logger.log(`${sevkiyatlarByDagitimci['Atanmamış'].length} adet atanmamış sevkiyat bulundu.`);
      
      // Tüm aktif personellere (yöneticilere) bildirim gönder
      const atanmamisSevkiyatlar = sevkiyatlarByDagitimci['Atanmamış'];
      
      for (const personel of personelList) {
        if (personel['Mail']) {
          const email = personel['Mail'];
          const isim = personel['İsim'];
          
          Logger.log(`Atanmamış sevkiyat bildirimi gönderiliyor: ${email} (${isim})`);
          
          // Mail içeriğini oluştur
          const subject = 'Hidroteknik - Atanmamış Sevkiyat Bildirimi';
          let body = `Merhaba ${isim},\n\n`;
          body += `Bugün için ${atanmamisSevkiyatlar.length} adet dağıtımcı atanmamış sevkiyat bulunmaktadır:\n\n`;
          
          atanmamisSevkiyatlar.forEach((sevkiyat, index) => {
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
          
          body += `Lütfen bu sevkiyatlar için dağıtımcı atayın.\n\n`;
          body += `Sevkiyat takip sistemine girmek için: ${APP_URL}\n\n`;
          body += `---\n`;
          body += `Bu otomatik bir hatırlatma mailidir.\n`;
          body += `Hidroteknik Sevkiyat Takip Sistemi`;
          
          // Mail gönder
          try {
            GmailApp.sendEmail(email, subject, body, {
              from: 'hidroteknikas@gmail.com',
              name: 'Hidroteknik Sevkiyat Takip Sistemi'
            });
            
            Logger.log(`✓ Atanmamış sevkiyat bildirimi gönderildi: ${email}`);
          } catch (error) {
            Logger.log(`✗ Atanmamış sevkiyat bildirimi gönderilemedi (${email}): ${error.toString()}`);
          }
        }
      }
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

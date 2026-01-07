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
const APP_URL = 'https://sevkiyat.hidroteknik.com.tr';

/**
 * Ana fonksiyon: Günlük hatırlatma maillerini gönder
 */
function sendDailyReminders() {
  try {
    Logger.log('Script başlatıldı. Sheet ID: ' + SHEET_ID);
    
    // Sheet ID'nin geçerli olup olmadığını kontrol et
    if (!SHEET_ID || SHEET_ID.trim() === '') {
      Logger.log('HATA: Sheet ID tanımlı değil veya boş!');
      return;
    }
    
    // Sheet'i aç - daha güvenli yaklaşım
    let spreadsheet;
    try {
      Logger.log('SpreadsheetApp servisi kontrol ediliyor...');
      
      // SpreadsheetApp'in mevcut olup olmadığını test et
      if (typeof SpreadsheetApp === 'undefined') {
        throw new Error('SpreadsheetApp servisi bulunamadı');
      }
      
      Logger.log('SpreadsheetApp servisi mevcut.');
      Logger.log('Sheet açılmaya çalışılıyor... Sheet ID: ' + SHEET_ID);
      
      // Kısa bir bekleme ekle (servislerin yüklenmesi için)
      Utilities.sleep(100);
      
      // Sheet'i açmayı dene - farklı yöntemlerle
      try {
        spreadsheet = SpreadsheetApp.openById(SHEET_ID);
      } catch (openError) {
        // İlk deneme başarısız olursa, tekrar dene
        Logger.log('İlk deneme başarısız, tekrar deneniyor...');
        Utilities.sleep(200);
        spreadsheet = SpreadsheetApp.openById(SHEET_ID);
      }
      
      if (!spreadsheet) {
        throw new Error('Sheet açıldı ancak null döndü');
      }
      
      // Sheet'in adını alarak doğrulama yap
      const sheetName = spreadsheet.getName();
      Logger.log('Sheet başarıyla açıldı: ' + sheetName);
      
    } catch (error) {
      Logger.log('HATA: Sheet açılamadı!');
      Logger.log('Hata tipi: ' + (typeof error));
      Logger.log('Hata detayı: ' + error.toString());
      Logger.log('Hata mesajı: ' + (error.message || 'Yok'));
      Logger.log('Hata stack: ' + (error.stack || 'Yok'));
      Logger.log('Sheet ID: ' + SHEET_ID);
      Logger.log('');
      Logger.log('ÇÖZÜM ADIMLARI:');
      Logger.log('1. Script\'i ilk kez çalıştırıyorsanız, yetkilendirme isteğini onaylayın');
      Logger.log('   - Run butonuna bastığınızda "Review permissions" (İzinleri İncele) çıkacak');
      Logger.log('   - Google hesabınızı seçin');
      Logger.log('   - "Advanced" (Gelişmiş) linkine tıklayın');
      Logger.log('   - "[Proje adı] (unsafe)" linkine tıklayın');
      Logger.log('   - Tüm izinleri onaylayın');
      Logger.log('2. Sheet ID\'nin doğru olduğundan emin olun (Sheet URL\'sinden kontrol edin)');
      Logger.log('3. Script\'in bu Sheet\'e erişim yetkisi olduğundan emin olun');
      Logger.log('4. Sheet\'in silinmediğinden veya paylaşım izinlerinin değişmediğinden emin olun');
      Logger.log('5. Script\'i tekrar çalıştırmayı deneyin');
      Logger.log('');
      Logger.log('ÖNEMLİ: Bu hata genellikle yetkilendirme sorunundan kaynaklanır.');
      Logger.log('Script\'i manuel olarak çalıştırıp yetkilendirme isteğini onaylamanız gerekiyor.');
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
    
    // Bugünün tarihi (Türkiye saati - UTC+3)
    const today = new Date();
    // Türkiye saatine çevir (UTC+3)
    const turkiyeSaati = new Date(today.getTime() + (3 * 60 * 60 * 1000));
    turkiyeSaati.setUTCHours(0, 0, 0, 0);
    const todayStr = Utilities.formatDate(turkiyeSaati, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    Logger.log('Bugünün tarihi (Türkiye saati): ' + todayStr);
    
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
    
    Logger.log('Toplam sevkiyat satır sayısı (başlık hariç): ' + (sevkiyatData.length - 1));
    
    let tarihYokSayisi = 0;
    let durumYokSayisi = 0;
    let tarihBugunDegilSayisi = 0;
    let durumUygunDegilSayisi = 0;
    let bugunVeBekliyorSayisi = 0;
    
    for (let i = 1; i < sevkiyatData.length; i++) {
      const row = sevkiyatData[i];
      const sevkiyat = {};
      sevkiyatHeaders.forEach((header, index) => {
        sevkiyat[header] = row[index];
      });
      
      // ID varsa logla (debug için)
      const sevkiyatID = sevkiyat['ID'] || sevkiyat['id'] || '';
      
      // Bugünün tarihine sahip ve durumu "Bekliyor" veya "Yolda" olanları filtrele
      if (!sevkiyat['Tarih']) {
        tarihYokSayisi++;
        Logger.log(`Sevkiyat atlandı (Tarih yok): ${sevkiyatID} - ${sevkiyat['Kaynak'] || ''} → ${sevkiyat['Hedef'] || ''}`);
        continue;
      }
      
      if (!sevkiyat['Durum']) {
        durumYokSayisi++;
        Logger.log(`Sevkiyat atlandı (Durum yok): ${sevkiyatID} - ${sevkiyat['Kaynak'] || ''} → ${sevkiyat['Hedef'] || ''}`);
        continue;
      }
      
      const sevkiyatTarih = new Date(sevkiyat['Tarih']);
      // Türkiye saatine çevir (UTC+3)
      const sevkiyatTarihTurkiye = new Date(sevkiyatTarih.getTime() + (3 * 60 * 60 * 1000));
      sevkiyatTarihTurkiye.setUTCHours(0, 0, 0, 0);
      const sevkiyatTarihStr = Utilities.formatDate(sevkiyatTarihTurkiye, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      
      // Durum kontrolü - önce durumu kontrol et
      if (sevkiyat['Durum'] !== 'Bekliyor' && sevkiyat['Durum'] !== 'Yolda') {
        durumUygunDegilSayisi++;
        Logger.log(`Sevkiyat atlandı (Durum uygun değil: ${sevkiyat['Durum']}): ${sevkiyatID} - ${sevkiyat['Kaynak'] || ''} → ${sevkiyat['Hedef'] || ''} (Tarih: ${sevkiyatTarihStr})`);
        continue;
      }
      
      // Dağıtımcı kontrolü - atanmamış sevkiyatlar için tarih kontrolü yapma
      const dagitimci = sevkiyat['Dağıtımcı'] || '';
      const isAtanmamis = !dagitimci || dagitimci.toString().trim() === '' || dagitimci.toString().trim() === 'Atanmamış';
      
      // Atanmamış sevkiyatlar: Bugün veya geçmiş tarihli olanları dahil et (gelecek tarihli olanları hariç tut)
      // Atanmış sevkiyatlar: Sadece bugünün tarihine sahip olanları dahil et
      if (isAtanmamis) {
        // Atanmamış sevkiyatlar için: Bugün veya geçmiş tarihli olanları dahil et
        const sevkiyatTarihTime = sevkiyatTarihTurkiye.getTime();
        const todayTime = turkiyeSaati.getTime();
        
        if (sevkiyatTarihTime > todayTime) {
          // Gelecek tarihli atanmamış sevkiyatları atla
          tarihBugunDegilSayisi++;
          Logger.log(`Sevkiyat atlandı (Gelecek tarihli atanmamış: ${sevkiyatTarihStr}): ${sevkiyatID} - ${sevkiyat['Kaynak'] || ''} → ${sevkiyat['Hedef'] || ''} (Durum: ${sevkiyat['Durum']})`);
          continue;
        }
        
        // Bugün veya geçmiş tarihli atanmamış sevkiyat - dahil et
        bugunVeBekliyorSayisi++;
        sevkiyatlar.push(sevkiyat);
        Logger.log(`✓ Atanmamış sevkiyat bulundu: ${sevkiyatID} - ${sevkiyat['Kaynak'] || ''} → ${sevkiyat['Hedef'] || ''} (Tarih: ${sevkiyatTarihStr}, Durum: ${sevkiyat['Durum']})`);
      } else {
        // Atanmış sevkiyatlar için: Sadece bugünün tarihine sahip olanları dahil et
        if (sevkiyatTarihStr !== todayStr) {
          tarihBugunDegilSayisi++;
          Logger.log(`Sevkiyat atlandı (Tarih bugün değil: ${sevkiyatTarihStr}): ${sevkiyatID} - ${sevkiyat['Kaynak'] || ''} → ${sevkiyat['Hedef'] || ''} (Dağıtımcı: ${dagitimci}, Durum: ${sevkiyat['Durum']})`);
          continue;
        }
        
        // Bugünkü atanmış sevkiyat - dahil et
        bugunVeBekliyorSayisi++;
        sevkiyatlar.push(sevkiyat);
        Logger.log(`✓ Bugünkü sevkiyat bulundu: ${sevkiyatID} - ${sevkiyat['Kaynak'] || ''} → ${sevkiyat['Hedef'] || ''} (Dağıtımcı: ${dagitimci}, Durum: ${sevkiyat['Durum']})`);
      }
    }
    
    Logger.log('\n=== SEVKİYAT FİLTRELEME ÖZETİ ===');
    Logger.log('Toplam sevkiyat satırı: ' + (sevkiyatData.length - 1));
    Logger.log('Tarih yok: ' + tarihYokSayisi);
    Logger.log('Durum yok: ' + durumYokSayisi);
    Logger.log('Tarih bugün değil: ' + tarihBugunDegilSayisi);
    Logger.log('Durum uygun değil (Bekliyor/Yolda değil): ' + durumUygunDegilSayisi);
    Logger.log('Bugün ve Bekliyor/Yolda: ' + bugunVeBekliyorSayisi);
    Logger.log('Toplam bugünkü sevkiyat sayısı: ' + sevkiyatlar.length);
    Logger.log('================================\n');
    
    if (sevkiyatlar.length === 0) {
      Logger.log('UYARI: Bugün için sevkiyat bulunamadı! Mail gönderilmeyecek.');
      Logger.log('Not: Sadece bugünün tarihine sahip ve durumu "Bekliyor" veya "Yolda" olan sevkiyatlar için mail gönderilir.');
      return;
    }
    
    // Dağıtımcılara göre grupla
    const sevkiyatlarByDagitimci = {};
    
    sevkiyatlar.forEach(sevkiyat => {
      // Dağıtımcı boş, null, undefined veya boş string ise "Atanmamış" olarak işaretle
      let dagitimci = sevkiyat['Dağıtımcı'];
      if (!dagitimci || dagitimci.toString().trim() === '') {
        dagitimci = 'Atanmamış';
      } else {
        dagitimci = dagitimci.toString().trim();
      }
      
      if (!sevkiyatlarByDagitimci[dagitimci]) {
        sevkiyatlarByDagitimci[dagitimci] = [];
      }
      sevkiyatlarByDagitimci[dagitimci].push(sevkiyat);
    });
    
    // Tüm dağıtımcı key'lerini logla (debug için)
    Logger.log('Dağıtımcı key\'leri: ' + Object.keys(sevkiyatlarByDagitimci).join(', '));
    Logger.log('Dağıtımcılara göre gruplanmış sevkiyat sayısı: ' + Object.keys(sevkiyatlarByDagitimci).length);
    
    // Atanmamış sevkiyatları önce kontrol et ve logla
    const atanmamisKey = Object.keys(sevkiyatlarByDagitimci).find(key => 
      key === 'Atanmamış' || 
      key.toString().trim() === '' || 
      !key || 
      key.toString().trim().toLowerCase() === 'atanmamış'
    );
    
    if (atanmamisKey) {
      Logger.log(`Atanmamış sevkiyat key bulundu: "${atanmamisKey}" (${sevkiyatlarByDagitimci[atanmamisKey].length} adet)`);
    } else {
      Logger.log('Atanmamış sevkiyat key bulunamadı. Tüm key\'ler: ' + Object.keys(sevkiyatlarByDagitimci).join(', '));
    }
    
    // Her dağıtımcıya mail gönder (Atanmamış hariç)
    for (const [dagitimci, sevkiyatList] of Object.entries(sevkiyatlarByDagitimci)) {
      // Atanmamış sevkiyatları şimdilik atla, sonra ayrı işleyeceğiz
      const isAtanmamis = !dagitimci || 
                          dagitimci.toString().trim() === '' || 
                          dagitimci.toString().trim() === 'Atanmamış' ||
                          dagitimci.toString().trim().toLowerCase() === 'atanmamış';
      
      if (isAtanmamis) {
        continue; // Atanmamış sevkiyatları sonra işleyeceğiz
      }
      
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
      } else {
        Logger.log(`✗ Personel bulunamadı veya mail adresi yok: ${dagitimci}`);
        if (personel) {
          Logger.log(`  Personel bulundu ama mail adresi yok. Mail sütunu: ${personel['Mail']}`);
        } else {
          Logger.log(`  Personel sheet'inde "${dagitimci}" isimli personel bulunamadı.`);
        }
      }
    }
    
    // Atanmamış sevkiyatlar için yöneticilere mail gönder
    const atanmamisKeyFinal = atanmamisKey || 'Atanmamış';
    const atanmamisSevkiyatlar = sevkiyatlarByDagitimci[atanmamisKeyFinal] || 
                                 sevkiyatlarByDagitimci['Atanmamış'] || 
                                 [];
    
    if (atanmamisSevkiyatlar.length > 0) {
      Logger.log(`\n=== ATANMAMIŞ SEVKİYAT İŞLEMİ ===`);
      Logger.log(`${atanmamisSevkiyatlar.length} adet atanmamış sevkiyat bulundu.`);
      Logger.log(`Toplam aktif personel sayısı: ${personelList.length}`);
      Logger.log(`Mail adresi olan personel sayısı: ${personelList.filter(p => p['Mail']).length}`);
      
      let mailGonderildi = false;
      let mailGonderilmeyeCalisilanSayisi = 0;
      
      for (const personel of personelList) {
        if (personel['Mail']) {
          mailGonderilmeyeCalisilanSayisi++;
          const email = personel['Mail'];
          const isim = personel['İsim'];
          
          Logger.log(`Atanmamış sevkiyat bildirimi gönderiliyor: ${email} (${isim})`);
          
          // Mail içeriğini oluştur
          const subject = 'Hidroteknik - Atanmamış Sevkiyat Bildirimi';
          let body = `Merhaba ${isim},\n\n`;
          body += `${atanmamisSevkiyatlar.length} adet dağıtımcı atanmamış sevkiyat bulunmaktadır:\n\n`;
          
          atanmamisSevkiyatlar.forEach((sevkiyat, index) => {
            // Tarih bilgisini formatla
            let tarihBilgisi = '';
            if (sevkiyat['Tarih']) {
              const sevkiyatTarih = new Date(sevkiyat['Tarih']);
              const sevkiyatTarihTurkiye = new Date(sevkiyatTarih.getTime() + (3 * 60 * 60 * 1000));
              const sevkiyatTarihStr = Utilities.formatDate(sevkiyatTarihTurkiye, Session.getScriptTimeZone(), 'yyyy-MM-dd');
              const todayStr = Utilities.formatDate(turkiyeSaati, Session.getScriptTimeZone(), 'yyyy-MM-dd');
              
              if (sevkiyatTarihStr === todayStr) {
                tarihBilgisi = ' (Bugün)';
              } else {
                tarihBilgisi = ` (Tarih: ${sevkiyatTarihStr})`;
              }
            }
            
            body += `${index + 1}. ${sevkiyat['Kaynak'] || ''} → ${sevkiyat['Hedef'] || ''} (${sevkiyat['Hedef Bölge'] || ''})${tarihBilgisi}\n`;
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
            mailGonderildi = true;
          } catch (error) {
            Logger.log(`✗ Atanmamış sevkiyat bildirimi gönderilemedi (${email}): ${error.toString()}`);
            Logger.log(`  Hata detayı: ${error.message || 'Bilinmeyen hata'}`);
          }
        } else {
          Logger.log(`Personel mail adresi yok: ${personel['İsim'] || 'İsimsiz'}`);
        }
      }
      
      Logger.log(`\n=== ATANMAMIŞ SEVKİYAT İŞLEM SONUCU ===`);
      Logger.log(`Mail gönderilmeye çalışılan personel sayısı: ${mailGonderilmeyeCalisilanSayisi}`);
      Logger.log(`Başarıyla gönderilen mail sayısı: ${mailGonderildi ? mailGonderilmeyeCalisilanSayisi : 0}`);
      
      if (!mailGonderildi) {
        Logger.log(`UYARI: Atanmamış sevkiyatlar var (${atanmamisSevkiyatlar.length} adet) ancak hiçbir personelin mail adresi bulunamadı veya mail gönderilemedi!`);
        Logger.log(`Personel listesi kontrol edilmeli. Toplam personel: ${personelList.length}, Mail adresi olan: ${personelList.filter(p => p['Mail']).length}`);
      }
    } else {
      Logger.log('Atanmamış sevkiyat bulunamadı.');
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
 * GERÇEK ÇALIŞTIRMA FONKSİYONU - Tüm kişilere mail gönderir
 * DİKKAT: Bu fonksiyon gerçek mailler gönderir!
 * Test için testSendDailyReminders() fonksiyonunu kullanın.
 */
function runSendDailyReminders() {
  sendDailyReminders();
}

/**
 * Günlük Rapor Fonksiyonu
 * Her gün 19:00-20:00 arası çalışacak şekilde trigger kurulmalıdır.
 */
function sendDailyReport() {
  try {
    Logger.log('Günlük rapor oluşturuluyor...');
    
    // Sheet ID'nin geçerli olup olmadığını kontrol et
    if (!SHEET_ID || SHEET_ID.trim() === '') {
      Logger.log('HATA: Sheet ID tanımlı değil veya boş!');
      return;
    }
    
    // Sheet'i aç - daha güvenli yaklaşım
    let spreadsheet;
    try {
      Logger.log('SpreadsheetApp servisi kontrol ediliyor...');
      if (typeof SpreadsheetApp === 'undefined') {
        throw new Error('SpreadsheetApp servisi bulunamadı');
      }
      
      Logger.log('SpreadsheetApp servisi mevcut.');
      Logger.log('Sheet açılmaya çalışılıyor... Sheet ID: ' + SHEET_ID);
      
      // Kısa bir bekleme ekle (servislerin yüklenmesi için)
      Utilities.sleep(100);
      
      // Sheet'i açmayı dene - farklı yöntemlerle
      try {
        spreadsheet = SpreadsheetApp.openById(SHEET_ID);
      } catch (openError) {
        // İlk deneme başarısız olursa, tekrar dene
        Logger.log('İlk deneme başarısız, tekrar deneniyor...');
        Utilities.sleep(200);
        spreadsheet = SpreadsheetApp.openById(SHEET_ID);
      }
      
      if (!spreadsheet) {
        throw new Error('Sheet açıldı ancak null döndü');
      }
      
      // Sheet'in adını alarak doğrulama yap
      const sheetName = spreadsheet.getName();
      Logger.log('Sheet başarıyla açıldı: ' + sheetName);
      
    } catch (error) {
      Logger.log('HATA: Sheet açılamadı!');
      Logger.log('Hata detayı: ' + error.toString());
      Logger.log('Hata mesajı: ' + (error.message || 'Yok'));
      Logger.log('Hata stack: ' + (error.stack || 'Yok'));
      Logger.log('Sheet ID: ' + SHEET_ID);
      Logger.log('');
      Logger.log('ÇÖZÜM: Script\'i manuel olarak çalıştırıp yetkilendirme isteğini onaylayın.');
      return;
    }
    
    const sevkiyatlarSheet = spreadsheet.getSheetByName(SEVKIYATLAR_SHEET);
    const personelSheet = spreadsheet.getSheetByName(PERSONEL_SHEET);
    
    if (!sevkiyatlarSheet || !personelSheet) {
      Logger.log('Sheet bulunamadı!');
      return;
    }
    
    // Bugünün tarihi (Türkiye saati - UTC+3)
    const today = new Date();
    const turkiyeSaati = new Date(today.getTime() + (3 * 60 * 60 * 1000));
    turkiyeSaati.setUTCHours(0, 0, 0, 0);
    const todayStr = Utilities.formatDate(turkiyeSaati, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    Logger.log('Rapor tarihi (Türkiye saati): ' + todayStr);
    
    // Tüm sevkiyatları al
    const sevkiyatData = sevkiyatlarSheet.getDataRange().getValues();
    const sevkiyatHeaders = sevkiyatData[0];
    const sevkiyatlar = [];
    
    for (let i = 1; i < sevkiyatData.length; i++) {
      const row = sevkiyatData[i];
      const sevkiyat = {};
      sevkiyatHeaders.forEach((header, index) => {
        sevkiyat[header] = row[index];
      });
      sevkiyatlar.push(sevkiyat);
    }
    
    // Bugün eklenen kayıtlar
    const bugunEklenenler = [];
    // Bugün tamamlanan kayıtlar
    const bugunTamamlananlar = [];
    // Bugün için planlanmış ama tamamlanmamış kayıtlar
    const bugunPlanlanmisTamamlanmamis = [];
    
    for (const sevkiyat of sevkiyatlar) {
      // Bugün eklenen kayıtlar (Kayıt Zamanı bugün)
      if (sevkiyat['Kayıt Zamanı']) {
        const kayitTarih = new Date(sevkiyat['Kayıt Zamanı']);
        const kayitTarihTurkiye = new Date(kayitTarih.getTime() + (3 * 60 * 60 * 1000));
        kayitTarihTurkiye.setUTCHours(0, 0, 0, 0);
        const kayitTarihStr = Utilities.formatDate(kayitTarihTurkiye, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        
        if (kayitTarihStr === todayStr) {
          bugunEklenenler.push(sevkiyat);
        }
      }
      
      // Bugün tamamlanan kayıtlar (Tamamlanma Zamanı bugün)
      if (sevkiyat['Tamamlanma Zamanı']) {
        const tamamlanmaTarih = new Date(sevkiyat['Tamamlanma Zamanı']);
        const tamamlanmaTarihTurkiye = new Date(tamamlanmaTarih.getTime() + (3 * 60 * 60 * 1000));
        tamamlanmaTarihTurkiye.setUTCHours(0, 0, 0, 0);
        const tamamlanmaTarihStr = Utilities.formatDate(tamamlanmaTarihTurkiye, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        
        if (tamamlanmaTarihStr === todayStr) {
          bugunTamamlananlar.push(sevkiyat);
        }
      }
      
      // Bugün için planlanmış ama tamamlanmamış kayıtlar
      if (sevkiyat['Tarih'] && sevkiyat['Durum']) {
        const sevkiyatTarih = new Date(sevkiyat['Tarih']);
        const sevkiyatTarihTurkiye = new Date(sevkiyatTarih.getTime() + (3 * 60 * 60 * 1000));
        sevkiyatTarihTurkiye.setUTCHours(0, 0, 0, 0);
        const sevkiyatTarihStr = Utilities.formatDate(sevkiyatTarihTurkiye, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        
        if (sevkiyatTarihStr === todayStr && 
            (sevkiyat['Durum'] === 'Bekliyor' || sevkiyat['Durum'] === 'Yolda')) {
          bugunPlanlanmisTamamlanmamis.push(sevkiyat);
        }
      }
    }
    
    Logger.log(`Bugün eklenen kayıt sayısı: ${bugunEklenenler.length}`);
    Logger.log(`Bugün tamamlanan kayıt sayısı: ${bugunTamamlananlar.length}`);
    Logger.log(`Bugün planlanmış ama tamamlanmamış kayıt sayısı: ${bugunPlanlanmisTamamlanmamis.length}`);
    
    // Rapor mailini oluştur
    const subject = `Hidroteknik - Günlük Sevkiyat Raporu (${todayStr})`;
    const body = createDailyReportBody(todayStr, bugunEklenenler, bugunTamamlananlar, bugunPlanlanmisTamamlanmamis);
    
    // Yönetici mail adresi
    const adminEmail = 'alper.alyaz@hidroteknik.com.tr';
    
    // Mail gönder
    try {
      GmailApp.sendEmail(adminEmail, subject, body, {
        from: 'hidroteknikas@gmail.com',
        name: 'Hidroteknik Sevkiyat Takip Sistemi'
      });
      
      Logger.log(`✓ Günlük rapor gönderildi: ${adminEmail}`);
    } catch (error) {
      Logger.log(`✗ Günlük rapor gönderilemedi (${adminEmail}): ${error.toString()}`);
    }
    
  } catch (error) {
    Logger.log('Günlük rapor hatası: ' + error.toString());
  }
}

/**
 * Tarih formatını Türkçe'ye çevir (Google Apps Script)
 */
function formatTarihTürkçe(tarihStr) {
  if (!tarihStr) return '';
  try {
    const tarih = new Date(tarihStr);
    if (isNaN(tarih.getTime())) return tarihStr;
    
    // Türkiye saatine çevir (UTC+3)
    const turkiyeSaati = new Date(tarih.getTime() + (3 * 60 * 60 * 1000));
    
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
}

/**
 * Günlük rapor mail içeriğini oluştur
 */
function createDailyReportBody(tarih, eklenenler, tamamlananlar, planlanmisTamamlanmamis) {
  let body = `Hidroteknik Sevkiyat Takip Sistemi - Günlük Rapor\n\n`;
  body += `Tarih: ${tarih}\n`;
  body += `Rapor Saati: ${new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}\n\n`;
  body += `═`.repeat(50) + `\n\n`;
  
  // Bugün eklenen kayıtlar
  body += `📝 BUGÜN EKLENEN KAYITLAR (${eklenenler.length} adet)\n`;
  body += `─`.repeat(50) + `\n\n`;
  
  if (eklenenler.length === 0) {
    body += `Bugün eklenen kayıt bulunmamaktadır.\n\n`;
  } else {
    eklenenler.forEach((sevkiyat, index) => {
      body += `${index + 1}. ${sevkiyat['ID'] || ''}\n`;
      body += `   Tarih: ${sevkiyat['Tarih'] || ''}\n`;
      body += `   Rota: ${sevkiyat['Kaynak'] || ''} → ${sevkiyat['Hedef'] || ''} (${sevkiyat['Hedef Bölge'] || ''})\n`;
      if (sevkiyat['Açıklama']) {
        body += `   Açıklama: ${sevkiyat['Açıklama']}\n`;
      }
      if (sevkiyat['Kaynak Muhatap']) {
        body += `   Kaynak Muhatap: ${sevkiyat['Kaynak Muhatap']}\n`;
      }
      if (sevkiyat['Hedef Muhatap']) {
        body += `   Hedef Muhatap: ${sevkiyat['Hedef Muhatap']}\n`;
      }
      body += `   Dağıtımcı: ${sevkiyat['Dağıtımcı'] || 'Atanmamış'}\n`;
      body += `   Durum: ${sevkiyat['Durum'] || 'Bekliyor'}\n`;
      body += `   Kaydı Giren: ${sevkiyat['Kaydı Giren'] || ''}\n`;
      body += `   Kayıt Zamanı: ${formatTarihTürkçe(sevkiyat['Kayıt Zamanı'])}\n`;
      body += `\n`;
    });
  }
  
  body += `═`.repeat(50) + `\n\n`;
  
  // Bugün tamamlanan kayıtlar
  body += `✅ BUGÜN TAMAMLANAN KAYITLAR (${tamamlananlar.length} adet)\n`;
  body += `─`.repeat(50) + `\n\n`;
  
  if (tamamlananlar.length === 0) {
    body += `Bugün tamamlanan kayıt bulunmamaktadır.\n\n`;
  } else {
    tamamlananlar.forEach((sevkiyat, index) => {
      body += `${index + 1}. ${sevkiyat['ID'] || ''}\n`;
      body += `   Tarih: ${sevkiyat['Tarih'] || ''}\n`;
      body += `   Rota: ${sevkiyat['Kaynak'] || ''} → ${sevkiyat['Hedef'] || ''} (${sevkiyat['Hedef Bölge'] || ''})\n`;
      if (sevkiyat['Açıklama']) {
        body += `   Açıklama: ${sevkiyat['Açıklama']}\n`;
      }
      if (sevkiyat['Dağıtımcı']) {
        body += `   Dağıtımcı: ${sevkiyat['Dağıtımcı']}\n`;
      }
      body += `   Tamamlanma Zamanı: ${formatTarihTürkçe(sevkiyat['Tamamlanma Zamanı'])}\n`;
      body += `\n`;
    });
  }
  
  body += `═`.repeat(50) + `\n\n`;
  
  // Bugün için planlanmış ama tamamlanmamış kayıtlar
  body += `⚠️ BUGÜN PLANLANMIŞ AMA TAMAMLANMAMIŞ KAYITLAR (${planlanmisTamamlanmamis.length} adet)\n`;
  body += `─`.repeat(50) + `\n\n`;
  
  if (planlanmisTamamlanmamis.length === 0) {
    body += `Bugün için planlanmış ama tamamlanmamış kayıt bulunmamaktadır.\n\n`;
  } else {
    planlanmisTamamlanmamis.forEach((sevkiyat, index) => {
      body += `${index + 1}. ${sevkiyat['ID'] || ''}\n`;
      body += `   Tarih: ${sevkiyat['Tarih'] || ''}\n`;
      body += `   Rota: ${sevkiyat['Kaynak'] || ''} → ${sevkiyat['Hedef'] || ''} (${sevkiyat['Hedef Bölge'] || ''})\n`;
      if (sevkiyat['Açıklama']) {
        body += `   Açıklama: ${sevkiyat['Açıklama']}\n`;
      }
      if (sevkiyat['Kaynak Muhatap']) {
        body += `   Kaynak Muhatap: ${sevkiyat['Kaynak Muhatap']}\n`;
      }
      if (sevkiyat['Hedef Muhatap']) {
        body += `   Hedef Muhatap: ${sevkiyat['Hedef Muhatap']}\n`;
      }
      body += `   Dağıtımcı: ${sevkiyat['Dağıtımcı'] || 'Atanmamış'}\n`;
      body += `   Durum: ${sevkiyat['Durum'] || 'Bekliyor'}\n`;
      body += `\n`;
    });
  }
  
  body += `═`.repeat(50) + `\n\n`;
  body += `Sevkiyat takip sistemine girmek için: ${APP_URL}\n\n`;
  body += `---\n`;
  body += `Bu otomatik bir günlük rapordur.\n`;
  body += `Hidroteknik Sevkiyat Takip Sistemi`;
  
  return body;
}

/**
 * Test fonksiyonu (manuel çalıştırma için)
 */
function testSendDailyReport() {
  sendDailyReport();
}

/**
 * TEST FONKSİYONU - Mail göndermez, sadece loglara yazar
 * Bu fonksiyon test için kullanılır, gerçek kişilere mail göndermez
 */
function testSendDailyReminders() {
  Logger.log('=== TEST MODU: Mail gönderilmeyecek, sadece loglara yazılacak ===\n');
  
  try {
    Logger.log('Script başlatıldı (TEST MODU). Sheet ID: ' + SHEET_ID);
    
    // Sheet ID'nin geçerli olup olmadığını kontrol et
    if (!SHEET_ID || SHEET_ID.trim() === '') {
      Logger.log('HATA: Sheet ID tanımlı değil veya boş!');
      return;
    }
    
    // Sheet'i aç
    let spreadsheet;
    try {
      Logger.log('SpreadsheetApp servisi kontrol ediliyor...');
      if (typeof SpreadsheetApp === 'undefined') {
        throw new Error('SpreadsheetApp servisi bulunamadı');
      }
      
      Logger.log('SpreadsheetApp servisi mevcut.');
      Logger.log('Sheet açılmaya çalışılıyor... Sheet ID: ' + SHEET_ID);
      Utilities.sleep(100);
      
      try {
        spreadsheet = SpreadsheetApp.openById(SHEET_ID);
      } catch (openError) {
        Logger.log('İlk deneme başarısız, tekrar deneniyor...');
        Utilities.sleep(200);
        spreadsheet = SpreadsheetApp.openById(SHEET_ID);
      }
      
      if (!spreadsheet) {
        throw new Error('Sheet açıldı ancak null döndü');
      }
      
      const sheetName = spreadsheet.getName();
      Logger.log('Sheet başarıyla açıldı: ' + sheetName);
      
    } catch (error) {
      Logger.log('HATA: Sheet açılamadı!');
      Logger.log('Hata detayı: ' + error.toString());
      return;
    }
    
    const sevkiyatlarSheet = spreadsheet.getSheetByName(SEVKIYATLAR_SHEET);
    const personelSheet = spreadsheet.getSheetByName(PERSONEL_SHEET);
    
    if (!sevkiyatlarSheet || !personelSheet) {
      Logger.log('HATA: Sheet\'ler bulunamadı!');
      return;
    }
    
    Logger.log('Sheet\'ler başarıyla açıldı');
    
    // Bugünün tarihi
    const today = new Date();
    const turkiyeSaati = new Date(today.getTime() + (3 * 60 * 60 * 1000));
    turkiyeSaati.setUTCHours(0, 0, 0, 0);
    const todayStr = Utilities.formatDate(turkiyeSaati, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    Logger.log('Bugünün tarihi (Türkiye saati): ' + todayStr);
    
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
      
      if (person['Aktif'] === true || person['Aktif'] === 'TRUE') {
        personelList.push(person);
      }
    }
    
    Logger.log('Toplam aktif personel sayısı: ' + personelList.length);
    
    // Sevkiyatları al
    const sevkiyatData = sevkiyatlarSheet.getDataRange().getValues();
    const sevkiyatHeaders = sevkiyatData[0];
    const sevkiyatlar = [];
    
    Logger.log('Toplam sevkiyat satır sayısı (başlık hariç): ' + (sevkiyatData.length - 1));
    
    let tarihYokSayisi = 0;
    let durumYokSayisi = 0;
    let tarihBugunDegilSayisi = 0;
    let durumUygunDegilSayisi = 0;
    let bugunVeBekliyorSayisi = 0;
    
    for (let i = 1; i < sevkiyatData.length; i++) {
      const row = sevkiyatData[i];
      const sevkiyat = {};
      sevkiyatHeaders.forEach((header, index) => {
        sevkiyat[header] = row[index];
      });
      
      const sevkiyatID = sevkiyat['ID'] || sevkiyat['id'] || '';
      
      if (!sevkiyat['Tarih']) {
        tarihYokSayisi++;
        continue;
      }
      
      if (!sevkiyat['Durum']) {
        durumYokSayisi++;
        continue;
      }
      
      const sevkiyatTarih = new Date(sevkiyat['Tarih']);
      const sevkiyatTarihTurkiye = new Date(sevkiyatTarih.getTime() + (3 * 60 * 60 * 1000));
      sevkiyatTarihTurkiye.setUTCHours(0, 0, 0, 0);
      const sevkiyatTarihStr = Utilities.formatDate(sevkiyatTarihTurkiye, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      
      // Durum kontrolü - önce durumu kontrol et
      if (sevkiyat['Durum'] !== 'Bekliyor' && sevkiyat['Durum'] !== 'Yolda') {
        durumUygunDegilSayisi++;
        continue;
      }
      
      // Dağıtımcı kontrolü - atanmamış sevkiyatlar için tarih kontrolü yapma
      const dagitimci = sevkiyat['Dağıtımcı'] || '';
      const isAtanmamis = !dagitimci || dagitimci.toString().trim() === '' || dagitimci.toString().trim() === 'Atanmamış';
      
      // Atanmamış sevkiyatlar: Bugün veya geçmiş tarihli olanları dahil et (gelecek tarihli olanları hariç tut)
      // Atanmış sevkiyatlar: Sadece bugünün tarihine sahip olanları dahil et
      if (isAtanmamis) {
        // Atanmamış sevkiyatlar için: Bugün veya geçmiş tarihli olanları dahil et
        const sevkiyatTarihTime = sevkiyatTarihTurkiye.getTime();
        const todayTime = turkiyeSaati.getTime();
        
        if (sevkiyatTarihTime > todayTime) {
          // Gelecek tarihli atanmamış sevkiyatları atla
          tarihBugunDegilSayisi++;
          continue;
        }
        
        // Bugün veya geçmiş tarihli atanmamış sevkiyat - dahil et
        bugunVeBekliyorSayisi++;
        sevkiyatlar.push(sevkiyat);
        Logger.log(`✓ Atanmamış sevkiyat bulundu: ${sevkiyatID} - ${sevkiyat['Kaynak'] || ''} → ${sevkiyat['Hedef'] || ''} (Tarih: ${sevkiyatTarihStr}, Durum: ${sevkiyat['Durum']})`);
      } else {
        // Atanmış sevkiyatlar için: Sadece bugünün tarihine sahip olanları dahil et
        if (sevkiyatTarihStr !== todayStr) {
          tarihBugunDegilSayisi++;
          continue;
        }
        
        // Bugünkü atanmış sevkiyat - dahil et
        bugunVeBekliyorSayisi++;
        sevkiyatlar.push(sevkiyat);
        Logger.log(`✓ Bugünkü sevkiyat bulundu: ${sevkiyatID} - ${sevkiyat['Kaynak'] || ''} → ${sevkiyat['Hedef'] || ''} (Dağıtımcı: ${dagitimci}, Durum: ${sevkiyat['Durum']})`);
      }
    }
    
    Logger.log('\n=== SEVKİYAT FİLTRELEME ÖZETİ ===');
    Logger.log('Toplam sevkiyat satırı: ' + (sevkiyatData.length - 1));
    Logger.log('Tarih yok: ' + tarihYokSayisi);
    Logger.log('Durum yok: ' + durumYokSayisi);
    Logger.log('Tarih bugün değil: ' + tarihBugunDegilSayisi);
    Logger.log('Durum uygun değil (Bekliyor/Yolda değil): ' + durumUygunDegilSayisi);
    Logger.log('Bugün ve Bekliyor/Yolda: ' + bugunVeBekliyorSayisi);
    Logger.log('Toplam bugünkü sevkiyat sayısı: ' + sevkiyatlar.length);
    Logger.log('================================\n');
    
    if (sevkiyatlar.length === 0) {
      Logger.log('UYARI: Bugün için sevkiyat bulunamadı!');
      return;
    }
    
    // Dağıtımcılara göre grupla
    const sevkiyatlarByDagitimci = {};
    
    sevkiyatlar.forEach(sevkiyat => {
      let dagitimci = sevkiyat['Dağıtımcı'];
      if (!dagitimci || dagitimci.toString().trim() === '') {
        dagitimci = 'Atanmamış';
      } else {
        dagitimci = dagitimci.toString().trim();
      }
      
      if (!sevkiyatlarByDagitimci[dagitimci]) {
        sevkiyatlarByDagitimci[dagitimci] = [];
      }
      sevkiyatlarByDagitimci[dagitimci].push(sevkiyat);
    });
    
    Logger.log('Dağıtımcı key\'leri: ' + Object.keys(sevkiyatlarByDagitimci).join(', '));
    
    // Atanmamış sevkiyatları kontrol et
    const atanmamisKey = Object.keys(sevkiyatlarByDagitimci).find(key => 
      key === 'Atanmamış' || 
      key.toString().trim() === '' || 
      !key || 
      key.toString().trim().toLowerCase() === 'atanmamış'
    );
    
    if (atanmamisKey) {
      Logger.log(`\n=== ATANMAMIŞ SEVKİYAT BULUNDU ===`);
      Logger.log(`Atanmamış sevkiyat key: "${atanmamisKey}"`);
      Logger.log(`Atanmamış sevkiyat sayısı: ${sevkiyatlarByDagitimci[atanmamisKey].length}`);
      
      const atanmamisSevkiyatlar = sevkiyatlarByDagitimci[atanmamisKey];
      
      Logger.log(`\nAtanmamış sevkiyatlar:`);
      atanmamisSevkiyatlar.forEach((sevkiyat, index) => {
        Logger.log(`${index + 1}. ${sevkiyat['Kaynak'] || ''} → ${sevkiyat['Hedef'] || ''} (${sevkiyat['Hedef Bölge'] || ''})`);
        Logger.log(`   ID: ${sevkiyat['ID'] || 'YOK'}`);
        Logger.log(`   Durum: ${sevkiyat['Durum'] || 'Bekliyor'}`);
        Logger.log(`   Tarih: ${sevkiyat['Tarih'] || 'YOK'}`);
      });
      
      Logger.log(`\nMail gönderilecek personel sayısı: ${personelList.filter(p => p['Mail']).length}`);
      Logger.log(`Mail gönderilecek personeller:`);
      personelList.filter(p => p['Mail']).forEach(personel => {
        Logger.log(`  - ${personel['İsim']} (${personel['Mail']})`);
      });
      
      Logger.log(`\n⚠️ TEST MODU: Mail gönderilmedi! Gerçek çalıştırmak için sendDailyReminders() fonksiyonunu kullanın.`);
    } else {
      Logger.log('\nAtanmamış sevkiyat bulunamadı.');
    }
    
    Logger.log('\n=== TEST TAMAMLANDI ===');
    
  } catch (error) {
    Logger.log('TEST HATASI: ' + error.toString());
    Logger.log('Hata stack: ' + (error.stack || 'Yok'));
  }
}

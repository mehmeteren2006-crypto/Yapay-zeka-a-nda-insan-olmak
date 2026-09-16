# Yapay Zeka Çağında İnsan Olmak - Etkinlik Kayıt Sistemi

## Hızlı Başlangıç

```bash
npm install
npm start
```

Tarayıcıda açın: http://localhost:3000

## Google Sheets API Kurulumu

Kayıtların otomatik olarak Google Sheets'e yazılması için aşağıdaki adımları izleyin:

### 1. Google Cloud Console'da Proje Oluşturun
1. [Google Cloud Console](https://console.cloud.google.com/) adresine gidin
2. Yeni proje oluşturun veya mevcut bir projeyi seçin
3. **APIs & Services > Library** bölümünden **Google Sheets API**'yi etkinleştirin

### 2. Service Account Oluşturun
1. **APIs & Services > Credentials** bölümüne gidin
2. **Create Credentials > Service Account** seçin
3. İsim verin (ör: "etkinlik-kayit-sistemi") ve oluşturun
4. Service account'ı oluşturduktan sonra **Keys** sekmesine gidin
5. **Add Key > Create new key > JSON** seçin
6. İndirilen JSON dosyasını projenizin kök dizinine `credentials.json` olarak kaydedin

### 3. Google Sheets Tablosu Hazırlayın
1. [Google Sheets](https://sheets.google.com/) adresinde yeni bir tablo oluşturun
2. Tablonun URL'sindeki ID'yi kopyalayın:
   - Örnek URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_BURAYA/edit`
3. Tabloyu service account e-posta adresiyle paylaşın (**Editor** yetkisiyle)
   - Service account e-postası: `credentials.json` dosyasındaki `client_email` alanı

### 4. Ortam Değişkenlerini Ayarlayın

Windows (PowerShell):
```powershell
$env:GOOGLE_SPREADSHEET_ID = "tablonuzun-id-si"
$env:GOOGLE_CREDENTIALS_PATH = "credentials.json"
npm start
```

Veya `.env` dosyası oluşturun:
```env
GOOGLE_SPREADSHEET_ID=tablonuzun-id-si
GOOGLE_CREDENTIALS_PATH=credentials.json
PORT=3000
```

## Cloudflare Turnstile Kurulumu (Opsiyonel)

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) adresine gidin
2. **Turnstile** bölümünden yeni bir site ekleyin
3. **Site Key**'i `public/index.html` dosyasındaki `data-sitekey` alanına yazın
4. **Secret Key**'i ortam değişkeni olarak ayarlayın:

```powershell
$env:TURNSTILE_SECRET_KEY = "secret-key-buraya"
```

5. `index.html` dosyasında Turnstile script satırının yorumunu kaldırın

## Dosya Yapısı

```
anket/
├── server.js                  # Express backend
├── package.json               # Bağımlılıklar
├── credentials.json           # Google API kimlik bilgileri (gitignore'a ekleyin!)
├── README.md                  # Bu dosya
└── public/
    ├── index.html             # Ana sayfa
    ├── styles.css             # Stiller + tema sistemi
    ├── app.js                 # Frontend JavaScript
    └── images/
        ├── logo-hmk.png       # HMKÜ logosu
        ├── logo-zamansiz.png  # Zamansız logosu
        ├── logo-myh.png       # MYH logosu
        ├── speaker-melodi.jpg # Konuşmacı fotoğrafı (siz ekleyeceksiniz)
        ├── speaker-dikel.jpg  # Konuşmacı fotoğrafı (siz ekleyeceksiniz)
        └── gallery/           # Geçmiş etkinlik görselleri (siz ekleyeceksiniz)
```

## Görselleri Ekleme

### Konuşmacı Fotoğrafları
1. Fotoğrafları `public/images/speaker-melodi.jpg` ve `public/images/speaker-dikel.jpg` olarak kaydedin
2. `index.html` dosyasında ilgili placeholder'ları yorum satırındaki `<img>` etiketleriyle değiştirin

### Galeri Görselleri
1. Görselleri `public/images/gallery/` klasörüne kaydedin
2. `index.html` dosyasındaki gallery-item'larda placeholder'ları gerçek görsellerle değiştirin

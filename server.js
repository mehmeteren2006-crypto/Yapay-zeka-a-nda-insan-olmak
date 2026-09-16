/* ============================================
   YAPAY ZEKÂ ÇAĞINDA İNSAN OLMAK
   Backend Server - Node.js + Express
   Google Sheets API · Rate Limiting · Turnstile
   ============================================ */

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { google } = require('googleapis');
const ExcelJS = require('exceljs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// === Admin Authentication Configuration ===
const VALID_ADMIN_USERNAMES = (process.env.ADMIN_USERNAMES || 'myh,admin,zamansiz,eren')
    .split(',')
    .map(u => u.trim().toLowerCase());

const VALID_ADMIN_PASSWORDS = (process.env.ADMIN_PASSWORDS || 'tevekkül,tevekkul')
    .split(',')
    .map(p => p.trim().toLowerCase());

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'myh-tevekkul-zirve-2026-auth-token-secret-key';

function generateAdminToken(username) {
    const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 gün geçerli
    const payload = `${username}:${expiresAt}`;
    const hmac = crypto.createHmac('sha256', ADMIN_SECRET).update(payload).digest('hex');
    return Buffer.from(`${payload}:${hmac}`).toString('base64');
}

function verifyAdminToken(token) {
    if (!token) return null;
    try {
        const decoded = Buffer.from(token, 'base64').toString('utf8');
        const parts = decoded.split(':');
        if (parts.length !== 3) return null;
        const [username, expiresStr, hmac] = parts;
        const expiresAt = parseInt(expiresStr, 10);
        if (isNaN(expiresAt) || Date.now() > expiresAt) return null;

        const expectedHmac = crypto.createHmac('sha256', ADMIN_SECRET).update(`${username}:${expiresStr}`).digest('hex');
        if (hmac === expectedHmac) {
            return { username };
        }
    } catch (err) {
        return null;
    }
    return null;
}

function extractAdminToken(req) {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7).trim();
    }
    const cookieHeader = req.headers['cookie'];
    if (cookieHeader) {
        const match = cookieHeader.match(/(?:^|;\s*)admin_token=([^;]+)/);
        if (match) {
            return decodeURIComponent(match[1]).trim();
        }
    }
    return null;
}

function requireAdminAuth(req, res, next) {
    const token = extractAdminToken(req);
    const user = verifyAdminToken(token);
    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Bu alana erişmek için yönetici girişi yapmalısınız.'
        });
    }
    req.adminUser = user;
    next();
}

// === Middleware ===
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// === Rate Limiting ===
// Genel istekler için: dakikada 100 istek
const generalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 dakika
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Çok fazla istek gönderildi. Lütfen biraz bekleyiniz.' }
});

// Kayıt formu için: dakikada 5 kayıt (aynı IP)
const registrationLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 dakika
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Çok fazla başvuru gönderildi. Lütfen 1 dakika bekleyiniz.' }
});

app.use(generalLimiter);

// === Google Sheets Configuration ===
// Kurulum talimatları aşağıda (setup bölümünde)
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || '1Q7abT-Zs8SnCKWoXEuayAzkD4XJdHW1XWFLXssATH7o';
const GOOGLE_CREDENTIALS_PATH = process.env.GOOGLE_CREDENTIALS_PATH || '';
const GOOGLE_CREDENTIALS_JSON = process.env.GOOGLE_CREDENTIALS_JSON || '';
const GOOGLE_SHEET_WEBHOOK_URL = process.env.GOOGLE_SHEET_WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbzYjOCblfEqT1Mzah1UIWTK5ITSMgOJdo9wxM_UYX18B70-ayXkKSs1RFk6cSzLzq_i/exec';

let sheetsClient = null;

async function initGoogleSheets() {
    if (GOOGLE_SHEET_WEBHOOK_URL) {
        console.log('✅ Google Sheets Webhook devrede: Kayıtlar Google E-Tablonuza anlık olarak aktarılacak.');
    }

    if (!SPREADSHEET_ID || (!GOOGLE_CREDENTIALS_PATH && !GOOGLE_CREDENTIALS_JSON)) {
        if (!GOOGLE_SHEET_WEBHOOK_URL) {
            console.log('⚠️  Google Sheets Service Account anahtarı veya Webhook tanımlanmamış. Veriler lokal Excel ve konsola kaydedilecek.');
        }
        return null;
    }

    try {
        const authOptions = {
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        };

        if (GOOGLE_CREDENTIALS_JSON) {
            try {
                authOptions.credentials = JSON.parse(GOOGLE_CREDENTIALS_JSON);
            } catch (e) {
                console.error('GOOGLE_CREDENTIALS_JSON JSON ayrıştırma hatası:', e.message);
                return null;
            }
        } else if (GOOGLE_CREDENTIALS_PATH) {
            authOptions.keyFile = GOOGLE_CREDENTIALS_PATH;
        }

        const auth = new google.auth.GoogleAuth(authOptions);
        const client = await auth.getClient();
        sheetsClient = google.sheets({ version: 'v4', auth: client });

        // İlk çalıştırmada başlık satırını oluştur
        await ensureHeaders();
        console.log('✅ Google Sheets API bağlantısı başarılı!');
        return sheetsClient;
    } catch (error) {
        console.error('❌ Google Sheets bağlantı hatası:', error.message);
        return null;
    }
}

let activeSheetName = 'Sayfa1';

async function ensureHeaders() {
    if (!sheetsClient) return;

    try {
        const meta = await sheetsClient.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
        if (meta.data.sheets && meta.data.sheets.length > 0) {
            activeSheetName = meta.data.sheets[0].properties.title || 'Sayfa1';
        }

        const response = await sheetsClient.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${activeSheetName}!A1:R1`,
        });

        if (!response.data.values || response.data.values.length === 0) {
            // Başlık satırını ekle
            await sheetsClient.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: `${activeSheetName}!A1`,
                valueInputOption: 'RAW',
                resource: {
                    values: [[
                        'Kayıt Tarihi',
                        'Ad',
                        'Soyad',
                        'E-posta',
                        'Telefon',
                        'Bölüm',
                        'Sınıf',
                        'Üniversite',
                        'Nereden Katılacak',
                        'Otobüs İhtiyacı',
                        'Diyet/Erişilebilirlik',
                        'Yapay Zeka Deneyimi',
                        'Daha Önce Katılım',
                        'Beklenti',
                        'Konuşmacılara Sorular',
                        'Nereden Duydu',
                        'IP Adresi'
                    ]]
                }
            });
            console.log(`📋 [${activeSheetName}] Başlık satırı oluşturuldu.`);
        }
    } catch (error) {
        console.error('Başlık oluşturma hatası:', error.message);
    }
}

async function appendToSheet(data) {
    let saved = false;

    // 1. Google Apps Script Webhook (Kolay & Hızlı Kurulum)
    const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL || GOOGLE_SHEET_WEBHOOK_URL;
    if (webhookUrl) {
        try {
            const resp = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'append', row: data })
            });
            if (resp.ok) {
                console.log('   ✅ Webhook üzerinden Google Sheets\'e aktarıldı');
                saved = true;
            }
        } catch (err) {
            console.error('Google Sheets Webhook hatası:', err.message);
        }
    }

    // 2. Google Sheets API v4 (Service Account)
    if (sheetsClient) {
        try {
            await sheetsClient.spreadsheets.values.append({
                spreadsheetId: SPREADSHEET_ID,
                range: `${activeSheetName}!A:R`,
                valueInputOption: 'RAW',
                insertDataOption: 'INSERT_ROWS',
                resource: {
                    values: [data]
                }
            });
            console.log('   ✅ Google Sheets API ile tabloya kaydedildi');
            saved = true;
        } catch (error) {
            console.error('Google Sheets yazma hatası:', error.message);
        }
    }

    return saved;
}

// === Local Excel (kayitlar.xlsx) Fallback & Storage ===
const EXCEL_FILE_PATH = path.join(__dirname, 'kayitlar.xlsx');

const EXCEL_HEADERS = [
    { header: 'Kayıt Tarihi', key: 'timestamp', width: 22 },
    { header: 'Ad', key: 'firstName', width: 16 },
    { header: 'Soyad', key: 'lastName', width: 16 },
    { header: 'E-posta', key: 'email', width: 28 },
    { header: 'Telefon', key: 'phone', width: 18 },
    { header: 'Bölüm', key: 'department', width: 28 },
    { header: 'Sınıf', key: 'grade', width: 12 },
    { header: 'Üniversite', key: 'university', width: 30 },
    { header: 'Nereden Katılacak', key: 'city', width: 20 },
    { header: 'Otobüs İhtiyacı', key: 'busNeeded', width: 16 },
    { header: 'Diyet/Erişilebilirlik', key: 'dietaryNeeds', width: 22 },
    { header: 'Yapay Zeka Deneyimi', key: 'aiExperience', width: 22 },
    { header: 'Daha Önce Katılım', key: 'previousEvents', width: 18 },
    { header: 'Beklenti', key: 'expectations', width: 35 },
    { header: 'Konuşmacılara Sorular', key: 'questions', width: 35 },
    { header: 'Nereden Duydu', key: 'hearAbout', width: 20 },
    { header: 'IP Adresi', key: 'ip', width: 18 }
];

async function appendToLocalExcel(rowData) {
    try {
        const workbook = new ExcelJS.Workbook();
        let worksheet;

        if (fs.existsSync(EXCEL_FILE_PATH)) {
            await workbook.xlsx.readFile(EXCEL_FILE_PATH);
            worksheet = workbook.getWorksheet('Kayıtlar') || workbook.addWorksheet('Kayıtlar');
        } else {
            worksheet = workbook.addWorksheet('Kayıtlar');
            worksheet.columns = EXCEL_HEADERS;

            // Şık başlık stili (Lacivert arkaplan, beyaz kalın yazı)
            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF0F172A' } // Slate 900
            };
            headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
            headerRow.height = 30;
            worksheet.views = [{ state: 'frozen', ySplit: 1 }];
        }

        const newRow = worksheet.addRow(rowData);
        newRow.alignment = { vertical: 'middle' };
        newRow.height = 24;

        // Çizgili satır efekti (zebra striping)
        if (worksheet.rowCount % 2 === 0) {
            newRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF8FAFC' }
            };
        }

        // İnce kenarlıklar
        newRow.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
            };
        });

        await workbook.xlsx.writeFile(EXCEL_FILE_PATH);
        return true;
    } catch (error) {
        console.error('Lokal Excel yazma hatası:', error.message);
        return false;
    }
}

// === Cloudflare Turnstile Verification ===
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY || '';

async function verifyTurnstile(token, ip) {
    if (!TURNSTILE_SECRET) {
        // Turnstile yapılandırılmamışsa geç
        return true;
    }

    try {
        const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                secret: TURNSTILE_SECRET,
                response: token,
                remoteip: ip,
            }),
        });

        const data = await response.json();
        return data.success === true;
    } catch (error) {
        console.error('Turnstile doğrulama hatası:', error.message);
        return false;
    }
}

// === Validation ===
function validateRegistration(body) {
    const errors = [];

    if (!body.firstName?.trim()) errors.push('Ad gereklidir');
    if (!body.lastName?.trim()) errors.push('Soyad gereklidir');
    if (!body.email?.trim()) errors.push('E-posta gereklidir');
    if (!body.phone?.trim()) errors.push('Telefon gereklidir');
    if (!body.department?.trim()) errors.push('Bölüm gereklidir');
    if (!body.grade) errors.push('Sınıf gereklidir');
    if (!body.city?.trim()) errors.push('Şehir gereklidir');
    if (!body.busNeeded) errors.push('Otobüs bilgisi gereklidir');
    if (!body.aiExperience) errors.push('Yapay zekâ deneyimi gereklidir');
    if (!body.expectations?.trim()) errors.push('Beklenti alanı gereklidir');
    if (!body.hearAbout) errors.push('Nereden duyduğunuz gereklidir');

    // Email validation
    if (body.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.email)) {
            errors.push('Geçerli bir e-posta adresi girin');
        }
    }

    // Phone validation
    if (body.phone) {
        const phoneDigits = body.phone.replace(/\D/g, '');
        if (phoneDigits.length < 10 || phoneDigits.length > 11) {
            errors.push('Geçerli bir telefon numarası girin');
        }
    }

    return errors;
}

// === API Routes ===

// Kayıt endpoint'i
app.post('/api/kayit', registrationLimiter, async (req, res) => {
    try {
        // Turnstile doğrulama
        const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
        if (TURNSTILE_SECRET && req.body.turnstileToken) {
            const isHuman = await verifyTurnstile(req.body.turnstileToken, clientIP);
            if (!isHuman) {
                return res.status(403).json({
                    success: false,
                    message: 'Bot doğrulaması başarısız. Lütfen tekrar deneyin.'
                });
            }
        }

        // Validasyon
        const errors = validateRegistration(req.body);
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: errors.join(', ')
            });
        }

        const now = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });

        const rowData = [
            now,
            req.body.firstName.trim(),
            req.body.lastName.trim(),
            req.body.email.trim(),
            req.body.phone.trim(),
            req.body.department.trim(),
            req.body.grade,
            req.body.university?.trim() || '',
            req.body.city.trim(),
            req.body.busNeeded,
            req.body.dietaryNeeds?.trim() || '',
            req.body.aiExperience,
            req.body.previousEvents || '',
            req.body.expectations.trim(),
            req.body.questions?.trim() || '',
            req.body.hearAbout,
            clientIP
        ];

        // Google Sheets'e yaz
        const sheetSuccess = await appendToSheet(rowData);

        // Lokal Excel'e yaz (her zaman - yedek olarak)
        const excelSuccess = await appendToLocalExcel(rowData);

        // Konsola da yaz
        console.log('\n📝 Yeni Kayıt:');
        console.log(`   Ad Soyad: ${req.body.firstName} ${req.body.lastName}`);
        console.log(`   E-posta: ${req.body.email}`);
        console.log(`   Telefon: ${req.body.phone}`);
        console.log(`   Bölüm: ${req.body.department} - ${req.body.grade}`);
        console.log(`   Şehir: ${req.body.city} | Otobüs: ${req.body.busNeeded}`);
        console.log(`   Tarih: ${now}`);
        if (sheetSuccess) console.log('   ✅ Google Sheets\'e kaydedildi');
        if (excelSuccess) console.log('   ✅ Lokal Excel\'e kaydedildi');

        res.json({
            success: true,
            message: 'Başvurunuz başarıyla alındı!'
        });

    } catch (error) {
        console.error('Kayıt hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.'
        });
    }
});

// === Admin Authentication Endpoints ===

// Admin Giriş (Login)
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body || {};
    const u = (username || '').trim().toLowerCase();
    const p = (password || '').trim().toLowerCase();

    if (!u || !p) {
        return res.status(400).json({ success: false, message: 'Kullanıcı adı ve şifre zorunludur.' });
    }

    const userValid = VALID_ADMIN_USERNAMES.includes(u);
    const passValid = VALID_ADMIN_PASSWORDS.includes(p);

    if (userValid && passValid) {
        const token = generateAdminToken(u);
        res.setHeader('Set-Cookie', `admin_token=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${7 * 24 * 3600}`);
        return res.json({
            success: true,
            token,
            username: u,
            message: 'Giriş başarılı'
        });
    }

    return res.status(401).json({
        success: false,
        message: 'Kullanıcı adı veya şifre hatalı!'
    });
});

// Admin Çıkış (Logout)
app.post('/api/admin/logout', (req, res) => {
    res.setHeader('Set-Cookie', 'admin_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
    res.json({ success: true, message: 'Başarıyla çıkış yapıldı' });
});

// Admin Oturum Durumu Kontrolü
app.get('/api/admin/check', (req, res) => {
    const token = extractAdminToken(req);
    const user = verifyAdminToken(token);
    res.json({
        authenticated: !!user,
        username: user ? user.username : null
    });
});

// Google Sheets'ten Canlı Kayıt Çekme Fonksiyonu
async function fetchGoogleSheetRows() {
    const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL || GOOGLE_SHEET_WEBHOOK_URL;
    if (!webhookUrl) return null;

    try {
        const resp = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'read' })
        });
        if (!resp.ok) return null;
        const data = await resp.json();
        if (data && Array.isArray(data.values) && data.values.length > 1) {
            return data.values;
        }
    } catch (err) {
        // Hata durumunda sessizce local Excel fallback'e geç
    }
    return null;
}

// Google Sheets'ten Satır Silme Fonksiyonu
async function deleteGoogleSheetRow(rowNumber) {
    const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL || GOOGLE_SHEET_WEBHOOK_URL;
    if (!webhookUrl) return false;

    try {
        const resp = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', rowNumber })
        });
        return resp.ok;
    } catch (err) {
        console.error('Google Sheet silme hatası:', err.message);
        return false;
    }
}

// === Admin Veri Endpoint'leri (Korumalı) ===

// Kayıtları JSON olarak listele (Öncelikli olarak canlı Google Sheets'ten çeker)
app.get('/api/admin/kayitlar', requireAdminAuth, async (req, res) => {
    try {
        // 1. Canlı Google E-Tablo'dan oku
        const sheetValues = await fetchGoogleSheetRows();
        if (sheetValues && sheetValues.length > 1) {
            const headers = sheetValues[0];
            const registrations = [];
            for (let i = 1; i < sheetValues.length; i++) {
                const row = sheetValues[i];
                if (!row || row.length === 0 || !row[1]) continue;
                const entry = {};
                row.forEach((cell, idx) => {
                    entry[headers[idx] || `col_${idx}`] = cell !== undefined ? String(cell) : '';
                });
                entry._rowNumber = i + 1;
                registrations.push(entry);
            }

            return res.json({
                success: true,
                count: registrations.length,
                source: 'google_sheets',
                registrations
            });
        }

        // 2. Yedek: Lokal Excel'den oku
        const excelPath = path.join(__dirname, 'kayitlar.xlsx');
        if (!fs.existsSync(excelPath)) {
            return res.json({ success: true, count: 0, registrations: [] });
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(excelPath);
        const worksheet = workbook.getWorksheet('Kayıtlar');

        const registrations = [];
        const headers = [];

        worksheet.eachRow((row, rowNumber) => {
            const values = row.values.slice(1); // ExcelJS 1-indexed
            if (rowNumber === 1) {
                values.forEach(v => headers.push(v));
            } else {
                const entry = {};
                values.forEach((v, i) => {
                    entry[headers[i] || `col_${i}`] = v || '';
                });
                entry._rowNumber = rowNumber;
                registrations.push(entry);
            }
        });

        res.json({
            success: true,
            count: registrations.length,
            source: 'local_excel',
            registrations
        });
    } catch (error) {
        console.error('Kayıt listeleme hatası:', error);
        res.status(500).json({ success: false, message: 'Veriler okunamadı' });
    }
});

// Excel dosyasını indir (Google Sheets canlı verisinden anlık üretir veya lokal dosyayı sunar)
app.get('/api/admin/indir', requireAdminAuth, async (req, res) => {
    try {
        const sheetValues = await fetchGoogleSheetRows();
        if (sheetValues && sheetValues.length > 1) {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Kayıtlar');
            worksheet.columns = EXCEL_HEADERS;

            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF0F172A' }
            };
            headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
            headerRow.height = 30;
            worksheet.views = [{ state: 'frozen', ySplit: 1 }];

            for (let i = 1; i < sheetValues.length; i++) {
                const row = sheetValues[i];
                if (!row || row.length === 0 || !row[1]) continue;
                worksheet.addRow(row);
            }

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=etkinlik-kayitlar-${new Date().toISOString().split('T')[0]}.xlsx`);
            await workbook.xlsx.write(res);
            return res.end();
        }

        const excelPath = path.join(__dirname, 'kayitlar.xlsx');
        if (!fs.existsSync(excelPath)) {
            return res.status(404).json({ success: false, message: 'Henüz kayıt bulunmuyor' });
        }
        res.download(excelPath, `etkinlik-kayitlar-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
        console.error('Excel indirme hatası:', err);
        res.status(500).json({ success: false, message: 'Dosya oluşturulamadı' });
    }
});

// Sağlık kontrolü
app.get('/api/health', (req, res) => {
    const excelPath = path.join(__dirname, 'kayitlar.xlsx');
    res.json({
        status: 'ok',
        sheetsConnected: !!sheetsClient || !!GOOGLE_SHEET_WEBHOOK_URL,
        turnstileEnabled: !!TURNSTILE_SECRET,
        localExcel: fs.existsSync(excelPath),
        timestamp: new Date().toISOString()
    });
});

// Admin Arayüzü Sayfası (Korumalı Dosya)
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'private', 'admin.html'));
});

// KVKK Aydınlatma Metni Sayfası
app.get('/kvkk', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'kvkk.html'));
});

// Test verisi oluşturma endpoint'i
app.post('/api/admin/seed-test', requireAdminAuth, async (req, res) => {
    try {
        const sampleRecords = [
            {
                firstName: 'Ahmet',
                lastName: 'Yılmaz',
                email: 'ahmet.yilmaz@hmku.edu.tr',
                phone: '0532 111 22 33',
                department: 'Bilgisayar Mühendisliği',
                grade: '3. Sınıf',
                university: 'Hatay Mustafa Kemal Üniversitesi',
                city: 'Antakya (Kampüs)',
                busNeeded: 'Hayır',
                dietaryNeeds: '',
                aiExperience: 'Orta Seviye (Projeler geliştirdim)',
                previousEvents: 'Evet',
                expectations: 'Büyük dil modellerinin gelecekteki istihdama etkisi ve etik sorunları öğrenmek.',
                questions: 'Yapay zeka modellerinin telif hakkı ve akademik dürüstlük açısından sınırları nereye evrilecek?',
                hearAbout: 'Kulüp / Topluluk Duyurusu'
            },
            {
                firstName: 'Zeynep',
                lastName: 'Kaya',
                email: 'zeynep.kaya@hmku.edu.tr',
                phone: '0544 555 66 77',
                department: 'Tıp Fakültesi',
                grade: '4. Sınıf',
                university: 'Hatay Mustafa Kemal Üniversitesi',
                city: 'İskenderun',
                busNeeded: 'Evet (İskenderun Servisi)',
                dietaryNeeds: 'Vejetaryen',
                aiExperience: 'Temel Seviye (ChatGPT, Claude kullanıyorum)',
                previousEvents: 'Hayır',
                expectations: 'Tıpta tanı ve teşhis süreçlerinde yapay zekanın hekimlik mesleğini nasıl dönüştüreceği.',
                questions: 'Yapay zeka klinik kararlarda hata yaptığında hukuki ve mesleki sorumluluk kime ait olacak?',
                hearAbout: 'Instagram'
            },
            {
                firstName: 'Mert',
                lastName: 'Demir',
                email: 'mert.demir@ogr.cu.edu.tr',
                phone: '0505 888 99 00',
                department: 'Psikoloji',
                grade: '2. Sınıf',
                university: 'Çukurova Üniversitesi',
                city: 'Adana',
                busNeeded: 'Evet (Adana Servisi)',
                dietaryNeeds: '',
                aiExperience: 'Meraklıyım / Henüz Deneyimim Yok',
                previousEvents: 'Evet',
                expectations: 'İnsan bilinci, duygusal bağlar ve AI etkileşimi üzerine felsefi tartışmaları dinlemek.',
                questions: 'Dr. Melodi Çiftçi\'ye: Yapay zeka ile kurulan duygusal bağlar insan ilişkilerini köreltir mi yoksa zenginleştirir mi?',
                hearAbout: 'Afiş / Kampüs Standı'
            },
            {
                firstName: 'Selin',
                lastName: 'Öztürk',
                email: 'selin.ozturk@hmku.edu.tr',
                phone: '0533 444 11 22',
                department: 'İktisadi ve İdari Bilimler',
                grade: 'Mezun',
                university: 'Hatay Mustafa Kemal Üniversitesi',
                city: 'Defne',
                busNeeded: 'Hayır',
                dietaryNeeds: '',
                aiExperience: 'İleri Seviye (Kendi şirketimde AI entegre ediyorum)',
                previousEvents: 'Evet',
                expectations: 'Zamansız ve Hasbro marka deneyimleriyle kurumsal dünyada üretken yapay zeka adaptasyonu.',
                questions: 'Ali Murathan Dikel\'e: Oyuncak ve eğlence sektöründe üretken AI kullanımında en çok hangi engellerle karşılaşıyorsunuz?',
                hearAbout: 'LinkedIn'
            }
        ];

        let addedCount = 0;
        const now = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });

        for (const record of sampleRecords) {
            const rowData = [
                now,
                record.firstName,
                record.lastName,
                record.email,
                record.phone,
                record.department,
                record.grade,
                record.university,
                record.city,
                record.busNeeded,
                record.dietaryNeeds,
                record.aiExperience,
                record.previousEvents,
                record.expectations,
                record.questions,
                record.hearAbout,
                '127.0.0.1 (Test Verisi)'
            ];

            await appendToLocalExcel(rowData);
            await appendToSheet(rowData);
            addedCount++;
        }

        res.json({
            success: true,
            message: `${addedCount} adet gerçekçi örnek başvuru başarıyla Excel'e kaydedildi!`
        });
    } catch (error) {
        console.error('Test veri ekleme hatası:', error);
        res.status(500).json({ success: false, message: 'Test verisi eklenemedi' });
    }
});

// Tek bir kaydı sil
app.delete('/api/admin/kayit/:rowNumber', requireAdminAuth, async (req, res) => {
    try {
        const rowNum = parseInt(req.params.rowNumber, 10);
        if (isNaN(rowNum) || rowNum <= 1) {
            return res.status(400).json({ success: false, message: 'Geçersiz satır numarası' });
        }

        // 1. Google Sheets'ten satırı sil
        await deleteGoogleSheetRow(rowNum);

        // 2. Lokal Excel'den de sil (varsa)
        const excelPath = path.join(__dirname, 'kayitlar.xlsx');
        if (fs.existsSync(excelPath)) {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(excelPath);
            const worksheet = workbook.getWorksheet('Kayıtlar');
            if (worksheet && rowNum <= worksheet.rowCount) {
                worksheet.spliceRows(rowNum, 1);
                await workbook.xlsx.writeFile(excelPath);
            }
        }

        res.json({ success: true, message: 'Kayıt başarıyla silindi.' });
    } catch (error) {
        console.error('Silme hatası:', error);
        res.status(500).json({ success: false, message: 'Silme işlemi sırasında hata oluştu' });
    }
});

// Lokal Excel kayıtlarını sıfırla
app.delete('/api/admin/temizle', requireAdminAuth, (req, res) => {
    try {
        const excelPath = path.join(__dirname, 'kayitlar.xlsx');
        if (fs.existsSync(excelPath)) {
            fs.unlinkSync(excelPath);
        }
        res.json({ success: true, message: 'Lokal Excel kayıt listesi sıfırlandı.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Sıfırlama hatası' });
    }
});

// SPA fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// === Start Server ===
async function start() {
    await initGoogleSheets();

    app.listen(PORT, () => {
        console.log('\n🚀 ═══════════════════════════════════════════');
        console.log('   Yapay Zekâ Çağında İnsan Olmak');
        console.log('   Etkinlik Kayıt Sistemi');
        console.log(`   http://localhost:${PORT}`);
        console.log('═══════════════════════════════════════════════');
        console.log(`\n📊 Google Sheets: ${sheetsClient || GOOGLE_SHEET_WEBHOOK_URL ? '✅ Aktif (Google E-Tablo Bağlı)' : '⚠️  Yapılandırılmamış'}`);
        console.log(`📁 Lokal Excel:  ✅ Aktif (kayitlar.xlsx)`);
        console.log(`🛡️  Turnstile:    ${TURNSTILE_SECRET ? '✅ Aktif' : '⚠️  Yapılandırılmamış'}`);
        console.log(`🔒 Rate Limit:   ✅ Aktif (5 kayıt/dakika)`);
        console.log(`\n📋 Admin Panel:`);
        console.log(`   Kayıtları Listele: http://localhost:${PORT}/api/admin/kayitlar`);
        console.log(`   Excel İndir:       http://localhost:${PORT}/api/admin/indir`);
        console.log('');
    });
}

start();

const fs = require('fs');
const path = require('path');
require('dotenv').config(); // Membaca file .env

// 1. Path file target: data/json/user.json
const jsonPath = path.join(__dirname, 'data', 'json', 'user.json');
const jsonDir = path.dirname(jsonPath);

// 2. Ambil data user dari .env
const defaultUser = {
  username: process.env.NAME_DEFAULT || process.env.DEFAULT_USER || 'Solihul Hadi',
  email: process.env.EMAIL_DEFAULT || process.env.DEFAULT_EMAIL || 'dhiforester@gmail.com',
  password: process.env.PASSWORD_DEFAULT || process.env.DEFAULT_PASSWORD || 'admin123',
  contact: process.env.CONTACT_DEFAULT || '089601154726',
  avatar: process.env.PROFILE_DEFAULT || 'no-image.png',
  created_at: new Date().toISOString()
};

// 3. Pastikan direktori data/json/ sudah ada, jika belum buat foldernya
if (!fs.existsSync(jsonDir)) {
  fs.mkdirSync(jsonDir, { recursive: true });
}

// 4. Baca file user.json yang sudah ada (jika ada), atau buat objek/array baru
let userData = {};
if (fs.existsSync(jsonPath)) {
  try {
    const fileContent = fs.readFileSync(jsonPath, 'utf8');
    // Jika isi file kosong, inisialisasi sebagai objek kosong
    userData = fileContent.trim() ? JSON.parse(fileContent) : {};
  } catch (err) {
    console.error('⚠️ Gagal membaca/parse user.json, membuat struktur baru:', err.message);
  }
}

// 5. Masukkan data default user ke dalam file JSON
userData.default_user = defaultUser;

// 6. Tulis kembali ke data/json/user.json
try {
  fs.writeFileSync(jsonPath, JSON.stringify(userData, null, 2), 'utf8');
  console.log('✅ Berhasil menulis default user dari .env ke data/json/user.json');
} catch (err) {
  console.error('❌ Gagal menulis file user.json:', err.message);
}
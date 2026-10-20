# FIRST PROMPT
Baca file `docs\.agentrules` dan `docs\stylerules.md` terlebih dulu.
Buatkan sebauh aplikasi yang bernama 'Workflow-Generator' berbasis web dengan ketentuan sebagai berikut:
## Tujuan dan Fungsi
1. Untuk mempermudah pengguna dalam pembuatan desain workflow sederhana tanpa menggunakan layanan web yang kompleks.
2. Membuat desain workflow dengan garis interaktif dengan animasi seperti air mengalir tanpa membutuhkan editor.
3. Tampilan sederhana dan ringkas tanpa fitur rumit.
## Tech Stack
1. HTML
2. CSS
3. Javascript
4. Pustaka dan dependesi baca sesuai `package.json`
## Fitur
1. Halaman Login
  - Terdapat judul halaman 'Selamat Datang' Kemudian 'Silahkan Login Terlebih Dulu'
  - Terdaapt form email dan password
  - Terdapat tombol tampilkan password
  - Terdapat tombol login
2. Halaman Utama
  - Menampilkan logo, nama aplikasi, foto profil pengguna, nama pengguna dan drop down untuk lihat profil, edit profil dan logout, tombol mode gelap.
  - Menampilkan toolbar kiri yang terdiri dari :
    - Creat Project (menambah project baru)
    - List Project (sesuai `data\json\project\project_by_user.json`)
  - Menampilkan canvas untuk menggambar workflow dengan latar putih. Pada canvas, user bisa melakukan hal berikut :
    - Menggeser shape
    - Menghubungkan antar shape dengan garis
    - Menambahkan properti shape (title, subtitle, color, icon)
    - Apabila shape di click maka sistem akan ditampilkan detail shape yang bisa diubah.
    - user dapat menentukan apakah garis antar shape menggunakan warna statis atau menggunakan animasi seperti cahaya yang mengalir.
  - Menampilkan toolbar kanan yang terdiri dari :
    - Add Shape (menambah shape baru)
    - Download (download ke format PNG, JPG, GIF dll)
  ## Referensi Desain Tampilan
 1. Desain tampilan login disimpan di `design\Login.png`
 2. Desain tampilan halaman utama disimpan di `design\Main.png`
 3. Desain tampilan secara deskriptif di `design\design_description.md`
 ## Cara Kerja Membuat dan Menyimpan Project
 1. Setiap project yang dibuat akan menghasilkan file json yang disimpan pada `data\json\project`
 2. File json project tersebut diberi nama sesuai tanggal, waktu hingga detik agar unik.
 3. File project menyimpan semua properti parameter yang dibutuhkan untuk merepresentasikan workflow yang dibuat, termasuk nama project dan identitas user.
 4. Agar file project antar user tidak bercampur, maka digunakan file `data\json\project\project_by_user.json` untuk mencatat index project berdasarkan user.
 5. Agar tidak berat, proses penyimpanan project saat digunakan tidak perlu realtime. setiap perubahan yang terjadi pada canvas di catat pada json setiap interval beberapa detik sekali. 
 ## Cara kerja Sistem Membuat dan menyimpan Workflow/flowmap
 1. Gunakan pustaka gojs untuk membuat shape, line, animation dan lainnya
 2. Setiap parameter ukuran, posisi, warna, prilaku disimpan pada file project dalam bentuk parameter json yang telah dibuat.
 3. User dapat menambahkan shape dan mengatur parameter title, subtitle, color dan icon. Kemudian sistem menyimpannya pada file project



# UI/UX & Design System Agent Rules

## 1. Color Palette & Branding
- Primary Accent: Yellow (`#FFCC00` / `bg-yellow-400`) — Digunakan untuk tombol CTA utama, tombol aksi sidebar, dan elemen sorotan utama[cite: 1, 2].
- Base Neutrals:
  - Pitch Black (`#000000`): Digunakan untuk latar belakang split-screen, teks judul utama, ikon, serta garis tepi (border) yang tegas[cite: 1, 2].
  - Pure White (`#FFFFFF`): Digunakan untuk kartu form utama, latar belakang canvas workspace, dan node diagram[cite: 1, 2].
  - Light / Neutral Gray (`#F3F4F6` / `#E5E7EB`): Digunakan untuk tombol sekunder, input placeholder, dan latar belakang field[cite: 1, 2].
- Node & Status Accent Borders (Diagram):
  - Green (`#22C55E`): Indikator start/success[cite: 2].
  - Red (`#EF4444`): Indikator alert/process[cite: 2].
  - Black (`#000000`): Indikator netral/default[cite: 2].
  - Blue (`#3B82F6`): Indikator info/secondary[cite: 2].

## 2. Component Specifications
- Cards & Floating Panels:
  - Outer Glass Cards: Sudut membulat besar (`rounded-2xl` / 24px), efek transparan gelap / glassmorphism, serta border hitam tipis[cite: 1].
  - Inner Cards & Modals: Latar belakang putih solid (`bg-white`), sudut membulat sedang (`rounded-xl` / 12px), dengan border tegas atau bayangan halus[cite: 1, 2].
- Primary Buttons:
  - Latar belakang kuning terang (`#FFCC00`) dengan border hitam tipis (`border border-black`)[cite: 1].
  - Teks bold berwarna hitam, rata tengah[cite: 1, 2].
- Secondary Buttons & Inputs:
  - Tombol sekunder menggunakan warna abu-abu netral (`bg-gray-200`)[cite: 2].
  - Input field menggunakan sudut membulat (`rounded-lg`), garis tepi abu-abu tipis, dan teks placeholder abu-abu terang[cite: 1, 2].

## 3. Layout & Structure Patterns
- Split-Screen Pattern: Pembagian layar vertikal 50/50 (Kuning di kiri, Hitam di kanan) untuk halaman autentikasi/login[cite: 1].
- Top Header: Latar putih bersih dengan border bawah hitam tipis, memuat logo di sisi kiri serta toggle tema (Matahari/Bulan) dan avatar pengguna di sisi kanan[cite: 2].
- Workspace & Canvas: Latar belakang putih luas dengan toolbar melayang (*floating toolbars*) bersudut membulat di sudut-sudut canvas[cite: 2].
- Diagram Nodes: Kartu node berbentuk persegi panjang bersudut tumpul dengan border warna spesifik dan terhubung menggunakan garis panah (*connector arrows*)[cite: 2].

## 4. Typography & Icons
- Font Family: Clean Sans-Serif (Inter, System UI, atau Helvetica).
- Header Text: Bold, tegas, berwarna hitam (`text-black font-bold`)[cite: 1, 2].
- Micro Text / Captions: Teks bantuan/catatan di bawah tombol menggunakan ukuran kecil, warna abu-abu (`text-xs text-gray-600`)[cite: 1].
- Icons: Menggunakan ikon bertipe *outline/line art* yang minimalis (misal: Lucide Icons)[cite: 2].
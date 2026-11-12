# ParkirKu — Frontend Sprint 1

Frontend aplikasi parkir menggunakan HTML, CSS, dan JavaScript murni (ES Modules). Tampilan mengikuti activity diagram dengan tiga role pengguna: Admin, Petugas, dan Owner. Customer tidak perlu login karena alurnya dilayani petugas.

## Menjalankan project
1. Pastikan Node.js dan npm sudah terpasang.
2. Buka folder project ini di terminal.
3. Jalankan `npm start`; server lokal akan hidup dan browser terbuka otomatis di `http://127.0.0.1:5500/`.
4. Tekan `Ctrl+C` di terminal untuk menghentikan server.
5. Login demo dengan username dan password bebas, lalu pilih role Admin, Petugas, atau Owner.

## Isi Sprint 1
- Struktur folder dan JavaScript module.
- Halaman login.
- Demo login dan penyimpanan session di localStorage.
- Proteksi route sederhana.
- Dashboard dan menu berbeda sesuai role.
- Tombol logout.

## Alur demo parkir
- Login sebagai Petugas untuk mencatat kendaraan masuk, membuat nomor karcis, mencari karcis, melihat biaya, dan mengonfirmasi pembayaran tunai atau QRIS.
- Login sebagai Admin untuk mengatur tarif per jam dan kapasitas slot, serta melihat kendaraan aktif dan riwayat kendaraan keluar.
- Login sebagai Owner untuk melihat rekap transaksi dan pendapatan.
- Data demo disimpan di `localStorage` browser, jadi tersedia kembali saat halaman dibuka di browser yang sama. Data belum dibagikan antarperangkat dan tidak menggantikan database backend.
- Tarif awal demo: motor Rp2.000/jam dan mobil Rp5.000/jam. Durasi dibulatkan ke atas dengan minimum satu jam; tarif dapat diubah dari menu Tarif & Area Parkir.

## Catatan integrasi backend
- Mode demo diatur melalui `DEMO_MODE` pada `js/config.js`.
- Login demo belum memakai database dan bukan autentikasi sungguhan.
- Setelah API backend siap, ubah `DEMO_MODE` menjadi `false`.
- Cocokkan `API_BASE_URL`, endpoint `/api/login`, bentuk request `{ username, password }`, dan respons `{ token, user }` dengan backend temanmu.
- Struktur `user` minimal perlu memiliki `username` dan `role` (`admin`, `petugas`, atau `owner`).

## Struktur folder
- `index.html` — halaman utama.
- `css/style.css` — desain dan responsive layout.
- `js/config.js` — URL API dan mode demo.
- `js/auth.js` — login, session, dan logout.
- `js/router.js` — pengaturan route dan proteksi halaman.
- `js/app.js` — halaman login, dashboard, navigasi, dan placeholder halaman.

# ParkirKu — Demo Web Parkir

Frontend aplikasi parkir menggunakan HTML, CSS, dan JavaScript murni (ES Modules), disimpan di folder `frontend/`. Backend temanmu nanti bisa ditambahkan terpisah di root repo atau folder `backend/`. Customer tidak perlu login karena alurnya dilayani petugas.

## Menjalankan project
1. Pastikan Node.js dan npm sudah terpasang.
2. Dari root repo, jalankan `npm --prefix .\frontend start` (atau masuk ke `frontend/` dan jalankan `npm start`).
3. Server lokal akan hidup dan browser terbuka otomatis di `http://127.0.0.1:5500/`.
4. Tekan `Ctrl+C` di terminal untuk menghentikan server.
5. Login demo dengan username dan password bebas, lalu pilih role Admin, Petugas, atau Owner.

## Fitur yang tersedia
- Login demo dengan menu berbeda untuk Admin, Petugas, dan Owner.
- Dashboard ringkas sesuai role.
- Pengaturan tarif/kapasitas dan pencatatan parkir masuk/keluar.
- Manajemen profil demo, log aktivitas, rekap transaksi, dan ekspor laporan CSV.
- Cetak karcis serta struk pembayaran.

## Alur demo parkir
- Login sebagai Petugas untuk mencatat kendaraan masuk, membuat nomor karcis, mencari karcis, melihat biaya, dan mengonfirmasi pembayaran tunai atau QRIS.
- Login sebagai Admin untuk mengatur tarif per jam dan kapasitas slot, serta melihat kendaraan aktif dan riwayat kendaraan keluar.
- Admin juga dapat mengelola profil demo dan memantau log aktivitas.
- Login sebagai Owner untuk melihat rekap transaksi, memfilter periode, dan mengunduh CSV.
- Petugas dapat mencetak karcis saat kendaraan masuk dan struk setelah transaksi keluar.
- Data demo disimpan di `localStorage` browser, jadi tersedia kembali saat halaman dibuka di browser yang sama. Data belum dibagikan antarperangkat dan tidak menggantikan database backend.
- Manajemen pengguna dan pilihan role login tetap berupa simulasi demo; daftar pengguna tidak mengautentikasi login.
- Tarif awal demo: motor Rp2.000/jam dan mobil Rp5.000/jam. Durasi dibulatkan ke atas dengan minimum satu jam; tarif dapat diubah dari menu Tarif & Area Parkir.

## Catatan integrasi backend
- Mode demo diatur melalui `DEMO_MODE` pada `frontend/js/config.js`.
- Login demo belum memakai database dan bukan autentikasi sungguhan.
- Setelah API backend siap, ubah `DEMO_MODE` menjadi `false`.
- Cocokkan `API_BASE_URL`, endpoint `/api/login`, bentuk request `{ username, password }`, dan respons `{ token, user }` dengan backend temanmu.
- Struktur `user` minimal perlu memiliki `username` dan `role` (`admin`, `petugas`, atau `owner`).

## Struktur folder
- `frontend/index.html` — halaman utama.
- `frontend/css/` — desain dan responsive layout.
- `frontend/js/` — aplikasi, konfigurasi, autentikasi demo, dan data demo.
- `frontend/package.json` — perintah `npm start`.
- `frontend/server.js` — server lokal untuk frontend.
- Backend belum ada di repo ini; tambahkan nanti sebagai bagian terpisah.

# Portal data Rote Ndao & Sabu Raijua

Situs statis (tanpa build) untuk kajian Pre-FS PLTS + BESS, berjalan di https://rotesabu.vercel.app

- `index.html` – aplikasi satu halaman: ringkasan, profil sistem, langgam beban, SLD, sumber data
- `data.js` – hasil ekstraksi otomatis dari tiga berkas Excel PLN (data mesin, langgam beban Ndao, rekap beban Raijua)
- `assets/` – SLD dirender dari PDF (110 dpi)
- `data/` – berkas asli PLN (PDF dan Excel) untuk diunduh

Deploy: project Vercel `rotesabu` membaca root repo langsung (framework Other, tanpa build command). Berkas Excel/PDF asli dengan nama lama tetap di root untuk arsip; salinan bernama rapi ada di `data/`.

# Portal data Rote Ndao & Sabu Raijua

Situs statis (tanpa build) untuk kajian Pre-FS PLTS + BESS.

- `index.html` – aplikasi satu halaman: ringkasan, profil sistem, langgam beban, SLD, sumber data
- `data.js` – hasil ekstraksi otomatis dari tiga berkas Excel PLN (data mesin, langgam beban Ndao, rekap beban Raijua)
- `assets/` – SLD dirender dari PDF (110 dpi)
- `data/` – berkas asli PLN (PDF dan Excel) untuk diunduh

Deploy: arahkan project Vercel ke root directory `site` (framework: Other, tanpa build command).

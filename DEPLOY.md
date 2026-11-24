# Portal data Rote Ndao & Sabu Raijua

Situs statis (tanpa build) untuk kajian Pre-FS PLTS + BESS, berjalan di https://rotesabu.vercel.app

- `index.html` + `app.js` – aplikasi satu halaman: ringkasan, insight, profil sistem, langgam beban, simulator PLTS + BESS, SLD, sumber data
- `analisis.js` – statistik langgam dan simulator per jam, dipakai portal dan `infografis.html`
- `data.js` – hasil ekstraksi dari berkas Excel PLN (data mesin, langgam Ndao, rekap Raijua, neraca daya Rote Sep 2026, logsheet per unit Seba/Raijua/Semau Okt 2026)
- `tools/ekstrak_data_baru.py` – menambah kunci `lg` dan `neraca` ke `data.js` dari dua berkas di `data/`
- `assets/` – SLD dirender dari PDF (110 dpi)
- `data/` – berkas asli PLN (PDF dan Excel) untuk diunduh

Deploy: project Vercel `rotesabu` membaca root repo langsung (framework Other, tanpa build command). Berkas Excel/PDF asli dengan nama lama tetap di root untuk arsip; salinan bernama rapi ada di `data/`.

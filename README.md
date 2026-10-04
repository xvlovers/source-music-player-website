# Web Music Player

Web music player ringan dan gratis, tanpa API key, tanpa akun, dan tanpa database.

## Fitur
- Cari lagu dari katalog publik Audius (artis independen)
- Player lengkap: play/pause, seek, volume, next/previous, shuffle, repeat, antrean
- Like, playlist (buat, ubah nama, tambah/hapus lagu, urutkan), dan riwayat putar
- Library tersimpan di browser (localStorage), hanya metadata, tanpa stream URL
- Tampilan responsif dengan MiniPlayer dan FullPlayer untuk HP
- Provider musik terpisah dari UI, jadi mudah diganti

## Teknologi
Next.js, React, TypeScript (strict), Tailwind CSS, Zustand

## Catatan
- Katalog hanya dari Audius, bukan Spotify atau SoundCloud
- Bergantung pada API publik pihak ketiga yang bisa berubah atau down
- Gratis dan tidak untuk dijual. Credit wajib dipertahankan (lihat LICENSE)

#CARA DEPLOY LOCALHOST, TINGGAL SALIN TEMPEL DI TERMUX.
** pkg update -y && pkg upgrade -y
pkg install -y nodejs-lts unzip
node -v **

**_termux-setup-storage_**
**_cp ~/storage/downloads/music.zip ~
mkdir -p ~/music
unzip -o ~/music.zip -d ~/music
cd ~/music_**
#SESUAIKAN DENGAN FOLDER ZIP↑↑↑

**cp .env.example .env.local**
**npm install**
**sed -i 's/"dev": "next dev"/"dev": "next dev --webpack"/; s/"build": "next build"/"build": "next build --webpack"/' package.json**

**termux-wake-lock
npm run build
npm start**

#DONE UDAH BISA DI PAKAI

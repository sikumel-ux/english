// Menggunakan URL API kamu yang tersimpan
const API_URL = "https://script.google.com/macros/s/AKfycbx9JsUb0saYvFnH8vpCn2JZu_AzdrXXXmQIcGfMW0dsTvPndFQC_CtKyLhMx_6Kjd_IEg/exec";

let skor = 0;
let namaPlayer = "";
let jawabanBenar = "";
let isPaused = false;
let nyawa = 3;
let timerInterval;
let waktuSisa = 100;

// KAMUS BESAR (Infinity Data)
const kamus = [
    { en: "Red", id: "Merah" }, { en: "Blue", id: "Biru" }, { en: "Green", id: "Hijau" },
    { en: "Yellow", id: "Kuning" }, { en: "Black", id: "Hitam" }, { en: "White", id: "Putih" },
    { en: "Cat", id: "Kucing" }, { en: "Dog", id: "Anjing" }, { en: "Bird", id: "Burung" },
    { en: "Fish", id: "Ikan" }, { en: "Lion", id: "Singa" }, { en: "Monkey", id: "Monyet" },
    { en: "Apple", id: "Apel" }, { en: "Banana", id: "Pisang" }, { en: "Orange", id: "Jeruk" },
    { en: "Watermelon", id: "Semangka" }, { en: "Book", id: "Buku" }, { en: "Pencil", id: "Pensil" },
    { en: "Eraser", id: "Penghapus" }, { en: "Bag", id: "Tas" }, { en: "Table", id: "Meja" },
    { en: "Chair", id: "Kursi" }, { en: "Eat", id: "Makan" }, { en: "Drink", id: "Minum" },
    { en: "Sleep", id: "Tidur" }, { en: "Run", id: "Lari" }, { en: "Jump", id: "Lompat" },
    { en: "One", id: "Satu" }, { en: "Two", id: "Dua" }, { en: "Three", id: "Tiga" },
    { en: "Ten", id: "Sepuluh" }, { en: "Mother", id: "Ibu" }, { en: "Father", id: "Ayah" }
];

window.onload = () => {
    loadLeaderboard();
    if(localStorage.getItem('math_nama')) document.getElementById('nama').value = localStorage.getItem('math_nama');
};

function bacakan(teks, lang = 'en-US') {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(teks);
        msg.lang = lang;
        msg.rate = 0.8;
        window.speechSynthesis.speak(msg);
    }
}

async function loadLeaderboard() {
    try {
        const res = await fetch(`${API_URL}?action=getLeaderboard`);
        const data = await res.json();
        const listContainer = document.getElementById('list-juara');
        if (data && data.length > 0) {
            listContainer.innerHTML = data.map((p, i) => `
                <div class="flex justify-between bg-blue-50 p-2 rounded-lg border-b-2 border-blue-100 mb-1 text-sm">
                    <span>${i+1}. <b>${p.nama}</b></span>
                    <span class="font-bold text-blue-600">${p.skor}</span>
                </div>
            `).join('');
        }
    } catch (e) { console.log("DB Offline"); }
}

function mulaiGame() {
    namaPlayer = document.getElementById('nama').value.trim();
    if(!namaPlayer) return Swal.fire('Wait!', 'Enter your name!', 'warning');
    localStorage.setItem('math_nama', namaPlayer);
    skor = 0; nyawa = 3; isPaused = false;
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    updateNyawaUI();
    buatSoal();
}

function updateNyawaUI() {
    const container = document.getElementById('lives-container');
    container.innerHTML = Array(3).fill(0).map((_, i) => 
        `<span class="${i >= nyawa ? 'heart-lost' : ''}">❤️</span>`
    ).join('');
}

function buatSoal() {
    try {
        // 1. Ambil kata target secara acak
        const target = kamus[Math.floor(Math.random() * kamus.length)];
        
        // 2. Acak tipe: 0 = Inggris->Indo, 1 = Indo->Inggris
        const tipe = Math.random() > 0.5 ? 0 : 1;
        let soalTeks = "";
        
        if (tipe === 0) {
            soalTeks = `Apa bahasa Indonesianya "${target.en}"?`;
            jawabanBenar = target.id;
            bacakan(target.en); // Bacakan kata inggrisnya
        } else {
            soalTeks = `Apa bahasa Inggrisnya "${target.id}"?`;
            jawabanBenar = target.en;
            bacakan(soalTeks, 'id-ID'); // Bacakan pertanyaan dlm bahasa indo
        }

        document.getElementById('pertanyaan').innerText = soalTeks;
        document.getElementById('display-skor').innerText = skor;

        // 3. Racik Pilihan Jawaban (Infinity Shuffle)
        let pilihan = [jawabanBenar];
        while(pilihan.length < 4) {
            const acak = kamus[Math.floor(Math.random() * kamus.length)];
            const kandidat = (tipe === 0) ? acak.id : acak.en;
            if(!pilihan.includes(kandidat)) pilihan.push(kandidat);
        }
        pilihan.sort(() => Math.random() - 0.5);

        // 4. Render Tombol
        const container = document.getElementById('pilihan-jawaban');
        container.innerHTML = "";
        pilihan.forEach(teks => {
            const btn = document.createElement('button');
            btn.innerText = teks;
            btn.className = "bg-white border-4 border-blue-50 p-4 rounded-2xl text-lg font-bold text-blue-600 shadow-sm hover:border-blue-400 active:scale-95 transition-all";
            btn.onclick = () => {
                if(tipe === 1) bacakan(teks); // Bacakan jika user pilih kata b.inggris
                cekJawaban(teks);
            };
            container.appendChild(btn);
        });

        startTimer();
    } catch (err) { console.error(err); }
}

function startTimer() {
    clearInterval(timerInterval);
    waktuSisa = 100;
    const bar = document.getElementById('timer-bar');
    // Timer makin cepat tiap 50 poin
    const speed = Math.max(20, 100 - Math.floor(skor/2)); 

    timerInterval = setInterval(() => {
        if (!isPaused) {
            waktuSisa -= 1;
            bar.style.width = waktuSisa + "%";
            if (waktuSisa <= 0) {
                clearInterval(timerInterval);
                kurangiNyawa("Time Out! ⏰");
            }
        }
    }, speed);
}

async function cekJawaban(pilih) {
    if (isPaused) return;
    if (pilih === jawabanBenar) {
        clearInterval(timerInterval);
        skor += 10;
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
        setTimeout(buatSoal, 400);
        simpanSkor();
    } else {
        kurangiNyawa("Wrong Answer! ❌");
    }
}

async function kurangiNyawa(msg) {
    clearInterval(timerInterval);
    nyawa--;
    updateNyawaUI();
    document.getElementById('app').classList.add('shake');
    setTimeout(() => document.getElementById('app').classList.remove('shake'), 400);

    if (nyawa <= 0) {
        await simpanSkor();
        Swal.fire({ title: 'GAME OVER!', text: `Your Score: ${skor}`, icon: 'error' }).then(() => location.reload());
    } else {
        Swal.fire({ title: msg, text: "Try again!", timer: 1000, showConfirmButton: false }).then(() => buatSoal());
    }
}

async function simpanSkor() {
    try {
        await fetch(`${API_URL}`, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nama: namaPlayer, skor: skor })
        });
    } catch (e) {}
}

function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pause-screen').classList.toggle('hidden');
    document.getElementById('game-content').classList.toggle('blur-content');
}

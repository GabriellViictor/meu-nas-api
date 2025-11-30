import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Verifica se é Android (Termux)
const isAndroid = process.platform === 'android';

// === AQUI ESTÁ A MUDANÇA DA PASTA ===
// No Android: Salva em Downloads/MyNas
// No PC: Salva na pasta downloads_nas do projeto
export const UPLOAD_DIR = isAndroid 
    ? '/data/data/com.termux/files/home/storage/downloads/MyNas'
    : path.join(__dirname, '..', '..', 'downloads_nas');

// Garante que a pasta existe (cria a MyNas se não existir)
if (!fs.existsSync(UPLOAD_DIR)) {
    console.log(`Criando diretório: ${UPLOAD_DIR}`);
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        // Corrige acentos e coloca timestamp
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const finalName = `${Date.now()}-${originalName}`;
        cb(null, finalName);
    }
});

export const uploadConfig = multer({ storage: storage });
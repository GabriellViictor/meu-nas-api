import multer from 'multer';
import path from 'path';
import fs from 'fs';

// === MUDANÇA IMPORTANTE ===
// No Android (Termux), esse caminho aponta para a memória interna pública
// No Windows (PC), ele vai salvar numa pasta 'downloads_nas' no projeto
const isAndroid = process.platform === 'android';
const UPLOAD_DIR = isAndroid 
    ? '/data/data/com.termux/files/home/storage/downloads/GabrielNAS' // Caminho do Termux para Downloads
    : path.join(__dirname, '..', '..', 'downloads_nas');

// Garante que a pasta existe
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const finalName = `${Date.now()}-${originalName}`;
        cb(null, finalName);
    }
});

export const uploadConfig = multer({ storage: storage });
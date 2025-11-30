import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Verifica se é Android (Termux)
const isAndroid = process.platform === 'android';

// === ADICIONE O 'export' AQUI EMBAIXO ===
export const UPLOAD_DIR = isAndroid 
    ? '/data/data/com.termux/files/home/storage/downloads/GabrielNAS'
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
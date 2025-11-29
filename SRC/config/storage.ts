import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Define a pasta de uploads (funciona no PC e no Android/Termux)
export const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

// Garante que a pasta existe ao iniciar
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        // Corrige acentos (latin1 -> utf8)
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        // Adiciona timestamp para evitar sobrepor arquivos com mesmo nome
        // Ex: 17150000-foto.jpg
        const finalName = `${Date.now()}-${originalName}`;
        cb(null, finalName);
    }
});

export const uploadConfig = multer({ storage: storage });
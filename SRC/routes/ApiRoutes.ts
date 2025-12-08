import { Router } from 'express';
import { FileController } from '../controllers/FileController';
import { uploadConfig } from '../config/storage';

const router = Router();

router.get('/status', (req, res) => res.json({ status: 'NAS Online' }));

// === ROTAS DE ARQUIVOS ===
// Upload (Agora suporta ?path=/Destino)
router.post('/upload', uploadConfig.array('meusArquivos'), FileController.uploadFiles);

// Listar (Agora suporta ?path=/Fotos)
router.get('/files', FileController.listFiles);

// Download (Agora suporta ?path=/Fotos&filename=img.jpg)
router.get('/download/:filename', FileController.downloadFile);

// Deletar (Agora suporta ?path=/Fotos&filename=img.jpg)
router.delete('/files/:filename', FileController.deleteFile);

// === NOVAS ROTAS (PASTAS) ===
router.post('/folders', FileController.createFolder); // Criar pasta
router.post('/files/move', FileController.moveFiles); // Mover arquivos

export default router;
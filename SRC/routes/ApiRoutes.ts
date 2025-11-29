import { Router } from 'express';
import { FileController } from '../controllers/FileController';
import { uploadConfig } from '../config/storage';

const router = Router();

// Rota de teste
router.get('/status', (req, res) => res.json({ status: 'NAS Online' }));

// Rotas do NAS
router.post('/upload', uploadConfig.array('meusArquivos'), FileController.uploadFiles);
router.get('/files', FileController.listFiles);           // Lista tudo
router.get('/download/:filename', FileController.downloadFile); // Baixa um específico
router.delete('/files/:filename', FileController.deleteFile);   // Deleta

export default router;
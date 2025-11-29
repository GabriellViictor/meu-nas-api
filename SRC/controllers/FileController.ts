import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { UPLOAD_DIR } from '../config/storage';

export class FileController {

    // 1. UPLOAD (Já conhecemos)
    static async uploadFiles(req: Request, res: Response) {
        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
        }
        const arquivos = req.files as Express.Multer.File[];
        
        return res.json({
            message: 'Upload realizado com sucesso!',
            files: arquivos.map(f => ({
                filename: f.filename,
                originalName: f.originalname,
                size: f.size
            }))
        });
    }

    // 2. LISTAR ARQUIVOS (Para o Flutter mostrar a galeria)
    static async listFiles(req: Request, res: Response) {
        try {
            const files = fs.readdirSync(UPLOAD_DIR);
            
            // Vamos montar uma lista com detalhes
            const fileList = files.map(fileName => {
                const filePath = path.join(UPLOAD_DIR, fileName);
                const stats = fs.statSync(filePath);
                return {
                    name: fileName,
                    size: stats.size,
                    createdAt: stats.birthtime
                };
            });

            return res.json(fileList);
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao listar arquivos' });
        }
    }

    // 3. DOWNLOAD (Para o Flutter baixar o arquivo)
    static async downloadFile(req: Request, res: Response) {
        const fileName = req.params.filename;
        const filePath = path.join(UPLOAD_DIR, fileName);

        if (fs.existsSync(filePath)) {
            return res.download(filePath); // O Express faz o stream automático
        } else {
            return res.status(404).json({ error: 'Arquivo não encontrado' });
        }
    }

    // 4. DELETAR (Para limpar espaço)
    static async deleteFile(req: Request, res: Response) {
        const fileName = req.params.filename;
        const filePath = path.join(UPLOAD_DIR, fileName);

        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                return res.json({ message: 'Arquivo deletado com sucesso' });
            } catch (err) {
                return res.status(500).json({ error: 'Erro ao deletar arquivo' });
            }
        } else {
            return res.status(404).json({ error: 'Arquivo não encontrado' });
        }
    }
}
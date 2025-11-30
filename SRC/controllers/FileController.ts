import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process'; // <--- IMPORTANTE: Importa o executor de comandos
import { UPLOAD_DIR } from '../config/storage';

export class FileController {

    // 1. UPLOAD
    static async uploadFiles(req: Request, res: Response) {
        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
        }
        
        const arquivos = req.files as Express.Multer.File[];
        
        // === NOVO: RODAR O SCAN AUTOMÁTICO ===
        // Só roda se estiver no Android
        if (process.platform === 'android') {
            arquivos.forEach(file => {
                // O comando 'termux-media-scan' avisa a galeria que o arquivo existe
                // Usamos aspas "${file.path}" para funcionar com nomes que têm espaço
                exec(`termux-media-scan "${file.path}"`, (error) => {
                    if (error) {
                        console.error(`Erro ao escanear ${file.filename}:`, error);
                    } else {
                        console.log(`Galeria atualizada para: ${file.filename}`);
                    }
                });
            });
        }
        // ======================================

        return res.json({
            message: 'Upload realizado com sucesso!',
            files: arquivos.map(f => ({
                filename: f.filename,
                originalName: f.originalname,
                size: f.size
            }))
        });
    }

    // 2. LISTAR ARQUIVOS
    static async listFiles(req: Request, res: Response) {
        try {
            const files = fs.readdirSync(UPLOAD_DIR);
            
            const fileList = files.map(fileName => {
                const filePath = path.join(UPLOAD_DIR, fileName);
                try {
                    const stats = fs.statSync(filePath);
                    return {
                        name: fileName,
                        size: stats.size,
                        createdAt: stats.birthtime
                    };
                } catch (e) {
                    return null;
                }
            }).filter(item => item !== null); // Remove arquivos com erro de leitura

            // Ordena do mais novo para o mais antigo
            fileList.sort((a, b) => (b?.createdAt.getTime() || 0) - (a?.createdAt.getTime() || 0));

            return res.json(fileList);
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao listar arquivos' });
        }
    }

    // 3. DOWNLOAD
    static async downloadFile(req: Request, res: Response) {
        const fileName = req.params.filename;
        const filePath = path.join(UPLOAD_DIR, fileName);

        if (fs.existsSync(filePath)) {
            return res.download(filePath);
        } else {
            return res.status(404).json({ error: 'Arquivo não encontrado' });
        }
    }

    // 4. DELETAR
    static async deleteFile(req: Request, res: Response) {
        const fileName = req.params.filename;
        const filePath = path.join(UPLOAD_DIR, fileName);

        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                
                // Opcional: Avisar o Android que deletou (para sumir da galeria também)
                if (process.platform === 'android') {
                     exec(`termux-media-scan -r "${UPLOAD_DIR}"`);
                }

                return res.json({ message: 'Arquivo deletado com sucesso' });
            } catch (err) {
                return res.status(500).json({ error: 'Erro ao deletar arquivo' });
            }
        } else {
            return res.status(404).json({ error: 'Arquivo não encontrado' });
        }
    }
}
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { UPLOAD_DIR } from '../config/storage';

export class FileController {

    // === 1. UPLOAD (COM AUTO-SCAN CORRIGIDO) ===
    static async uploadFiles(req: Request, res: Response) {
        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
        }
        
        const arquivos = req.files as Express.Multer.File[];
        
        // Lógica específica para o Android/Termux
        if (process.platform === 'android') {
            console.log("Iniciando processo de Media Scan...");
            
            // 1. Caminho ABSOLUTO do executável do termux (para o Node não se perder)
            const termuxBin = '/data/data/com.termux/files/usr/bin/termux-media-scan';
            
            // 2. Escaneia a pasta inteira (-r) onde salvamos (MyNas)
            const command = `${termuxBin} -r "${UPLOAD_DIR}"`;

            // Pequeno delay para garantir que o arquivo foi liberado pelo sistema
            setTimeout(() => {
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`❌ ERRO CRÍTICO no Scan: ${error.message}`);
                        return;
                    }
                    if (stderr) {
                        console.error(`⚠️ Aviso do Scan: ${stderr}`);
                    }
                    console.log(`✅ Galeria do Android atualizada! Pasta: ${UPLOAD_DIR}`);
                });
            }, 1000);
        }

        return res.json({
            message: 'Upload realizado com sucesso!',
            files: arquivos.map(f => ({
                filename: f.filename,
                size: f.size
            }))
        });
    }

    // === 2. LISTAR ARQUIVOS DA PASTA MyNas ===
    static async listFiles(req: Request, res: Response) {
        try {
            // Lê a pasta configurada no storage.ts
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
            }).filter(item => item !== null);

            // Ordena: Mais recentes primeiro
            fileList.sort((a, b) => (b?.createdAt.getTime() || 0) - (a?.createdAt.getTime() || 0));

            return res.json(fileList);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao listar arquivos da pasta MyNas' });
        }
    }

    // === 3. DOWNLOAD ===
    static async downloadFile(req: Request, res: Response) {
        const fileName = req.params.filename;
        const filePath = path.join(UPLOAD_DIR, fileName);

        if (fs.existsSync(filePath)) {
            return res.download(filePath);
        } else {
            return res.status(404).json({ error: 'Arquivo não encontrado' });
        }
    }

    // === 4. DELETAR ===
    static async deleteFile(req: Request, res: Response) {
        const fileName = req.params.filename;
        const filePath = path.join(UPLOAD_DIR, fileName);

        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                
                // Atualiza a galeria removendo o arquivo
                if (process.platform === 'android') {
                    const termuxBin = '/data/data/com.termux/files/usr/bin/termux-media-scan';
                    exec(`${termuxBin} -r "${UPLOAD_DIR}"`);
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
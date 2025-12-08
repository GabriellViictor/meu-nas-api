import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { UPLOAD_DIR } from '../config/storage';

export class FileController {

    // Helper para garantir que o usuário não saia da pasta permitida (Segurança)
    private static getSafePath(userPath: string): string {
        const safePath = userPath ? path.normalize(userPath).replace(/^(\.\.[\/\\])+/, '') : '';
        return path.join(UPLOAD_DIR, safePath);
    }

    // Helper para rodar o Media Scan do Termux
    private static runMediaScan(targetPath: string) {
        if (process.platform === 'android') {
            const termuxBin = '/data/data/com.termux/files/usr/bin/termux-media-scan';
            // Escaneia recursivamente a pasta alterada
            exec(`${termuxBin} -r "${targetPath}"`, (err) => {
                if (err) console.error("Erro no Media Scan:", err.message);
            });
        }
    }

    // === 1. UPLOAD (COM SUPORTE A SUBPASTAS) ===
    static async uploadFiles(req: Request, res: Response) {
        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
        }

        const arquivos = req.files as Express.Multer.File[];

        // Se o usuário mandou um ?path=/Fotos, movemos os arquivos para lá após o upload
        const destinationFolder = req.query.path ? String(req.query.path) : '/';

        if (destinationFolder !== '/') {
            const targetDir = FileController.getSafePath(destinationFolder);

            // Garante que a pasta existe
            if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

            // Move cada arquivo da raiz (onde o Multer salvou) para a subpasta
            arquivos.forEach(file => {
                const oldPath = file.path; // Caminho onde o Multer salvou
                const newPath = path.join(targetDir, file.filename);
                fs.renameSync(oldPath, newPath);
            });
        }

        // Roda o scan na pasta correta
        FileController.runMediaScan(FileController.getSafePath(destinationFolder));

        return res.json({
            message: 'Upload realizado com sucesso!',
            files: arquivos.map(f => ({ filename: f.filename, size: f.size }))
        });
    }

    // === 2. LISTAR ARQUIVOS (COM SUBPASTAS) ===
    static async listFiles(req: Request, res: Response) {
        try {
            // Pega o caminho da URL (ex: /files?path=/Fotos) ou usa raiz
            const currentPath = req.query.path ? String(req.query.path) : '/';
            const fullPath = FileController.getSafePath(currentPath);

            if (!fs.existsSync(fullPath)) {
                return res.status(404).json({ error: 'Pasta não encontrada' });
            }

            const files = fs.readdirSync(fullPath);

            const fileList = files.map(fileName => {
                const filePath = path.join(fullPath, fileName);
                try {
                    const stats = fs.statSync(filePath);
                    return {
                        name: fileName,
                        size: stats.size,
                        createdAt: stats.birthtime,
                        isDirectory: stats.isDirectory() // <--- IMPORTANTE PARA O APP
                    };
                } catch (e) {
                    return null;
                }
            }).filter(item => item !== null);

            // Ordena: Pastas primeiro, depois arquivos (mais recentes)
            fileList.sort((a, b) => {
                if (a!.isDirectory && !b!.isDirectory) return -1;
                if (!a!.isDirectory && b!.isDirectory) return 1;
                return (b?.createdAt.getTime() || 0) - (a?.createdAt.getTime() || 0);
            });

            return res.json(fileList);
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao listar arquivos' });
        }
    }

    // === 3. DOWNLOAD (COM PATH) ===
    static async downloadFile(req: Request, res: Response) {
        const fileName = req.params.filename;
        const currentPath = req.query.path ? String(req.query.path) : '/';
        const filePath = path.join(FileController.getSafePath(currentPath), fileName);

        if (fs.existsSync(filePath)) {
            return res.download(filePath);
        } else {
            return res.status(404).json({ error: 'Arquivo não encontrado' });
        }
    }

    // === 4. DELETAR (COM PATH) ===
    static async deleteFile(req: Request, res: Response) {
        const fileName = req.params.filename;
        const currentPath = req.query.path ? String(req.query.path) : '/';
        const filePath = path.join(FileController.getSafePath(currentPath), fileName);

        if (fs.existsSync(filePath)) {
            try {
                // Se for pasta, usa rmdir, se for arquivo usa unlink
                if (fs.lstatSync(filePath).isDirectory()) {
                    fs.rmdirSync(filePath, { recursive: true });
                } else {
                    fs.unlinkSync(filePath);
                }

                FileController.runMediaScan(FileController.getSafePath(currentPath));
                return res.json({ message: 'Item deletado com sucesso' });
            } catch (err) {
                return res.status(500).json({ error: 'Erro ao deletar item' });
            }
        } else {
            return res.status(404).json({ error: 'Arquivo não encontrado' });
        }
    }

    // === 5. CRIAR PASTA (NOVO) ===
    static async createFolder(req: Request, res: Response) {
        const { folderName, currentPath } = req.body;
        // currentPath vem do app (ex: /Fotos)
        const targetPath = path.join(FileController.getSafePath(currentPath || '/'), folderName);

        try {
            if (!fs.existsSync(targetPath)) {
                fs.mkdirSync(targetPath);
                return res.status(201).json({ message: 'Pasta criada' });
            }
            return res.status(400).json({ error: 'Pasta já existe' });
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao criar pasta' });
        }
    }

    // === 6. MOVER ARQUIVOS (NOVO) ===
    static async moveFiles(req: Request, res: Response) {
        // files: ['a.jpg', 'b.png'], sourcePath: '/', destinationPath: '/Fotos'
        const { files, sourcePath, destinationPath } = req.body;

        const sourceDir = FileController.getSafePath(sourcePath || '/');
        const destDir = FileController.getSafePath(destinationPath || '/');

        try {
            if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

            for (const fileName of files) {
                const oldPath = path.join(sourceDir, fileName);
                const newPath = path.join(destDir, fileName);

                if (fs.existsSync(oldPath)) {
                    fs.renameSync(oldPath, newPath);
                }
            }

            FileController.runMediaScan(destDir);
            FileController.runMediaScan(sourceDir);

            return res.json({ message: 'Arquivos movidos' });
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao mover arquivos' });
        }
    }
}
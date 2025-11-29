import express from 'express';
import cors from 'cors';
import ip from 'ip';
import apiRoutes from './routes/ApiRoutes'; // Importa as rotas novas
import { UPLOAD_DIR } from './config/storage';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// === AQUI ESTÁ A MÁGICA ===
// Diz para o servidor usar o arquivo de rotas que criamos
app.use('/', apiRoutes);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n📦 GABRIEL NAS - MODULAR v2`);
    console.log(`-----------------------------------------------`);
    console.log(`IP Local:   http://localhost:${PORT}`);
    console.log(`IP Rede:    http://${ip.address()}:${PORT}`);
    console.log(`Armazenamento: ${UPLOAD_DIR}`);
    console.log(`-----------------------------------------------`);
    console.log(`Rotas Disponíveis:`);
    console.log(` [POST]   /upload`);
    console.log(` [GET]    /files`);
    console.log(` [GET]    /download/:filename`);
    console.log(` [DELETE] /files/:filename`);
});
import compression from 'compression';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 4173;
const distPath = path.join(__dirname, 'dist');

app.disable('x-powered-by');
app.use(compression());
app.use(express.static(distPath, {
  maxAge: '1d',
  setHeaders(res, filePath) {
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

app.get('/health', (req, res) => {
  res.json({ ok: true, app: 'Smart Quiz Generator Web' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Smart Quiz Generator web running on port ${port}`);
});

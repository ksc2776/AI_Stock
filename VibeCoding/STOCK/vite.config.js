import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const EXPORT_LIMIT_BYTES = 64 * 1024;

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString('utf8');
      if (Buffer.byteLength(body, 'utf8') > EXPORT_LIMIT_BYTES) {
        reject(new Error('Export payload is too large.'));
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON payload.'));
      }
    });

    req.on('error', reject);
  });
}

function escapeCsvCell(value) {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsvLine(values) {
  return values.map(escapeCsvCell).join(',');
}

function exportReportPlugin() {
  return {
    name: 'report-export',
    configureServer(server) {
      server.middlewares.use('/api/export-excel', async (req, res, next) => {
        if (req.method !== 'POST') return next();

        try {
          const data = await readJsonBody(req);
          const filePath = path.join(process.cwd(), 'analysis-report.csv');
          const headers = Object.keys(data);
          const exists = fs.existsSync(filePath);
          const lines = [];

          if (!exists) {
            lines.push(toCsvLine(headers));
          }

          lines.push(toCsvLine(headers.map(key => data[key])));
          fs.appendFileSync(filePath, `${lines.join('\n')}\n`, 'utf8');

          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, path: filePath, format: 'csv' }));
        } catch (e) {
          console.error('Export Error:', e);
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = e.message.includes('large') ? 413 : 500;
          res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
    }
  };
}

function apiAnalyzePlugin() {
  return {
    name: 'api-analyze',
    configureServer(server) {
      server.middlewares.use('/api/analyze', async (req, res, next) => {
        try {
          const analyzeFn = require('./api/analyze.js');
          const url = new URL(req.url, `http://${req.headers.host}`);
          req.query = Object.fromEntries(url.searchParams);
          
          res.status = (code) => { res.statusCode = code; return res; };
          res.json = (obj) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(obj));
          };
          
          await analyzeFn(req, res);
        } catch (e) {
          console.error(e);
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), exportReportPlugin(), apiAnalyzePlugin()],
  base: '/',
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/api/naver': {
        target: 'https://polling.finance.naver.com',
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace(/^\/api\/naver/, '/api/realtime')
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});

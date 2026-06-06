import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import * as xlsx from 'xlsx';

function excelExportPlugin() {
  return {
    name: 'excel-export',
    configureServer(server) {
      server.middlewares.use('/api/export-excel', (req, res, next) => {
        if (req.method !== 'POST') return next();
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const filePath = path.join(process.cwd(), '실시간_분석리포트.xlsx');
            let workbook;
            let worksheet;
            
            // 기존 파일이 있으면 불러오기
            if (fs.existsSync(filePath)) {
              workbook = xlsx.readFile(filePath);
              worksheet = workbook.Sheets['분석리포트'];
            } else {
              // 없으면 새 워크북 생성
              workbook = xlsx.utils.book_new();
            }
            
            // 시트가 없으면 생성
            if (!worksheet) {
              worksheet = xlsx.utils.json_to_sheet([]);
              xlsx.utils.book_append_sheet(workbook, worksheet, '분석리포트');
            }
            
            // 기존 데이터의 끝에 새 행 추가
            xlsx.utils.sheet_add_json(worksheet, [data], { origin: -1, skipHeader: true });
            
            // 만약 첫 행(헤더)이 비어있다면 다시 써주기 (A1 셀이 비었을 때)
            if (!worksheet['A1']) {
              xlsx.utils.sheet_add_json(worksheet, [data], { origin: "A1" });
            }

            // 파일 저장
            xlsx.writeFile(workbook, filePath);
            
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, path: filePath }));
          } catch (e) {
            console.error('Excel Export Error:', e);
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: e.message }));
          }
        });
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), excelExportPlugin()],
  base: './',
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api/naver': {
        target: 'https://polling.finance.naver.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/naver/, '/api/realtime')
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});

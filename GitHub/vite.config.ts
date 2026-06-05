import { defineConfig } from 'vite';

export default defineConfig({
  // 프로젝트 루트 기준 설정 (index.html이 있는 경로)
  root: '.',
  
  server: {
    port: 3000, // 로컬 개발 서버 포트 지정
  },
  build: {
    outDir: 'dist', // 최종 프로덕션 빌드 결과물이 저장될 폴더
    emptyOutDir: true, // 빌드 시마다 기존 dist 폴더 초기화
  },
});
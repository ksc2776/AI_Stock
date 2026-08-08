@echo off
:: 현재 실행 중인 서버를 종료하지 않고 새 창에서 git 푸시
start cmd /k "cd /d C:\Workspace && git add netlify.toml .vercelignore vercel.json VibeCoding\STOCK\vercel.json VibeCoding\STOCK\public\_redirects && git commit -m "Fix Netlify: correct publish dir and redirects" && git push origin main && echo. && echo === 완료! Netlify 자동 재배포 시작됨 === && pause"

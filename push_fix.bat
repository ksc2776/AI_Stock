@echo off
chcp 65001 > nul
cd /d C:\Workspace
echo === Deploying to GitHub (Vercel Root Fix) ===
git add vercel.json .vercelignore VibeCoding/STOCK/vercel.json
git commit -m "Fix Vercel 404: Root vercel.json with VibeCoding/STOCK build path"
git push origin main
echo.
echo === Done! Check Vercel dashboard in 60 seconds ===
echo === URL: https://ai-stock-vert.vercel.app ===
pause

@echo off
chcp 65001 > nul
echo ========================================================
echo   EQV Stock App - GitHub Deploy (Vercel Root Fix)
echo ========================================================
echo.

:: 저장소 루트로 이동 (vercel.json이 있는 곳)
cd /d C:\Workspace

echo [1/3] Staging all changes...
git add .

echo [2/3] Committing...
git commit -m "Fix Vercel: Add root vercel.json pointing to VibeCoding/STOCK"

echo [3/3] Pushing to GitHub...
git push origin main

echo.
echo ========================================================
echo  Deploy Complete! Vercel will auto-build in ~30 seconds
echo  URL: https://ai-stock-vert.vercel.app
echo ========================================================
pause

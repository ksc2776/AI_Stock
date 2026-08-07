git add .
git commit -m "Fix Vercel 404: Force @vercel/static-build with distDir dist"
git push origin main
if %errorlevel% neq 0 (
    git push origin master
)
echo.
echo ========================================================
echo  GitHub Sync Complete! Vercel is building now...
echo ========================================================
pause

git add .
git commit -m "Fix 404: Set outputDirectory dist and vite framework for Vercel"
git push origin main
if %errorlevel% neq 0 (
    git push origin master
)
echo.
echo ========================================================
echo  GitHub Sync Complete! Vercel is now auto-building...
echo ========================================================
pause

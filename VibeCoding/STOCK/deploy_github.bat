git add .
git commit -m "Update mobile layout, peer PER compare and financials"
git push origin main
if %errorlevel% neq 0 (
    git push origin master
)
echo.
echo ========================================================
echo  Successfully updated and pushed to GitHub!
echo ========================================================
pause

cd /d C:\Workspace
git add netlify.toml vercel.json .vercelignore VibeCoding\STOCK\vercel.json VibeCoding\STOCK\public\_redirects
git commit -m "Add Netlify config and fix Vercel root: VibeCoding/STOCK"
git push origin main
echo 완료! Netlify에서 배포하세요: https://app.netlify.com
pause

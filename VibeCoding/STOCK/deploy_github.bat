@echo off
chcp 65001 > nul
echo.
echo ========================================================
echo  Vercel 배포 - 404 근본 해결 버전
echo ========================================================
echo.

cd /d "c:\Workspace\VibeCoding\STOCK"

echo [1/4] 변경 파일 스테이징 중...
git add .

echo [2/4] 커밋 중...
git commit -m "Fix: Vercel 404 근본 해결 - SPA rewrite + Serverless API 재작성"

echo [3/4] GitHub main 브랜치에 푸시 중...
git push origin main
if %errorlevel% neq 0 (
    echo main 브랜치 실패, master 시도 중...
    git push origin master
)

echo [4/4] 완료!
echo.
echo ========================================================
echo  GitHub Push 완료! Vercel이 자동으로 빌드 및 배포합니다.
echo  약 1~2분 후 Vercel 대시보드에서 배포 상태를 확인하세요.
echo ========================================================
pause

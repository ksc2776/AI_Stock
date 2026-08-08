@echo off
chcp 65001 >nul
echo.
echo ========================================================
echo  컨센서스 버그 수정 - GitHub 배포
echo ========================================================
echo.
echo 수정 내용:
echo  1. api/analyze.js - financials 필드 제거 (consensus 문자열 반환 차단)
echo  2. src/App.jsx   - financials 병합 시 consensus 객체 보호
echo.

cd /d "c:\Workspace\VibeCoding\STOCK"

echo [1/3] 변경 파일 확인 중...
git status

echo.
echo [2/3] 커밋 중...
git add api/analyze.js src/App.jsx
git commit -m "Fix: 컨센서스 차트 데이터 없음 버그 수정 - consensus 객체 보호"

echo.
echo [3/3] GitHub에 Push 중...
git push origin main
if %errorlevel% neq 0 (
    echo main 실패, master 시도...
    git push origin master
)

echo.
echo ========================================================
echo  Push 완료! Vercel 자동 배포 시작 (약 1-2분 소요)
echo  https://ai-stock-vert.vercel.app 에서 확인하세요
echo ========================================================
pause

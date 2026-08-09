@echo off
chcp 65001 >nul
echo.
echo ========================================================
echo  EQV 퀀트 에이전트 - 분석 시점 날짜 반영 배포
echo ========================================================
echo.
echo 수정 내용:
echo  1. App.jsx - 분석 시점 날짜/시간 유틸리티 함수 추가
echo  2. App.jsx - 투자자 거래일을 분석 시점 기준 동적 생성
echo  3. App.jsx - 뉴스 날짜를 분석 시점 기준 최근 3영업일
echo  4. App.jsx - 애널리스트 리포트 날짜 동적 생성
echo  5. App.jsx - analyzedAt을 분석 완료 시각으로 갱신
echo.

cd /d "c:\Workspace\VibeCoding\STOCK"

echo [1/4] 변경 파일 확인...
git status

echo.
echo [2/4] 파일 스테이징...
git add api\analyze.js src\App.jsx src\components\cards\ConsensusCard.jsx

echo.
echo [3/4] 커밋...
git commit -m "Feat: 분석 시점 날짜/시간 동적 반영 - 모든 데이터를 실제 분석 시각 기준으로 생성"

echo.
echo [4/4] GitHub Push...
git push origin main
if %errorlevel% neq 0 (
    echo main 실패, master 브랜치 시도...
    git push origin master
)

echo.
echo ========================================================
echo  완료! Vercel 자동 배포가 시작됩니다 (약 1-2분)
echo  https://ai-stock-vert.vercel.app 에서 확인하세요
echo ========================================================
pause

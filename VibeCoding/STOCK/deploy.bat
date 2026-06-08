# Google Cloud Run 수동 배포 스크립트
# 이 배치 파일을 실행하면 자동으로 배포됩니다

@echo off
REM 프로젝트 변수
set PROJECT_ID=project-842398be-a4d4-405f-afa
set REGION=asia-northeast1
set SERVICE_NAME=stock-app
set IMAGE_NAME=stock-app
set DOCKER_REPO=gcr.io

REM 색상 정의
REM 현재 디렉토리 확인
cd /d C:\Workspace\VibeCoding\STOCK
echo.
echo ============================================
echo STOCK App - Google Cloud Run 배포 시작
echo ============================================
echo.
echo 프로젝트: %PROJECT_ID%
echo 리전: %REGION%
echo 서비스: %SERVICE_NAME%
echo.

REM Step 1: Docker 이미지 빌드
echo [Step 1/4] Docker 이미지 빌드 중...
docker build -t %DOCKER_REPO%/%PROJECT_ID%/%IMAGE_NAME%:latest .
if %errorlevel% neq 0 (
    echo ❌ Docker 빌드 실패
    exit /b 1
)
echo ✅ Docker 이미지 빌드 완료
echo.

REM Step 2: Docker 로그인
echo [Step 2/4] Google Container Registry 로그인 중...
call gcloud auth configure-docker %DOCKER_REPO%
if %errorlevel% neq 0 (
    echo ❌ Docker 로그인 실패
    exit /b 1
)
echo ✅ Docker 로그인 완료
echo.

REM Step 3: Docker 이미지 푸시
echo [Step 3/4] Docker 이미지를 Container Registry에 푸시 중...
docker push %DOCKER_REPO%/%PROJECT_ID%/%IMAGE_NAME%:latest
if %errorlevel% neq 0 (
    echo ❌ Docker 푸시 실패
    exit /b 1
)
echo ✅ Docker 이미지 푸시 완료
echo.

REM Step 4: Cloud Run 배포
echo [Step 4/4] Cloud Run에 배포 중...
call gcloud run deploy %SERVICE_NAME% ^
    --image %DOCKER_REPO%/%PROJECT_ID%/%IMAGE_NAME%:latest ^
    --region %REGION% ^
    --platform managed ^
    --allow-unauthenticated ^
    --memory 512Mi ^
    --cpu 1 ^
    --timeout 300 ^
    --set-env-vars NODE_ENV=production ^
    --port 8080 ^
    --project %PROJECT_ID%

if %errorlevel% neq 0 (
    echo ❌ Cloud Run 배포 실패
    exit /b 1
)
echo ✅ Cloud Run 배포 완료
echo.

REM Step 5: 배포된 URL 확인
echo [완료] 배포된 URL 확인 중...
for /f "delims=" %%A in ('gcloud run services describe %SERVICE_NAME% --region %REGION% --format "value(status.url)" --project %PROJECT_ID%') do set SERVICE_URL=%%A

echo.
echo ============================================
echo ✅ 배포 성공!
echo ============================================
echo.
echo 📱 스마트폰에서 접근 가능한 URL:
echo %SERVICE_URL%
echo.
echo 🌐 웹 브라우저에서 확인:
echo %SERVICE_URL%
echo.
echo iOS: Safari에서 URL 입력 → 공유 → 홈 화면에 추가
echo Android: Chrome에서 URL 입력 → 앱 설치
echo.
echo ============================================
pause

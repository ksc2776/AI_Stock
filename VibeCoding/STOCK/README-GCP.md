# Google Cloud Run 배포 가이드

## 🚀 빠른 시작

이 애플리케이션은 Google Cloud Run에서 자동으로 배포됩니다.

### 1️⃣ Google Cloud Console 설정

#### 프로젝트 정보
- **Project ID**: `project-842398be-a4d4-405f-afa`
- **Region**: `asia-northeast1` (도쿄)
- **Platform**: Cloud Run (Managed)

#### 필수 API 활성화
```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  containerregistry.googleapis.com
```

### 2️⃣ GitHub 연결 (자동)

#### 옵션 A: Cloud Build으로 자동 배포 (권장)
1. [Google Cloud Console](https://console.cloud.google.com/)에서 Cloud Build로 이동
2. **설정** → **GitHub 저장소 연결**
3. `ksc2776/AI_Stock` 리포지토리 선택
4. **빌드 트리거 생성**:
   - 이름: `stock-app-deploy`
   - 이벤트: `Push to branch`
   - 브랜치: `main`
   - 빌드 설정: `cloudbuild.yaml`
   - 위치: `VibeCoding/STOCK/cloudbuild.yaml`

#### 옵션 B: GitHub Actions로 배포 (고급)
`.github/workflows/deploy.yml` 파일 추가 (생략)

### 3️⃣ 배포 확인

#### 배포 상태 확인
```bash
gcloud builds log --stream
```

#### Cloud Run 서비스 확인
```bash
gcloud run services list --region asia-northeast1
```

#### 배포된 URL 확인
```bash
gcloud run services describe stock-app --region asia-northeast1
```

예상 URL: `https://stock-app-[hash].run.app`

### 4️⃣ 스마트폰에서 접근

#### 공개 URL로 접근
```
https://stock-app-[hash].run.app
```

#### iOS (iPhone/iPad)
1. Safari에서 위 URL 입력
2. 홈 화면에 추가 (추천)
3. 설정 → 개인정보보호 → 신뢰된 앱 추가

#### Android
1. Chrome에서 위 URL 입력
2. "앱 설치" 선택 (PWA)
3. 또는 북마크에 추가

---

## 📊 비용 추정

### Cloud Run 무료 할당량 (월별)
- **요청**: 200만 건
- **CPU 시간**: 180,000초
- **메모리**: 360,000 GB·초
- **네트워크**: 1GB (무료)

### 초과 시 비용
| 항목 | 가격 |
|------|------|
| vCPU | $0.0000100/초 |
| 메모리 | $0.0000025/GB·초 |
| 요청 | $0.40/백만 건 |

### 예상 월별 비용
- **저트래픽** (100만 요청): ~$0 (무료 범위)
- **중트래픽** (1000만 요청): ~$4-10
- **고트래픽** (1억 요청): ~$40-100

---

## 🔧 환경 변수 설정

### Cloud Run에서 환경 변수 추가

```bash
gcloud run services update stock-app \
  --region asia-northeast1 \
  --set-env-vars NODE_ENV=production,LOG_LEVEL=info
```

또는 `cloudbuild.yaml`에서 수정:
```yaml
--set-env-vars NODE_ENV=production,LOG_LEVEL=info
```

---

## 🐛 문제 해결

### 배포 실패

#### 로그 확인
```bash
gcloud builds log --stream
```

#### 일반적인 에러

**1. "Docker 이미지 빌드 실패"**
```bash
# Dockerfile 경로 확인
cat VibeCoding/STOCK/Dockerfile

# 수동으로 로컬에서 빌드 테스트
docker build -t stock-app VibeCoding/STOCK/
docker run -p 8080:8080 stock-app
```

**2. "Cloud Run 배포 실패"**
```bash
# Cloud Run 권한 확인
gcloud projects get-iam-policy project-842398be-a4d4-405f-afa

# 서비스 계정 확인
gcloud iam service-accounts list
```

**3. "포트 8080에서 응답 없음"**
```bash
# server.js 확인
cat VibeCoding/STOCK/server.js | grep "PORT\|listen"

# 포트가 8080인지 확인
# 또는 PORT 환경 변수 설정
gcloud run services update stock-app \
  --region asia-northeast1 \
  --set-env-vars PORT=8080
```

### 스마트폰에서 접근 불가

#### CORS 에러 해결
```bash
# server.js에서 CORS 설정 확인
# vite.config.js에서 CORS 허용 확인
```

#### 네트워크 확인
```bash
# 공개 URL인지 확인
gcloud run services describe stock-app --region asia-northeast1 | grep "URL"

# 인증 비활성화 확인
gcloud run services describe stock-app --region asia-northeast1 | grep "unauthenticated"
```

---

## 📈 모니터링

### Cloud Run 메트릭 확인
```bash
gcloud monitoring dashboards list
```

### 실시간 로그 보기
```bash
gcloud logging read "resource.type=cloud_run_revision" --limit=50 --stream
```

### 에러 로그만 보기
```bash
gcloud logging read "resource.type=cloud_run_revision AND severity=ERROR" --limit=20
```

---

## 🔐 보안 설정

### 인증 활성화 (필요시)
```bash
gcloud run services update stock-app \
  --region asia-northeast1 \
  --no-allow-unauthenticated
```

### 트래픽 분할 (카나리 배포)
```bash
gcloud run services update-traffic stock-app \
  --region asia-northeast1 \
  --to-revisions stock-app-v1=90,stock-app-v2=10
```

---

## 🚀 고급 설정

### 커스텀 도메인
```bash
gcloud run domain-mappings create \
  --service=stock-app \
  --domain=stock.yourdomain.com \
  --region=asia-northeast1
```

### 최대 인스턴스 수 제한
```bash
gcloud run services update stock-app \
  --region asia-northeast1 \
  --max-instances 100
```

### 메모리 및 CPU 증가
```bash
gcloud run services update stock-app \
  --region asia-northeast1 \
  --memory 1Gi \
  --cpu 2
```

---

## 📝 자주 묻는 질문 (FAQ)

**Q: GitHub에 푸시하면 자동으로 배포되나요?**
A: 네, Cloud Build 트리거를 설정하면 자동 배포됩니다.

**Q: 배포에 얼마나 걸리나요?**
A: 보통 2-5분 소요됩니다.

**Q: 공개 URL을 비공개로 만들 수 있나요?**
A: 네, `--no-allow-unauthenticated` 옵션으로 설정 가능합니다.

**Q: 이전 버전으로 롤백할 수 있나요?**
A: 네, Cloud Run에서 리비전 관리로 가능합니다.

**Q: 데이터베이스를 사용할 수 있나요?**
A: 네, Cloud SQL, Firestore, BigQuery 등을 연결할 수 있습니다.

---

## 📚 참고 자료

- [Google Cloud Run 공식 문서](https://cloud.google.com/run/docs)
- [Cloud Build 설정](https://cloud.google.com/build/docs/config/build-config)
- [Docker 모범 사례](https://cloud.google.com/architecture/best-practices-for-running-cost-effective-kubernetes-applications-on-gke)

---

**마지막 업데이트**: 2026년 6월 7일
**작성자**: AI Assistant (Copilot CLI)

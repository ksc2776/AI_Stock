# 🚀 글로벌 풀스택 아키텍처 프로젝트 표준 설명서

본 설명서는 안정적인 유지보수와 엄격한 보안 품질 보증(QA)을 충족하기 위한 프론트엔드 및 백엔드 풀스택 개발 표준 가이드라인입니다. AI 아키텍트 및 개발자는 본 문서의 규칙을 반드시 준수해야 합니다.

---

## 📂 1. 프론트엔드 아키텍처 (Feature-Sliced Design)

소프트웨어의 결합도 제어와 모듈화를 위해 가독성이 높은 FSD(Feature-Sliced Design) 구조에 따라 폴더를 엄격히 분리하여 관리합니다.

- `src/app/`: 애플리케이션의 진입점, 글로벌 프로바이더 및 스타일 초기화 설정 영역
- `src/pages/`: 라우팅을 담당하는 화면 단위 컴포넌트 영역
- `src/widgets/`: 독립적으로 작동하는 완성형 UI 컴포넌트 결합체 영역
- `src/features/`: 바코드 스캔, API 전송 등 유저 상호작용 및 비즈니스 기능 중심 영역
- `src/entities/`: 데이터 모델링, 타입 정의 및 핵심 도메인 데이터 구조 영역
- `src/shared/`: 특정 도메인에 종속되지 않는 범용 공통 UI 부품(버튼, 입력창 등) 및 라이브러리 영역

> ⚠️ **FSD 단방향 참조 규칙:** 상위 레이어는 하위 레이어를 참조할 수 있으나, 하위 레이어는 상위 레이어를 역참조할 수 없습니다. 위반 시 순환 참조 결함으로 간주합니다.

---

## 🛠️ 2. 통합 개발 환경 (IDE) 및 소스코드 한글화 표준

- **권장 IDE:** Visual Studio Code / Antigravity IDE
- **코드 내부 주석 표준 (100% 한글화):** 소스코드 가독성과 유지보수 품질을 극대화하기 위해, 모든 함수와 컴포넌트 내부의 주석은 **한국어로 명확하고 상세하게** 작성합니다.

### ✍️ 코딩 주석 및 작성 예시 (JavaScript/TypeScript)

```javascript

/**
 * 사용자 스캔 데이터를 검증하고 클라우드 데이터베이스에 등록하는 함수
 * @param {Object} scanData - 스마트폰 카메라를 통해 추출된 정형 데이터
 * @returns {Promise<boolean>} 데이터베이스 저장 성공 여부
 */
export const processAndSyncData = async (scanData) => {
  // 1단계 [검증]: 입력된 스캔 데이터의 유효성(Null 체크 및 규격 부합 여부)을 확인합니다.
  if (!scanData || !scanData.id) {
    console.error("[품질 결함] 유효하지 않은 스캔 데이터가 인입되었습니다.");
    return false;
  }

  try {
    // 2단계 [변환]: 비정형 데이터를 시스템 표준 단일 레코드(JSONB) 구조로 매핑합니다.
    const payload = {
      raw_code: scanData.code,
      scanned_at: new Date().toISOString()
    };

    // 3단계 [전송]: 엔드포인트 설정을 호출하여 백엔드(Supabase)에 실시간 동기화를 수행합니다.
    // (보안 표준에 따라 주소 및 API Key는 외부 환경 변수 시스템에서 안전하게 호출됩니다.)
    const result = await dbClient.sync("project_sync", scanData.id, payload);
  
    return result.success;
  } catch (error) {
    // 4단계 [예외 처리]: 시스템 예외 발생 시 로그를 남기고 안전하게 결함을 격리합니다.
    console.error(`[서버 오류] 클라우드 동기화 실패: ${error.message}`);
    return false;
  }
};
```

## ⚡ 3. 단계별 검증 프로세스 (Gate Review 기법)

프로젝트의 유실 없는 저장과 품질 확보를 위해 각 단계를 완벽히 검증(Validation)한 후에만 다음 단계로 빌드를 진행합니다.

1. **[1단계] 로컬 환경 검증:** IDE 내에서 코드 린터(Linter) 및 포맷터 오류가 없는지 최종 확인합니다.
2. **[2단계] 데이터베이스 스키마 구축:** 데이터베이스 대시보드의 SQL Editor에서 연산 성능 최적화를 위한 단일 레코드 매핑 테이블을 생성합니다.
3. 
4. -- 글로벌 데이터베이스 실시간 연동용 표준 공용 테이블 생성 쿼리
   CREATE TABLE IF NOT EXISTS project_sync (
   id text PRIMARY KEY,
   data jsonb NOT NULL,
   updated_at timestamp with time zone DEFAULT now()
   );
5. 

* **[3단계] 환경 변수 로컬 테스트:** `.env.local` 템플릿 환경에서 백엔드 접속 인터페이스가 정상 작동하는지 API 응답 속도를 벤치마킹합니다.
* **[4단계] 원격 배포 및 HTTPS 검증:** GitHub에 코드를 푸시하고 Vercel을 연동하여 정식 배포 주소를 확보합니다. 스마트폰 하드웨어(카메라 등) 권한 승인을 위해 반드시 **HTTPS 보안 연결** 상태에서 종합 연동 테스트를 완료합니다.
* 

## 🔒 4. 🚀 프로덕션 운영 및 보안 강화 가이드 (필수)

실제 사용자가 접속하는 최종 운영(Production) 단계로 전환 시, 시스템 자산 보호를 위해 아래의 보안 프로토콜을 반드시 이행해야 합니다.

### 1) 소스코드 내 민감 정보 마스킹 (`*` 처리 규칙)

* 오픈소스 혹은 외부 형상관리 시스템에 코드가 유출되더라도 인프라 탈취가 불가능하도록 소스코드 내 설정 파일(`config.js` 등)의 실주소 및 마스터 키(Master Key) 문자열은 반드시 탈취 방지용 `*` 문자로 은닉 치환되어야 합니다.
* // 환경 설정 파일 보안 가속화 표준 예시
  export const GLOBAL_CONFIG = {
  API_URL: 'https://*******.supabase.co',
  ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.***'
  };
* 

### 2) Vercel 대시보드 비밀 금고(Environment Variables) 인프라 격리 이관

* 코드 파일 내부에서 인프라 키 값을 완전히 배제하고, Vercel 플랫폼이 제공하는 **`Settings ➔ Environment Variables`** 내부 원격 환경 변수 시스템에 키-값 쌍을 격리 등록하여 운영합니다.
* **등록할 환경 변수 표준 키 값:**
  * `SUPABASE_URL`: 클라우드 데이터베이스 고유 엔드포인트 주소
  * `SUPABASE_KEY`: 외부 접근 제어용 Anon Public Key

## 🤝 5. 기여 방법 및 개발 규격 (Contribution)

본 공용 템플릿에 버그 수정이나 새로운 아키텍처 레이어를 제안할 때는 다음과 같은 프로세스를 따릅니다.

1. 본 저장소를 `Fork` 합니다.
2. FSD 계층 구조에 부합하는 명확한 기능 단위 브랜치를 생성합니다 (`feature/기능명`).
3. 상단의 **주석 한글화 표준** 및 **단계별 검증**을 마친 뒤 `Pull Request`를 전송합니다.

## 📄 6. 라이선스 (License)

본 프로젝트 아키텍처 가이드라인은 **MIT License**를 따르며, 상업적 이용 및 수정, 배포가 자유롭게 허용되는 검증된 오픈소스 규격입니다.

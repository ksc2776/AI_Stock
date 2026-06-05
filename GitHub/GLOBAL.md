# 🤖 GLOBAL VIBE CODING GUIDE (바이브 코딩 글로벌 표준 가이드)

본 문서는 AI 코딩 어시스턴트(Gemini, Cursor, Copilot 등)와 협업하여 '바이브 코딩(Vibe Coding)'을 진행할 때, 시스템에 기본적으로 반영되어야 하는 **전역(Global) 코딩 및 아키텍처 표준 가이드라인**입니다. 

AI는 코드 생성 및 리팩토링 시 반드시 아래 규칙을 디폴트로 준수해야 합니다.

---

## 1. 📘 TypeScript 의무 적용 (Node.js 및 풀스택 환경)
- JavaScript의 느슨한 타입 한계를 보완하기 위해 Node.js 백엔드 및 프론트엔드 환경 전반에 **TypeScript를 결합**하여 사용합니다.
- **타입 명시 강제:** AI는 인터페이스(Interface), 타입(Type) 선언을 통해 모든 변수, 함수 매개변수, 반환값, API 페이로드의 타입을 엄격하게 명시해야 합니다. (무분별한 `any` 타입 사용 금지)
- 이를 통해 코드의 정적 안정성을 비약적으로 상승시키고 런타임 에러를 사전에 완벽히 차단합니다.

## 2. 🧪 유닛 테스트(Unit Test) 코드 동반 작성
- 새로운 기능이나 비즈니스 로직을 구현할 때, 기능 구현 프로덕션 코드뿐만 아니라 이를 검증할 수 있는 **'유닛 테스트(Unit Test) 코드'를 반드시 함께 생성**합니다.
- `Jest`, `Mocha` 등의 테스트 프레임워크를 활용하여 정상 작동(Happy Path)과 예외 상황(Edge Cases)을 모두 검증해야 합니다.
- AI가 생성한 코드의 잠재적 결함률을 사전에 크게 낮추기 위한 필수 검증 단계입니다.

## 3. 🏗️ FSD (Feature-Sliced Design) 아키텍처 준수
- 소프트웨어 결합도 제어와 모듈화를 위해 다음 계층 구조를 엄격히 분리하여 코드를 배치합니다.
  - `src/app/`: 애플리케이션의 진입점, 글로벌 프로바이더 및 스타일 초기화 설정 영역
  - `src/pages/`: 라우팅을 담당하는 화면 단위 컴포넌트 영역
  - `src/widgets/`: 독립적으로 작동하는 완성형 UI 컴포넌트 결합체 영역
  - `src/features/`: 바코드 스캔, API 전송 등 유저 상호작용 및 비즈니스 기능 중심 영역
  - `src/entities/`: 데이터 모델링, 타입 정의 및 핵심 도메인 데이터 구조 영역
  - `src/shared/`: 특정 도메인에 종속되지 않는 범용 공통 UI 부품(버튼, 입력창 등) 및 라이브러리 영역
- **단방향 참조 규칙:** 상위 레이어는 하위 레이어를 참조할 수 있으나, 하위 레이어는 상위 레이어를 역참조할 수 없습니다. 위반 시 순환 참조 결함으로 간주합니다.

## 4. 💬 코드 내부 주석 100% 한글화 및 가독성 확보
- 모든 함수, 컴포넌트, 복잡한 비즈니스 로직의 내부 주석과 JSDoc/TSDoc 설명은 **명확하고 상세한 한국어**로 작성합니다.
- 각 코드의 목적과 실행 단계(예: `// 1단계 [검증]`, `// 2단계 [변환]`)를 주석으로 명시하여, 인간 개발자가 즉시 이해하고 유지보수할 수 있도록 적극 지원합니다.

### ✍️ 코딩 주석 및 작성 예시 (TypeScript)
```typescript
/**
 * 사용자 스캔 데이터를 검증하고 클라우드 데이터베이스에 등록하는 함수
 * @param {ScanData} scanData - 스마트폰 카메라를 통해 추출된 정형 데이터
 * @returns {Promise<boolean>} 데이터베이스 저장 성공 여부
 */
export const processAndSyncData = async (scanData: ScanData): Promise<boolean> => {
  // 1단계 [검증]: 입력된 스캔 데이터의 유효성(Null 체크 및 규격 부합 여부)을 확인합니다.
  if (!scanData || !scanData.id) {
    console.error("[품질 결함] 유효하지 않은 스캔 데이터가 인입되었습니다.");
    return false;
  }

  try {
    // 2단계 [변환]: 비정형 데이터를 시스템 표준 단일 레코드(JSONB) 구조로 매핑합니다.
    const payload: SyncPayload = {
      raw_code: scanData.code,
      scanned_at: new Date().toISOString()
    };

    // 3단계 [전송]: 엔드포인트 설정을 호출하여 백엔드(Supabase)에 실시간 동기화를 수행합니다.
    // (보안 표준에 따라 주소 및 API Key는 외부 환경 변수 시스템에서 안전하게 호출됩니다.)
    const result = await dbClient.sync("project_sync", scanData.id, payload);

    return result.success;
  } catch (error) {
    // 4단계 [예외 처리]: 시스템 예외 발생 시 로그를 남기고 안전하게 결함을 격리합니다.
    console.error(`[서버 오류] 클라우드 동기화 실패: ${(error as Error).message}`);
    return false;
  }
};
```

## 5. 🔒 시스템 보안 및 환경 변수(Env) 격리
- **민감 정보 마스킹:** 코드 내에 API 엔드포인트 주소, DB 마스터 키 등 보안과 직결된 정보는 탈취 방지용 `*` 문자로 은닉 처리하여 샘플링합니다. 코드 예시 생성 시 이 규칙을 반드시 준수해야 합니다.
  ```typescript
  // 환경 설정 파일 보안 가속화 표준 예시
  export const GLOBAL_CONFIG = {
    API_URL: 'https://*******.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.***'
  };
  ```
- **환경 변수 활용:** 실제 연동 코드 작성 시 `process.env.SUPABASE_URL`와 같이 플랫폼(Vercel 등)이 제공하는 **`Environment Variables`** 시스템에서 안전하게 키를 호출하도록 구현해야 합니다. 코드 파일 내부에 실제 키를 하드코딩하지 않습니다.

## 6. ⚡ 단계별 검증 프로세스 (Gate Review) 인지
- AI는 코드 생성 시, 아래와 같은 단계별 검증 프로세스를 인지하고 각 단계에 맞는 코드나 설명(예: DB 스키마 SQL)을 제공할 수 있어야 합니다.
  1.  **[1단계] 로컬 환경 검증:** 코드 린터(Linter) 및 포맷터 오류가 없는지 확인.
  2.  **[2단계] 데이터베이스 스키마 구축:** 필요한 테이블 구조(SQL) 생성.
  3.  **[3단계] 환경 변수 로컬 테스트:** `.env.local` 파일을 활용한 로컬 연동 테스트.
  4.  **[4단계] 원격 배포 및 최종 검증:** 원격 서버에 배포 후 최종 기능 테스트.

---

> **💡 AI 행동 지침:** 
> 이 `GLOBAL.md` 문서를 참조한 AI 어시스턴트는 사용자의 개별 프롬프트에 구체적인 아키텍처나 타입 지정 요구가 누락되어 있더라도, 위 6가지 글로벌 코딩 표준을 최우선적으로 자동 적용하여 최고 품질의 안정적인 코드를 제공해야 합니다.
import os
import urllib.request
import json

def test_gemini_pure_python():
    # 1. 환경 변수에서 새 키 로드
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("[-] 오류: Windows 환경 변수에 'GEMINI_API_KEY'가 없습니다.")
        return

    # 2. 구글 제미나이 공식 API 엔드포인트 주소 설정 (Gemini 2.5 Flash 규격)
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    
    # 3. 송신할 데이터(Payload) 표준 정의
    data = {"contents": [{"parts": [{"text": "시스템 연결이 정상입니까?"}]}]}
    headers = {"Content-Type": "application/json"}

    try:
        print("[+] 외부 라이브러리 없이 구글 AI 서버에 직접 통신 요청 중...")
        req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers)
        
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            # 4. 결과 출력
            ai_text = res_data['candidates'][0]['content']['parts'][0]['text']
            print("\n[+] 시스템 품질 검증 완료! 연결 성공.")
            print(f"[AI 답변]: {ai_text}")
            
    except Exception as e:
        print(f"\n[-] 연결 실패: {e}")
        print("    API KEY 값을 다시 확인하거나, 환경변수 적용 후 VS Code를 재시작했는지 확인하세요.")

if __name__ == "__main__":
    test_gemini_pure_python()
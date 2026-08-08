"""
GitHub API를 통해 ConsensusCard.jsx를 직접 업데이트합니다.
토큰이 필요합니다 - 아래 TOKEN 변수에 GitHub Personal Access Token을 설정하세요.
"""
import base64
import json
import urllib.request
import urllib.error

TOKEN = "YOUR_GITHUB_TOKEN_HERE"  # 이 부분을 실제 토큰으로 교체하세요

# 수정된 파일 경로
file_path = r"c:\Workspace\VibeCoding\STOCK\src\components\cards\ConsensusCard.jsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Base64 인코딩
encoded = base64.b64encode(content.encode('utf-8')).decode('utf-8')

# GitHub API 요청
data = {
    "message": "Fix: ConsensusCard - consensus 문자열/null 방어 처리 추가",
    "content": encoded,
    "sha": "6269763ab306a97ba44bc7df1aef7777d93bdc81",
    "branch": "main"
}

url = "https://api.github.com/repos/ksc2776/AI_Stock/contents/VibeCoding/STOCK/src/components/cards/ConsensusCard.jsx"
headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/vnd.github+json",
    "Content-Type": "application/json"
}

req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method='PUT')
try:
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read())
        print(f"✅ 성공! Commit SHA: {result['commit']['sha']}")
except urllib.error.HTTPError as e:
    print(f"❌ 오류: {e.code} {e.reason}")
    print(e.read().decode())

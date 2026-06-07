FROM node:20-alpine

# 컨테이너 내 작업 디렉토리 설정
WORKDIR /usr/src/app

# package.json 및 package-lock.json 복사
COPY package*.json ./

# 의존성 설치 (production 전용)
RUN npm install

# 소스 코드 복사
COPY . .

# React 프론트엔드 빌드 (선택 사항: 이미 빌드된 dist를 올릴 수도 있지만, 컨테이너 내에서 빌드하는 것이 깔끔함)
RUN npm run build

# Cloud Run에서 요구하는 포트 개방 (기본 8080)
EXPOSE 8080

# 서버 실행
CMD [ "node", "server.js" ]

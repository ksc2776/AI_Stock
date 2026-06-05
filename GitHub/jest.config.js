/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // TypeScript 파일을 테스트하기 위해 ts-jest를 사용하도록 지정
  preset: 'ts-jest',
  
  // 프론트엔드 DOM 요소(document, window) 조작을 위한 가상 브라우저 환경 설정
  testEnvironment: 'jest-environment-jsdom',
  
  // 테스트 대상 파일 확장자 및 패턴 지정 (*.test.ts)
  testMatch: ['<rootDir>/**/*.test.ts'],

  // 모듈 확장자 인식 설정 (ts, js 파일을 최우선으로 탐색)
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
};
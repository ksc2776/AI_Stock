const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const version = 'v36.3.0';
const url = `https://npmmirror.com/mirrors/electron/${version}/electron-${version}-win32-x64.zip`;
const zipPath = path.join(__dirname, 'electron_temp.zip');
const distPath = path.join(__dirname, 'node_modules', 'electron', 'dist');
const exePath = path.join(distPath, 'electron.exe');
const pathFile = path.join(__dirname, 'node_modules', 'electron', 'path.txt');

// 이미 electron.exe 와 path.txt 가 정상적으로 존재하면 스킵
if (fs.existsSync(exePath) && fs.existsSync(pathFile)) {
  console.log('✅ Electron binary already exists. Ready to launch!');
  process.exit(0);
}

try {
  console.log('[1/3] Downloading Electron binary...');
  const downloadCmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object System.Net.WebClient).DownloadFile('${url}', '${zipPath}')"`;
  execSync(downloadCmd, { stdio: 'inherit' });

  console.log('[2/3] Extracting Electron zip...');
  if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath, { recursive: true });
  }
  const extractCmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${distPath}' -Force"`;
  execSync(extractCmd, { stdio: 'inherit' });

  console.log('[3/3] Registering path.txt...');
  fs.writeFileSync(pathFile, 'electron.exe');

  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  console.log('✅ Electron successfully restored!');
} catch (err) {
  console.error('❌ Failed:', err.message);
  process.exit(1);
}

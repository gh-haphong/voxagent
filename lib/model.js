'use strict';

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const MODEL_DIR = path.join(os.homedir(), '.voxagent', 'models');
const MODEL_FILE = 'ggml-base.en.bin';
const MODEL_URL = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin';

function getModelPath() {
  return path.join(MODEL_DIR, MODEL_FILE);
}

function download(url, dest, maxRedirects) {
  if (maxRedirects === undefined) maxRedirects = 5;

  return new Promise((resolve, reject) => {
    if (maxRedirects < 0) {
      return reject(new Error('Too many redirects'));
    }

    const proto = url.startsWith('https') ? https : http;
    const tmpDest = dest + '.tmp';

    proto.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        res.resume();
        return download(res.headers.location, dest, maxRedirects - 1).then(resolve, reject);
      }

      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`Download failed: HTTP ${res.statusCode}`));
      }

      const totalBytes = parseInt(res.headers['content-length'], 10) || 0;
      let downloadedBytes = 0;
      const file = fs.createWriteStream(tmpDest);

      res.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        if (totalBytes > 0) {
          const pct = ((downloadedBytes / totalBytes) * 100).toFixed(1);
          const dlMB = (downloadedBytes / 1048576).toFixed(1);
          const totalMB = (totalBytes / 1048576).toFixed(1);
          process.stdout.write(`\rDownloading whisper model... ${dlMB} MB / ${totalMB} MB (${pct}%)`);
        } else {
          const dlMB = (downloadedBytes / 1048576).toFixed(1);
          process.stdout.write(`\rDownloading whisper model... ${dlMB} MB`);
        }
      });

      res.pipe(file);

      file.on('finish', () => {
        file.close(() => {
          process.stdout.write('\n');
          fs.renameSync(tmpDest, dest);
          resolve();
        });
      });

      file.on('error', (err) => {
        fs.unlink(tmpDest, () => {});
        reject(err);
      });

      res.on('error', (err) => {
        fs.unlink(tmpDest, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

async function ensureModel() {
  const modelPath = getModelPath();

  if (fs.existsSync(modelPath)) {
    return modelPath;
  }

  fs.mkdirSync(MODEL_DIR, { recursive: true });

  process.stdout.write('Whisper model not found. Downloading base.en (~150 MB)...\n');
  await download(MODEL_URL, modelPath);
  process.stdout.write('Model downloaded successfully.\n');

  return modelPath;
}

module.exports = { getModelPath, ensureModel };

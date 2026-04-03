'use strict';

const Decibri = require('decibri');

function startCapture() {
  const mic = new Decibri({ sampleRate: 16000, channels: 1, format: 'int16' });
  const chunks = [];

  mic.on('data', (chunk) => {
    chunks.push(chunk);
  });

  mic.on('error', (err) => {
    console.error('Mic error:', err.message);
  });

  return { mic, chunks };
}

function stopCapture(handle) {
  handle.mic.stop();
  return Buffer.concat(handle.chunks);
}

module.exports = { startCapture, stopCapture };

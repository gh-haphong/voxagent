'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { transcribe: whisperTranscribe } = require('@kutalia/whisper-node-addon');

function createWavBuffer(pcmInt16Buffer) {
  const dataSize = pcmInt16Buffer.length;
  const header = Buffer.alloc(44);

  // RIFF chunk descriptor
  header.write('RIFF', 0);                    // ChunkID
  header.writeUInt32LE(36 + dataSize, 4);      // ChunkSize
  header.write('WAVE', 8);                     // Format

  // fmt sub-chunk
  header.write('fmt ', 12);                    // Subchunk1ID
  header.writeUInt32LE(16, 16);                // Subchunk1Size (PCM = 16)
  header.writeUInt16LE(1, 20);                 // AudioFormat (PCM = 1)
  header.writeUInt16LE(1, 22);                 // NumChannels (mono = 1)
  header.writeUInt32LE(16000, 24);             // SampleRate
  header.writeUInt32LE(32000, 28);             // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  header.writeUInt16LE(2, 32);                 // BlockAlign (NumChannels * BitsPerSample/8)
  header.writeUInt16LE(16, 34);                // BitsPerSample

  // data sub-chunk
  header.write('data', 36);                    // Subchunk2ID
  header.writeUInt32LE(dataSize, 40);          // Subchunk2Size

  return Buffer.concat([header, pcmInt16Buffer]);
}

async function transcribe(pcmInt16Buffer, modelPath) {
  const tmpFile = path.join(os.tmpdir(), `voxagent-${Date.now()}.wav`);

  fs.writeFileSync(tmpFile, createWavBuffer(pcmInt16Buffer));

  try {
    const result = await whisperTranscribe({
      fname_inp: tmpFile,
      model: modelPath,
      language: 'en',
      use_gpu: true,
      no_prints: true,
    });

    // Normalize: result may be array of segments, string, or object
    if (Array.isArray(result)) {
      return result
        .map((s) => (typeof s === 'string' ? s : s.speech || s.text || ''))
        .join(' ')
        .trim();
    }
    if (typeof result === 'string') {
      return result.trim();
    }
    if (result && typeof result === 'object') {
      return (result.speech || result.text || '').trim();
    }
    return '';
  } finally {
    try { fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

module.exports = { transcribe, createWavBuffer };

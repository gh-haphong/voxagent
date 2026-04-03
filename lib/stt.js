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

async function transcribe(pcmInt16Buffer, modelPath, debug) {
  const tmpFile = path.join(os.tmpdir(), `voxagent-${Date.now()}.wav`);
  const wavBuffer = createWavBuffer(pcmInt16Buffer);

  fs.writeFileSync(tmpFile, wavBuffer);

  if (debug) {
    const debugPath = path.join(process.cwd(), 'debug-capture.wav');
    fs.writeFileSync(debugPath, wavBuffer);
    console.log(`[debug] Saved WAV to ${debugPath} (${wavBuffer.length} bytes)`);

    // Check audio levels
    const samples = new Int16Array(pcmInt16Buffer.buffer, pcmInt16Buffer.byteOffset, pcmInt16Buffer.length / 2);
    let max = 0, sum = 0;
    for (let i = 0; i < samples.length; i++) {
      const abs = Math.abs(samples[i]);
      if (abs > max) max = abs;
      sum += abs;
    }
    console.log(`[debug] Audio: ${samples.length} samples, max=${max}, avg=${(sum / samples.length).toFixed(1)}, silence=${max < 100}`);
  }

  try {
    const result = await whisperTranscribe({
      fname_inp: tmpFile,
      model: modelPath,
      language: 'en',
      use_gpu: true,
      no_prints: true,
    });

    if (debug) {
      console.log('[debug] Whisper result:', JSON.stringify(result));
    }

    // Result shape: { transcription: string[][] | string[] }
    // Each segment is ["00:00:00.000", "00:00:06.800", " actual text here"]
    // Timestamps are the first two elements; text is the rest.
    if (result && result.transcription) {
      return result.transcription
        .map((segment) => {
          if (Array.isArray(segment)) {
            return segment
              .filter((s) => !s.match(/^\d{2}:\d{2}:\d{2}\.\d{3}$/))
              .join(' ');
          }
          return String(segment);
        })
        .join(' ')
        .trim();
    }

    return '';
  } finally {
    try { fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

module.exports = { transcribe, createWavBuffer };

'use strict';

const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const DIM = '\x1b[2m';

function waitForKey() {
  return new Promise((resolve) => {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', (key) => {
      if (key[0] === 0x03) {
        process.stdin.setRawMode(false);
        process.stdout.write('\n');
        process.exit(0);
      }
      process.stdin.setRawMode(false);
      process.stdin.pause();
      resolve();
    });
  });
}

function print(msg) {
  process.stdout.write(msg + '\n');
}

function printError(msg) {
  process.stdout.write(`${RED}Error: ${msg}${RESET}\n`);
}

function printTranscript(text) {
  process.stdout.write(`\n${GREEN}You:${RESET} ${text}\n`);
}

function printResponse(text) {
  process.stdout.write(`\n${text}\n`);
}

function printStatus(msg) {
  process.stdout.write(`${DIM}${msg}${RESET}\n`);
}

function printBanner(version) {
  process.stdout.write(`\n${CYAN}voxagent${RESET} v${version} — voice-powered terminal\n\n`);
}

module.exports = {
  waitForKey,
  print,
  printError,
  printTranscript,
  printResponse,
  printStatus,
  printBanner,
};

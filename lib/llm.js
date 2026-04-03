'use strict';

const { Ollama } = require('ollama');

const DEFAULT_MODEL = 'llama3.2';

function createClient() {
  return new Ollama({ host: 'http://127.0.0.1:11434' });
}

async function checkConnection() {
  try {
    const ollama = createClient();
    await ollama.list();
    return true;
  } catch {
    return false;
  }
}

async function ask(text, model) {
  const ollama = createClient();
  const response = await ollama.chat({
    model: model || DEFAULT_MODEL,
    messages: [{ role: 'user', content: text }],
  });
  return response.message.content;
}

module.exports = { checkConnection, ask, DEFAULT_MODEL };

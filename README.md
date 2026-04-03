# voxagent

Voice-powered terminal agent. Fully offline.

Press a key, speak, get an answer. Nothing leaves your machine.

## Quick start

```bash
npm install -g voxagent
voxagent
```

## Requirements

- Node.js 18+
- [Ollama](https://ollama.com) running locally

That's it. No API keys. No cloud accounts. No recurring costs.

On first run, voxagent downloads a small whisper model (~150 MB) for speech-to-text. Everything runs on your machine.

## Usage

```
$ voxagent

Press ENTER to speak...
[Recording...] Press ENTER to stop.

Transcribing...
You: What's the default port for PostgreSQL?

Thinking...
PostgreSQL runs on port 5432 by default.

Press ENTER to speak...
```

### Options

```
--model <name>   Ollama model to use (default: llama3.2)
--help, -h       Show help
--version, -v    Show version
```

## How it works

voxagent captures your voice with [decibri](https://decibri.dev), transcribes it locally with [whisper.cpp](https://github.com/ggerganov/whisper.cpp), sends the text to your local [Ollama](https://ollama.com) model, and prints the response.

No audio is recorded, stored, or transmitted. Ever.

## Powered by

- [decibri](https://decibri.dev) - cross-platform microphone capture
- [whisper.cpp](https://github.com/ggerganov/whisper.cpp) - local speech-to-text
- [Ollama](https://ollama.com) - local LLM inference

## License

Apache 2.0

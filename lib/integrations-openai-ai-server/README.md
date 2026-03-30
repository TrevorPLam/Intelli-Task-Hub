# @workspace/integrations-openai-ai-server
> Server-side OpenAI integration library with comprehensive configuration and error handling

Server-side OpenAI client providing chat completions, image generation, and audio transcription capabilities with advanced configuration, rate limiting, and error handling.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Security](#security)

## Overview

### Purpose
- **AI Integration** - Unified interface to OpenAI services
- **Type Safety** - Full TypeScript support with generated types
- **Error Handling** - Comprehensive error handling and retry logic
- **Performance** - Optimized for production workloads
- **Monitoring** - Built-in metrics and logging

### Supported Services
- **Chat Completions** - GPT-4 and GPT-3.5 models
- **Image Generation** - DALL-E 3 image creation
- **Audio Transcription** - Whisper speech-to-text
- **Batch Processing** - Efficient batch operations

## Features

### Advanced Configuration
- **Model Selection** - Support for all OpenAI models
- **Rate Limiting** - Configurable request limits
- **Timeout Management** - Per-request timeout configuration
- **Retry Logic** - Exponential backoff with jitter
- **Streaming Support** - Real-time response streaming

### Error Handling
- **Structured Errors** - Consistent error format
- **Retry Strategies** - Configurable retry policies
- **Fallback Options** - Graceful degradation
- **Logging Integration** - Structured logging with context

### Performance Optimization
- **Connection Pooling** - Reuse HTTP connections
- **Request Batching** - Batch multiple operations
- **Caching** - Response caching where appropriate
- **Monitoring** - Built-in performance metrics

## Installation

### Prerequisites
- Node.js 24+
- OpenAI API key
- pnpm package manager

### Setup Commands

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your OpenAI configuration
```

## Configuration

### Environment Variables

#### Required Configuration
```bash
# OpenAI API Key (required)
AI_INTEGRATIONS_OPENAI_API_KEY=sk-your-openai-api-key
```

#### Optional Configuration
```bash
# OpenAI Configuration
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
AI_INTEGRATIONS_OPENAI_CHAT_MODEL=gpt-4
AI_INTEGRATIONS_OPENAI_IMAGE_MODEL=dall-e-3
AI_INTEGRATIONS_OPENAI_AUDIO_MODEL=whisper-1
AI_INTEGRATIONS_OPENAI_MAX_TOKENS=4096
AI_INTEGRATIONS_OPENAI_TEMPERATURE=0.7
AI_INTEGRATIONS_OPENAI_TIMEOUT_MS=30000

# Rate Limiting
AI_INTEGRATIONS_OPENAI_RATE_LIMIT_RPM=60
AI_INTEGRATIONS_OPENAI_RATE_LIMIT_TPM=100000

# Feature Flags
AI_INTEGRATIONS_OPENAI_ENABLE_STREAMING=true
AI_INTEGRATIONS_OPENAI_ENABLE_IMAGES=true
AI_INTEGRATIONS_OPENAI_ENABLE_AUDIO=true

# Advanced Options
AI_INTEGRATIONS_OPENAI_ORG_ID=your-organization-id
AI_INTEGRATIONS_OPENAI_PROJECT_ID=your-project-id
```

### Configuration Object
```typescript
import { createOpenAIConfig } from '@workspace/integrations-openai-ai-server';

const config = createOpenAIConfig({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseUrl: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  defaultModel: 'gpt-4',
  maxTokens: 4096,
  temperature: 0.7,
  timeout: 30000,
  rateLimit: {
    requestsPerMinute: 60,
    tokensPerMinute: 100000,
  },
  features: {
    streaming: true,
    images: true,
    audio: true,
  },
});
```

## Usage

### Basic Usage

#### Chat Completions
```typescript
import { createChatCompletion } from '@workspace/integrations-openai-ai-server';

async function chatExample() {
  const completion = await createChatCompletion({
    messages: [
      { role: 'user', content: 'Hello, how can you help me today?' }
    ],
    model: 'gpt-4',
    maxTokens: 1000,
    temperature: 0.7,
  });

  console.log(completion.choices[0].message.content);
}
```

#### Streaming Chat
```typescript
import { createStreamingChatCompletion } from '@workspace/integrations-openai-ai-server';

async function streamingChatExample() {
  const stream = await createStreamingChatCompletion({
    messages: [
      { role: 'user', content: 'Tell me a story' }
    ],
    model: 'gpt-4',
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    process.stdout.write(content);
  }
}
```

#### Image Generation
```typescript
import { createImageGeneration } from '@workspace/integrations-openai-ai-server';

async function imageExample() {
  const images = await createImageGeneration({
    prompt: 'A beautiful sunset over mountains',
    model: 'dall-e-3',
    size: '1024x1024',
    quality: 'standard',
    n: 1,
  });

  console.log('Image URL:', images.data[0].url);
}
```

#### Audio Transcription
```typescript
import { createAudioTranscription } from '@workspace/integrations-openai-ai-server';
import { readFile } from 'fs/promises';

async function transcriptionExample() {
  const audioFile = await readFile('audio.mp3');
  
  const transcription = await createAudioTranscription({
    file: audioFile,
    model: 'whisper-1',
    language: 'en',
  });

  console.log('Transcription:', transcription.text);
}
```

### Advanced Usage

#### Batch Operations
```typescript
import { createBatchChatCompletion } from '@workspace/integrations-openai-ai-server';

async function batchExample() {
  const requests = [
    { messages: [{ role: 'user', content: 'Hello' }] },
    { messages: [{ role: 'user', content: 'How are you?' }] },
    { messages: [{ role: 'user', content: 'Goodbye' }] },
  ];

  const results = await createBatchChatCompletion(requests);
  console.log('Batch results:', results);
}
```

#### Custom Configuration
```typescript
import { OpenAIClient } from '@workspace/integrations-openai-ai-server';

const client = new OpenAIClient({
  apiKey: 'your-api-key',
  organization: 'your-org-id',
  timeout: 60000,
  retryConfig: {
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 30000,
  },
});

const response = await client.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello' }],
});
```

## API Reference

### Chat Completions

#### `createChatCompletion`
```typescript
interface ChatCompletionRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string | string[];
}

interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finishReason: 'stop' | 'length' | 'content_filter';
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
```

#### `createStreamingChatCompletion`
```typescript
interface StreamingChatCompletionRequest extends ChatCompletionRequest {
  stream: true;
}

interface StreamingChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finishReason?: string;
  }>;
}
```

### Image Generation

#### `createImageGeneration`
```typescript
interface ImageGenerationRequest {
  prompt: string;
  model?: string;
  n?: number;
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024';
  quality?: 'standard' | 'hd';
  responseFormat?: 'url' | 'b64_json';
  user?: string;
}

interface ImageGenerationResponse {
  created: number;
  data: Array<{
    url?: string;
    b64_json?: string;
    revisedPrompt?: string;
  }>;
}
```

### Audio Transcription

#### `createAudioTranscription`
```typescript
interface AudioTranscriptionRequest {
  file: Buffer | File;
  model?: string;
  language?: string;
  prompt?: string;
  responseFormat?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
  temperature?: number;
}

interface AudioTranscriptionResponse {
  text: string;
  task: 'transcribe';
  language: string;
  duration: number;
  words?: Array<{
    word: string;
    start: number;
    end: number;
  }>;
}
```

## Security

### API Key Protection
```typescript
// Environment variable validation
const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
if (!apiKey || !apiKey.startsWith('sk-')) {
  throw new Error('Invalid OpenAI API key format');
}

// Secure key storage (never log API keys)
console.log('Configuration loaded, API key:', '[REDACTED]');
```

### Input Validation
```typescript
import { z } from 'zod';

const chatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string().max(4000),
  })).min(1).max(50),
  maxTokens: z.number().min(1).max(8000).optional(),
});

function validateChatRequest(request: unknown) {
  return chatRequestSchema.parse(request);
}
```

### Rate Limiting
```typescript
import { pLimit } from 'p-limit';

// Rate limit concurrent requests
const limit = pLimit(5); // Max 5 concurrent requests

async function rateLimitedRequest(request: ChatCompletionRequest) {
  return limit(() => createChatCompletion(request));
}
```

## Development

### Testing
```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test chat.test.ts
```

### Mock Testing
```typescript
// __tests__/mocks/openai.ts
import { vi } from 'vitest';

export const mockOpenAIResponse = {
  choices: [{
    message: { content: 'Mock response' },
    finishReason: 'stop',
  }],
  usage: {
    promptTokens: 10,
    completionTokens: 20,
    totalTokens: 30,
  },
};

vi.mock('@workspace/integrations-openai-ai-server', () => ({
  createChatCompletion: vi.fn().mockResolvedValue(mockOpenAIResponse),
}));
```

### Performance Monitoring
```typescript
import { createMetricsCollector } from '@workspace/integrations-openai-ai-server';

const metrics = createMetricsCollector();

// Track request metrics
metrics.trackRequest({
  endpoint: 'chat.completions',
  model: 'gpt-4',
  tokensUsed: 100,
  responseTime: 1500,
});

// Get performance summary
console.log(metrics.getSummary());
```

## Dependencies

### Runtime Dependencies
- `openai` - Official OpenAI Node.js SDK
- `p-limit` - Promise concurrency limiting
- `p-retry` - Retry logic with exponential backoff

### Development Dependencies
- `@types/node` - Node.js TypeScript definitions
- `vitest` - Testing framework

## Related Packages

- **[@workspace/api-server](../../artifacts/api-server/README.md)** - API server using this integration
- **[@workspace/integrations-openai-ai-react](../integrations-openai-ai-react/README.md)** - React hooks for client-side AI

## Troubleshooting

### Common Issues

#### API Key Errors
```bash
# Verify API key format
echo $AI_INTEGRATIONS_OPENAI_API_KEY | grep -E "^sk-"

# Test API key
curl -H "Authorization: Bearer $AI_INTEGRATIONS_OPENAI_API_KEY" \
  https://api.openai.com/v1/models
```

#### Rate Limiting
- Check rate limit configuration
- Implement proper backoff logic
- Monitor usage in OpenAI dashboard

#### Timeout Issues
- Increase timeout values for large requests
- Implement streaming for long responses
- Check network connectivity

### Debug Mode
```typescript
// Enable debug logging
process.env.DEBUG = 'openai:*';

// Verbose error logging
const client = new OpenAIClient({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  logLevel: 'debug',
});
```

## Support

For OpenAI integration issues:
- Check [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- Review [OpenAI Node.js SDK](https://github.com/openai/openai-node)
- Submit [GitHub Issues](https://github.com/TrevorPLam/Intelli-Task-Hub/issues)

## License

MIT License - see the main project [LICENSE](../../../LICENSE) file for details.

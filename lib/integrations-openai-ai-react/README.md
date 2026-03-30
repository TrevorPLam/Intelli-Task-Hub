# @workspace/integrations-openai-ai-react

React hooks and utilities for integrating with OpenAI services in the Intelli-Task-Hub workspace.

## Installation

```bash
pnpm add @workspace/integrations-openai-ai-react
```

## Audio Features

This package provides voice chat capabilities through AudioWorklet-based audio playback and recording.

### Setup Requirements

**Important**: The AudioWorklet file must be served from the same origin as your application.

#### Option 1: Manual Deployment (Recommended for production)

1. Copy the worklet file to your public directory:

```bash
cp node_modules/@workspace/integrations-openai-ai-react/src/audio/audio-playback-worklet.js public/
```

2. Use the worklet path in your components:

```tsx
import { useVoiceStream } from "@workspace/integrations-openai-ai-react/audio";

function VoiceChat() {
  const stream = useVoiceStream({
    workletPath: "/audio-playback-worklet.js", // Path relative to your domain root
    onTranscript: (partial, full) => console.log(full),
    onComplete: (text) => console.log("Complete:", text),
  });

  // ... component logic
}
```

#### Option 2: Vite Automatic Resolution (Development)

For Vite-based applications, you can use the exported URL:

```tsx
import {
  useVoiceStream,
  audioPlaybackWorkletUrl,
} from "@workspace/integrations-openai-ai-react/audio";

function VoiceChat() {
  const stream = useVoiceStream({
    workletPath: audioPlaybackWorkletUrl, // Automatically resolved by Vite
    onTranscript: (partial, full) => console.log(full),
    onComplete: (text) => console.log("Complete:", text),
  });

  // ... component logic
}
```

#### Option 3: Expo Web Compatibility

For Expo Web applications, the worklet must be placed in the `public/` directory and accessed via the absolute URL:

```tsx
import { useVoiceStream } from "@workspace/integrations-openai-ai-react/audio";

function VoiceChat() {
  const workletPath = `${process.env.EXPO_PUBLIC_APP_ORIGIN}/audio-playback-worklet.js`;

  const stream = useVoiceStream({
    workletPath,
    onTranscript: (partial, full) => console.log(full),
    onComplete: (text) => console.log("Complete:", text),
  });

  // ... component logic
}
```

## API Reference

### `useVoiceRecorder`

Hook for recording audio from the user's microphone.

```tsx
import {
  useVoiceRecorder,
  type RecordingState,
} from "@workspace/integrations-openai-ai-react/audio";

const recorder = useVoiceRecorder();

// recorder.state: 'idle' | 'recording' | 'stopped'
// recorder.startRecording(): Promise<void>
// recorder.stopRecording(): Promise<Blob>
```

### `useVoiceStream`

Hook for streaming audio to OpenAI and receiving real-time transcription.

```tsx
import { useVoiceStream } from '@workspace/integrations-openai-ai-react/audio';

const stream = useVoiceStream({
  workletPath: string,
  onTranscript: (partial: string, full: string) => void,
  onComplete: (text: string) => void,
  onError?: (error: Error) => void,
});

// stream.streamVoiceResponse(endpoint: string, audioBlob: Blob): Promise<void>
```

### `useAudioPlayback`

Hook for playing back audio through the AudioWorklet.

```tsx
import {
  useAudioPlayback,
  type PlaybackState,
} from "@workspace/integrations-openai-ai-react/audio";

const playback = useAudioPlayback(workletPath);

// playback.state: 'idle' | 'playing' | 'stopped'
// playback.play(pcm16Audio: string): void
// playback.stop(): void
// playback.clear(): void
```

### `createAudioPlaybackContext`

Utility function to create an AudioContext with the worklet loaded.

```tsx
import { createAudioPlaybackContext } from "@workspace/integrations-openai-ai-react/audio";

const { ctx, worklet } = await createAudioPlaybackContext(
  workletPath,
  sampleRate
);
```

### `decodePCM16ToFloat32`

Utility function to decode base64 PCM16 audio to Float32Array.

```tsx
import { decodePCM16ToFloat32 } from "@workspace/integrations-openai-ai-react/audio";

const float32Data = decodePCM16ToFloat32(base64PCM16Audio);
```

## Security Considerations

- The AudioWorklet must be served from the same origin due to browser security restrictions
- Always validate user input before processing
- Ensure proper microphone permissions are handled
- Consider adding rate limiting for voice requests

## Browser Compatibility

- Chrome 66+ (AudioWorklet support)
- Firefox 76+ (AudioWorklet support)
- Safari 14.1+ (AudioWorklet support)
- Expo Web (with worklet in public/ directory)

## Troubleshooting

### "URL is not defined" Error

Ensure you're using the correct worklet path for your build system:

- Vite: Use `audioPlaybackWorkletUrl` export
- Manual deployment: Use absolute path from domain root
- Expo Web: Use full URL with `EXPO_PUBLIC_APP_ORIGIN`

### Worklet Fails to Load

1. Verify the worklet file is accessible in your browser
2. Check same-origin policy compliance
3. Ensure proper MIME type (`.js` files should serve as `application/javascript`)

### No Audio Output

1. Check browser autoplay policies
2. Ensure AudioContext is resumed after user interaction
3. Verify worklet is properly loaded and connected

## Development

This package is part of the Intelli-Task-Hub monorepo. See the main workspace documentation for development setup.

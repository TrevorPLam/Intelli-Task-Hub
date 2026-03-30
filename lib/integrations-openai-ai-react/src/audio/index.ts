/**
 * Voice chat client utilities for Replit AI Integrations.
 *
 * Usage:
 * 1. Copy audio-playback-worklet.js to your public/ folder
 * 2. Pass the deployed worklet URL into hooks, or use audioPlaybackWorkletUrl for Vite
 *
 * Example:
 * ```tsx
 * import { useVoiceRecorder, useVoiceStream, audioPlaybackWorkletUrl } from "./audio";
 *
 * function VoiceChat({ workletPath }: { workletPath?: string }) {
 *   const [transcript, setTranscript] = useState("");
 *   const recorder = useVoiceRecorder();
 *   const stream = useVoiceStream({
 *     workletPath: workletPath ?? audioPlaybackWorkletUrl,
 *     onTranscript: (_, full) => setTranscript(full),
 *     onComplete: (text) => console.log("Done:", text),
 *   });
 *
 *   const handleClick = async () => {
 *     if (recorder.state === "recording") {
 *       const blob = await recorder.stopRecording();
 *       await stream.streamVoiceResponse("/api/openai/conversations/1/voice-messages", blob);
 *     } else {
 *       await recorder.startRecording();
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleClick}>
 *         {recorder.state === "recording" ? "Stop" : "Record"}
 *       </button>
 *       <p>{transcript}</p>
 *     </div>
 *   );
 * }
 * ```
 */

// Vite consumers can use this URL directly
export const audioPlaybackWorkletUrl =
  typeof import.meta !== "undefined"
    ? new URL("./audio-playback-worklet.js", import.meta.url).href
    : "/audio-playback-worklet.js";

export {
  decodePCM16ToFloat32,
  createAudioPlaybackContext,
} from "./audio-utils";
export { useVoiceRecorder, type RecordingState } from "./useVoiceRecorder";
export { useAudioPlayback, type PlaybackState } from "./useAudioPlayback";
export { useVoiceStream } from "./useVoiceStream";

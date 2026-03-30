/**
 * Global type definitions for WebAssembly and Web Audio APIs
 * Following TypeScript 2026 best practices for enterprise applications
 */

declare global {
  interface WebAssemblyGlobal {
    instantiate(
      bytes: ArrayBufferSource,
      importObject?: WebAssembly.Imports,
    ): Promise<WebAssembly.WebAssemblyInstantiatedSource>;
    Memory: {
      new(bufferSource?: ArrayBufferLike | SharedArrayBuffer): WebAssembly.Memory;
      validate(address: number, length: number): boolean;
      grow(delta: number): void;
    }
  }
}

declare const WebAssembly: WebAssemblyGlobal;

declare global {
  interface AudioWorkletGlobalScope {
    currentFrame: number;
    sampleRate: number;
    currentTime: number;
  }
}

declare global {
  interface AudioWorkletProcessor {
    process(inputs: Float32Array[][], parameters: Record<string, number>, outputs: Float32Array[][]): void;
  }
}

declare global {
  interface MessagePort {
    postMessage(message: any, transfer?: Transferable[]): void;
    start(): void;
    close(): void;
  }
}

declare global {
  type Transferable = ArrayBuffer | MessagePort | ImageBitmap | OffscreenCanvas | ReadableStream | WritableStream | TransformStream | AudioData;
}

declare global {
  interface SharedArrayBuffer {
    readonly byteLength: number;
    readonly maxByteLength: number;
    slice(begin?: number, end?: number): SharedArrayBuffer;
    transfer(): ArrayBuffer;
  }
}

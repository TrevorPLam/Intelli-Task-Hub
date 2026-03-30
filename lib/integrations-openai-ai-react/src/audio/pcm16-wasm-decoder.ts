/**
 * WebAssembly-optimized PCM16 to Float32 audio decoder
 * Provides high-performance audio processing using WASM for CPU-intensive operations
 */

// WebAssembly module interface for PCM16 decoding
export interface PCM16DecoderModule {
  memory: WebAssembly.Memory;
  decodePCM16ToFloat32: (inputPtr: number, inputSize: number, outputPtr: number) => void;
  allocate: (size: number) => number;
  free: (ptr: number) => void;
}

declare const WebAssembly: {
  instantiate: (
    bytes: ArrayBufferSource,
    importObject?: WebAssembly.Imports,
  ): Promise<WebAssembly.WebAssemblyInstantiatedSource>;
};

export class WebAssemblyPCM16Decoder {
  private wasmModule: PCM16DecoderModule | null = null;
  private wasmInstance: WebAssembly.Instance | null = null;
  private memoryBuffer: Uint8Array | null = null;
  private decodeFunction: ((inputPtr: number, inputSize: number, outputPtr: number) => void) | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize WebAssembly module
   */
  async initialize(): Promise<void> {
    try {
      // Load WebAssembly module
      const wasmResponse = await fetch('/wasm/pcm16-decoder.wasm');
      if (!wasmResponse.ok) {
        throw new Error(`Failed to load WASM module: ${wasmResponse.status}`);
      }

      const wasmBuffer = await wasmResponse.arrayBuffer();
      const wasmBytes = new Uint8Array(wasmBuffer);

      // Create WebAssembly memory
      const pageSize = 65536;
      const initialMemory = new WebAssembly.Memory({ 
        initial: 1, // 1 page = 64KB
        maximum: 256, // 256 pages = 16MB max
      });

      // Compile WebAssembly module
      const wasmModule = await WebAssembly.instantiate(wasmBytes, {
        env: {
          memory: initialMemory,
          // Import functions for memory management
          abort: (reason: string) => {
            console.error('WASM abort:', reason);
            throw new Error(`WebAssembly aborted: ${reason}`);
          }
        }
      });

      this.wasmInstance = wasmModule.instance;
      this.wasmModule = wasmModule;
      this.memoryBuffer = new Uint8Array(initialMemory.buffer);

      // Get the decode function
      this.decodeFunction = this.wasmInstance.exports.decodePCM16ToFloat32 as any;

      console.log('WebAssembly PCM16 decoder initialized successfully');
    } catch (error) {
      console.error('Failed to initialize WebAssembly PCM16 decoder:', error);
      throw error;
    }
  }

  /**
   * Decode base64 PCM16 audio data to Float32Array using WebAssembly
   */
  decodePCM16ToFloat32(base64Audio: string): Float32Array {
    if (!this.wasmInstance || !this.decodeFunction) {
      throw new Error('WebAssembly module not initialized');
    }

    try {
      // Decode base64 to binary
      const binaryString = atob(base64Audio);
      const inputBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        inputBytes[i] = binaryString.charCodeAt(i);
      }

      // Allocate memory for input and output
      const inputSize = inputBytes.length;
      const outputSize = inputSize; // PCM16 to Float32 doubles the size
      
      const inputPtr = this.allocateMemory(inputSize);
      const outputPtr = this.allocateMemory(outputSize);

      // Copy input data to WASM memory
      const wasmMemory = new Uint8Array(this.wasmInstance.exports.memory.buffer);
      wasmMemory.set(inputBytes, inputPtr);

      // Call WASM decode function
      this.decodeFunction(inputPtr, inputSize, outputPtr);

      // Read output from WASM memory
      const outputBytes = new Float32Array(wasmMemory.buffer, outputPtr / 4, outputSize / 4);
      const result = new Float32Array(outputBytes);

      // Free allocated memory
      this.freeMemory(inputPtr, inputSize);
      this.freeMemory(outputPtr, outputSize);

      return result;
    } catch (error) {
      console.error('WebAssembly PCM16 decoding failed:', error);
      throw error;
    }
  }

  /**
   * Decode Uint8Array PCM16 data to Float32Array using WebAssembly
   */
  decodePCM16ArrayToFloat32(pcm16Data: Uint8Array): Float32Array {
    if (!this.wasmInstance || !this.decodeFunction) {
      throw new Error('WebAssembly module not initialized');
    }

    try {
      const inputSize = pcm16Data.length;
      const outputSize = inputSize; // PCM16 to Float32 doubles the size
      
      const inputPtr = this.allocateMemory(inputSize);
      const outputPtr = this.allocateMemory(outputSize);

      // Copy input data to WASM memory
      const wasmMemory = new Uint8Array(this.wasmInstance.exports.memory.buffer);
      wasmMemory.set(pcm16Data, inputPtr);

      // Call WASM decode function
      this.decodeFunction(inputPtr, inputSize, outputPtr);

      // Read output from WASM memory
      const outputBytes = new Float32Array(wasmMemory.buffer, outputPtr / 4, outputSize / 4);
      const result = new Float32Array(outputBytes);

      // Free allocated memory
      this.freeMemory(inputPtr, inputSize);
      this.freeMemory(outputPtr, outputSize);

      return result;
    } catch (error) {
      console.error('WebAssembly PCM16 array decoding failed:', error);
      throw error;
    }
  }

  /**
   * High-performance batch decoding for multiple audio chunks
   */
  batchDecodePCM16ToFloat32(audioChunks: string[]): Float32Array[] {
    const results: Float32Array[] = [];
    
    for (const chunk of audioChunks) {
      try {
        const decoded = this.decodePCM16ToFloat32(chunk);
        results.push(decoded);
      } catch (error) {
        console.error('Failed to decode audio chunk:', error);
        // Return silence for failed chunks to maintain audio continuity
        const silence = new Float32Array(24000); // 1 second of silence at 24kHz
        results.push(silence);
      }
    }

    // Concatenate all results
    const totalLength = results.reduce((sum, arr) => sum + arr.length, 0);
    const concatenated = new Float32Array(totalLength);
    
    let offset = 0;
    for (const result of results) {
      concatenated.set(result, offset);
      offset += result.length;
    }

    return concatenated;
  }

  /**
   * Get performance metrics for WebAssembly operations
   */
  getPerformanceMetrics(): {
    wasmMemoryUsage: number;
    decodeTime: number;
    throughput: number;
  } {
    if (!this.wasmInstance) {
      return {
        wasmMemoryUsage: 0,
        decodeTime: 0,
        throughput: 0
      };
    }

    // Calculate memory usage
    const memoryUsage = this.wasmModule ? this.wasmModule.memory.buffer.byteLength / (1024 * 1024) : 0;

    return {
      wasmMemoryUsage: memoryUsage,
      decodeTime: 0, // Would need timing implementation
      throughput: 0 // Would need measurement
    };
  }

  /**
   * Allocate memory in WebAssembly module
   */
  private allocateMemory(size: number): number {
    if (!this.wasmModule) {
      throw new Error('WebAssembly module not initialized');
    }
    
    // Use WebAssembly memory allocation if available
    if ('allocate' in this.wasmInstance.exports) {
      return (this.wasmInstance.exports.allocate as any)(size);
    }
    
    // Fallback to simple allocation
    return this.allocateMemoryFallback(size);
  }

  /**
   * Free allocated memory in WebAssembly module
   */
  private freeMemory(ptr: number, size: number): void {
    if (!this.wasmModule) {
      return;
    }
    
    // Use WebAssembly free function if available
    if ('free' in this.wasmInstance.exports) {
      (this.wasmInstance.exports.free as any)(ptr);
      return;
    }
    
    // Fallback - mark as free (simplified)
    return;
  }

  /**
   * Fallback memory allocation for environments without WASM
   */
  private allocateMemoryFallback(size: number): number {
    // Simple fallback - return 0 (would need proper implementation)
    return 0;
  }

  /**
   * Check if WebAssembly is supported
   */
  static isSupported(): boolean {
    return typeof WebAssembly === 'object' && 
           typeof WebAssembly.instantiate === 'function';
  }

  /**
   * Get WebAssembly capabilities
   */
  static getCapabilities(): {
    supported: boolean;
    simd: boolean;
    threads: boolean;
    bulkMemory: boolean;
  } {
    return {
      supported: WebAssembly.isSupported(),
      simd: typeof SIMD !== 'undefined',
      threads: typeof SharedArrayBuffer !== 'undefined',
      bulkMemory: typeof WebAssembly.Memory !== 'undefined'
    };
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.wasmInstance = null;
    this.wasmModule = null;
    this.memoryBuffer = null;
    this.decodeFunction = null;
  }
}

/**
 * Fallback JavaScript implementation for environments without WebAssembly
 */
export class JavaScriptPCM16Decoder {
  /**
   * Decode base64 PCM16 audio data to Float32Array using JavaScript
   */
  decodePCM16ToFloat32(base64Audio: string): Float32Array {
    try {
      const raw = atob(base64Audio);
      const bytes = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) {
        bytes[i] = raw.charCodeAt(i);
      }
      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768.0;
      }
      
      return float32;
    } catch (error) {
      console.error('JavaScript PCM16 decoding failed:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics for JavaScript implementation
   */
  getPerformanceMetrics(): {
    decodeTime: number;
    throughput: number;
  } {
    return {
      decodeTime: 0, // Would need timing implementation
      throughput: 0 // Would need measurement
    };
  }

  static isSupported(): boolean {
    return true; // JavaScript is always supported
  }
}

/**
 * Universal PCM16 decoder that chooses optimal implementation
 */
export class UniversalPCM16Decoder {
  private wasmDecoder: WebAssemblyPCM16Decoder | null = null;
  private jsDecoder: JavaScriptPCM16Decoder;

  constructor() {
    this.jsDecoder = new JavaScriptPCM16Decoder();
    
    // Initialize WebAssembly if supported
    if (WebAssemblyPCM16Decoder.isSupported()) {
      this.wasmDecoder = new WebAssemblyPCM16Decoder();
    }
  }

  /**
   * Initialize the decoder with optimal backend
   */
  async initialize(): Promise<void> {
    if (this.wasmDecoder) {
      await this.wasmDecoder.initialize();
    }
    // JavaScript decoder is always ready
  }

  /**
   * Decode base64 PCM16 audio data to Float32Array
   */
  decodePCM16ToFloat32(base64Audio: string): Float32Array {
    if (this.wasmDecoder) {
      return this.wasmDecoder.decodePCM16ToFloat32(base64Audio);
    } else {
      return this.jsDecoder.decodePCM16ToFloat32(base64Audio);
    }
  }

  /**
   * Batch decode multiple audio chunks
   */
  batchDecodePCM16ToFloat32(audioChunks: string[]): Float32Array[] {
    if (this.wasmDecoder) {
      return this.wasmDecoder.batchDecodePCM16ToFloat32(audioChunks);
    } else {
      // JavaScript fallback for batch processing
      const results: Float32Array[] = [];
      for (const chunk of audioChunks) {
        const decoded = this.jsDecoder.decodePCM16ToFloat32(chunk);
        results.push(decoded);
      }
      return results;
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    wasmMemoryUsage: number;
    decodeTime: number;
    throughput: number;
    jsDecodeTime: number;
    jsThroughput: number;
  } {
    const wasmMetrics = this.wasmDecoder ? this.wasmDecoder.getPerformanceMetrics() : { wasmMemoryUsage: 0, decodeTime: 0, throughput: 0 };
    const jsMetrics = this.jsDecoder.getPerformanceMetrics();
    
    return {
      ...wasmMetrics,
      ...jsMetrics
    };
  }

  /**
   * Get decoder capabilities
   */
  getCapabilities(): {
    wasm: WebAssemblyPCM16Decoder.getCapabilities(),
    js: JavaScriptPCM16Decoder.isSupported(),
    currentBackend: this.wasmDecoder ? 'wasm' : 'js'
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.wasmDecoder) {
      this.wasmDecoder.dispose();
    }
    // JavaScript decoder doesn't need cleanup
  }
}

// Export the universal decoder
export { UniversalPCM16Decoder, WebAssemblyPCM16Decoder, JavaScriptPCM16Decoder };

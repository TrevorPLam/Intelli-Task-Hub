/**
 * SharedArrayBuffer patterns for real-time audio data transfer
 * Implements zero-copy data transfer between main thread and AudioWorklets
 */

export interface SharedAudioBuffer {
  buffer: SharedArrayBuffer;
  length: number;
  sampleRate: number;
  channels: number;
  timestamp: number;
}

export interface AudioBufferPool {
  available: SharedAudioBuffer[];
  inUse: Set<SharedAudioBuffer>;
  maxSize: number;
  totalAllocated: number;
}

export class SharedBufferManager {
  private bufferPool: AudioBufferPool;
  private nextBufferId = 0;
  private maxBufferSize = 32768; // 1 second at 32kHz
  private maxPoolSize = 10;

  constructor() {
    this.bufferPool = {
      available: [],
      inUse: new Set(),
      maxSize: this.maxPoolSize,
      totalAllocated: 0,
    };
  }

  /**
   * Allocate a shared audio buffer for zero-copy transfer
   */
  allocateSharedBuffer(
    length: number,
    sampleRate: number,
    channels: number = 2
  ): SharedAudioBuffer {
    // Check if buffer is already available
    const availableBuffer = this.bufferPool.available.find(
      (buffer) =>
        buffer.length >= length &&
        buffer.sampleRate === sampleRate &&
        buffer.channels === channels
    );

    if (availableBuffer) {
      this.bufferPool.inUse.add(availableBuffer);
      return availableBuffer;
    }

    // Create new shared buffer
    const sharedBuffer = new SharedArrayBuffer(
      length * Float32Array.BYTES_PER_ELEMENT
    );
    const audioBuffer: SharedAudioBuffer = {
      buffer: sharedBuffer,
      length,
      sampleRate,
      channels,
      timestamp: performance.now(),
    };

    this.bufferPool.available.push(audioBuffer);
    this.bufferPool.totalAllocated += length;

    return audioBuffer;
  }

  /**
   * Release a shared audio buffer back to the pool
   */
  releaseSharedBuffer(audioBuffer: SharedAudioBuffer): void {
    if (!this.bufferPool.inUse.has(audioBuffer)) {
      return;
    }

    this.bufferPool.inUse.delete(audioBuffer);

    // Clear buffer data for reuse
    if (audioBuffer.buffer) {
      audioBuffer.buffer.fill(0);
    }
  }

  /**
   * Get buffer pool statistics
   */
  getPoolStats(): {
    totalBuffers: number;
    availableBuffers: number;
    inUseBuffers: number;
    memoryUsage: number;
  } {
    return {
      totalBuffers:
        this.bufferPool.available.length + this.bufferPool.inUse.size,
      availableBuffers: this.bufferPool.available.length,
      inUseBuffers: this.bufferPool.inUse.size,
      memoryUsage:
        this.bufferPool.totalAllocated * Float32Array.BYTES_PER_ELEMENT,
    };
  }

  /**
   * Cleanup all buffers
   */
  dispose(): void {
    this.bufferPool.available.forEach((buffer) => {
      if (buffer.buffer) {
        buffer.buffer.fill(0);
      }
    });

    this.bufferPool.available = [];
    this.bufferPool.inUse.clear();
    this.bufferPool.totalAllocated = 0;
  }
}

export interface WorkletMessagePort {
  postMessage: (message: any, transfer?: Transferable[]) => void;
  onmessage: (handler: (event: MessageEvent) => void) => void;
  onmessageerror: (handler: (event: MessageEventError) => void) => void;
}

export class SharedAudioWorkletBridge {
  private sharedBufferManager: SharedBufferManager;
  private workletPorts: Map<string, WorkletMessagePort> = new Map();
  private pendingTransfers: Map<string, Transferable[]> = new Map();

  constructor() {
    this.sharedBufferManager = new SharedBufferManager();
  }

  /**
   * Initialize shared buffer communication with AudioWorklet
   */
  async initializeWorkletPort(workletNode: AudioWorkletNode): Promise<void> {
    return new Promise<void>((resolve) => {
      // Setup message handling
      workletNode.port.onmessage = (event) => {
        this.handleWorkletMessage(event.data, workletNode);
      };

      workletNode.port.onmessageerror = (event) => {
        console.error("Worklet message error:", event);
      };

      // Send initialization message
      workletNode.port.postMessage({
        type: "init",
        maxBufferSize: this.sharedBufferManager["maxBufferSize"],
      });

      this.workletPorts.set("main", workletNode.port);
      resolve();
    });
  }

  /**
   * Handle messages from AudioWorklet
   */
  private handleWorkletMessage(data: any, workletNode: AudioWorkletNode): void {
    switch (data.type) {
      case "ready":
        console.log("Worklet ready for shared buffer communication");
        break;

      case "bufferRequest":
        this.handleBufferRequest(data, workletNode);
        break;

      case "bufferRelease":
        this.handleBufferRelease(data, workletNode);
        break;

      case "audioProcessed":
        this.handleAudioProcessed(data, workletNode);
        break;

      case "error":
        console.error("Worklet error:", data.error);
        break;

      default:
        console.warn("Unknown worklet message:", data);
    }
  }

  /**
   * Handle buffer allocation requests from worklet
   */
  private handleBufferRequest(data: any, workletNode: AudioWorkletNode): void {
    const { bufferId, length, sampleRate, channels } = data;

    try {
      const audioBuffer = this.sharedBufferManager.allocateSharedBuffer(
        length,
        sampleRate,
        channels
      );

      // Transfer buffer ownership to worklet
      workletNode.port.postMessage(
        {
          type: "bufferAllocate",
          bufferId,
          length: audioBuffer.length,
        },
        [audioBuffer.buffer]
      );

      // Store transfer info for potential cleanup
      this.pendingTransfers.set(bufferId, [audioBuffer.buffer]);
    } catch (error) {
      console.error("Failed to allocate shared buffer:", error);

      // Send error response to worklet
      workletNode.port.postMessage({
        type: "bufferAllocateError",
        bufferId,
        error: error.message,
      });
    }
  }

  /**
   * Handle buffer release requests from worklet
   */
  private handleBufferRelease(data: any, workletNode: AudioWorkletNode): void {
    const { bufferId } = data;

    try {
      const audioBuffer = this.sharedBufferManager.bufferPool.available.find(
        (buffer) =>
          buffer.length > 0 &&
          buffer.buffer === this.pendingTransfers.get(bufferId)?.[0]
      );

      if (audioBuffer) {
        this.sharedBufferManager.releaseSharedBuffer(audioBuffer);
      }

      // Clear transfer tracking
      this.pendingTransfers.delete(bufferId);

      // Notify worklet of successful release
      workletNode.port.postMessage({
        type: "bufferReleased",
        bufferId,
      });
    } catch (error) {
      console.error("Failed to release shared buffer:", error);
    }
  }

  /**
   * Handle processed audio data from worklet
   */
  private handleAudioProcessed(data: any, workletNode: AudioWorkletNode): void {
    const { bufferId, processedData } = data;

    try {
      // Create shared buffer for processed data
      const audioBuffer = this.sharedBufferManager.allocateSharedBuffer(
        processedData.length,
        24000, // 24kHz sample rate
        2
      );

      // Copy processed data to shared buffer
      if (audioBuffer.buffer) {
        const floatArray = new Float32Array(processedData);
        audioBuffer.buffer.set(floatArray);
      }

      // Transfer buffer back to main thread
      const mainPort = this.workletPorts.get("main");
      if (mainPort) {
        mainPort.postMessage(
          {
            type: "audioData",
            bufferId,
            audioData: processedData,
            timestamp: performance.now(),
          },
          [audioBuffer.buffer]
        );
      }
    } catch (error) {
      console.error("Failed to handle processed audio:", error);
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    bufferPoolUtilization: number;
    memoryUsage: number;
    activeConnections: number;
    transferEfficiency: number;
    averageLatency: number;
  } {
    const stats = this.sharedBufferManager.getPoolStats();
    const activeConnections = this.workletPorts.size;

    return {
      bufferPoolUtilization:
        stats.totalBuffers / this.sharedBufferManager["maxPoolSize"],
      memoryUsage: stats.memoryUsage,
      activeConnections,
      transferEfficiency: stats.availableBuffers / stats.totalBuffers,
      averageLatency: 0, // Would need timing implementation
    };
  }

  /**
   * Cleanup all resources
   */
  dispose(): void {
    this.sharedBufferManager.dispose();
    this.workletPorts.forEach((port) => {
      port.postMessage({ type: "shutdown" });
    });
    this.workletPorts.clear();
    this.pendingTransfers.clear();
  }
}

/**
 * Enhanced AudioWorklet processor with shared buffer support
 */
export class SharedAudioWorkletProcessor {
  private sharedBuffers: Map<number, SharedArrayBuffer> = new Map();
  private processorId: string;

  constructor(processorId: string = "shared-audio-processor") {
    this.processorId = processorId;
  }

  /**
   * Process audio with shared buffer support
   */
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean {
    const input = inputs[0];
    if (!input) return true;

    try {
      // Handle different message types
      if (parameters.command === "allocateBuffer") {
        return this.handleBufferAllocation(parameters);
      } else if (parameters.command === "processAudio") {
        return this.handleAudioProcessing(parameters);
      } else if (parameters.command === "releaseBuffer") {
        return this.handleBufferRelease(parameters);
      } else {
        // Default audio processing
        const output = new Float32Array(input.length);
        for (let i = 0; i < input.length; i++) {
          output[i] = input[i] * (parameters.gain || 1.0);
        }
        outputs[0].set(output);
      }

      return true;
    } catch (error) {
      console.error("SharedAudioWorkletProcessor error:", error);
      return false;
    }
  }

  /**
   * Handle shared buffer allocation
   */
  private handleBufferAllocation(parameters: any): boolean {
    const { length, sampleRate, channels } = parameters;

    try {
      // Create shared buffer
      const sharedBuffer = new SharedArrayBuffer(
        length * Float32Array.BYTES_PER_ELEMENT
      );
      this.sharedBuffers.set(sharedBufferId, sharedBuffer);

      // Notify main thread of buffer allocation
      this.port.postMessage({
        type: "bufferAllocated",
        bufferId: sharedBufferId,
        length,
        sampleRate,
        channels,
      });

      return true;
    } catch (error) {
      console.error("Buffer allocation failed:", error);
      this.port.postMessage({
        type: "error",
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Handle audio processing with shared buffers
   */
  private handleAudioProcessing(parameters: any): boolean {
    const { bufferId, audioData } = parameters;
    const sharedBuffer = this.sharedBuffers.get(bufferId);

    if (!sharedBuffer) {
      this.port.postMessage({
        type: "error",
        error: `Buffer ${bufferId} not found`,
      });
      return false;
    }

    try {
      // Copy audio data to shared buffer
      const floatArray = new Float32Array(audioData);
      if (sharedBuffer.buffer) {
        sharedBuffer.buffer.set(floatArray);
      }

      // Notify main thread that processing is complete
      this.port.postMessage({
        type: "audioProcessed",
        bufferId,
        processedData: audioData,
      });

      return true;
    } catch (error) {
      console.error("Audio processing failed:", error);
      this.port.postMessage({
        type: "error",
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Handle shared buffer release
   */
  private handleBufferRelease(parameters: any): boolean {
    const { bufferId } = parameters;
    const sharedBuffer = this.sharedBuffers.get(bufferId);

    if (sharedBuffer) {
      // Clear buffer data
      if (sharedBuffer.buffer) {
        sharedBuffer.buffer.fill(0);
      }

      // Remove from active buffers
      this.sharedBuffers.delete(bufferId);

      // Notify main thread of buffer release
      this.port.postMessage({
        type: "bufferReleased",
        bufferId,
      });

      return true;
    } else {
      this.port.postMessage({
        type: "error",
        error: `Buffer ${bufferId} not found`,
      });
      return false;
    }
  }

  /**
   * Cleanup shared buffers
   */
  cleanup(): void {
    this.sharedBuffers.forEach((buffer, id) => {
      if (buffer.buffer) {
        buffer.buffer.fill(0);
      }
    });
    this.sharedBuffers.clear();
  }
}

// Export shared buffer utilities
export {
  SharedBufferManager,
  SharedAudioWorkletBridge,
  SharedAudioWorkletProcessor,
};

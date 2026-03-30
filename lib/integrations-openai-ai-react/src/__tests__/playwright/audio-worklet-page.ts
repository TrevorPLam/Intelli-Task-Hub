import { Page } from "@playwright/test";

export interface AudioWorkletTestConfig {
  workletPath: string;
  audioContext?: AudioContext;
  performanceThresholds: {
    initializationTime: number;
    renderCapacity: number;
    callbackInterval: number;
  };
}

export class AudioWorkletPage {
  constructor(private page: Page) {}

  async navigateToTestPage(): Promise<void> {
    await this.page.goto("/audio-worklet-test");
  }

  async getAudioContextState(): Promise<string> {
    return await this.page.evaluate(() => {
      return (window as any).testAudioContext?.state || "unknown";
    });
  }

  async getWorkletLoadTime(): Promise<number> {
    return await this.page.evaluate(() => {
      return (window as any).workletLoadTime || 0;
    });
  }

  async getPerformanceMetrics(): Promise<any> {
    return await this.page.evaluate(() => {
      const audioContext = (window as any).testAudioContext;
      if (!audioContext) return null;

      // Get Chrome DevTools WebAudio metrics if available
      const metrics = {
        contextState: audioContext.state,
        sampleRate: audioContext.sampleRate,
        callbackBufferSize: audioContext.baseLatency,
        currentTime: audioContext.currentTime,
        // Performance metrics (if available)
        renderCapacity: (window as any).audioMetrics?.renderCapacity || 0,
        callbackInterval: (window as any).audioMetrics?.callbackInterval || 0,
        cpuUsage: (window as any).audioMetrics?.cpuUsage || 0,
      };

      return metrics;
    });
  }

  async loadWorklet(workletPath: string): Promise<boolean> {
    try {
      const success = await this.page.evaluate((path) => {
        return new Promise<boolean>((resolve) => {
          const audioContext = new (
            window.AudioContext || (window as any).webkitAudioContext
          )();

          // Store context for testing
          (window as any).testAudioContext = audioContext;

          const startTime = performance.now();

          audioContext.audioWorklet
            .addModule(path)
            .then(() => {
              const loadTime = performance.now() - startTime;
              (window as any).workletLoadTime = loadTime;

              // Create worklet node to test functionality
              const workletNode = new AudioWorkletNode(
                audioContext,
                "audio-playback-processor"
              );
              workletNode.connect(audioContext.destination);

              resolve(true);
            })
            .catch((error) => {
              console.error("Worklet load failed:", error);
              resolve(false);
            });
        });
      }, workletPath);

      return success;
    } catch (error) {
      console.error("Worklet loading error:", error);
      return false;
    }
  }

  async testAudioPlayback(): Promise<boolean> {
    return await this.page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        const audioContext = (window as any).testAudioContext;
        if (!audioContext) {
          resolve(false);
          return;
        }

        try {
          // Test audio playback through worklet
          const workletNode = new AudioWorkletNode(
            audioContext,
            "audio-playback-processor"
          );
          workletNode.connect(audioContext.destination);

          // Send test audio data
          const testAudioData = new Float32Array(24000); // 1 second of silence
          workletNode.port.postMessage({
            type: "audio",
            samples: testAudioData,
          });

          // Check if worklet processes the data
          workletNode.port.onmessage = (event) => {
            if (event.data.type === "ended") {
              resolve(true);
            }
          };

          // Timeout after 5 seconds
          setTimeout(() => resolve(false), 5000);
        } catch (error) {
          console.error("Audio playback test failed:", error);
          resolve(false);
        }
      });
    });
  }

  async checkSameOriginPolicy(): Promise<boolean> {
    // Test cross-origin worklet loading (should fail)
    const crossOriginPath = "https://evil.example.com/worklet.js";

    try {
      const success = await this.page.evaluate((path) => {
        return new Promise<boolean>((resolve) => {
          const audioContext = new (
            window.AudioContext || (window as any).webkitAudioContext
          )();

          audioContext.audioWorklet
            .addModule(path)
            .then(() => {
              // This should not succeed
              resolve(false);
            })
            .catch(() => {
              // Expected to fail due to same-origin policy
              resolve(true);
            });
        });
      }, crossOriginPath);

      return success;
    } catch (error) {
      // Expected to fail
      return true;
    }
  }
}

import { test, expect, devices } from '@playwright/test';
import { AudioWorkletPage } from './audio-worklet-page';

test.describe('AudioWorklet Integration Tests', () => {
  let audioPage: AudioWorkletPage;

  test.beforeEach(async ({ page }) => {
    audioPage = new AudioWorkletPage(page);
  });

  test.describe('Worklet Loading', () => {
    test('should load worklet successfully with Vite URL', async ({ page }) => {
      // Mock the Vite environment
      await page.addScriptTag({
        content: `
          window.import = { meta: { url: 'http://localhost:3000/src/audio/' } };
        `
      });

      await audioPage.navigateToTestPage();
      
      // Test with Vite-generated URL
      const workletPath = '/audio-playback-worklet.js';
      const loadSuccess = await audioPage.loadWorklet(workletPath);
      
      expect(loadSuccess).toBe(true);
      
      const contextState = await audioPage.getAudioContextState();
      expect(contextState).toBe('running');
      
      const loadTime = await audioPage.getWorkletLoadTime();
      expect(loadTime).toBeLessThan(1000); // Should load within 1 second
    });

    test('should handle worklet loading failure gracefully', async ({ page }) => {
      await audioPage.navigateToTestPage();
      
      // Test with non-existent worklet
      const workletPath = '/non-existent-worklet.js';
      const loadSuccess = await audioPage.loadWorklet(workletPath);
      
      expect(loadSuccess).toBe(false);
      
      const contextState = await audioPage.getAudioContextState();
      expect(['suspended', 'closed']).toContain(contextState);
    });

    test('should enforce same-origin policy', async ({ page }) => {
      await audioPage.navigateToTestPage();
      
      const sameOriginEnforced = await audioPage.checkSameOriginPolicy();
      expect(sameOriginEnforced).toBe(true);
    });
  });

  test.describe('Audio Playback', () => {
    test('should play audio through worklet', async ({ page }) => {
      await audioPage.navigateToTestPage();
      
      const workletPath = '/audio-playback-worklet.js';
      const loadSuccess = await audioPage.loadWorklet(workletPath);
      expect(loadSuccess).toBe(true);
      
      const playbackSuccess = await audioPage.testAudioPlayback();
      expect(playbackSuccess).toBe(true);
    });

    test('should handle audio context state changes', async ({ page }) => {
      await audioPage.navigateToTestPage();
      
      const workletPath = '/audio-playback-worklet.js';
      await audioPage.loadWorklet(workletPath);
      
      // Test context suspension
      const suspended = await page.evaluate(() => {
        const audioContext = (window as any).testAudioContext;
        return audioContext.suspend().then(() => audioContext.state);
      });
      
      expect(suspended).toBe('suspended');
      
      // Test context resumption
      const resumed = await page.evaluate(() => {
        const audioContext = (window as any).testAudioContext;
        return audioContext.resume().then(() => audioContext.state);
      });
      
      expect(resumed).toBe('running');
    });
  });

  test.describe('Performance Metrics', () => {
    test('should collect performance metrics', async ({ page }) => {
      await audioPage.navigateToTestPage();
      
      const workletPath = '/audio-playback-worklet.js';
      await audioPage.loadWorklet(workletPath);
      
      const metrics = await audioPage.getPerformanceMetrics();
      expect(metrics).not.toBeNull();
      expect(metrics?.contextState).toBe('running');
      expect(metrics?.sampleRate).toBeGreaterThan(0);
      expect(metrics?.currentTime).toBeGreaterThanOrEqual(0);
    });

    test('should meet performance thresholds', async ({ page }) => {
      await audioPage.navigateToTestPage();
      
      const workletPath = '/audio-playback-worklet.js';
      const loadSuccess = await audioPage.loadWorklet(workletPath);
      expect(loadSuccess).toBe(true);
      
      const loadTime = await audioPage.getWorkletLoadTime();
      expect(loadTime).toBeLessThan(500); // Performance threshold
      
      const metrics = await audioPage.getPerformanceMetrics();
      
      // Check render capacity if available (Chrome DevTools)
      if (metrics?.renderCapacity) {
        expect(metrics.renderCapacity).toBeLessThan(80); // Should not exceed 80%
      }
    });
  });

  test.describe('Cross-Browser Compatibility', () => {
    test.describe.configure({ mode: 'parallel' });
    
    ['chromium', 'firefox', 'webkit'].forEach(browserName => {
      test(`should work in ${browserName}`, async ({ page, browserName: currentBrowser }) => {
        test.skip(currentBrowser !== browserName, `Running only in ${browserName}`);
        
        await audioPage.navigateToTestPage();
        
        const workletPath = '/audio-playback-worklet.js';
        const loadSuccess = await audioPage.loadWorklet(workletPath);
        
        // Firefox might have different behavior with AudioWorklet
        if (browserName === 'firefox') {
          // Firefox supports AudioWorklet but might have different performance characteristics
          expect(loadSuccess).toBe(true);
        } else {
          expect(loadSuccess).toBe(true);
        }
        
        const contextState = await audioPage.getAudioContextState();
        expect(['running', 'suspended']).toContain(contextState);
      });
    });
  });

  test.describe('Mobile Device Testing', () => {
    test.use({ ...devices['iPhone 13'] });
    
    test('should work on mobile devices', async ({ page }) => {
      await audioPage.navigateToTestPage();
      
      const workletPath = '/audio-playback-worklet.js';
      const loadSuccess = await audioPage.loadWorklet(workletPath);
      
      // Mobile devices might have stricter autoplay policies
      expect(loadSuccess).toBe(true);
      
      const contextState = await audioPage.getAudioContextState();
      // Mobile might start in suspended state due to autoplay policies
      expect(['running', 'suspended']).toContain(contextState);
      
      // Test user gesture requirement
      if (contextState === 'suspended') {
        // Simulate user interaction
        await page.click('body');
        
        // Check if context resumes
        await page.waitForTimeout(100);
        const resumedState = await audioPage.getAudioContextState();
        expect(resumedState).toBe('running');
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle invalid worklet paths', async ({ page }) => {
      await audioPage.navigateToTestPage();
      
      const invalidPaths = [
        '',
        'invalid-path',
        '/path/to/invalid.js',
        'https://cross-origin.com/worklet.js'
      ];
      
      for (const path of invalidPaths) {
        const loadSuccess = await audioPage.loadWorklet(path);
        expect(loadSuccess).toBe(false);
      }
    });

    test('should handle audio context creation failures', async ({ page }) => {
      // Mock AudioContext failure
      await page.addScriptTag({
        content: `
          window.AudioContext = class MockAudioContext {
            constructor() {
              throw new Error('AudioContext not supported');
            }
          };
          window.webkitAudioContext = window.AudioContext;
        `
      });
      
      await audioPage.navigateToTestPage();
      
      const workletPath = '/audio-playback-worklet.js';
      const loadSuccess = await audioPage.loadWorklet(workletPath);
      
      expect(loadSuccess).toBe(false);
    });
  });
});

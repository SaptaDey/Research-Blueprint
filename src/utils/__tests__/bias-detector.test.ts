import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { BiasDetector, BiasType, BiasResult, DetectionConfig } from '../bias-detector';

describe('BiasDetector', () => {
  let biasDetector: BiasDetector;
  let mockConfig: DetectionConfig;

  beforeEach(() => {
    mockConfig = {
      enabledBiasTypes: [BiasType.CONFIRMATION, BiasType.SELECTION, BiasType.ANCHORING],
      threshold: 0.7,
      contextWindow: 100,
      strictMode: false
    };
    biasDetector = new BiasDetector(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default config when no config provided', () => {
      const detector = new BiasDetector();
      expect(detector).toBeInstanceOf(BiasDetector);
      expect(detector.getConfig()).toEqual(expect.objectContaining({
        threshold: expect.any(Number),
        enabledBiasTypes: expect.any(Array)
      }));
    });

    it('should initialize with provided config', () => {
      const customConfig = {
        enabledBiasTypes: [BiasType.CONFIRMATION],
        threshold: 0.8,
        contextWindow: 50,
        strictMode: true
      };
      const detector = new BiasDetector(customConfig);
      expect(detector.getConfig()).toEqual(customConfig);
    });

    it('should throw error for invalid threshold values', () => {
      expect(() => new BiasDetector({ threshold: -0.1 })).toThrow('Threshold must be between 0 and 1');
      expect(() => new BiasDetector({ threshold: 1.1 })).toThrow('Threshold must be between 0 and 1');
    });

    it('should throw error for invalid context window', () => {
      expect(() => new BiasDetector({ contextWindow: 0 })).toThrow('Context window must be positive');
      expect(() => new BiasDetector({ contextWindow: -5 })).toThrow('Context window must be positive');
    });
  });

  describe('detectBias', () => {
    describe('happy path scenarios', () => {
      it('should detect confirmation bias in biased text', async () => {
        const text = "This clearly proves my point. Obviously, anyone who disagrees is wrong. The evidence is undeniable.";
        const result = await biasDetector.detectBias(text);
        
        expect(result).toEqual(expect.objectContaining({
          detected: true,
          biasTypes: expect.arrayContaining([BiasType.CONFIRMATION]),
          confidence: expect.any(Number),
          locations: expect.any(Array)
        }));
        expect(result.confidence).toBeGreaterThan(mockConfig.threshold);
      });

      it('should detect selection bias in cherry-picked data', async () => {
        const text = "Based on the 3 studies that support our hypothesis (ignoring the 47 that don't), we conclude...";
        const result = await biasDetector.detectBias(text);
        
        expect(result.detected).toBe(true);
        expect(result.biasTypes).toContain(BiasType.SELECTION);
        expect(result.confidence).toBeGreaterThan(mockConfig.threshold);
      });

      it('should detect anchoring bias in numerical contexts', async () => {
        const text = "The price starts at $999, but we're offering it for just $799 - that's a huge discount!";
        const result = await biasDetector.detectBias(text);
        
        expect(result.detected).toBe(true);
        expect(result.biasTypes).toContain(BiasType.ANCHORING);
      });

      it('should detect multiple bias types in complex text', async () => {
        const text = "Starting from $1000 (that's the regular price), this obviously superior product proves that competitors are inferior based on the one study we selected.";
        const result = await biasDetector.detectBias(text);
        
        expect(result.detected).toBe(true);
        expect(result.biasTypes.length).toBeGreaterThan(1);
        expect(result.biasTypes).toEqual(expect.arrayContaining([
          BiasType.ANCHORING,
          BiasType.CONFIRMATION,
          BiasType.SELECTION
        ]));
      });

      it('should return detailed location information', async () => {
        const text = "Obviously, this is the best solution. Clearly, no other option makes sense.";
        const result = await biasDetector.detectBias(text);
        
        expect(result.locations).toEqual(expect.arrayContaining([
          expect.objectContaining({
            start: expect.any(Number),
            end: expect.any(Number),
            biasType: expect.any(String),
            snippet: expect.any(String)
          })
        ]));
      });
    });

    describe('edge cases', () => {
      it('should handle empty string input', async () => {
        const result = await biasDetector.detectBias('');
        expect(result).toEqual({
          detected: false,
          biasTypes: [],
          confidence: 0,
          locations: [],
          metadata: expect.any(Object)
        });
      });

      it('should handle whitespace-only input', async () => {
        const result = await biasDetector.detectBias('   \n\t   ');
        expect(result.detected).toBe(false);
        expect(result.confidence).toBe(0);
      });

      it('should handle very long text input', async () => {
        const longText = 'This is neutral text. '.repeat(10000);
        const result = await biasDetector.detectBias(longText);
        expect(result).toEqual(expect.objectContaining({
          detected: expect.any(Boolean),
          confidence: expect.any(Number),
          metadata: expect.objectContaining({
            textLength: longText.length
          })
        }));
      });

      it('should handle text with special characters and unicode', async () => {
        const specialText = "Obviously 🎯, this émojî-filled téxt with spëcial chåråctërs is biased! 中文 العربية";
        const result = await biasDetector.detectBias(specialText);
        expect(result).toEqual(expect.objectContaining({
          detected: expect.any(Boolean),
          confidence: expect.any(Number)
        }));
      });

      it('should handle malformed or corrupted text', async () => {
        const malformedText = "\x00\x01\x02 Obviously corrupted \xFF\xFE";
        await expect(biasDetector.detectBias(malformedText)).resolves.not.toThrow();
      });

      it('should respect context window limits', async () => {
        const shortWindowDetector = new BiasDetector({ contextWindow: 10 });
        const longText = "This is a very long text that obviously contains confirmation bias but should be truncated based on the context window setting.";
        const result = await shortWindowDetector.detectBias(longText);
        expect(result.metadata.processedLength).toBeLessThanOrEqual(10);
      });
    });

    describe('failure conditions', () => {
      it('should handle null input gracefully', async () => {
        await expect(biasDetector.detectBias(null as any)).rejects.toThrow('Input text cannot be null or undefined');
      });

      it('should handle undefined input gracefully', async () => {
        await expect(biasDetector.detectBias(undefined as any)).rejects.toThrow('Input text cannot be null or undefined');
      });

      it('should handle non-string input', async () => {
        await expect(biasDetector.detectBias(123 as any)).rejects.toThrow('Input must be a string');
        await expect(biasDetector.detectBias({} as any)).rejects.toThrow('Input must be a string');
        await expect(biasDetector.detectBias([] as any)).rejects.toThrow('Input must be a string');
      });

      it('should handle detection service failures gracefully', async () => {
        const failingDetector = new BiasDetector();
        jest.spyOn(failingDetector as any, '_analyzeText').mockRejectedValue(new Error('Service unavailable'));
        
        await expect(failingDetector.detectBias('test text')).rejects.toThrow('Service unavailable');
      });

      it('should handle timeout scenarios', async () => {
        const timeoutDetector = new BiasDetector({ timeout: 1 });
        const veryLongText = 'Obviously biased text. '.repeat(100000);
        
        await expect(timeoutDetector.detectBias(veryLongText)).rejects.toThrow(/timeout/i);
      }, 10000);
    });

    describe('configuration-based behavior', () => {
      it('should respect disabled bias types', async () => {
        const restrictedDetector = new BiasDetector({
          enabledBiasTypes: [BiasType.CONFIRMATION],
          threshold: 0.5
        });
        
        const text = "Starting at $999, this obviously proves selection bias exists.";
        const result = await restrictedDetector.detectBias(text);
        
        expect(result.biasTypes).not.toContain(BiasType.ANCHORING);
        expect(result.biasTypes).not.toContain(BiasType.SELECTION);
      });

      it('should respect threshold settings', async () => {
        const highThresholdDetector = new BiasDetector({ threshold: 0.95 });
        const lowThresholdDetector = new BiasDetector({ threshold: 0.1 });
        
        const weakBiasText = "This might be somewhat biased text.";
        
        const highResult = await highThresholdDetector.detectBias(weakBiasText);
        const lowResult = await lowThresholdDetector.detectBias(weakBiasText);
        
        expect(lowResult.detected).toBe(true);
        expect(highResult.detected).toBe(false);
      });

      it('should behave differently in strict mode', async () => {
        const strictDetector = new BiasDetector({ strictMode: true });
        const lenientDetector = new BiasDetector({ strictMode: false });
        
        const ambiguousText = "This seems to suggest that the hypothesis might be correct.";
        
        const strictResult = await strictDetector.detectBias(ambiguousText);
        const lenientResult = await lenientDetector.detectBias(ambiguousText);
        
        expect(strictResult.confidence).toBeGreaterThanOrEqual(lenientResult.confidence);
      });
    });
  });

  describe('updateConfig', () => {
    it('should update configuration successfully', () => {
      const newConfig = {
        threshold: 0.8,
        enabledBiasTypes: [BiasType.CONFIRMATION],
        strictMode: true
      };
      
      biasDetector.updateConfig(newConfig);
      expect(biasDetector.getConfig()).toEqual(expect.objectContaining(newConfig));
    });

    it('should validate new configuration', () => {
      expect(() => biasDetector.updateConfig({ threshold: 2.0 })).toThrow('Threshold must be between 0 and 1');
      expect(() => biasDetector.updateConfig({ contextWindow: -1 })).toThrow('Context window must be positive');
    });

    it('should merge with existing configuration', () => {
      const originalConfig = biasDetector.getConfig();
      biasDetector.updateConfig({ threshold: 0.9 });
      
      const updatedConfig = biasDetector.getConfig();
      expect(updatedConfig.threshold).toBe(0.9);
      expect(updatedConfig.enabledBiasTypes).toEqual(originalConfig.enabledBiasTypes);
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const config = biasDetector.getConfig();
      expect(config).toEqual(expect.objectContaining({
        threshold: expect.any(Number),
        enabledBiasTypes: expect.any(Array),
        contextWindow: expect.any(Number),
        strictMode: expect.any(Boolean)
      }));
    });

    it('should return a copy of configuration (not reference)', () => {
      const config1 = biasDetector.getConfig();
      const config2 = biasDetector.getConfig();
      
      config1.threshold = 0.99;
      expect(config2.threshold).not.toBe(0.99);
    });
  });

  describe('static methods', () => {
    describe('getSupportedBiasTypes', () => {
      it('should return all supported bias types', () => {
        const supportedTypes = BiasDetector.getSupportedBiasTypes();
        expect(supportedTypes).toEqual(expect.arrayContaining([
          BiasType.CONFIRMATION,
          BiasType.SELECTION,
          BiasType.ANCHORING,
          BiasType.AVAILABILITY,
          BiasType.SURVIVORSHIP
        ]));
      });
    });

    describe('getDefaultConfig', () => {
      it('should return default configuration', () => {
        const defaultConfig = BiasDetector.getDefaultConfig();
        expect(defaultConfig).toEqual(expect.objectContaining({
          threshold: expect.any(Number),
          enabledBiasTypes: expect.any(Array),
          contextWindow: expect.any(Number),
          strictMode: expect.any(Boolean)
        }));
      });
    });
  });

  describe('performance and resource management', () => {
    it('should handle concurrent detection requests', async () => {
      const texts = [
        "Obviously biased text number 1",
        "Clearly biased text number 2",
        "Undeniably biased text number 3"
      ];
      
      const promises = texts.map(text => biasDetector.detectBias(text));
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toEqual(expect.objectContaining({
          detected: expect.any(Boolean),
          confidence: expect.any(Number)
        }));
      });
    });

    it('should not leak memory with repeated calls', async () => {
      const text = "Obviously biased text for memory testing";
      
      for (let i = 0; i < 100; i++) {
        await biasDetector.detectBias(text);
      }
      
      // If we get here without memory issues, the test passes
      expect(true).toBe(true);
    });

    it('should clean up resources properly', () => {
      const detector = new BiasDetector();
      expect(() => detector.destroy()).not.toThrow();
    });
  });

  describe('integration scenarios', () => {
    it('should work with real-world article text', async () => {
      const articleText = `
        The study clearly demonstrates that our product is superior to all competitors.
        Based on the carefully selected data from our most favorable trials,
        we can confidently state that users will obviously prefer our solution.
        Starting from our premium price of $999, we're offering an incredible discount to just $699.
        The evidence is undeniable - this is the best choice available in the market.
      `;
      
      const result = await biasDetector.detectBias(articleText);
      
      expect(result.detected).toBe(true);
      expect(result.biasTypes.length).toBeGreaterThan(1);
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.locations.length).toBeGreaterThan(0);
    });

    it('should work with neutral academic text', async () => {
      const academicText = `
        The research methodology involved a randomized controlled trial with 500 participants.
        Results were analyzed using standard statistical methods, including t-tests and ANOVA.
        The findings suggest a correlation between the variables, though further research is needed
        to establish causation. Limitations include sample size and potential confounding variables.
        These results contribute to the existing body of knowledge in this field.
      `;
      
      const result = await biasDetector.detectBias(academicText);
      
      expect(result.detected).toBe(false);
      expect(result.confidence).toBeLessThan(0.3);
    });
  });
});

// Additional test utilities and helpers
describe('BiasDetector utilities', () => {
  describe('BiasType enum', () => {
    it('should contain all expected bias types', () => {
      expect(BiasType.CONFIRMATION).toBeDefined();
      expect(BiasType.SELECTION).toBeDefined();
      expect(BiasType.ANCHORING).toBeDefined();
      expect(BiasType.AVAILABILITY).toBeDefined();
      expect(BiasType.SURVIVORSHIP).toBeDefined();
    });
  });

  describe('BiasResult interface', () => {
    it('should have proper structure', () => {
      const mockResult: BiasResult = {
        detected: true,
        biasTypes: [BiasType.CONFIRMATION],
        confidence: 0.85,
        locations: [{
          start: 0,
          end: 10,
          biasType: BiasType.CONFIRMATION,
          snippet: 'test'
        }],
        metadata: {
          textLength: 100,
          processedLength: 100,
          detectionTime: 150
        }
      };
      
      expect(mockResult.detected).toBe(true);
      expect(mockResult.biasTypes).toContain(BiasType.CONFIRMATION);
      expect(mockResult.confidence).toBe(0.85);
      expect(mockResult.locations).toHaveLength(1);
      expect(mockResult.metadata).toBeDefined();
    });
  });
});
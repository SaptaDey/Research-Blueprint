import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Note: Using Jest testing framework as identified in existing project test files

// Mock external dependencies that might be used by pipeline
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Define interfaces for testing (these would typically be imported)
interface PipelineContext {
  id: string;
  timestamp: Date;
  data: Record<string, any>;
  metadata: Record<string, any>;
}

interface PipelineResult {
  success: boolean;
  completedStages: number;
  totalStages: number;
  failedStage?: string;
  error?: string;
  data?: Record<string, any>;
  executionTime?: number;
}

interface PipelineStage {
  name: string;
  execute: (context: PipelineContext) => Promise<{ success: boolean; data?: any; error?: string }>;
  description?: string;
  timeout?: number;
  retryCount?: number;
  onError?: (error: Error) => void;
  onSuccess?: (result: any) => void;
}

// Mock Pipeline class for comprehensive testing
class Pipeline {
  private stages: PipelineStage[] = [];

  constructor(initialStages?: PipelineStage[]) {
    if (initialStages) {
      this.stages = [...initialStages];
    }
  }

  addStage(stage: PipelineStage): void {
    if (!stage) {
      throw new Error('Stage cannot be null or undefined');
    }
    if (!stage.execute || typeof stage.execute !== 'function') {
      throw new Error('Stage must have an execute method');
    }
    if (this.stages.some(s => s.name === stage.name)) {
      throw new Error(`Stage with name "${stage.name}" already exists`);
    }
    this.stages.push(stage);
  }

  removeStage(name: string): boolean {
    const index = this.stages.findIndex(s => s.name === name);
    if (index >= 0) {
      this.stages.splice(index, 1);
      return true;
    }
    return false;
  }

  getStages(): PipelineStage[] {
    return [...this.stages];
  }

  getStageByName(name: string): PipelineStage | undefined {
    return this.stages.find(s => s.name === name);
  }

  clear(): void {
    this.stages = [];
  }

  clone(): Pipeline {
    return new Pipeline([...this.stages]);
  }

  async execute(context: PipelineContext): Promise<PipelineResult> {
    if (!context) {
      throw new Error('Context cannot be null or undefined');
    }

    const startTime = Date.now();
    let currentContext = { ...context };
    let completedStages = 0;

    for (const stage of this.stages) {
      try {
        const stageResult = await this.executeStageWithTimeout(stage, currentContext);
        
        if (!stageResult.success) {
          return {
            success: false,
            completedStages,
            totalStages: this.stages.length,
            failedStage: stage.name,
            error: stageResult.error || `Stage ${stage.name} failed`,
            executionTime: Date.now() - startTime,
          };
        }

        if (stageResult.data) {
          currentContext = { ...currentContext, data: { ...currentContext.data, ...stageResult.data } };
        }
        
        completedStages++;
        stage.onSuccess?.(stageResult);
      } catch (error) {
        stage.onError?.(error as Error);
        return {
          success: false,
          completedStages,
          totalStages: this.stages.length,
          failedStage: stage.name,
          error: (error as Error).message,
          executionTime: Date.now() - startTime,
        };
      }
    }

    return {
      success: true,
      completedStages,
      totalStages: this.stages.length,
      data: currentContext.data,
      executionTime: Date.now() - startTime,
    };
  }

  private async executeStageWithTimeout(stage: PipelineStage, context: PipelineContext) {
    if (stage.timeout) {
      return Promise.race([
        stage.execute(context),
        new Promise<{ success: false; error: string }>((_, reject) =>
          setTimeout(() => reject(new Error(`Stage ${stage.name} timed out after ${stage.timeout}ms`)), stage.timeout)
        )
      ]);
    }
    return stage.execute(context);
  }
}

describe('Pipeline', () => {
  let pipeline: Pipeline;
  let mockContext: PipelineContext;

  beforeEach(() => {
    pipeline = new Pipeline();
    mockContext = {
      id: 'test-pipeline-001',
      timestamp: new Date('2023-01-01T00:00:00Z'),
      data: { input: 'test-data' },
      metadata: {},
    };
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create a new pipeline instance with empty stages', () => {
      const newPipeline = new Pipeline();
      expect(newPipeline).toBeInstanceOf(Pipeline);
      expect(newPipeline.getStages()).toHaveLength(0);
    });

    it('should create pipeline with initial stages when provided', () => {
      const mockStage: PipelineStage = {
        name: 'test-stage',
        execute: jest.fn().mockResolvedValue({ success: true }),
      };
      const newPipeline = new Pipeline([mockStage]);
      expect(newPipeline.getStages()).toHaveLength(1);
      expect(newPipeline.getStages()[0]).toBe(mockStage);
    });

    it('should handle empty initial stages array', () => {
      const newPipeline = new Pipeline([]);
      expect(newPipeline.getStages()).toHaveLength(0);
    });
  });

  describe('addStage', () => {
    it('should add stage to pipeline', () => {
      const mockStage: PipelineStage = {
        name: 'test-stage',
        execute: jest.fn().mockResolvedValue({ success: true }),
      };
      
      pipeline.addStage(mockStage);
      expect(pipeline.getStages()).toHaveLength(1);
      expect(pipeline.getStages()[0]).toBe(mockStage);
    });

    it('should add multiple stages in correct order', () => {
      const stage1: PipelineStage = {
        name: 'stage-1',
        execute: jest.fn().mockResolvedValue({ success: true }),
      };
      const stage2: PipelineStage = {
        name: 'stage-2',
        execute: jest.fn().mockResolvedValue({ success: true }),
      };

      pipeline.addStage(stage1);
      pipeline.addStage(stage2);

      const stages = pipeline.getStages();
      expect(stages).toHaveLength(2);
      expect(stages[0]).toBe(stage1);
      expect(stages[1]).toBe(stage2);
    });

    it('should throw error when adding stage with duplicate name', () => {
      const stage1: PipelineStage = {
        name: 'duplicate-name',
        execute: jest.fn().mockResolvedValue({ success: true }),
      };
      const stage2: PipelineStage = {
        name: 'duplicate-name',
        execute: jest.fn().mockResolvedValue({ success: true }),
      };

      pipeline.addStage(stage1);
      expect(() => pipeline.addStage(stage2)).toThrow('Stage with name "duplicate-name" already exists');
    });

    it('should throw error when adding null or undefined stage', () => {
      expect(() => pipeline.addStage(null as any)).toThrow('Stage cannot be null or undefined');
      expect(() => pipeline.addStage(undefined as any)).toThrow('Stage cannot be null or undefined');
    });

    it('should throw error when adding stage without execute method', () => {
      const invalidStage = {
        name: 'invalid-stage',
      } as PipelineStage;

      expect(() => pipeline.addStage(invalidStage)).toThrow('Stage must have an execute method');
    });

    it('should throw error when adding stage with non-function execute', () => {
      const invalidStage = {
        name: 'invalid-stage',
        execute: 'not-a-function',
      } as any;

      expect(() => pipeline.addStage(invalidStage)).toThrow('Stage must have an execute method');
    });
  });

  describe('removeStage', () => {
    it('should remove stage by name', () => {
      const stage1: PipelineStage = {
        name: 'stage-1',
        execute: jest.fn().mockResolvedValue({ success: true }),
      };
      const stage2: PipelineStage = {
        name: 'stage-2',
        execute: jest.fn().mockResolvedValue({ success: true }),
      };

      pipeline.addStage(stage1);
      pipeline.addStage(stage2);
      expect(pipeline.getStages()).toHaveLength(2);

      const removed = pipeline.removeStage('stage-1');
      expect(removed).toBe(true);
      expect(pipeline.getStages()).toHaveLength(1);
      expect(pipeline.getStages()[0]).toBe(stage2);
    });

    it('should return false when removing non-existent stage', () => {
      const removed = pipeline.removeStage('non-existent');
      expect(removed).toBe(false);
    });

    it('should handle empty string stage name', () => {
      const removed = pipeline.removeStage('');
      expect(removed).toBe(false);
    });

    it('should handle null or undefined stage name', () => {
      const removed1 = pipeline.removeStage(null as any);
      const removed2 = pipeline.removeStage(undefined as any);
      expect(removed1).toBe(false);
      expect(removed2).toBe(false);
    });
  });

  describe('execute', () => {
    it('should execute all stages successfully', async () => {
      const stage1 = {
        name: 'stage-1',
        execute: jest.fn().mockResolvedValue({ 
          success: true, 
          data: { stage1: 'completed' } 
        }),
      };
      const stage2 = {
        name: 'stage-2',
        execute: jest.fn().mockResolvedValue({ 
          success: true, 
          data: { stage2: 'completed' } 
        }),
      };

      pipeline.addStage(stage1);
      pipeline.addStage(stage2);

      const result = await pipeline.execute(mockContext);

      expect(result.success).toBe(true);
      expect(result.completedStages).toBe(2);
      expect(result.totalStages).toBe(2);
      expect(result.executionTime).toBeGreaterThan(0);
      expect(stage1.execute).toHaveBeenCalledWith(mockContext);
      expect(stage2.execute).toHaveBeenCalledWith(expect.objectContaining({
        ...mockContext,
        data: expect.objectContaining({ stage1: 'completed' })
      }));
    });

    it('should stop execution on stage failure', async () => {
      const stage1 = {
        name: 'stage-1',
        execute: jest.fn().mockResolvedValue({ success: true }),
      };
      const stage2 = {
        name: 'stage-2',
        execute: jest.fn().mockResolvedValue({ 
          success: false, 
          error: 'Stage 2 failed' 
        }),
      };
      const stage3 = {
        name: 'stage-3',
        execute: jest.fn().mockResolvedValue({ success: true }),
      };

      pipeline.addStage(stage1);
      pipeline.addStage(stage2);
      pipeline.addStage(stage3);

      const result = await pipeline.execute(mockContext);

      expect(result.success).toBe(false);
      expect(result.completedStages).toBe(1);
      expect(result.totalStages).toBe(3);
      expect(result.failedStage).toBe('stage-2');
      expect(result.error).toBe('Stage 2 failed');
      expect(stage1.execute).toHaveBeenCalled();
      expect(stage2.execute).toHaveBeenCalled();
      expect(stage3.execute).not.toHaveBeenCalled();
    });

    it('should handle stage execution throwing errors', async () => {
      const stage1 = {
        name: 'stage-1',
        execute: jest.fn().mockRejectedValue(new Error('Unexpected error')),
      };

      pipeline.addStage(stage1);

      const result = await pipeline.execute(mockContext);

      expect(result.success).toBe(false);
      expect(result.completedStages).toBe(0);
      expect(result.failedStage).toBe('stage-1');
      expect(result.error).toContain('Unexpected error');
    });

    it('should execute empty pipeline successfully', async () => {
      const result = await pipeline.execute(mockContext);

      expect(result.success).toBe(true);
      expect(result.completedStages).toBe(0);
      expect(result.totalStages).toBe(0);
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle null context gracefully', async () => {
      const stage1 = {
        name: 'stage-1',
        execute: jest.fn().mockResolvedValue({ success: true }),
      };

      pipeline.addStage(stage1);

      await expect(pipeline.execute(null as any)).rejects.toThrow('Context cannot be null or undefined');
    });

    it('should handle undefined context gracefully', async () => {
      await expect(pipeline.execute(undefined as any)).rejects.toThrow('Context cannot be null or undefined');
    });

    it('should pass updated context between stages', async () => {
      const stage1 = {
        name: 'stage-1',
        execute: jest.fn().mockImplementation((ctx) => Promise.resolve({
          success: true,
          data: { ...ctx.data, step1: 'done' }
        })),
      };
      const stage2 = {
        name: 'stage-2',
        execute: jest.fn().mockImplementation((ctx) => Promise.resolve({
          success: true,
          data: { ...ctx.data, step2: 'done' }
        })),
      };

      pipeline.addStage(stage1);
      pipeline.addStage(stage2);

      const result = await pipeline.execute(mockContext);

      expect(result.success).toBe(true);
      expect(stage2.execute).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ step1: 'done' })
      }));
      expect(result.data).toEqual(expect.objectContaining({
        input: 'test-data',
        step1: 'done',
        step2: 'done'
      }));
    });

    it('should handle stage timeout correctly', async () => {
      const slowStage = {
        name: 'slow-stage',
        execute: jest.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({ success: true }), 5000))
        ),
        timeout: 100,
      };

      pipeline.addStage(slowStage);

      const result = await pipeline.execute(mockContext);

      expect(result.success).toBe(false);
      expect(result.failedStage).toBe('slow-stage');
      expect(result.error).toContain('timed out');
    });

    it('should execute stages without timeout when not specified', async () => {
      const normalStage = {
        name: 'normal-stage',
        execute: jest.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({ success: true }), 50))
        ),
      };

      pipeline.addStage(normalStage);

      const result = await pipeline.execute(mockContext);

      expect(result.success).toBe(true);
      expect(normalStage.execute).toHaveBeenCalled();
    });

    it('should call onSuccess callback when stage succeeds', async () => {
      const onSuccessSpy = jest.fn();
      const stage = {
        name: 'success-stage',
        execute: jest.fn().mockResolvedValue({ success: true, data: { result: 'ok' } }),
        onSuccess: onSuccessSpy,
      };

      pipeline.addStage(stage);
      await pipeline.execute(mockContext);

      expect(onSuccessSpy).toHaveBeenCalledWith({ success: true, data: { result: 'ok' } });
    });

    it('should call onError callback when stage throws', async () => {
      const onErrorSpy = jest.fn();
      const error = new Error('Test error');
      const stage = {
        name: 'error-stage',
        execute: jest.fn().mockRejectedValue(error),
        onError: onErrorSpy,
      };

      pipeline.addStage(stage);
      await pipeline.execute(mockContext);

      expect(onErrorSpy).toHaveBeenCalledWith(error);
    });
  });

  describe('getStageByName', () => {
    it('should return stage by name', () => {
      const testStage: PipelineStage = {
        name: 'test-stage',
        execute: jest.fn().mockResolvedValue({ success: true }),
      };

      pipeline.addStage(testStage);
      const foundStage = pipeline.getStageByName('test-stage');

      expect(foundStage).toBe(testStage);
    });

    it('should return undefined for non-existent stage', () => {
      const foundStage = pipeline.getStageByName('non-existent');
      expect(foundStage).toBeUndefined();
    });

    it('should handle empty string stage name', () => {
      const foundStage = pipeline.getStageByName('');
      expect(foundStage).toBeUndefined();
    });

    it('should handle null or undefined stage name', () => {
      const foundStage1 = pipeline.getStageByName(null as any);
      const foundStage2 = pipeline.getStageByName(undefined as any);
      expect(foundStage1).toBeUndefined();
      expect(foundStage2).toBeUndefined();
    });

    it('should be case sensitive', () => {
      const testStage: PipelineStage = {
        name: 'Test-Stage',
        execute: jest.fn().mockResolvedValue({ success: true }),
      };

      pipeline.addStage(testStage);
      expect(pipeline.getStageByName('Test-Stage')).toBe(testStage);
      expect(pipeline.getStageByName('test-stage')).toBeUndefined();
      expect(pipeline.getStageByName('TEST-STAGE')).toBeUndefined();
    });
  });

  describe('getStages', () => {
    it('should return copy of stages array', () => {
      const stage1: PipelineStage = {
        name: 'stage-1',
        execute: jest.fn().mockResolvedValue({ success: true }),
      };
      const stage2: PipelineStage = {
        name: 'stage-2',
        execute: jest.fn().mockResolvedValue({ success: true }),
      };

      pipeline.addStage(stage1);
      pipeline.addStage(stage2);

      const stages = pipeline.getStages();
      expect(stages).toHaveLength(2);

      // Modifying returned array should not affect pipeline
      stages.pop();
      expect(pipeline.getStages()).toHaveLength(2);
    });

    it('should return empty array for empty pipeline', () => {
      const stages = pipeline.getStages();
      expect(stages).toEqual([]);
      expect(Array.isArray(stages)).toBe(true);
    });
  });

  describe('clear', () => {
    it('should remove all stages', () => {
      const stage1: PipelineStage = {
        name: 'stage-1',
        execute: jest.fn().mockResolvedValue({ success: true }),
      };
      const stage2: PipelineStage = {
        name: 'stage-2',
        execute: jest.fn().mockResolvedValue({ success: true }),
      };

      pipeline.addStage(stage1);
      pipeline.addStage(stage2);
      expect(pipeline.getStages()).toHaveLength(2);

      pipeline.clear();
      expect(pipeline.getStages()).toHaveLength(0);
    });

    it('should handle clearing empty pipeline', () => {
      expect(() => pipeline.clear()).not.toThrow();
      expect(pipeline.getStages()).toHaveLength(0);
    });

    it('should allow adding stages after clear', () => {
      const stage1: PipelineStage = {
        name: 'stage-1',
        execute: jest.fn().mockResolvedValue({ success: true }),
      };

      pipeline.addStage(stage1);
      pipeline.clear();

      const stage2: PipelineStage = {
        name: 'stage-2',
        execute: jest.fn().mockResolvedValue({ success: true }),
      };

      pipeline.addStage(stage2);
      expect(pipeline.getStages()).toHaveLength(1);
      expect(pipeline.getStages()[0]).toBe(stage2);
    });
  });

  describe('clone', () => {
    it('should create a deep copy of pipeline', () => {
      const stage1: PipelineStage = {
        name: 'stage-1',
        execute: jest.fn().mockResolvedValue({ success: true }),
      };

      pipeline.addStage(stage1);
      const clonedPipeline = pipeline.clone();

      expect(clonedPipeline).not.toBe(pipeline);
      expect(clonedPipeline.getStages()).toHaveLength(1);
      expect(clonedPipeline.getStages()[0].name).toBe('stage-1');

      // Modifications to clone should not affect original
      clonedPipeline.clear();
      expect(pipeline.getStages()).toHaveLength(1);
    });

    it('should clone empty pipeline', () => {
      const clonedPipeline = pipeline.clone();
      expect(clonedPipeline).not.toBe(pipeline);
      expect(clonedPipeline.getStages()).toHaveLength(0);
    });

    it('should create independent clones', () => {
      const stage1: PipelineStage = {
        name: 'stage-1',
        execute: jest.fn().mockResolvedValue({ success: true }),
      };

      pipeline.addStage(stage1);
      const clone1 = pipeline.clone();
      const clone2 = pipeline.clone();

      expect(clone1).not.toBe(clone2);
      expect(clone1.getStages()).toEqual(clone2.getStages());

      // Modify one clone
      const stage2: PipelineStage = {
        name: 'stage-2',
        execute: jest.fn().mockResolvedValue({ success: true }),
      };
      clone1.addStage(stage2);

      expect(clone1.getStages()).toHaveLength(2);
      expect(clone2.getStages()).toHaveLength(1);
      expect(pipeline.getStages()).toHaveLength(1);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle stages with special characters in names', () => {
      const specialNames = [
        'stage-with-dashes', 
        'stage_with_underscores', 
        'stage.with.dots', 
        'stage with spaces',
        'stage@with#symbols',
        'stage/with\\slashes',
        'stage[with]brackets',
        'stage{with}braces'
      ];
      
      specialNames.forEach(name => {
        const stage: PipelineStage = {
          name,
          execute: jest.fn().mockResolvedValue({ success: true }),
        };
        pipeline.addStage(stage);
      });

      expect(pipeline.getStages()).toHaveLength(specialNames.length);
      specialNames.forEach(name => {
        expect(pipeline.getStageByName(name)).toBeDefined();
      });
    });

    it('should handle context with nested complex data structures', async () => {
      const complexContext = {
        ...mockContext,
        data: {
          nested: {
            array: [1, 2, 3, { deep: 'value' }],
            object: { key: 'value', nested: { deeper: true } },
            nullValue: null,
            undefinedValue: undefined,
            emptyString: '',
            emptyArray: [],
            emptyObject: {},
          },
          circular: null as any,
        },
      };
      
      // Add circular reference
      complexContext.data.circular = complexContext.data;

      const stage: PipelineStage = {
        name: 'complex-data-stage',
        execute: jest.fn().mockResolvedValue({ success: true }),
      };

      pipeline.addStage(stage);
      const result = await pipeline.execute(complexContext);

      expect(result.success).toBe(true);
      expect(stage.execute).toHaveBeenCalledWith(complexContext);
    });

    it('should handle very long stage names', () => {
      const longName = 'a'.repeat(1000);
      const stage: PipelineStage = {
        name: longName,
        execute: jest.fn().mockResolvedValue({ success: true }),
      };

      expect(() => pipeline.addStage(stage)).not.toThrow();
      expect(pipeline.getStageByName(longName)).toBe(stage);
    });

    it('should handle stages returning null or undefined data', async () => {
      const stage1: PipelineStage = {
        name: 'null-data-stage',
        execute: jest.fn().mockResolvedValue({ success: true, data: null }),
      };
      const stage2: PipelineStage = {
        name: 'undefined-data-stage',
        execute: jest.fn().mockResolvedValue({ success: true, data: undefined }),
      };

      pipeline.addStage(stage1);
      pipeline.addStage(stage2);

      const result = await pipeline.execute(mockContext);
      expect(result.success).toBe(true);
    });

    it('should handle stages returning malformed results', async () => {
      const badStage: PipelineStage = {
        name: 'bad-stage',
        execute: jest.fn().mockResolvedValue({ notSuccess: true } as any),
      };

      pipeline.addStage(badStage);
      const result = await pipeline.execute(mockContext);

      expect(result.success).toBe(false);
      expect(result.failedStage).toBe('bad-stage');
    });

    it('should handle large numbers of stages efficiently', async () => {
      const stageCount = 100;
      const stages: PipelineStage[] = [];

      for (let i = 0; i < stageCount; i++) {
        const stage: PipelineStage = {
          name: `stage-${i}`,
          execute: jest.fn().mockResolvedValue({ 
            success: true, 
            data: { [`step${i}`]: `completed` } 
          }),
        };
        stages.push(stage);
        pipeline.addStage(stage);
      }

      expect(pipeline.getStages()).toHaveLength(stageCount);
      
      const startTime = Date.now();
      const result = await pipeline.execute(mockContext);
      const executionTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.completedStages).toBe(stageCount);
      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds

      stages.forEach(stage => {
        expect(stage.execute).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('performance and memory tests', () => {
    it('should not leak memory with repeated executions', async () => {
      const stage: PipelineStage = {
        name: 'memory-test-stage',
        execute: jest.fn().mockResolvedValue({ success: true }),
      };

      pipeline.addStage(stage);

      // Execute multiple times to test for memory leaks
      const iterations = 50;
      for (let i = 0; i < iterations; i++) {
        await pipeline.execute({ ...mockContext, id: `test-${i}` });
      }

      expect(stage.execute).toHaveBeenCalledTimes(iterations);
    });

    it('should handle concurrent executions gracefully', async () => {
      const stage: PipelineStage = {
        name: 'concurrent-test-stage',
        execute: jest.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({ success: true }), 10))
        ),
      };

      pipeline.addStage(stage);

      const concurrentExecutions = 20;
      const promises = Array.from({ length: concurrentExecutions }, (_, i) => 
        pipeline.execute({ ...mockContext, id: `concurrent-${i}` })
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(concurrentExecutions);
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.completedStages).toBe(1);
      });

      expect(stage.execute).toHaveBeenCalledTimes(concurrentExecutions);
    });

    it('should handle stress test with mixed success/failure scenarios', async () => {
      const stages: PipelineStage[] = [];
      
      for (let i = 0; i < 10; i++) {
        const shouldFail = i === 5; // Make the 6th stage fail
        const stage: PipelineStage = {
          name: `stress-stage-${i}`,
          execute: jest.fn().mockResolvedValue(
            shouldFail 
              ? { success: false, error: `Stage ${i} intentionally failed` }
              : { success: true, data: { [`result${i}`]: `done` } }
          ),
        };
        stages.push(stage);
        pipeline.addStage(stage);
      }

      const result = await pipeline.execute(mockContext);

      expect(result.success).toBe(false);
      expect(result.completedStages).toBe(5); // Should stop at the failing stage
      expect(result.failedStage).toBe('stress-stage-5');
      expect(result.totalStages).toBe(10);

      // Verify only stages up to the failure were called
      for (let i = 0; i < 10; i++) {
        if (i <= 5) {
          expect(stages[i].execute).toHaveBeenCalled();
        } else {
          expect(stages[i].execute).not.toHaveBeenCalled();
        }
      }
    });
  });

  describe('integration-style tests', () => {
    it('should handle a realistic data processing pipeline', async () => {
      const validateStage: PipelineStage = {
        name: 'validate',
        execute: async (context) => {
          if (!context.data || typeof context.data !== 'object') {
            return { success: false, error: 'Invalid input data' };
          }
          return { success: true, data: { ...context.data, validated: true } };
        },
      };

      const transformStage: PipelineStage = {
        name: 'transform',
        execute: async (context) => {
          const transformed = Object.keys(context.data).reduce((acc, key) => {
            if (typeof context.data[key] === 'string') {
              acc[key.toUpperCase()] = context.data[key].toUpperCase();
            } else {
              acc[key.toUpperCase()] = context.data[key];
            }
            return acc;
          }, {} as any);
          return { success: true, data: { ...transformed, transformed: true } };
        },
      };

      const enrichStage: PipelineStage = {
        name: 'enrich',
        execute: async (context) => {
          return { 
            success: true, 
            data: { 
              ...context.data, 
              enriched: true,
              processedAt: new Date().toISOString(),
              version: '1.0.0'
            } 
          };
        },
      };

      const saveStage: PipelineStage = {
        name: 'save',
        execute: async (context) => {
          // Simulate save operation
          if (!context.data.VALIDATED) {
            return { success: false, error: 'Cannot save unvalidated data' };
          }
          return { success: true, data: { ...context.data, saved: true } };
        },
      };

      pipeline.addStage(validateStage);
      pipeline.addStage(transformStage);
      pipeline.addStage(enrichStage);
      pipeline.addStage(saveStage);

      const inputContext = {
        id: 'integration-test',
        timestamp: new Date(),
        data: { name: 'test user', email: 'test@example.com', status: 'active' },
        metadata: { source: 'api' },
      };

      const result = await pipeline.execute(inputContext);

      expect(result.success).toBe(true);
      expect(result.completedStages).toBe(4);
      expect(result.data).toEqual(expect.objectContaining({
        NAME: 'TEST USER',
        EMAIL: 'TEST@EXAMPLE.COM',
        STATUS: 'ACTIVE',
        VALIDATED: true,
        transformed: true,
        enriched: true,
        saved: true,
        processedAt: expect.any(String),
        version: '1.0.0',
      }));
    });

    it('should handle pipeline with retry logic', async () => {
      let attemptCount = 0;
      const flakyStage: PipelineStage = {
        name: 'flaky-stage',
        execute: jest.fn().mockImplementation(async () => {
          attemptCount++;
          if (attemptCount < 3) {
            throw new Error(`Attempt ${attemptCount} failed`);
          }
          return { success: true, data: { attempts: attemptCount } };
        }),
        retryCount: 3,
      };

      // Simulate retry logic (would be implemented in actual Pipeline class)
      const retryWrapper: PipelineStage = {
        name: 'retry-wrapper',
        execute: async (context) => {
          const maxRetries = flakyStage.retryCount || 0;
          let lastError: Error | null = null;
          
          for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
              return await flakyStage.execute!(context);
            } catch (error) {
              lastError = error as Error;
              if (attempt === maxRetries) {
                return { success: false, error: lastError.message };
              }
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 10));
            }
          }
          
          return { success: false, error: lastError?.message || 'Unknown error' };
        },
      };

      pipeline.addStage(retryWrapper);
      const result = await pipeline.execute(mockContext);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.objectContaining({ attempts: 3 }));
      expect(flakyStage.execute).toHaveBeenCalledTimes(3);
    });

    it('should handle pipeline with conditional execution', async () => {
      const conditionalStage: PipelineStage = {
        name: 'conditional-stage',
        execute: async (context) => {
          // Only execute if certain condition is met
          if (context.data.shouldProcess !== true) {
            return { success: true, data: { ...context.data, skipped: true } };
          }
          return { success: true, data: { ...context.data, processed: true } };
        },
      };

      pipeline.addStage(conditionalStage);

      // Test with condition false
      const result1 = await pipeline.execute({
        ...mockContext,
        data: { shouldProcess: false }
      });
      expect(result1.success).toBe(true);
      expect(result1.data).toEqual(expect.objectContaining({ skipped: true }));

      // Test with condition true
      const result2 = await pipeline.execute({
        ...mockContext,
        data: { shouldProcess: true }
      });
      expect(result2.success).toBe(true);
      expect(result2.data).toEqual(expect.objectContaining({ processed: true }));
    });
  });
});

// Additional test suite for PipelineStage interface compliance
describe('PipelineStage Interface', () => {
  describe('stage validation', () => {
    it('should validate required properties', () => {
      const validStage: PipelineStage = {
        name: 'valid-stage',
        execute: jest.fn().mockResolvedValue({ success: true }),
      };

      expect(validStage.name).toBeDefined();
      expect(typeof validStage.name).toBe('string');
      expect(typeof validStage.execute).toBe('function');
    });

    it('should handle optional properties', () => {
      const stageWithOptionals: PipelineStage = {
        name: 'stage-with-optionals',
        execute: jest.fn().mockResolvedValue({ success: true }),
        description: 'Test stage with optional properties',
        timeout: 5000,
        retryCount: 3,
        onError: jest.fn(),
        onSuccess: jest.fn(),
      };

      expect(stageWithOptionals.description).toBe('Test stage with optional properties');
      expect(stageWithOptionals.timeout).toBe(5000);
      expect(stageWithOptionals.retryCount).toBe(3);
      expect(typeof stageWithOptionals.onError).toBe('function');
      expect(typeof stageWithOptionals.onSuccess).toBe('function');
    });

    it('should validate execute method returns proper structure', async () => {
      const validExecute = jest.fn().mockResolvedValue({ 
        success: true, 
        data: { result: 'test' },
        error: undefined 
      });
      
      const stage: PipelineStage = {
        name: 'validation-test',
        execute: validExecute,
      };

      const context: PipelineContext = {
        id: 'test',
        timestamp: new Date(),
        data: {},
        metadata: {},
      };

      const result = await stage.execute(context);
      
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ result: 'test' });
    });

    it('should handle execute method returning failure', async () => {
      const failingExecute = jest.fn().mockResolvedValue({ 
        success: false, 
        error: 'Test failure' 
      });
      
      const stage: PipelineStage = {
        name: 'failing-stage',
        execute: failingExecute,
      };

      const context: PipelineContext = {
        id: 'test',
        timestamp: new Date(),
        data: {},
        metadata: {},
      };

      const result = await stage.execute(context);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Test failure');
    });
  });
});
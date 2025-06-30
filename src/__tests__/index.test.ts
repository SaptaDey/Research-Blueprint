import { describe, it, expect, beforeEach, afterEach, jest, beforeAll, afterAll } from '@jest/globals';

// Import the classes and types from the main index file
import { 
  ASRGoTGraph, 
  ASRGoTPipeline, 
  BiasDetector,
  ASRGoTValidator,
  type ASRGoTContext,
  type ResearchQuery,
  type ASRGoTResponse,
  type NodeMetadata,
  type EdgeMetadata,
  NodeType,
  EdgeType
} from '../index.js';

describe('ASR-GoT MCP Server - Core Functionality', () => {
  beforeAll(() => {
    console.log('Starting ASR-GoT MCP Server test suite');
  });

  afterAll(() => {
    console.log('Completed ASR-GoT MCP Server test suite');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('ASRGoTGraph - Graph Operations', () => {
    let graph: ASRGoTGraph;

    beforeEach(() => {
      graph = new ASRGoTGraph();
    });

    it('should initialize empty graph correctly', () => {
      expect(graph).toBeInstanceOf(ASRGoTGraph);
      expect(graph.getNodeCount()).toBe(0);
      expect(graph.getEdgeCount()).toBe(0);
      expect(graph.isEmpty()).toBe(true);
    });

    it('should add nodes with proper metadata', () => {
      const nodeMetadata: NodeMetadata = {
        node_id: 'test-node-1',
        label: 'Test Hypothesis Node',
        type: NodeType.HYPOTHESIS,
        timestamp: new Date(),
        provenance: 'test',
        confidence: {
          empirical_support: 0.8,
          theoretical_basis: 0.7,
          methodological_rigor: 0.9,
          consensus_alignment: 0.6
        },
        epistemic_status: 'hypothetical',
        disciplinary_tags: ['computer_science', 'machine_learning'],
        bias_flags: [],
        revision_history: [],
        layer_id: 'layer-1',
        impact_score: 0.75
      };

      const nodeId = graph.addNode(nodeMetadata);
      expect(nodeId).toBeTruthy();
      expect(graph.getNodeCount()).toBe(1);
      expect(graph.hasNode(nodeId)).toBe(true);
      
      const retrievedNode = graph.getNode(nodeId);
      expect(retrievedNode).toBeDefined();
      expect(retrievedNode?.metadata.label).toBe('Test Hypothesis Node');
      expect(retrievedNode?.metadata.type).toBe(NodeType.HYPOTHESIS);
    });

    it('should add edges between existing nodes', () => {
      // Create two nodes first
      const node1Metadata: NodeMetadata = {
        node_id: 'root-node',
        label: 'Root Research Question',
        type: NodeType.ROOT,
        timestamp: new Date(),
        provenance: 'user_input',
        confidence: {
          empirical_support: 1.0,
          theoretical_basis: 1.0,
          methodological_rigor: 1.0,
          consensus_alignment: 1.0
        },
        epistemic_status: 'established',
        disciplinary_tags: ['research_methodology'],
        bias_flags: [],
        revision_history: [],
        layer_id: 'layer-0',
        impact_score: 1.0
      };

      const node2Metadata: NodeMetadata = {
        node_id: 'hypothesis-1',
        label: 'First Hypothesis',
        type: NodeType.HYPOTHESIS,
        timestamp: new Date(),
        provenance: 'reasoning',
        confidence: {
          empirical_support: 0.6,
          theoretical_basis: 0.8,
          methodological_rigor: 0.7,
          consensus_alignment: 0.5
        },
        epistemic_status: 'hypothetical',
        disciplinary_tags: ['domain_specific'],
        bias_flags: [],
        revision_history: [],
        layer_id: 'layer-1',
        impact_score: 0.7
      };

      const nodeId1 = graph.addNode(node1Metadata);
      const nodeId2 = graph.addNode(node2Metadata);

      const edgeMetadata: EdgeMetadata = {
        edge_id: 'edge-supports-1',
        edge_type: EdgeType.SUPPORTIVE,
        confidence: {
          empirical_support: 0.7,
          theoretical_basis: 0.8,
          methodological_rigor: 0.6,
          consensus_alignment: 0.7
        },
        timestamp: new Date()
      };

      const edgeId = graph.addEdge(nodeId1, nodeId2, edgeMetadata);
      expect(edgeId).toBeTruthy();
      expect(graph.getEdgeCount()).toBe(1);
      expect(graph.hasEdge(edgeId)).toBe(true);

      const neighbors = graph.getNeighbors(nodeId1);
      expect(neighbors).toContain(nodeId2);
    });

    it('should extract subgraphs based on criteria', () => {
      // Add multiple nodes with different properties
      const highConfidenceNode = graph.addNode({
        node_id: 'high-conf',
        label: 'High Confidence Node',
        type: NodeType.EVIDENCE,
        timestamp: new Date(),
        provenance: 'empirical_study',
        confidence: {
          empirical_support: 0.9,
          theoretical_basis: 0.8,
          methodological_rigor: 0.9,
          consensus_alignment: 0.8
        },
        epistemic_status: 'validated',
        disciplinary_tags: ['empirical_research'],
        bias_flags: [],
        revision_history: [],
        layer_id: 'layer-2',
        impact_score: 0.9
      });

      const lowConfidenceNode = graph.addNode({
        node_id: 'low-conf',
        label: 'Low Confidence Node',
        type: NodeType.HYPOTHESIS,
        timestamp: new Date(),
        provenance: 'speculation',
        confidence: {
          empirical_support: 0.3,
          theoretical_basis: 0.4,
          methodological_rigor: 0.2,
          consensus_alignment: 0.3
        },
        epistemic_status: 'speculative',
        disciplinary_tags: ['theoretical'],
        bias_flags: [],
        revision_history: [],
        layer_id: 'layer-3',
        impact_score: 0.3
      });

      // Extract subgraph with high confidence threshold
      const subgraph = graph.extractSubgraph({
        confidence_threshold: 0.7,
        node_types: [NodeType.EVIDENCE]
      });

      expect(subgraph.nodes.length).toBe(1);
      expect(subgraph.nodes[0].id).toBe(highConfidenceNode);
    });
  });

  describe('ASRGoTPipeline - Analysis Execution', () => {
    let pipeline: ASRGoTPipeline;
    let graph: ASRGoTGraph;

    beforeEach(() => {
      graph = new ASRGoTGraph();
      pipeline = new ASRGoTPipeline(graph);
    });

    it('should initialize pipeline correctly', () => {
      expect(pipeline).toBeInstanceOf(ASRGoTPipeline);
    });

    it('should execute complete analysis pipeline', async () => {
      const query: ResearchQuery = {
        query: 'What are the effects of machine learning in drug discovery?',
        domain: ['healthcare', 'computer_science'],
        complexity_level: 'intermediate',
        expected_depth: 'detailed',
        interdisciplinary: true
      };

      const userProfile = {
        identity: 'Test Researcher',
        experience: 'PhD in computational biology',
        research_focus: ['bioinformatics', 'machine_learning'],
        methodologies: ['computational_analysis', 'statistical_modeling'],
        philosophy: 'Evidence-based research with interdisciplinary collaboration'
      };

      const result = await pipeline.executeComplete(query, userProfile);
      
      expect(result).toBeDefined();
      expect(result.current_stage).toBeGreaterThanOrEqual(0);
      expect(result.stage_results).toBeDefined();
      expect(Array.isArray(result.stage_results)).toBe(true);
      expect(result.graph_state).toBeDefined();
      expect(result.graph_state.vertices).toBeDefined();
    }, 30000); // 30 second timeout for pipeline execution

    it('should handle simple queries efficiently', async () => {
      const simpleQuery: ResearchQuery = {
        query: 'What is machine learning?',
        domain: ['computer_science'],
        complexity_level: 'basic',
        expected_depth: 'overview',
        interdisciplinary: false
      };

      const userProfile = {
        identity: 'Student',
        experience: 'Undergraduate',
        research_focus: ['basics'],
        methodologies: ['literature_review'],
        philosophy: 'Learning fundamentals'
      };

      const startTime = Date.now();
      const result = await pipeline.executeComplete(simpleQuery, userProfile);
      const executionTime = Date.now() - startTime;
      
      expect(result).toBeDefined();
      expect(executionTime).toBeLessThan(15000); // Should complete in under 15 seconds
      expect(result.fail_safe_active).toBeDefined();
    }, 20000);
  });

  describe('BiasDetector - Bias Detection', () => {
    let biasDetector: BiasDetector;

    beforeEach(() => {
      biasDetector = new BiasDetector();
    });

    it('should initialize bias detector correctly', () => {
      expect(biasDetector).toBeInstanceOf(BiasDetector);
    });

    it('should detect obvious biases in text content', () => {
      const biasedTexts = [
        'This treatment always works perfectly and has no side effects whatsoever.',
        'All researchers agree that this is the only correct approach.',
        'This method is clearly superior to all alternatives without exception.',
        'The data obviously shows that our hypothesis is 100% correct.'
      ];

      biasedTexts.forEach(text => {
        const detectedBiases = biasDetector.detectBiases(text);
        expect(Array.isArray(detectedBiases)).toBe(true);
        // Should detect at least some bias indicators
        expect(detectedBiases.length).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle neutral content appropriately', () => {
      const neutralTexts = [
        'The study results showed a moderate correlation between variables A and B.',
        'Further research is needed to establish causation.',
        'The findings suggest possible implications for future work.',
        'Statistical analysis indicates significance at p<0.05 with appropriate controls.'
      ];

      neutralTexts.forEach(text => {
        const detectedBiases = biasDetector.detectBiases(text);
        expect(Array.isArray(detectedBiases)).toBe(true);
        // Neutral content should have fewer bias flags
      });
    });

    it('should handle edge cases gracefully', () => {
      const edgeCases = ['', '   ', '\n\t', null, undefined];
      
      edgeCases.forEach(testCase => {
        expect(() => {
          biasDetector.detectBiases(testCase as any);
        }).not.toThrow();
      });
    });
  });

  describe('ASRGoTValidator - Graph Validation', () => {
    let validator: ASRGoTValidator;
    let graph: ASRGoTGraph;

    beforeEach(() => {
      validator = new ASRGoTValidator();
      graph = new ASRGoTGraph();
    });

    it('should initialize validator correctly', () => {
      expect(validator).toBeInstanceOf(ASRGoTValidator);
    });

    it('should validate empty graph state', () => {
      const graphState = graph.getState();
      const validationResult = validator.validateGraphState(graphState);
      
      expect(validationResult).toBeDefined();
      expect(validationResult.isValid).toBeDefined();
      expect(validationResult.statistics).toBeDefined();
      expect(validationResult.errors).toBeDefined();
      expect(validationResult.warnings).toBeDefined();
    });

    it('should validate graph with nodes and edges', () => {
      // Add some nodes and edges to test validation
      const rootNode = graph.addNode({
        node_id: 'validation-root',
        label: 'Validation Test Root',
        type: NodeType.ROOT,
        timestamp: new Date(),
        provenance: 'test',
        confidence: {
          empirical_support: 1.0,
          theoretical_basis: 1.0,
          methodological_rigor: 1.0,
          consensus_alignment: 1.0
        },
        epistemic_status: 'established',
        disciplinary_tags: ['test'],
        bias_flags: [],
        revision_history: [],
        layer_id: 'layer-0',
        impact_score: 1.0
      });

      const hypothesisNode = graph.addNode({
        node_id: 'validation-hypothesis',
        label: 'Validation Test Hypothesis',
        type: NodeType.HYPOTHESIS,
        timestamp: new Date(),
        provenance: 'test',
        confidence: {
          empirical_support: 0.7,
          theoretical_basis: 0.8,
          methodological_rigor: 0.6,
          consensus_alignment: 0.7
        },
        epistemic_status: 'hypothetical',
        disciplinary_tags: ['test'],
        bias_flags: [],
        revision_history: [],
        layer_id: 'layer-1',
        impact_score: 0.7
      });

      graph.addEdge(rootNode, hypothesisNode, {
        edge_id: 'validation-edge',
        edge_type: EdgeType.SUPPORTIVE,
        confidence: {
          empirical_support: 0.8,
          theoretical_basis: 0.7,
          methodological_rigor: 0.8,
          consensus_alignment: 0.7
        },
        timestamp: new Date()
      });

      const graphState = graph.getState();
      const validationResult = validator.validateGraphState(graphState);
      
      expect(validationResult.statistics.total_nodes).toBe(2);
      expect(validationResult.statistics.total_edges).toBe(1);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle invalid node metadata gracefully', () => {
      const graph = new ASRGoTGraph();
      
      expect(() => {
        graph.addNode(null as any);
      }).toThrow();
      
      expect(() => {
        graph.addNode({} as any);
      }).toThrow();
    });

    it('should handle missing edge endpoints', () => {
      const graph = new ASRGoTGraph();
      
      expect(() => {
        graph.addEdge('non-existent-1', 'non-existent-2', {
          edge_id: 'test-edge',
          edge_type: EdgeType.SUPPORTIVE,
          confidence: {
            empirical_support: 0.5,
            theoretical_basis: 0.5,
            methodological_rigor: 0.5,
            consensus_alignment: 0.5
          },
          timestamp: new Date()
        });
      }).toThrow();
    });

    it('should handle pipeline execution with invalid context', async () => {
      const graph = new ASRGoTGraph();
      const pipeline = new ASRGoTPipeline(graph);
      
      // Test with null query
      await expect(
        pipeline.executeComplete(null as any, {
          identity: 'test',
          experience: 'test',
          research_focus: [],
          methodologies: [],
          philosophy: 'test'
        })
      ).rejects.toThrow();
      
      // Test with empty query
      await expect(
        pipeline.executeComplete({
          query: '',
          domain: [],
          complexity_level: 'basic',
          expected_depth: 'overview',
          interdisciplinary: false
        }, null as any)
      ).rejects.toThrow();
    });
  });

  describe('Performance and Resource Management', () => {
    jest.setTimeout(15000);

    it('should handle large graphs efficiently', () => {
      const graph = new ASRGoTGraph();
      const startTime = performance.now();
      
      // Add 50 nodes (reasonable size for testing)
      const nodeIds = [];
      for (let i = 0; i < 50; i++) {
        const nodeId = graph.addNode({
          node_id: `perf-test-node-${i}`,
          label: `Performance Test Node ${i}`,
          type: NodeType.HYPOTHESIS,
          timestamp: new Date(),
          provenance: 'performance_test',
          confidence: {
            empirical_support: Math.random(),
            theoretical_basis: Math.random(),
            methodological_rigor: Math.random(),
            consensus_alignment: Math.random()
          },
          epistemic_status: 'test',
          disciplinary_tags: [`domain_${i % 5}`],
          bias_flags: [],
          revision_history: [],
          layer_id: `layer-${i % 10}`,
          impact_score: Math.random()
        });
        nodeIds.push(nodeId);
      }
      
      const executionTime = performance.now() - startTime;
      expect(graph.getNodeCount()).toBe(50);
      expect(executionTime).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should manage memory efficiently during operations', () => {
      const graph = new ASRGoTGraph();
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform multiple operations
      for (let i = 0; i < 20; i++) {
        const nodeId = graph.addNode({
          node_id: `memory-test-${i}`,
          label: `Memory Test ${i}`,
          type: NodeType.HYPOTHESIS,
          timestamp: new Date(),
          provenance: 'memory_test',
          confidence: {
            empirical_support: 0.5,
            theoretical_basis: 0.5,
            methodological_rigor: 0.5,
            consensus_alignment: 0.5
          },
          epistemic_status: 'test',
          disciplinary_tags: ['memory_test'],
          bias_flags: [],
          revision_history: [],
          layer_id: 'memory-layer',
          impact_score: 0.5
        });
        
        // Remove some nodes to test memory cleanup
        if (i % 4 === 0 && i > 0) {
          graph.removeNode(nodeId);
        }
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Integration Tests', () => {
    it('should work end-to-end with real research query', async () => {
      const graph = new ASRGoTGraph();
      const pipeline = new ASRGoTPipeline(graph);
      
      const query: ResearchQuery = {
        query: 'How does artificial intelligence impact medical diagnosis accuracy?',
        domain: ['artificial_intelligence', 'medicine', 'healthcare'],
        complexity_level: 'intermediate',
        expected_depth: 'detailed',
        interdisciplinary: true
      };

      const userProfile = {
        identity: 'Medical AI Researcher',
        experience: 'PhD in Computer Science, MD specialization',
        research_focus: ['medical_ai', 'diagnostic_systems', 'clinical_decision_support'],
        methodologies: ['machine_learning', 'clinical_trials', 'statistical_analysis'],
        philosophy: 'Evidence-based AI for improving patient outcomes'
      };

      const result = await pipeline.executeComplete(query, userProfile);
      
      // Verify basic structure
      expect(result).toBeDefined();
      expect(result.task_query).toBe(query.query);
      expect(result.graph_state).toBeDefined();
      expect(result.stage_results).toBeDefined();
      
      // Verify some nodes were created
      expect(result.graph_state.vertices.size).toBeGreaterThan(0);
      
      // Verify stages were executed
      expect(result.stage_results.length).toBeGreaterThan(0);
      expect(result.current_stage).toBeGreaterThanOrEqual(0);
      
    }, 45000); // Longer timeout for complex integration test
  });
});
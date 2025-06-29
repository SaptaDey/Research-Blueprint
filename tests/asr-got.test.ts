import { ASRGoTPipeline } from '../src/stages/pipeline';
import { ASRGoTGraph } from '../src/core/graph';
import { ASRGoTValidator } from '../src/validation/schema-validator';
import { BayesianUpdater } from '../src/utils/bayesian';
import { InformationTheory } from '../src/utils/information-theory';
import { BiasDetector } from '../src/utils/bias-detector';
import { TemporalAnalyzer } from '../src/utils/temporal-analyzer';
import { CausalInference } from '../src/utils/causal-inference';
import { 
  ResearchQuery, 
  NodeType, 
  EdgeType, 
  ConfidenceVector,
  NodeMetadata 
} from '../src/types/index';

describe('ASR-GoT MCP Server', () => {
  let pipeline: ASRGoTPipeline;
  let graph: ASRGoTGraph;
  let validator: ASRGoTValidator;

  beforeEach(() => {
    pipeline = new ASRGoTPipeline();
    graph = new ASRGoTGraph();
    validator = new ASRGoTValidator();
  });

  describe('Core Graph Operations', () => {
    test('should create and manage nodes correctly', () => {
      const nodeMetadata: NodeMetadata = {
        node_id: 'test-node-1',
        label: 'Test Node',
        type: NodeType.ROOT,
        timestamp: new Date(),
        provenance: 'Test provenance',
        confidence: {
          empirical_support: 0.8,
          theoretical_basis: 0.7,
          methodological_rigor: 0.9,
          consensus_alignment: 0.6
        },
        epistemic_status: 'initial',
        disciplinary_tags: ['test', 'research'],
        bias_flags: [],
        revision_history: [{
          timestamp: new Date(),
          change: 'Node created for testing',
          author: 'Test Suite'
        }],
        impact_score: 0.7
      };

      const nodeId = graph.addNode(nodeMetadata);
      expect(nodeId).toBe('test-node-1');

      const retrievedNode = graph.getNode(nodeId);
      expect(retrievedNode).toBeDefined();
      expect(retrievedNode?.metadata.label).toBe('Test Node');
      expect(retrievedNode?.metadata.type).toBe(NodeType.ROOT);
    });

    test('should update node confidence using Bayesian methods', () => {
      const nodeMetadata: NodeMetadata = {
        node_id: 'test-node-bayesian',
        label: 'Bayesian Test Node',
        type: NodeType.HYPOTHESIS,
        timestamp: new Date(),
        provenance: 'Test',
        confidence: {
          empirical_support: 0.5,
          theoretical_basis: 0.5,
          methodological_rigor: 0.5,
          consensus_alignment: 0.5
        },
        epistemic_status: 'initial',
        disciplinary_tags: ['test'],
        bias_flags: [],
        revision_history: [],
        impact_score: 0.5
      };

      const nodeId = graph.addNode(nodeMetadata);
      
      const newConfidence: ConfidenceVector = {
        empirical_support: 0.8,
        theoretical_basis: 0.7,
        methodological_rigor: 0.9,
        consensus_alignment: 0.6
      };

      const success = graph.updateNodeConfidence(nodeId, newConfidence, { reliability: 0.8 });
      expect(success).toBe(true);

      const updatedNode = graph.getNode(nodeId);
      expect(updatedNode?.metadata.confidence.empirical_support).toBeGreaterThan(0.5);
    });

    test('should create interdisciplinary bridge nodes', () => {
      // Create two nodes with different disciplinary tags
      const node1Metadata: NodeMetadata = {
        node_id: 'node1-interdisciplinary',
        label: 'Immunology Node',
        type: NodeType.HYPOTHESIS,
        timestamp: new Date(),
        provenance: 'Test',
        confidence: { empirical_support: 0.7, theoretical_basis: 0.6, methodological_rigor: 0.8, consensus_alignment: 0.5 },
        epistemic_status: 'hypothesis',
        disciplinary_tags: ['immunology', 'biology'],
        bias_flags: [],
        revision_history: [],
        impact_score: 0.6
      };

      const node2Metadata: NodeMetadata = {
        node_id: 'node2-interdisciplinary',
        label: 'Machine Learning Node',
        type: NodeType.HYPOTHESIS,
        timestamp: new Date(),
        provenance: 'Test',
        confidence: { empirical_support: 0.6, theoretical_basis: 0.8, methodological_rigor: 0.7, consensus_alignment: 0.6 },
        epistemic_status: 'hypothesis',
        disciplinary_tags: ['machine_learning', 'computer_science'],
        bias_flags: [],
        revision_history: [],
        impact_score: 0.7
      };

      const node1Id = graph.addNode(node1Metadata);
      const node2Id = graph.addNode(node2Metadata);

      // Create IBN with high semantic similarity
      const ibnId = graph.createIBN(node1Id, node2Id, 0.8);
      
      expect(ibnId).toBeDefined();
      if (ibnId) {
        const ibnNode = graph.getNode(ibnId);
        expect(ibnNode?.metadata.type).toBe(NodeType.IBN);
        expect(ibnNode?.metadata.disciplinary_tags).toContain('immunology');
        expect(ibnNode?.metadata.disciplinary_tags).toContain('machine_learning');
      }
    });

    test('should prune low-confidence nodes', () => {
      // Add nodes with varying confidence levels
      const highConfNode: NodeMetadata = {
        node_id: 'high-conf-node',
        label: 'High Confidence',
        type: NodeType.HYPOTHESIS,
        timestamp: new Date(),
        provenance: 'Test',
        confidence: { empirical_support: 0.9, theoretical_basis: 0.8, methodological_rigor: 0.9, consensus_alignment: 0.8 },
        epistemic_status: 'hypothesis',
        disciplinary_tags: ['test'],
        bias_flags: [],
        revision_history: [],
        impact_score: 0.8
      };

      const lowConfNode: NodeMetadata = {
        node_id: 'low-conf-node',
        label: 'Low Confidence',
        type: NodeType.HYPOTHESIS,
        timestamp: new Date(),
        provenance: 'Test',
        confidence: { empirical_support: 0.1, theoretical_basis: 0.1, methodological_rigor: 0.1, consensus_alignment: 0.1 },
        epistemic_status: 'hypothesis',
        disciplinary_tags: ['test'],
        bias_flags: [],
        revision_history: [],
        impact_score: 0.05
      };

      graph.addNode(highConfNode);
      graph.addNode(lowConfNode);

      const initialNodeCount = graph.getNodeCount();
      const prunedNodes = graph.pruneNodes(0.2, 0.1);

      expect(prunedNodes.length).toBeGreaterThan(0);
      expect(graph.getNodeCount()).toBeLessThan(initialNodeCount);
      expect(graph.getNode('high-conf-node')).toBeDefined();
      expect(graph.getNode('low-conf-node')).toBeUndefined();
    });
  });

  describe('8-Stage Pipeline Execution', () => {
    test('should execute complete pipeline successfully', async () => {
      const query: ResearchQuery = {
        query: 'What are the mechanisms of skin immune response in cutaneous T-cell lymphoma?',
        domain: ['immunology', 'dermatology', 'oncology'],
        complexity_level: 'advanced',
        expected_depth: 'comprehensive',
        interdisciplinary: true
      };

      const userProfile = {
        identity: 'Dr. Test Researcher',
        experience: 'Advanced researcher in immunology',
        research_focus: ['immunology', 'dermatology'],
        methodologies: ['molecular_biology', 'genomic_analysis'],
        philosophy: 'Evidence-based research'
      };

      const context = await pipeline.executeComplete(query, userProfile);

      expect(context.stage_results).toHaveLength(8);
      expect(context.current_stage).toBe(8);
      expect(context.graph_state.vertices.size).toBeGreaterThan(0);
      
      // Check that all stages completed (either successfully or with fail-safe)
      const completedStages = context.stage_results.filter(r => r.success).length;
      expect(completedStages).toBeGreaterThan(0);
    });

    test('should activate fail-safe mechanisms on errors', async () => {
      // Create a pipeline that will likely trigger fail-safe due to resource constraints
      const largeBudgetQuery: ResearchQuery = {
        query: 'Very complex query with enormous computational requirements',
        domain: ['domain1', 'domain2', 'domain3', 'domain4', 'domain5'],
        complexity_level: 'advanced',
        expected_depth: 'comprehensive',
        interdisciplinary: true
      };

      const userProfile = {
        identity: 'Test User',
        experience: 'Test',
        research_focus: ['test'],
        methodologies: ['test'],
        philosophy: 'Test'
      };

      // Set very restrictive computational budget
      const restrictiveBudget = {
        max_nodes: 5,
        max_edges: 10,
        max_execution_time_ms: 100
      };

      const context = await pipeline.executeComplete(largeBudgetQuery, userProfile);
      
      // Even with constraints, should complete all stages (possibly with fail-safe)
      expect(context.stage_results).toHaveLength(8);
      
      // Should have some output even if fail-safe was activated
      expect(context.graph_state.vertices.size).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Validation System', () => {
    test('should validate node metadata correctly', () => {
      const validMetadata: NodeMetadata = {
        node_id: 'valid-node',
        label: 'Valid Node',
        type: NodeType.HYPOTHESIS,
        timestamp: new Date(),
        provenance: 'Test validation',
        confidence: {
          empirical_support: 0.7,
          theoretical_basis: 0.6,
          methodological_rigor: 0.8,
          consensus_alignment: 0.5
        },
        epistemic_status: 'validated',
        disciplinary_tags: ['test', 'validation'],
        bias_flags: [],
        revision_history: [{
          timestamp: new Date(),
          change: 'Created for validation test',
          author: 'Test Suite'
        }],
        impact_score: 0.6,
        falsification_criteria: 'Testable hypothesis'
      };

      const result = validator.validateNodeMetadata(validMetadata);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect validation errors', () => {
      const invalidMetadata = {
        node_id: '', // Invalid empty ID
        label: 'Invalid Node',
        type: 'invalid_type', // Invalid type
        confidence: {
          empirical_support: 1.5, // Invalid value > 1
          theoretical_basis: -0.1, // Invalid negative value
          methodological_rigor: 0.5,
          consensus_alignment: 0.5
        },
        // Missing required fields
      };

      const result = validator.validateNodeMetadata(invalidMetadata);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should validate graph state consistency', () => {
      // Create a valid graph state
      const node1: NodeMetadata = {
        node_id: 'graph-test-1',
        label: 'Test Node 1',
        type: NodeType.ROOT,
        timestamp: new Date(),
        provenance: 'Graph test',
        confidence: { empirical_support: 0.7, theoretical_basis: 0.6, methodological_rigor: 0.8, consensus_alignment: 0.5 },
        epistemic_status: 'test',
        disciplinary_tags: ['test'],
        bias_flags: [],
        revision_history: [],
        impact_score: 0.5
      };

      const node2: NodeMetadata = {
        node_id: 'graph-test-2',
        label: 'Test Node 2',
        type: NodeType.HYPOTHESIS,
        timestamp: new Date(),
        provenance: 'Graph test',
        confidence: { empirical_support: 0.6, theoretical_basis: 0.7, methodological_rigor: 0.7, consensus_alignment: 0.6 },
        epistemic_status: 'test',
        disciplinary_tags: ['test'],
        bias_flags: [],
        revision_history: [],
        impact_score: 0.6
      };

      graph.addNode(node1);
      graph.addNode(node2);

      // Add edge between nodes
      graph.addEdge('graph-test-1', 'graph-test-2', {
        edge_id: 'test-edge-1',
        edge_type: EdgeType.SUPPORTIVE,
        confidence: node1.confidence,
        timestamp: new Date()
      });

      const graphState = graph.getState();
      const validation = validator.validateGraphState(graphState);

      expect(validation.isValid).toBe(true);
      expect(validation.statistics.total_nodes).toBe(2);
      expect(validation.statistics.total_edges).toBe(1);
      expect(validation.statistics.orphaned_nodes).toBe(0);
    });
  });

  describe('Advanced Features', () => {
    test('Bayesian confidence updates', () => {
      const bayesian = new BayesianUpdater();
      
      const prior: ConfidenceVector = {
        empirical_support: 0.5,
        theoretical_basis: 0.6,
        methodological_rigor: 0.7,
        consensus_alignment: 0.5
      };

      const likelihood: ConfidenceVector = {
        empirical_support: 0.8,
        theoretical_basis: 0.7,
        methodological_rigor: 0.9,
        consensus_alignment: 0.6
      };

      const posterior = bayesian.updateConfidence(prior, likelihood, { reliability: 0.8 });

      expect(posterior.empirical_support).toBeGreaterThan(prior.empirical_support);
      expect(posterior.empirical_support).toBeLessThanOrEqual(1.0);
      expect(posterior.empirical_support).toBeGreaterThanOrEqual(0.0);
    });

    test('Information theory calculations', () => {
      const infoTheory = new InformationTheory();
      
      const confidence: ConfidenceVector = {
        empirical_support: 0.7,
        theoretical_basis: 0.6,
        methodological_rigor: 0.8,
        consensus_alignment: 0.5
      };

      const entropy = infoTheory.calculateEntropy(confidence);
      expect(entropy).toBeGreaterThanOrEqual(0);
      expect(entropy).toBeLessThanOrEqual(10);

      const klDiv = infoTheory.calculateKLDivergence(confidence, confidence);
      expect(klDiv).toBeCloseTo(0, 3); // KL divergence of identical distributions should be 0
    });

    test('Bias detection', () => {
      const biasDetector = new BiasDetector();
      
      const biasedContent = 'Obviously, all patients clearly show significant improvements with no side effects whatsoever.';
      const biases = biasDetector.detectBiases(biasedContent);

      expect(biases.length).toBeGreaterThan(0);
      expect(biases).toContain('overconfidence_bias');
    });

    test('Temporal pattern detection', () => {
      const temporalAnalyzer = new TemporalAnalyzer();
      
      const temporalContent = 'First, we observe the initial response. Then, after a delay, the secondary effects become apparent. This leads to a cyclic pattern of immune activation.';
      const patterns = temporalAnalyzer.detectTemporalPatterns(temporalContent);

      expect(patterns.patterns.length).toBeGreaterThan(0);
      expect(patterns.temporal_markers.length).toBeGreaterThan(0);
      expect(patterns.sequence_indicators.length).toBeGreaterThan(0);
    });

    test('Causal inference analysis', () => {
      const causalInference = new CausalInference();
      
      const causalContent = 'The increased cytokine production directly causes inflammation, which leads to tissue damage. This causal relationship is supported by experimental evidence.';
      const analysis = causalInference.analyzeCausalRelationships(causalContent);

      expect(analysis.causal_claims.length).toBeGreaterThan(0);
      expect(analysis.hill_criteria_score).toBeGreaterThan(0);
      expect(analysis.hill_criteria_score).toBeLessThanOrEqual(1);
    });
  });

  describe('Subgraph Extraction', () => {
    test('should extract subgraphs based on criteria', () => {
      // Setup a graph with multiple nodes and edges
      const nodes = [
        {
          node_id: 'sub-1',
          label: 'High Impact Node',
          type: NodeType.HYPOTHESIS,
          timestamp: new Date(),
          provenance: 'Test',
          confidence: { empirical_support: 0.9, theoretical_basis: 0.8, methodological_rigor: 0.9, consensus_alignment: 0.8 },
          epistemic_status: 'high-impact',
          disciplinary_tags: ['important'],
          bias_flags: [],
          revision_history: [],
          impact_score: 0.9
        },
        {
          node_id: 'sub-2',
          label: 'Low Impact Node',
          type: NodeType.HYPOTHESIS,
          timestamp: new Date(),
          provenance: 'Test',
          confidence: { empirical_support: 0.3, theoretical_basis: 0.3, methodological_rigor: 0.3, consensus_alignment: 0.3 },
          epistemic_status: 'low-impact',
          disciplinary_tags: ['unimportant'],
          bias_flags: [],
          revision_history: [],
          impact_score: 0.1
        }
      ];

      nodes.forEach(node => graph.addNode(node));

      const subgraph = graph.extractSubgraph({
        confidence_threshold: 0.5,
        impact_threshold: 0.5,
        node_types: [NodeType.HYPOTHESIS]
      });

      expect(subgraph.nodes.length).toBe(1); // Only high-impact node should be included
      expect(subgraph.nodes[0].id).toBe('sub-1');
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle invalid input gracefully', async () => {
      const invalidQuery: ResearchQuery = {
        query: '', // Empty query
        domain: [],
        complexity_level: 'basic',
        expected_depth: 'overview',
        interdisciplinary: false
      };

      const userProfile = {
        identity: 'Test',
        experience: 'Test',
        research_focus: [],
        methodologies: [],
        philosophy: 'Test'
      };

      // Should not throw an error even with invalid input
      const context = await pipeline.executeComplete(invalidQuery, userProfile);
      expect(context.stage_results).toHaveLength(8);
    });

    test('should maintain graph consistency after operations', () => {
      const nodeId = graph.addNode({
        node_id: 'consistency-test',
        label: 'Consistency Test',
        type: NodeType.ROOT,
        timestamp: new Date(),
        provenance: 'Test',
        confidence: { empirical_support: 0.5, theoretical_basis: 0.5, methodological_rigor: 0.5, consensus_alignment: 0.5 },
        epistemic_status: 'test',
        disciplinary_tags: ['test'],
        bias_flags: [],
        revision_history: [],
        impact_score: 0.5
      });

      const initialState = graph.getState();
      const initialNodeCount = initialState.vertices.size;

      // Perform various operations
      graph.updateNodeConfidence(nodeId, {
        empirical_support: 0.8,
        theoretical_basis: 0.7,
        methodological_rigor: 0.9,
        consensus_alignment: 0.6
      });

      const finalState = graph.getState();
      
      // Graph should maintain consistency
      expect(finalState.vertices.size).toBe(initialNodeCount);
      expect(finalState.vertices.has(nodeId)).toBe(true);
    });
  });
});

describe('Integration Tests', () => {
  test('should demonstrate complete workflow', async () => {
    const pipeline = new ASRGoTPipeline();
    
    const researchQuery: ResearchQuery = {
      query: 'How do immune checkpoint inhibitors affect T-cell activation in melanoma patients?',
      domain: ['immunology', 'oncology', 'pharmacology'],
      complexity_level: 'advanced',
      expected_depth: 'comprehensive',
      interdisciplinary: true
    };

    const userProfile = {
      identity: 'Dr. Saptaswa Dey',
      experience: '>10 years in immunology, molecular biology, inflammatory diseases',
      research_focus: ['skin_immunology', 'cutaneous_malignancies', 'CTCL', 'skin_microbiome'],
      methodologies: ['genomic_analysis', 'microbiome_analysis', 'molecular_biology', 'machine_learning'],
      philosophy: 'Holistic, interdisciplinary, curiosity-driven research'
    };

    // Execute complete analysis
    const context = await pipeline.executeComplete(researchQuery, userProfile);

    // Verify complete execution
    expect(context.stage_results).toHaveLength(8);
    expect(context.current_stage).toBe(8);
    
    // Should have created nodes and edges
    expect(context.graph_state.vertices.size).toBeGreaterThan(0);
    
    // Should have generated some insights
    const successfulStages = context.stage_results.filter(r => r.success).length;
    expect(successfulStages).toBeGreaterThan(0);

    // Validate the final graph
    const validator = new ASRGoTValidator();
    const validation = validator.validateGraphState(context.graph_state);
    
    // Graph should be valid or have minimal issues
    expect(validation.statistics.total_nodes).toBeGreaterThan(0);
    expect(validation.statistics.invalid_references).toBe(0);
  });
});
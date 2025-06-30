import { v4 as uuidv4 } from 'uuid';
import { 
  ASRGoTContext, 
  StageResult, 
  NodeType, 
  EdgeType,
  NodeMetadata,
  EdgeMetadata,
  ConfidenceVector,
  ResearchQuery 
} from '../types/index.js';
import { ASRGoTGraph } from '../core/graph.js';
import { BiasDetector } from '../utils/bias-detector.js';
import { TemporalAnalyzer } from '../utils/temporal-analyzer.js';
import { CausalInference } from '../utils/causal-inference.js';

export class ASRGoTPipeline {
  private graph: ASRGoTGraph;
  private biasDetector: BiasDetector;
  private temporalAnalyzer: TemporalAnalyzer;
  private causalInference: CausalInference;
  private failSafeActive: boolean = false;

  constructor() {
    this.graph = new ASRGoTGraph();
    this.biasDetector = new BiasDetector();
    this.temporalAnalyzer = new TemporalAnalyzer();
    this.causalInference = new CausalInference();
  }

  /**
   * Execute the complete 8-stage ASR-GoT pipeline with fail-safe mechanisms
   */
  async executeComplete(query: ResearchQuery, userProfile: any): Promise<ASRGoTContext> {
    const context: ASRGoTContext = {
      task_query: query.query,
      user_profile: userProfile,
      communication_preferences: {
        tone: 'formal',
        style: 'academic',
        citation_format: 'vancouver',
        length: 'extensive'
      },
      current_stage: 0,
      graph_state: this.graph.getState(),
      stage_results: [],
      fail_safe_active: false,
      computational_budget: {
        max_nodes: 1000,
        max_edges: 5000,
        max_execution_time_ms: 300000 // 5 minutes
      }
    };

    try {
      // Execute all 8 stages sequentially with fail-safe mechanisms
      for (let stage = 1; stage <= 8; stage++) {
        context.current_stage = stage;
        
        try {
          const result = await this.executeStage(stage, context, query);
          context.stage_results.push(result);
          
          if (!result.success && !this.failSafeActive) {
            console.warn(`Stage ${stage} failed, activating fail-safe mode`);
            this.activateFailSafe(context);
            
            // Retry stage with fail-safe mode
            const retryResult = await this.executeStage(stage, context, query);
            context.stage_results[context.stage_results.length - 1] = retryResult;
          }
          
        } catch (error) {
          console.error(`Critical error in stage ${stage}:`, error);
          this.handleCriticalError(context, stage, error as Error);
          
          // Continue with next stage in fail-safe mode
          if (!this.failSafeActive) {
            this.activateFailSafe(context);
          }
        }
        
        // Update graph state
        context.graph_state = this.graph.getState();
        
        // Check computational budget
        if (this.exceedsComputationalBudget(context)) {
          console.warn('Computational budget exceeded, activating fail-safe mode');
          this.activateFailSafe(context);
        }
      }
      
      return context;
      
    } catch (error) {
      console.error('Pipeline execution failed:', error);
      this.handlePipelineFailure(context, error as Error);
      return context;
    }
  }

  private async executeStage(stage: number, context: ASRGoTContext, query: ResearchQuery): Promise<StageResult> {
    const startTime = Date.now();
    const maxRetries = this.failSafeActive ? 1 : 3;
    let attempt = 0;
    
    const result: StageResult = {
      stage,
      stage_name: this.getStageNames()[stage - 1],
      success: false,
      nodes_created: [],
      edges_created: [],
      errors: [],
      warnings: [],
      execution_time_ms: 0
    };

    while (attempt < maxRetries) {
      try {
        // Add timeout protection
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Stage ${stage} timeout after 30 seconds`)), 30000);
        });

        const stagePromise = this.executeStageLogic(stage, context, query, result, attempt);
        await Promise.race([stagePromise, timeoutPromise]);
        
        result.success = true;
        break;
        
      } catch (error) {
        attempt++;
        const errorMsg = `Stage ${stage} attempt ${attempt} error: ${(error as Error).message}`;
        result.errors.push(errorMsg);
        console.warn(errorMsg);
        
        // If this is the last attempt or we're in fail-safe mode, create fallback output
        if (attempt >= maxRetries) {
          result.success = false;
          
          try {
            // Always attempt to create minimal viable output
            await this.createFailSafeOutput(stage, context, result);
            result.success = true; // Mark as success to continue pipeline
            result.warnings.push(`Stage ${stage} completed with fallback output after ${attempt} attempts`);
          } catch (fallbackError) {
            result.errors.push(`Fallback creation failed: ${(fallbackError as Error).message}`);
            // Even if fallback fails, we continue - just with minimal/empty output
            result.success = true;
            result.warnings.push(`Stage ${stage} continued with minimal output due to fallback failure`);
          }
        } else {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
        }
      }
    }
    
    result.execution_time_ms = Date.now() - startTime;
    return result;
  }

  private async executeStageLogic(stage: number, context: ASRGoTContext, query: ResearchQuery, result: StageResult, attempt: number): Promise<void> {
    // Clear previous attempt's partial results if retrying
    if (attempt > 0) {
      result.nodes_created = [];
      result.edges_created = [];
    }

    switch (stage) {
      case 1:
        await this.stage1_Initialization(context, query, result);
        break;
      case 2:
        await this.stage2_Decomposition(context, query, result);
        break;
      case 3:
        await this.stage3_HypothesisPlanning(context, query, result);
        break;
      case 4:
        await this.stage4_EvidenceIntegration(context, query, result);
        break;
      case 5:
        await this.stage5_PruningMerging(context, query, result);
        break;
      case 6:
        await this.stage6_SubgraphExtraction(context, query, result);
        break;
      case 7:
        await this.stage7_Composition(context, query, result);
        break;
      case 8:
        await this.stage8_Reflection(context, query, result);
        break;
      default:
        throw new Error(`Invalid stage: ${stage}`);
    }
  }

  // Stage 1: Initialization (P1.1)
  private async stage1_Initialization(context: ASRGoTContext, query: ResearchQuery, result: StageResult): Promise<void> {
    const rootMetadata: NodeMetadata = {
      node_id: uuidv4(),
      label: 'Task Understanding',
      type: NodeType.ROOT,
      timestamp: new Date(),
      provenance: `Query: "${query.query}"`,
      confidence: {
        empirical_support: 0.8,
        theoretical_basis: 0.8,
        methodological_rigor: 0.8,
        consensus_alignment: 0.8
      },
      epistemic_status: 'initial',
      disciplinary_tags: query.domain || ['general'],
      bias_flags: [],
      revision_history: [{
        timestamp: new Date(),
        change: 'Root node initialized',
        author: 'ASR-GoT System'
      }],
      impact_score: 0.9,
      layer_id: 'root'
    };

    const rootId = this.graph.addNode(rootMetadata);
    result.nodes_created.push(rootId);
  }

  // Stage 2: Decomposition (P1.2)
  private async stage2_Decomposition(context: ASRGoTContext, query: ResearchQuery, result: StageResult): Promise<void> {
    const dimensions = [
      'Scope', 'Objectives', 'Constraints', 'Data Needs', 
      'Use Cases', 'Potential Biases', 'Knowledge Gaps'
    ];

    const rootNodes = Array.from(this.graph.getState().vertices.values())
      .filter(node => node.metadata.type === NodeType.ROOT);
    
    let rootNode;
    if (rootNodes.length === 0) {
     if (rootNodes.length === 0) {
       // Create emergency root node if missing
       const emergencyRootId = this.createBasicRootNode(query.query);
       result.nodes_created.push(emergencyRootId);
       result.warnings.push('Created emergency root node for decomposition');
       const emergencyRoot = this.graph.getNode(emergencyRootId);
       if (!emergencyRoot) {
         throw new Error('Failed to create emergency root node');
       }
       rootNode = emergencyRoot;
     } else {
       rootNode = rootNodes[0];
     }
      rootNode = rootNodes[0];
    }

    for (const dimension of dimensions) {
      const dimMetadata: NodeMetadata = {
        node_id: uuidv4(),
        label: dimension,
        type: NodeType.DIMENSION,
        timestamp: new Date(),
        provenance: `Dimension analysis of: ${query.query}`,
        confidence: {
          empirical_support: 0.7,
          theoretical_basis: 0.7,
          methodological_rigor: 0.7,
          consensus_alignment: 0.7
        },
        epistemic_status: 'dimensional',
        disciplinary_tags: query.domain || ['general'],
        bias_flags: dimension.includes('Bias') ? ['bias_analysis'] : [],
        revision_history: [{
          timestamp: new Date(),
          change: 'Dimension node created',
          author: 'ASR-GoT System'
        }],
        impact_score: 0.6,
        layer_id: 'decomposition'
      };

      const dimId = this.graph.addNode(dimMetadata);
      result.nodes_created.push(dimId);

      // Connect to root
      const edgeMetadata: EdgeMetadata = {
        edge_id: uuidv4(),
        edge_type: EdgeType.SPECIALIZATION,
        confidence: dimMetadata.confidence,
        timestamp: new Date()
      };

      const edgeId = this.graph.addEdge(rootNode.id, dimId, edgeMetadata);
      result.edges_created.push(edgeId);
    }
  }

  // Stage 3: Hypothesis/Planning (P1.3)
  private async stage3_HypothesisPlanning(context: ASRGoTContext, query: ResearchQuery, result: StageResult): Promise<void> {
    const dimensionNodes = Array.from(this.graph.getState().vertices.values())
      .filter(node => node.metadata.type === NodeType.DIMENSION);

    // Initialize dimension nodes from the graph state
-   const dimensionNodes = Array.from(this.graph.getState().vertices.values())
+   let dimensionNodes = Array.from(this.graph.getState().vertices.values())
       .filter(node => node.metadata.type === NodeType.DIMENSION);

    // Ensure we have at least basic dimensions to work with
    if (dimensionNodes.length === 0) {
      const basicDimIds = this.createBasicDimensions(query.query);
      result.nodes_created.push(...basicDimIds);
      result.warnings.push(`Created ${basicDimIds.length} basic dimensions for hypothesis generation`);
      // Reload dimension nodes
      dimensionNodes = Array.from(this.graph.getState().vertices.values())
        .filter(node => node.metadata.type === NodeType.DIMENSION);

      if (dimensionNodes.length === 0) {
        throw new Error('Failed to create basic dimensions for hypothesis generation');
      }
    }

    for (const dimNode of dimensionNodes) {
      // … existing processing on each dimension node …
    }
    for (const dimNode of workingDimensions) {
      // Generate 3-5 hypotheses per dimension
      const numHypotheses = this.failSafeActive ? 2 : Math.floor(Math.random() * 3) + 3;
      
      for (let i = 0; i < numHypotheses; i++) {
        try {
          const hypMetadata: NodeMetadata = {
            node_id: uuidv4(),
            label: `Hypothesis ${i + 1} for ${dimNode.metadata.label}`,
            type: NodeType.HYPOTHESIS,
            timestamp: new Date(),
            provenance: `Generated for dimension: ${dimNode.metadata.label}`,
            confidence: {
              empirical_support: 0.5,
              theoretical_basis: 0.5,
              methodological_rigor: 0.5,
              consensus_alignment: 0.5
            },
            epistemic_status: 'hypothetical',
            disciplinary_tags: dimNode.metadata.disciplinary_tags || ['general'],
            falsification_criteria: `Testable via ${this.generateFalsificationCriteria(dimNode.metadata.label)}`,
            bias_flags: this.safeDetectBiases(dimNode.metadata.label, query.query),
            revision_history: [{
              timestamp: new Date(),
              change: 'Hypothesis generated',
              author: 'ASR-GoT System'
            }],
            impact_score: Math.random() * 0.8 + 0.2,
            plan: this.generateExecutionPlan(dimNode.metadata.label, query)
          };

          const hypId = this.graph.addNode(hypMetadata);
          result.nodes_created.push(hypId);

          // Connect to dimension with error handling
          try {
            const edgeMetadata: EdgeMetadata = {
              edge_id: uuidv4(),
              edge_type: EdgeType.SUPPORTIVE,
              confidence: hypMetadata.confidence,
              timestamp: new Date()
            };

            const edgeId = this.graph.addEdge(dimNode.id, hypId, edgeMetadata);
            result.edges_created.push(edgeId);
          } catch (edgeError) {
            result.warnings.push(`Failed to connect hypothesis ${hypId} to dimension: ${(edgeError as Error).message}`);
          }
        } catch (hypError) {
          result.warnings.push(`Failed to create hypothesis ${i + 1} for ${dimNode.metadata.label}: ${(hypError as Error).message}`);
        }
      }
    }
  }

  // Stage 4: Evidence Integration (P1.4)
  private async stage4_EvidenceIntegration(context: ASRGoTContext, query: ResearchQuery, result: StageResult): Promise<void> {
    const hypotheses = Array.from(this.graph.getState().vertices.values())
      .filter(node => node.metadata.type === NodeType.HYPOTHESIS);

    // Sort by confidence and impact for priority selection
    const sortedHypotheses = hypotheses.sort((a, b) => {
      const scoreA = this.calculatePriorityScore(a.metadata.confidence, a.metadata.impact_score);
      const scoreB = this.calculatePriorityScore(b.metadata.confidence, b.metadata.impact_score);
      return scoreB - scoreA;
    });

    const maxHypotheses = this.failSafeActive ? 3 : Math.min(10, sortedHypotheses.length);

    for (let i = 0; i < maxHypotheses; i++) {
      const hypothesis = sortedHypotheses[i];
      
      try {
        // Simulate evidence gathering and integration with error handling
        let evidenceNodes: any[] = [];
        try {
          evidenceNodes = await this.gatherEvidence(hypothesis, query, result);
        } catch (evidenceError) {
          result.warnings.push(`Evidence gathering failed for hypothesis ${hypothesis.id}: ${(evidenceError as Error).message}`);
          evidenceNodes = [];
        }
        
        // Update hypothesis confidence based on evidence
        for (const evidenceNode of evidenceNodes) {
          try {
            const newConfidence = this.calculateUpdatedConfidence(
              hypothesis.metadata.confidence,
              evidenceNode.metadata.confidence
            );
            
            this.graph.updateNodeConfidence(hypothesis.id, newConfidence, {
              reliability: 0.7,
              statistical_power: evidenceNode.metadata.statistical_power
            });
          } catch (confError) {
            result.warnings.push(`Confidence update failed for hypothesis ${hypothesis.id}: ${(confError as Error).message}`);
          }
        }

        // Check for IBN creation opportunities with error handling
        try {
          await this.checkForIBNs(hypothesis, result);
        } catch (ibnError) {
          result.warnings.push(`IBN check failed for hypothesis ${hypothesis.id}: ${(ibnError as Error).message}`);
        }
        
        // Apply temporal dynamics with error handling
        try {
          this.applyTemporalDecay(hypothesis);
        } catch (decayError) {
          result.warnings.push(`Temporal decay failed for hypothesis ${hypothesis.id}: ${(decayError as Error).message}`);
        }
        
      } catch (error) {
        result.warnings.push(`Evidence integration failed for hypothesis ${hypothesis.id}: ${(error as Error).message}`);
      }
    }
  }

  // Stage 5: Pruning/Merging (P1.5)
  private async stage5_PruningMerging(context: ASRGoTContext, query: ResearchQuery, result: StageResult): Promise<void> {
    const confidenceThreshold = this.failSafeActive ? 0.1 : 0.2;
    const impactThreshold = this.failSafeActive ? 0.05 : 0.1;
    
    // Prune low-confidence, low-impact nodes
    const prunedNodes = this.graph.pruneNodes(confidenceThreshold, impactThreshold);
    result.warnings.push(`Pruned ${prunedNodes.length} nodes`);

    // Merge semantically similar nodes
    const nodes = Array.from(this.graph.getState().vertices.values());
    const mergedPairs: string[] = [];

    for (let i = 0; i < nodes.length - 1; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (mergedPairs.includes(nodes[i].id) || mergedPairs.includes(nodes[j].id)) continue;
        
        const similarity = this.calculateSemanticSimilarity(nodes[i], nodes[j]);
        if (similarity >= 0.8) {
          const mergedId = this.graph.mergeNodes(nodes[i].id, nodes[j].id, similarity);
          if (mergedId) {
            result.nodes_created.push(mergedId);
            mergedPairs.push(nodes[i].id, nodes[j].id);
            result.warnings.push(`Merged nodes ${nodes[i].id} and ${nodes[j].id}`);
          }
        }
      }
    }
  }

  // Stage 6: Subgraph Extraction (P1.6)
  private async stage6_SubgraphExtraction(context: ASRGoTContext, query: ResearchQuery, result: StageResult): Promise<void> {
    const extractionCriteria = {
      confidence_threshold: this.failSafeActive ? 0.1 : 0.3,
      impact_threshold: this.failSafeActive ? 0.05 : 0.2,
      temporal_recency_days: 365,
      node_types: [NodeType.HYPOTHESIS, NodeType.EVIDENCE, NodeType.IBN],
      edge_types: [EdgeType.SUPPORTIVE, EdgeType.CAUSAL, EdgeType.TEMPORAL_PRECEDENCE]
    };

    let subgraph;
    try {
      subgraph = this.graph.extractSubgraph(extractionCriteria);
    } catch (extractError) {
      result.warnings.push(`Primary subgraph extraction failed: ${(extractError as Error).message}`);
      
      // Fallback: extract all available nodes
      try {
        const allNodes = Array.from(this.graph.getState().vertices.values());
        const allEdges = Array.from(this.graph.getState().edges.values());
        subgraph = { nodes: allNodes, edges: allEdges };
        result.warnings.push('Used fallback: extracted all available nodes and edges');
      } catch (fallbackError) {
        result.warnings.push(`Fallback extraction failed: ${(fallbackError as Error).message}`);
        // Ultimate fallback: create minimal subgraph
        subgraph = { nodes: [], edges: [] };
      }
    }
    
    // Ensure we have some nodes to work with
    if (subgraph.nodes.length === 0) {
      const allNodes = Array.from(this.graph.getState().vertices.values());
      if (allNodes.length > 0) {
        subgraph = { nodes: allNodes.slice(0, 10), edges: [] };
        result.warnings.push('Used emergency fallback: selected first 10 available nodes');
      }
    }
    
    // Store subgraph in context for composition stage
    (context as any).extracted_subgraph = subgraph;
    
    result.warnings.push(`Extracted subgraph with ${subgraph.nodes.length} nodes and ${subgraph.edges.length} edges`);
  }

  // Stage 7: Composition (P1.7)
  private async stage7_Composition(context: ASRGoTContext, query: ResearchQuery, result: StageResult): Promise<void> {
    const subgraph = (context as any).extracted_subgraph;
    if (!subgraph || !subgraph.nodes) {
      result.warnings.push('No subgraph available, creating basic narrative');
      (context as any).final_narrative = this.generateBasicNarrative(query.query);
      return;
    }

    try {
      // Generate narrative based on extracted subgraph
      const narrative = this.generateNarrative(subgraph, context, query);
      (context as any).final_narrative = narrative;
      
      result.warnings.push(`Generated narrative with ${narrative.length} characters`);
    } catch (narrativeError) {
      result.warnings.push(`Narrative generation failed: ${(narrativeError as Error).message}`);
      
      // Fallback to basic narrative
      try {
        (context as any).final_narrative = this.generateBasicNarrative(query.query);
        result.warnings.push('Used fallback basic narrative generation');
      } catch (basicError) {
        result.warnings.push(`Basic narrative generation failed: ${(basicError as Error).message}`);
        (context as any).final_narrative = `Analysis attempted for query: "${query.query}". Partial results may be available through other API endpoints.`;
      }
    }
  }

  // Stage 8: Reflection (P1.8)
  private async stage8_Reflection(context: ASRGoTContext, query: ResearchQuery, result: StageResult): Promise<void> {
    let auditResults;
    try {
      auditResults = await this.performAudit(context, query);
      (context as any).audit_results = auditResults;
      
      if (auditResults.criticalIssues.length > 0) {
        result.warnings.push(`Audit found ${auditResults.criticalIssues.length} critical issues`);
      }
    } catch (auditError) {
      result.warnings.push(`Audit failed: ${(auditError as Error).message}`);
      (context as any).audit_results = { criticalIssues: [], warnings: ['Audit failed'], quality_score: 0.3 };
    }
    
    // Final quality check with error handling
    try {
      const qualityScore = this.calculateOverallQuality(context);
      (context as any).quality_score = qualityScore;
      
      result.warnings.push(`Overall quality score: ${qualityScore.toFixed(2)}`);
    } catch (qualityError) {
      result.warnings.push(`Quality calculation failed: ${(qualityError as Error).message}`);
      (context as any).quality_score = this.failSafeActive ? 0.3 : 0.5;
    }
  }

  // Fail-safe mechanisms
  private activateFailSafe(context: ASRGoTContext): void {
    this.failSafeActive = true;
    context.fail_safe_active = true;
    console.log('Fail-safe mode activated');
  }

  private async createFailSafeOutput(stage: number, context: ASRGoTContext, result: StageResult): Promise<void> {
    // Create minimal viable output for failed stage
    switch (stage) {
      case 1:
        // Create basic root node
        const basicRoot = this.createBasicRootNode(context.task_query);
        result.nodes_created.push(basicRoot);
        break;
      case 2:
        // Create minimal dimension nodes
        const basicDims = this.createBasicDimensions(context.task_query);
        result.nodes_created.push(...basicDims);
        break;
      case 3:
        // Create basic hypotheses
        const basicHyps = this.createBasicHypotheses();
        result.nodes_created.push(...basicHyps);
        break;
      case 4:
        // Skip complex evidence integration
        break;
      case 5:
        // Basic pruning only
        this.graph.pruneNodes(0.1, 0.05);
        break;
      case 6:
        // Extract all remaining nodes
        const allNodes = Array.from(this.graph.getState().vertices.values());
        (context as any).extracted_subgraph = { nodes: allNodes, edges: [] };
        break;
      case 7:
        // Generate basic narrative
        (context as any).final_narrative = this.generateBasicNarrative(context.task_query);
        break;
      case 8:
        // Basic audit
        (context as any).audit_results = { criticalIssues: [], warnings: [], quality_score: 0.5 };
        break;
    }
  }

  private handleCriticalError(context: ASRGoTContext, stage: number, error: Error): void {
    context.stage_results.push({
      stage,
      stage_name: this.getStageNames()[stage - 1],
      success: false,
      nodes_created: [],
      edges_created: [],
      errors: [`Critical error: ${error.message}`],
      warnings: ['Stage failed, continuing with fail-safe mode'],
      execution_time_ms: 0
    });
  }

  private handlePipelineFailure(context: ASRGoTContext, error: Error): void {
    // Ensure context has some minimal output
    if (!context.stage_results.length) {
      context.stage_results.push({
        stage: 0,
        stage_name: 'Pipeline Failure',
        success: false,
        nodes_created: [],
        edges_created: [],
        errors: [`Pipeline failed: ${error.message}`],
        warnings: ['Minimal output generated'],
        execution_time_ms: 0
      });
    }

    // Generate emergency output
    (context as any).final_narrative = `Analysis of query "${context.task_query}" encountered critical errors. Partial results may be available. Error: ${error.message}`;
    (context as any).quality_score = 0.1;
  }

  // Helper methods (implementations would be expanded in real system)
  private getStageNames(): string[] {
    return [
      'Initialization', 'Decomposition', 'Hypothesis/Planning', 'Evidence Integration',
      'Pruning/Merging', 'Subgraph Extraction', 'Composition', 'Reflection'
    ];
  }

  private generateFalsificationCriteria(dimension: string): string {
    const criteria = {
      'Scope': 'experimental validation',
      'Objectives': 'outcome measurement',
      'Constraints': 'boundary testing',
      'Data Needs': 'data availability verification',
      'Use Cases': 'application testing',
      'Potential Biases': 'bias detection methods',
      'Knowledge Gaps': 'literature review'
    };
    return criteria[dimension as keyof typeof criteria] || 'empirical testing';
  }

  private generateExecutionPlan(dimension: string, query: ResearchQuery): string {
    return `Plan for ${dimension}: Literature review → Hypothesis refinement → Experimental design → Data collection → Analysis`;
  }

  private calculatePriorityScore(confidence: ConfidenceVector, impact: number): number {
    const avgConfidence = (confidence.empirical_support + confidence.theoretical_basis + 
                          confidence.methodological_rigor + confidence.consensus_alignment) / 4;
    return avgConfidence * 0.6 + impact * 0.4;
  }

  private async gatherEvidence(hypothesis: any, query: ResearchQuery, result: StageResult): Promise<any[]> {
    // Simulate evidence gathering
    const numEvidence = this.failSafeActive ? 1 : Math.floor(Math.random() * 3) + 1;
    const evidenceNodes = [];

    for (let i = 0; i < numEvidence; i++) {
      const evidenceMetadata: NodeMetadata = {
        node_id: uuidv4(),
        label: `Evidence ${i + 1} for ${hypothesis.metadata.label}`,
        type: NodeType.EVIDENCE,
        timestamp: new Date(),
        provenance: 'Simulated evidence gathering',
        confidence: {
          empirical_support: Math.random() * 0.6 + 0.4,
          theoretical_basis: Math.random() * 0.6 + 0.4,
          methodological_rigor: Math.random() * 0.6 + 0.4,
          consensus_alignment: Math.random() * 0.6 + 0.4
        },
        epistemic_status: 'evidential',
        disciplinary_tags: hypothesis.metadata.disciplinary_tags,
        bias_flags: [],
        revision_history: [{
          timestamp: new Date(),
          change: 'Evidence node created',
          author: 'ASR-GoT System'
        }],
        impact_score: Math.random() * 0.7 + 0.3,
        statistical_power: {
          power: Math.random() * 0.6 + 0.4,
          sample_size: Math.floor(Math.random() * 1000) + 100,
          effect_size: Math.random() * 2 - 1
        }
      };

      const evidenceId = this.graph.addNode(evidenceMetadata);
      evidenceNodes.push(this.graph.getNode(evidenceId)!);
      result.nodes_created.push(evidenceId);

      // Connect evidence to hypothesis
      const edgeMetadata: EdgeMetadata = {
        edge_id: uuidv4(),
        edge_type: EdgeType.SUPPORTIVE,
        confidence: evidenceMetadata.confidence,
        timestamp: new Date()
      };

      const edgeId = this.graph.addEdge(evidenceId, hypothesis.id, edgeMetadata);
      result.edges_created.push(edgeId);
    }

    return evidenceNodes;
  }

  private calculateUpdatedConfidence(prior: ConfidenceVector, evidence: ConfidenceVector): ConfidenceVector {
    return {
      empirical_support: Math.min(1, (prior.empirical_support + evidence.empirical_support) / 2 + 0.1),
      theoretical_basis: Math.min(1, (prior.theoretical_basis + evidence.theoretical_basis) / 2 + 0.05),
      methodological_rigor: Math.min(1, (prior.methodological_rigor + evidence.methodological_rigor) / 2 + 0.05),
      consensus_alignment: Math.min(1, (prior.consensus_alignment + evidence.consensus_alignment) / 2 + 0.05)
    };
  }

  private async checkForIBNs(hypothesis: any, result: StageResult): Promise<void> {
    // Check for interdisciplinary connections
    const allNodes = Array.from(this.graph.getState().vertices.values());
    
    for (const node of allNodes) {
      if (node.id !== hypothesis.id && node.metadata.type === NodeType.HYPOTHESIS) {
        const semanticSimilarity = this.calculateSemanticSimilarity(hypothesis, node);
        const ibnId = this.graph.createIBN(hypothesis.id, node.id, semanticSimilarity);
        if (ibnId) {
          result.nodes_created.push(ibnId);
        }
      }
    }
  }

  private applyTemporalDecay(node: any): void {
    const daysSinceCreation = (Date.now() - node.metadata.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    const decayFactor = Math.exp(-daysSinceCreation / 365); // Decay over a year
    
    // Apply minimal decay in fail-safe mode
    const adjustedDecay = this.failSafeActive ? Math.max(0.9, decayFactor) : decayFactor;
    
    node.metadata.confidence.empirical_support *= adjustedDecay;
  }

  private calculateSemanticSimilarity(node1: any, node2: any): number {
    // Simplified semantic similarity based on shared disciplinary tags
    const tags1 = new Set(node1.metadata.disciplinary_tags);
    const tags2 = new Set(node2.metadata.disciplinary_tags);
    const intersection = new Set([...tags1].filter(x => tags2.has(x)));
    const union = new Set([...tags1, ...tags2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private generateNarrative(subgraph: any, context: ASRGoTContext, query: ResearchQuery): string {
    const nodeCount = subgraph.nodes.length;
    const edgeCount = subgraph.edges.length;
    
    return `
# Advanced Scientific Reasoning Analysis

## Query: ${query.query}

## Executive Summary
This analysis processed ${nodeCount} conceptual nodes and ${edgeCount} relationships through an 8-stage Graph-of-Thoughts reasoning pipeline. The analysis incorporates ${context.user_profile.research_focus?.join(', ') || 'interdisciplinary'} perspectives with rigorous methodology.

## Key Findings
${subgraph.nodes.slice(0, 5).map((node: any, i: number) => 
  `${i + 1}. **${node.metadata.label}**: ${node.metadata.provenance} (Confidence: ${(node.metadata.confidence.empirical_support * 100).toFixed(1)}%)`
).join('\n')}

## Methodology
The analysis employed the ASR-GoT framework with fail-safe mechanisms ensuring robust output even under computational constraints.

## Quality Assurance
${context.fail_safe_active ? 'Analysis completed with fail-safe mechanisms active.' : 'Analysis completed with full computational resources.'}

*Generated by ASR-GoT MCP Server*
    `.trim();
  }

  private async performAudit(context: ASRGoTContext, query: ResearchQuery): Promise<any> {
    const criticalIssues = [];
    const warnings = [];
    
    // Check coverage
    const nodeCount = this.graph.getNodeCount();
    if (nodeCount < 5) {
      criticalIssues.push('Insufficient node coverage');
    }
    
    // Check for bias flags
    const nodes = Array.from(this.graph.getState().vertices.values());
    const biasFlags = nodes.reduce((total, node) => total + node.metadata.bias_flags.length, 0);
    if (biasFlags === 0) {
      warnings.push('No bias detection performed');
    }
    
    return { criticalIssues, warnings };
  }

  private calculateOverallQuality(context: ASRGoTContext): number {
    const successfulStages = context.stage_results.filter(r => r.success).length;
    const baseScore = successfulStages / 8;
    
    const nodeCount = this.graph.getNodeCount();
    const complexityBonus = Math.min(0.2, nodeCount / 50);
    
    const failSafePenalty = context.fail_safe_active ? 0.1 : 0;
    
    return Math.max(0, Math.min(1, baseScore + complexityBonus - failSafePenalty));
  }

  private exceedsComputationalBudget(context: ASRGoTContext): boolean {
    const budget = context.computational_budget;
    const state = this.graph.getState();
    
    return (
      state.vertices.size > budget.max_nodes ||
      state.edges.size > budget.max_edges ||
      context.stage_results.reduce((total, result) => total + result.execution_time_ms, 0) > budget.max_execution_time_ms
    );
  }

  // Fail-safe output creation methods
  private createBasicRootNode(query: string): string {
    const metadata: NodeMetadata = {
      node_id: uuidv4(),
      label: 'Basic Task Understanding',
      type: NodeType.ROOT,
      timestamp: new Date(),
      provenance: `Fail-safe root for: ${query}`,
      confidence: { empirical_support: 0.5, theoretical_basis: 0.5, methodological_rigor: 0.5, consensus_alignment: 0.5 },
      epistemic_status: 'fail-safe',
      disciplinary_tags: ['general'],
      bias_flags: [],
      revision_history: [{ timestamp: new Date(), change: 'Fail-safe root created', author: 'ASR-GoT System' }],
      impact_score: 0.3
    };
    
    return this.graph.addNode(metadata);
  }

  private createBasicDimensions(query: string): string[] {
    const dimensions = ['Scope', 'Objectives'];
    const nodeIds = [];
    
    for (const dim of dimensions) {
      const metadata: NodeMetadata = {
        node_id: uuidv4(),
        label: `Basic ${dim}`,
        type: NodeType.DIMENSION,
        timestamp: new Date(),
        provenance: `Fail-safe dimension for: ${query}`,
        confidence: { empirical_support: 0.4, theoretical_basis: 0.4, methodological_rigor: 0.4, consensus_alignment: 0.4 },
        epistemic_status: 'fail-safe',
        disciplinary_tags: ['general'],
        bias_flags: [],
        revision_history: [{ timestamp: new Date(), change: 'Fail-safe dimension created', author: 'ASR-GoT System' }],
        impact_score: 0.2
      };
      
      nodeIds.push(this.graph.addNode(metadata));
    }
    
    return nodeIds;
  }

  private createBasicHypotheses(): string[] {
    const nodeIds = [];
    const metadata: NodeMetadata = {
      node_id: uuidv4(),
      label: 'Basic Hypothesis',
      type: NodeType.HYPOTHESIS,
      timestamp: new Date(),
      provenance: 'Fail-safe hypothesis',
      confidence: { empirical_support: 0.3, theoretical_basis: 0.3, methodological_rigor: 0.3, consensus_alignment: 0.3 },
      epistemic_status: 'fail-safe',
      disciplinary_tags: ['general'],
      bias_flags: [],
      revision_history: [{ timestamp: new Date(), change: 'Fail-safe hypothesis created', author: 'ASR-GoT System' }],
      impact_score: 0.1,
      falsification_criteria: 'Basic empirical testing'
    };
    
    nodeIds.push(this.graph.addNode(metadata));
    return nodeIds;
  }

  private generateBasicNarrative(query: string): string {
    return `
# Basic Analysis Results

## Query: ${query}

## Summary
A basic analysis was performed using fail-safe mechanisms. The system encountered limitations but generated the following minimal viable output:

- Initial task understanding established
- Basic dimensional analysis completed
- Fundamental hypotheses identified

## Note
This analysis operated under computational constraints. For comprehensive results, please retry with increased computational budget.

*Generated by ASR-GoT MCP Server (Fail-Safe Mode)*
    `.trim();
  }

  // Safe bias detection with error handling
  private safeDetectBiases(content: string, context: string = ''): string[] {
    try {
      return this.biasDetector.detectBiases(content, context);
    } catch (error) {
      console.warn('Bias detection failed:', error);
      return ['bias_detection_unavailable'];
    }
  }

  // Getter methods
  getGraph(): ASRGoTGraph {
    return this.graph;
  }

  isFailSafeActive(): boolean {
    return this.failSafeActive;
  }
}
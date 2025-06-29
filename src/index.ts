#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { ASRGoTPipeline } from './stages/pipeline.js';
import { ASRGoTValidator } from './validation/schema-validator.js';
import { 
  ResearchQuery, 
  ASRGoTResponse, 
  ASRGoTContext,
  NodeType,
  EdgeType 
} from './types/index.js';

/**
 * Advanced Scientific Reasoning Graph-of-Thoughts MCP Server
 * Implements the complete ASR-GoT framework with 8-stage pipeline and fail-safe mechanisms
 */
class ASRGoTMCPServer {
  private server: Server;
  private pipeline: ASRGoTPipeline;
  private validator: ASRGoTValidator;
  private activeContexts: Map<string, ASRGoTContext>;

  constructor() {
    this.server = new Server(
      {
        name: 'asr-got-server',
        version: '1.0.0',
      }
    );

    this.pipeline = new ASRGoTPipeline();
    this.validator = new ASRGoTValidator();
    this.activeContexts = new Map();

    this.setupTools();
    this.setupErrorHandling();
  }

  private setupTools(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'execute_asr_got_analysis',
            description: 'Execute complete ASR-GoT analysis pipeline on a research query',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'The research question or topic to analyze',
                },
                domain: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Disciplinary domains for the analysis',
                  default: ['general'],
                },
                complexity_level: {
                  type: 'string',
                  enum: ['basic', 'intermediate', 'advanced'],
                  description: 'Complexity level of the analysis',
                  default: 'intermediate',
                },
                expected_depth: {
                  type: 'string',
                  enum: ['overview', 'detailed', 'comprehensive'],
                  description: 'Expected depth of analysis',
                  default: 'detailed',
                },
                interdisciplinary: {
                  type: 'boolean',
                  description: 'Whether to focus on interdisciplinary connections',
                  default: true,
                },
                user_profile: {
                  type: 'object',
                  properties: {
                    identity: { type: 'string', default: 'Researcher' },
                    experience: { type: 'string', default: 'Experienced researcher' },
                    research_focus: { 
                      type: 'array', 
                      items: { type: 'string' },
                      default: ['general_research']
                    },
                    methodologies: { 
                      type: 'array', 
                      items: { type: 'string' },
                      default: ['systematic_analysis']
                    },
                    philosophy: { type: 'string', default: 'Evidence-based research' }
                  },
                  default: {
                    identity: 'Dr. Saptaswa Dey',
                    experience: '>10 years in immunology, molecular biology, inflammatory diseases',
                    research_focus: ['skin_immunology', 'cutaneous_malignancies', 'CTCL', 'skin_microbiome'],
                    methodologies: ['genomic_analysis', 'microbiome_analysis', 'molecular_biology', 'machine_learning'],
                    philosophy: 'Holistic, interdisciplinary, curiosity-driven research'
                  }
                }
              },
              required: ['query'],
            },
          },
          {
            name: 'get_analysis_status',
            description: 'Get the status of an ongoing or completed analysis',
            inputSchema: {
              type: 'object',
              properties: {
                context_id: {
                  type: 'string',
                  description: 'ID of the analysis context',
                },
              },
              required: ['context_id'],
            },
          },
          {
            name: 'extract_subgraph',
            description: 'Extract specific subgraph from completed analysis',
            inputSchema: {
              type: 'object',
              properties: {
                context_id: {
                  type: 'string',
                  description: 'ID of the analysis context',
                },
                criteria: {
                  type: 'object',
                  properties: {
                    confidence_threshold: { type: 'number', minimum: 0, maximum: 1 },
                    impact_threshold: { type: 'number', minimum: 0, maximum: 1 },
                    node_types: { 
                      type: 'array', 
                      items: { 
                        type: 'string',
                        enum: ['root', 'dimension', 'hypothesis', 'evidence', 'placeholder_gap', 'interdisciplinary_bridge_node']
                      }
                    },
                    edge_types: { 
                      type: 'array', 
                      items: { 
                        type: 'string',
                        enum: ['correlative', 'supportive', 'contradictory', 'prerequisite', 'causal', 'temporal_precedence']
                      }
                    },
                    temporal_recency_days: { type: 'number', minimum: 0 }
                  }
                }
              },
              required: ['context_id'],
            },
          },
          {
            name: 'validate_graph_structure',
            description: 'Validate the integrity and consistency of graph structures',
            inputSchema: {
              type: 'object',
              properties: {
                context_id: {
                  type: 'string',
                  description: 'ID of the analysis context',
                },
                validation_level: {
                  type: 'string',
                  enum: ['basic', 'comprehensive'],
                  description: 'Level of validation to perform',
                  default: 'basic'
                }
              },
              required: ['context_id'],
            },
          },
          {
            name: 'get_research_insights',
            description: 'Generate specific research insights and recommendations',
            inputSchema: {
              type: 'object',
              properties: {
                context_id: {
                  type: 'string',
                  description: 'ID of the analysis context',
                },
                focus_area: {
                  type: 'string',
                  enum: ['gaps', 'interventions', 'causality', 'temporal_patterns', 'interdisciplinary'],
                  description: 'Specific area of insight generation',
                  default: 'gaps'
                }
              },
              required: ['context_id'],
            },
          }
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'execute_asr_got_analysis':
            return await this.executeAnalysis(args);
          case 'get_analysis_status':
            return await this.getAnalysisStatus(args);
          case 'extract_subgraph':
            return await this.extractSubgraph(args);
          case 'validate_graph_structure':
            return await this.validateGraphStructure(args);
          case 'get_research_insights':
            return await this.getResearchInsights(args);
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${errorMessage}`);
      }
    });
  }

  private async executeAnalysis(args: any): Promise<{ content: ASRGoTResponse[] }> {
    try {
      // Validate input
      const query: ResearchQuery = {
        query: args.query,
        domain: args.domain || ['general'],
        complexity_level: args.complexity_level || 'intermediate',
        expected_depth: args.expected_depth || 'detailed',
        interdisciplinary: args.interdisciplinary !== false
      };

      const userProfile = args.user_profile || {
        identity: 'Dr. Saptaswa Dey',
        experience: '>10 years in immunology, molecular biology, inflammatory diseases',
        research_focus: ['skin_immunology', 'cutaneous_malignancies', 'CTCL', 'skin_microbiome'],
        methodologies: ['genomic_analysis', 'microbiome_analysis', 'molecular_biology', 'machine_learning'],
        philosophy: 'Holistic, interdisciplinary, curiosity-driven research'
      };

      // Execute ASR-GoT pipeline
      const context = await this.pipeline.executeComplete(query, userProfile);
      
      // Store context for future reference
      const contextId = `context_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.activeContexts.set(contextId, context);

      // Create response
      const response: ASRGoTResponse = {
        success: true,
        stage: context.current_stage,
        result: {
          context_id: contextId,
          analysis_summary: this.generateAnalysisSummary(context),
          final_narrative: (context as any).final_narrative || 'Analysis completed',
          quality_score: (context as any).quality_score || 0.7,
          fail_safe_mode: context.fail_safe_active,
          execution_time_ms: context.stage_results.reduce((total, result) => total + result.execution_time_ms, 0)
        },
        graph_summary: {
          total_nodes: context.graph_state.vertices.size,
          total_edges: context.graph_state.edges.size,
          total_hyperedges: context.graph_state.hyperedges.size,
          current_stage: context.current_stage
        },
        errors: context.stage_results.flatMap(r => r.errors),
        warnings: context.stage_results.flatMap(r => r.warnings)
      };

      return { content: [response] };

    } catch (error) {
      const failSafeResponse: ASRGoTResponse = {
        success: false,
        stage: 0,
        result: {
          error: `Analysis failed: ${(error as Error).message}`,
          fail_safe_activated: true
        },
        graph_summary: {
          total_nodes: 0,
          total_edges: 0,
          total_hyperedges: 0,
          current_stage: 0
        },
        errors: [(error as Error).message],
        warnings: ['Analysis failed, minimal output generated']
      };

      return { content: [failSafeResponse] };
    }
  }

  private async getAnalysisStatus(args: any): Promise<{ content: any[] }> {
    const contextId = args.context_id;
    const context = this.activeContexts.get(contextId);

    if (!context) {
      throw new McpError(ErrorCode.InvalidRequest, `Context ${contextId} not found`);
    }

    const status = {
      context_id: contextId,
      current_stage: context.current_stage,
      stages_completed: context.stage_results.filter(r => r.success).length,
      total_stages: 8,
      fail_safe_active: context.fail_safe_active,
      graph_statistics: {
        nodes: context.graph_state.vertices.size,
        edges: context.graph_state.edges.size,
        hyperedges: context.graph_state.hyperedges.size,
        layers: context.graph_state.layers.size
      },
      stage_details: context.stage_results.map(result => ({
        stage: result.stage,
        name: result.stage_name,
        success: result.success,
        execution_time_ms: result.execution_time_ms,
        nodes_created: result.nodes_created.length,
        edges_created: result.edges_created.length,
        errors: result.errors.length,
        warnings: result.warnings.length
      }))
    };

    return { content: [status] };
  }

  private async extractSubgraph(args: any): Promise<{ content: any[] }> {
    const contextId = args.context_id;
    const context = this.activeContexts.get(contextId);

    if (!context) {
      throw new McpError(ErrorCode.InvalidRequest, `Context ${contextId} not found`);
    }

    const criteria = args.criteria || {};
    const graph = this.pipeline.getGraph();
    
    // Convert string node types to enum values
    if (criteria.node_types) {
      criteria.node_types = (criteria.node_types as string[]).map((type: string) => {
        switch (type) {
          case 'root': return NodeType.ROOT;
          case 'dimension': return NodeType.DIMENSION;
          case 'hypothesis': return NodeType.HYPOTHESIS;
          case 'evidence': return NodeType.EVIDENCE;
          case 'placeholder_gap': return NodeType.PLACEHOLDER_GAP;
          case 'interdisciplinary_bridge_node': return NodeType.IBN;
          default: return NodeType.ROOT;
        }
      });
    }

    // Convert string edge types to enum values  
    if (criteria.edge_types) {
      criteria.edge_types = (criteria.edge_types as string[]).map((type: string) => {
        switch (type) {
          case 'correlative': return EdgeType.CORRELATIVE;
          case 'supportive': return EdgeType.SUPPORTIVE;
          case 'contradictory': return EdgeType.CONTRADICTORY;
          case 'prerequisite': return EdgeType.PREREQUISITE;
          case 'causal': return EdgeType.CAUSAL;
          case 'temporal_precedence': return EdgeType.TEMPORAL_PRECEDENCE;
          default: return EdgeType.OTHER;
        }
      });
    }

    const subgraph = graph.extractSubgraph(criteria);

    const result = {
      context_id: contextId,
      subgraph_summary: {
        nodes_count: subgraph.nodes.length,
        edges_count: subgraph.edges.length,
        extraction_criteria: criteria
      },
      nodes: subgraph.nodes.map(node => ({
        id: node.id,
        label: node.metadata.label,
        type: node.metadata.type,
        confidence: node.metadata.confidence,
        impact_score: node.metadata.impact_score,
        disciplinary_tags: node.metadata.disciplinary_tags,
        created: node.metadata.timestamp
      })),
      edges: subgraph.edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.metadata.edge_type,
        confidence: edge.metadata.confidence,
        created: edge.metadata.timestamp
      })),
      insights: this.generateSubgraphInsights(subgraph)
    };

    return { content: [result] };
  }

  private async validateGraphStructure(args: any): Promise<{ content: any[] }> {
    const contextId = args.context_id;
    const context = this.activeContexts.get(contextId);

    if (!context) {
      throw new McpError(ErrorCode.InvalidRequest, `Context ${contextId} not found`);
    }

    const validationLevel = args.validation_level || 'basic';
    const graphState = context.graph_state;

    const validationResult = this.validator.validateGraphState(graphState);

    const result = {
      context_id: contextId,
      validation_level: validationLevel,
      is_valid: validationResult.isValid,
      statistics: validationResult.statistics,
      errors: validationResult.errors,
      warnings: validationResult.warnings,
      recommendations: this.generateValidationRecommendations(validationResult),
      quality_metrics: {
        structural_integrity: validationResult.isValid ? 1.0 : 0.5,
        error_rate: validationResult.errors.length / Math.max(1, validationResult.statistics.total_nodes),
        warning_rate: validationResult.warnings.length / Math.max(1, validationResult.statistics.total_nodes),
        connectivity: 1 - (validationResult.statistics.orphaned_nodes / Math.max(1, validationResult.statistics.total_nodes))
      }
    };

    return { content: [result] };
  }

  private async getResearchInsights(args: any): Promise<{ content: any[] }> {
    const contextId = args.context_id;
    const context = this.activeContexts.get(contextId);

    if (!context) {
      throw new McpError(ErrorCode.InvalidRequest, `Context ${contextId} not found`);
    }

    const focusArea = args.focus_area || 'gaps';
    const graph = this.pipeline.getGraph();
    const graphState = graph.getState();

    let insights: any = {};

    switch (focusArea) {
      case 'gaps':
        insights = this.generateGapInsights(graphState);
        break;
      case 'interventions':
        insights = this.generateInterventionInsights(graphState);
        break;
      case 'causality':
        insights = this.generateCausalityInsights(graphState);
        break;
      case 'temporal_patterns':
        insights = this.generateTemporalInsights(graphState);
        break;
      case 'interdisciplinary':
        insights = this.generateInterdisciplinaryInsights(graphState);
        break;
      default:
        insights = { error: `Unknown focus area: ${focusArea}` };
    }

    const result = {
      context_id: contextId,
      focus_area: focusArea,
      insights: insights,
      generated_at: new Date().toISOString(),
      quality_score: (context as any).quality_score || 0.7
    };

    return { content: [result] };
  }

  // Helper methods for generating insights and summaries
  private generateAnalysisSummary(context: ASRGoTContext): any {
    const successfulStages = context.stage_results.filter(r => r.success).length;
    const totalNodes = context.graph_state.vertices.size;
    const totalEdges = context.graph_state.edges.size;

    return {
      query: context.task_query,
      stages_completed: `${successfulStages}/8`,
      graph_complexity: {
        nodes: totalNodes,
        edges: totalEdges,
        density: totalNodes > 0 ? totalEdges / (totalNodes * (totalNodes - 1)) : 0
      },
      fail_safe_activated: context.fail_safe_active,
      total_execution_time_ms: context.stage_results.reduce((total, result) => total + result.execution_time_ms, 0),
      key_findings: this.extractKeyFindings(context)
    };
  }

  private extractKeyFindings(context: ASRGoTContext): string[] {
    const findings = [];
    
    // Count different node types
    const nodeTypes = new Map();
    for (const node of context.graph_state.vertices.values()) {
      const type = node.metadata.type;
      nodeTypes.set(type, (nodeTypes.get(type) || 0) + 1);
    }

    if (nodeTypes.get('hypothesis') > 0) {
      findings.push(`Generated ${nodeTypes.get('hypothesis')} hypotheses for investigation`);
    }

    if (nodeTypes.get('evidence') > 0) {
      findings.push(`Integrated ${nodeTypes.get('evidence')} pieces of evidence`);
    }

    if (nodeTypes.get('interdisciplinary_bridge_node') > 0) {
      findings.push(`Identified ${nodeTypes.get('interdisciplinary_bridge_node')} interdisciplinary connections`);
    }

    if (context.stage_results.some(r => r.warnings.length > 0)) {
      findings.push('Analysis identified potential biases and limitations');
    }

    return findings;
  }

  private generateSubgraphInsights(subgraph: any): any {
    return {
      most_confident_nodes: subgraph.nodes
        .sort((a: any, b: any) => this.getAverageConfidence(b.metadata.confidence) - this.getAverageConfidence(a.metadata.confidence))
        .slice(0, 3)
        .map((node: any) => ({ id: node.id, label: node.metadata.label, confidence: this.getAverageConfidence(node.metadata.confidence) })),
      
      highest_impact_nodes: subgraph.nodes
        .sort((a: any, b: any) => b.metadata.impact_score - a.metadata.impact_score)
        .slice(0, 3)
        .map((node: any) => ({ id: node.id, label: node.metadata.label, impact: node.metadata.impact_score })),
      
      edge_type_distribution: this.getEdgeTypeDistribution(subgraph.edges),
      
      disciplinary_coverage: this.getDisciplinaryCoverage(subgraph.nodes)
    };
  }

  private generateGapInsights(graphState: any): any {
    const gapNodes = Array.from(graphState.vertices.values())
      .filter((node: any) => node.metadata.type === 'placeholder_gap');

    return {
      total_gaps_identified: gapNodes.length,
      high_priority_gaps: gapNodes
        .filter((node: any) => node.metadata.impact_score > 0.7)
        .map((node: any) => ({ id: node.id, label: node.metadata.label, impact: node.metadata.impact_score })),
      research_recommendations: gapNodes.slice(0, 5).map((node: any) => 
        `Investigate ${node.metadata.label} (Impact: ${node.metadata.impact_score.toFixed(2)})`
      )
    };
  }

  private generateInterventionInsights(graphState: any): any {
    const interventionableNodes = Array.from(graphState.vertices.values())
      .filter((node: any) => node.metadata.type === 'hypothesis' && node.metadata.plan);

    return {
      potential_interventions: interventionableNodes.length,
      recommended_actions: interventionableNodes
        .sort((a: any, b: any) => b.metadata.impact_score - a.metadata.impact_score)
        .slice(0, 5)
        .map((node: any) => ({
          hypothesis: node.metadata.label,
          plan: node.metadata.plan,
          impact: node.metadata.impact_score,
          confidence: this.getAverageConfidence(node.metadata.confidence)
        }))
    };
  }

  private generateCausalityInsights(graphState: any): any {
    const causalEdges = Array.from(graphState.edges.values())
      .filter((edge: any) => edge.metadata.edge_type === 'causal');

    return {
      causal_relationships_identified: causalEdges.length,
      strongest_causal_links: causalEdges
        .sort((a: any, b: any) => this.getAverageConfidence(b.metadata.confidence) - this.getAverageConfidence(a.metadata.confidence))
        .slice(0, 5)
        .map((edge: any) => ({
          source: edge.source,
          target: edge.target,
          confidence: this.getAverageConfidence(edge.metadata.confidence)
        })),
      causal_strength_distribution: this.getCausalStrengthDistribution(causalEdges)
    };
  }

  private generateTemporalInsights(graphState: any): any {
    const temporalEdges = Array.from(graphState.edges.values())
      .filter((edge: any) => ['temporal_precedence', 'sequential', 'delayed', 'cyclic'].includes(edge.metadata.edge_type));

    return {
      temporal_relationships_found: temporalEdges.length,
      temporal_patterns: this.getTemporalPatterns(temporalEdges),
      timeline_insights: 'Temporal analysis reveals sequential dependencies in the research domain'
    };
  }

  private generateInterdisciplinaryInsights(graphState: any): any {
    const ibnNodes = Array.from(graphState.vertices.values())
      .filter((node: any) => node.metadata.type === 'interdisciplinary_bridge_node');

    const allDisciplines = new Set();
    for (const node of graphState.vertices.values()) {
      for (const tag of (node as any).metadata.disciplinary_tags) {
        allDisciplines.add(tag);
      }
    }

    return {
      interdisciplinary_bridges: ibnNodes.length,
      disciplines_connected: allDisciplines.size,
      cross_disciplinary_opportunities: ibnNodes.map((node: any) => ({
        id: node.id,
        label: node.metadata.label,
        disciplines: node.metadata.disciplinary_tags,
        potential_impact: node.metadata.impact_score
      }))
    };
  }

  private generateValidationRecommendations(validationResult: any): string[] {
    const recommendations = [];
    
    if (validationResult.statistics.orphaned_nodes > 0) {
      recommendations.push('Consider connecting or removing orphaned nodes');
    }
    
    if (validationResult.statistics.invalid_references > 0) {
      recommendations.push('Fix invalid edge references');
    }
    
    if (!validationResult.isValid) {
      recommendations.push('Address validation errors before proceeding');
    }
    
    if (validationResult.warnings.length > validationResult.statistics.total_nodes * 0.1) {
      recommendations.push('Review and address validation warnings');
    }

    return recommendations;
  }

  // Utility methods
  private getAverageConfidence(confidence: any): number {
    if (!confidence) return 0;
    return (confidence.empirical_support + confidence.theoretical_basis + 
            confidence.methodological_rigor + confidence.consensus_alignment) / 4;
  }

  private getEdgeTypeDistribution(edges: any[]): any {
    const distribution: any = {};
    for (const edge of edges) {
      const type = edge.metadata.edge_type;
      distribution[type] = (distribution[type] || 0) + 1;
    }
    return distribution;
  }

  private getDisciplinaryCoverage(nodes: any[]): string[] {
    const disciplines = new Set<string>();
    for (const node of nodes) {
      for (const tag of node.metadata.disciplinary_tags) {
        disciplines.add(tag);
      }
    }
    return Array.from(disciplines);
  }

  private getCausalStrengthDistribution(causalEdges: any[]): any {
    const distribution = { weak: 0, moderate: 0, strong: 0 };
    
    for (const edge of causalEdges) {
      const confidence = this.getAverageConfidence(edge.metadata.confidence);
      if (confidence < 0.4) {
        distribution.weak++;
      } else if (confidence < 0.7) {
        distribution.moderate++;
      } else {
        distribution.strong++;
      }
    }
    
    return distribution;
  }

  private getTemporalPatterns(temporalEdges: any[]): any {
    const patterns: any = {};
    for (const edge of temporalEdges) {
      const type = edge.metadata.edge_type;
      patterns[type] = (patterns[type] || 0) + 1;
    }
    return patterns;
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('ASR-GoT MCP Server running on stdio');
  }
}

// Start the server
const server = new ASRGoTMCPServer();
server.run().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
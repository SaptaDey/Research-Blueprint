import { z } from 'zod';

// Core ASR-GoT Types Based on P1.11 Mathematical Formalism

// Confidence Vector (P1.5) - Multi-dimensional confidence representation
export const ConfidenceVectorSchema = z.object({
  empirical_support: z.number().min(0).max(1),
  theoretical_basis: z.number().min(0).max(1),
  methodological_rigor: z.number().min(0).max(1),
  consensus_alignment: z.number().min(0).max(1)
});

export type ConfidenceVector = z.infer<typeof ConfidenceVectorSchema>;

// Statistical Power Metrics (P1.26)
export const StatisticalPowerSchema = z.object({
  power: z.number().min(0).max(1).optional(),
  sample_size: z.number().int().positive().optional(),
  effect_size: z.number().optional(),
  confidence_interval: z.tuple([z.number(), z.number()]).optional(),
  p_value: z.number().min(0).max(1).optional()
});

export type StatisticalPower = z.infer<typeof StatisticalPowerSchema>;

// Information Theory Metrics (P1.27)
export const InfoMetricsSchema = z.object({
  entropy: z.number().optional(),
  kl_divergence: z.number().optional(),
  mutual_information: z.number().optional(),
  mdl_score: z.number().optional()
});

export type InfoMetrics = z.infer<typeof InfoMetricsSchema>;

// Topology Metrics (P1.22)
export const TopologyMetricsSchema = z.object({
  centrality: z.number().optional(),
  clustering_coefficient: z.number().optional(),
  betweenness: z.number().optional(),
  degree: z.number().int().min(0).optional()
});

export type TopologyMetrics = z.infer<typeof TopologyMetricsSchema>;

// Edge Types (P1.10, P1.24, P1.25)
export enum EdgeType {
  // Basic Types
  CORRELATIVE = 'correlative',
  SUPPORTIVE = 'supportive', 
  CONTRADICTORY = 'contradictory',
  PREREQUISITE = 'prerequisite',
  GENERALIZATION = 'generalization',
  SPECIALIZATION = 'specialization',
  OTHER = 'other',
  
  // Causal Types (P1.24)
  CAUSAL = 'causal',
  COUNTERFACTUAL = 'counterfactual',
  CONFOUNDED = 'confounded',
  
  // Temporal Types (P1.25)
  TEMPORAL_PRECEDENCE = 'temporal_precedence',
  CYCLIC = 'cyclic',
  DELAYED = 'delayed',
  SEQUENTIAL = 'sequential'
}

// Node Types
export enum NodeType {
  ROOT = 'root',
  DIMENSION = 'dimension',
  HYPOTHESIS = 'hypothesis',
  EVIDENCE = 'evidence',
  PLACEHOLDER_GAP = 'placeholder_gap',
  IBN = 'interdisciplinary_bridge_node'
}

// Extended Metadata Schema (P1.12)
export const NodeMetadataSchema = z.object({
  node_id: z.string(),
  label: z.string(),
  type: z.nativeEnum(NodeType),
  timestamp: z.date(),
  provenance: z.string(),
  confidence: ConfidenceVectorSchema,
  epistemic_status: z.string(),
  disciplinary_tags: z.array(z.string()),
  falsification_criteria: z.string().optional(),
  bias_flags: z.array(z.string()),
  revision_history: z.array(z.object({
    timestamp: z.date(),
    change: z.string(),
    author: z.string().optional()
  })),
  layer_id: z.string().optional(),
  topology_metrics: TopologyMetricsSchema.optional(),
  statistical_power: StatisticalPowerSchema.optional(),
  info_metrics: InfoMetricsSchema.optional(),
  impact_score: z.number().min(0).max(1),
  attribution: z.string().optional(),
  plan: z.string().optional() // For hypothesis nodes
});

export type NodeMetadata = z.infer<typeof NodeMetadataSchema>;

export const EdgeMetadataSchema = z.object({
  edge_id: z.string(),
  edge_type: z.nativeEnum(EdgeType),
  confidence: ConfidenceVectorSchema,
  timestamp: z.date(),
  causal_metadata: z.object({
    confounders: z.array(z.string()),
    mechanism: z.string().optional(),
    strength: z.number().min(0).max(1).optional()
  }).optional(),
  temporal_metadata: z.object({
    delay_duration: z.number().optional(),
    pattern_type: z.string().optional(),
    frequency: z.number().optional()
  }).optional()
});

export type EdgeMetadata = z.infer<typeof EdgeMetadataSchema>;

// Graph Node
export interface GraphNode {
  id: string;
  metadata: NodeMetadata;
}

// Graph Edge
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  metadata: EdgeMetadata;
}

// Hyperedge (P1.9)
export interface Hyperedge {
  id: string;
  nodes: string[]; // Set of node IDs
  metadata: EdgeMetadata;
}

// ASR-GoT Graph State (P1.11)
export interface ASRGoTGraphState {
  timestamp: Date;
  vertices: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
  hyperedges: Map<string, Hyperedge>;
  layers: Map<string, string[]>; // layer_id -> node_ids
  node_types: Map<string, NodeType>;
  confidence_function: Map<string, ConfidenceVector>;
  metadata_function: Map<string, NodeMetadata>;
  info_metrics: Map<string, InfoMetrics>;
}

// Stage Execution Result
export interface StageResult {
  stage: number;
  stage_name: string;
  success: boolean;
  nodes_created: string[];
  edges_created: string[];
  errors: string[];
  warnings: string[];
  execution_time_ms: number;
}

// ASR-GoT Execution Context
export interface ASRGoTContext {
  task_query: string;
  user_profile: {
    identity: string;
    experience: string;
    research_focus: string[];
    methodologies: string[];
    philosophy: string;
  };
  communication_preferences: {
    tone: string;
    style: string;
    citation_format: string;
    length: string;
  };
  current_stage: number;
  graph_state: ASRGoTGraphState;
  stage_results: StageResult[];
  fail_safe_active: boolean;
  computational_budget: {
    max_nodes: number;
    max_edges: number;
    max_execution_time_ms: number;
  };
}

// MCP Tool Responses
export interface ASRGoTResponse {
  success: boolean;
  stage: number;
  result: any;
  graph_summary: {
    total_nodes: number;
    total_edges: number;
    total_hyperedges: number;
    current_stage: number;
  };
  errors: string[];
  warnings: string[];
}

export interface ResearchQuery {
  query: string;
  domain: string[];
  complexity_level: 'basic' | 'intermediate' | 'advanced';
  expected_depth: 'overview' | 'detailed' | 'comprehensive';
  interdisciplinary: boolean;
}

// Export all schemas for validation
export const Schemas = {
  ConfidenceVectorSchema,
  StatisticalPowerSchema,
  InfoMetricsSchema,
  TopologyMetricsSchema,
  NodeMetadataSchema,
  EdgeMetadataSchema
};
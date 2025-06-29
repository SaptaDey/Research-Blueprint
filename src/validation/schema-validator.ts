import { z } from 'zod';
import { Schemas, NodeMetadata, EdgeMetadata, ConfidenceVector } from '../types/index.js';

/**
 * Comprehensive validation system for ASR-GoT metadata and structures
 */
export class ASRGoTValidator {
  private validationErrors: string[] = [];
  private validationWarnings: string[] = [];

  /**
   * Validate node metadata according to P1.12 schema
   */
  validateNodeMetadata(metadata: any): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    sanitized?: NodeMetadata;
  } {
    this.resetValidation();

    try {
      // Primary schema validation
      const validatedMetadata = Schemas.NodeMetadataSchema.parse(metadata);
      
      // Additional semantic validation
      this.validateSemanticConstraints(validatedMetadata);
      this.validateConfidenceVector(validatedMetadata.confidence);
      this.validateTemporalConsistency(validatedMetadata);
      this.validateDisciplinaryTags(validatedMetadata.disciplinary_tags);

      return {
        isValid: this.validationErrors.length === 0,
        errors: this.validationErrors,
        warnings: this.validationWarnings,
        sanitized: validatedMetadata
      };

    } catch (error) {
      if (error instanceof z.ZodError) {
        this.validationErrors.push(...error.errors.map(e => `${e.path.join('.')}: ${e.message}`));
      } else {
        this.validationErrors.push(`Validation error: ${(error as Error).message}`);
      }

      return {
        isValid: false,
        errors: this.validationErrors,
        warnings: this.validationWarnings
      };
    }
  }

  /**
   * Validate edge metadata according to extended schema
   */
  validateEdgeMetadata(metadata: any): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    sanitized?: EdgeMetadata;
  } {
    this.resetValidation();

    try {
      const validatedMetadata = Schemas.EdgeMetadataSchema.parse(metadata);
      
      // Additional edge-specific validation
      this.validateEdgeTypeConsistency(validatedMetadata);
      this.validateCausalMetadata(validatedMetadata.causal_metadata);
      this.validateTemporalMetadata(validatedMetadata.temporal_metadata);

      return {
        isValid: this.validationErrors.length === 0,
        errors: this.validationErrors,
        warnings: this.validationWarnings,
        sanitized: validatedMetadata
      };

    } catch (error) {
      if (error instanceof z.ZodError) {
        this.validationErrors.push(...error.errors.map(e => `${e.path.join('.')}: ${e.message}`));
      } else {
        this.validationErrors.push(`Validation error: ${(error as Error).message}`);
      }

      return {
        isValid: false,
        errors: this.validationErrors,
        warnings: this.validationWarnings
      };
    }
  }

  /**
   * Validate confidence vector constraints (P1.5)
   */
  validateConfidenceVector(confidence: any): boolean {
    try {
      const validated = Schemas.ConfidenceVectorSchema.parse(confidence);
      
      // Check for logical consistency
      if (validated.empirical_support > 0.9 && validated.methodological_rigor < 0.3) {
        this.validationWarnings.push('High empirical support with low methodological rigor may indicate issues');
      }
      
      if (validated.consensus_alignment > 0.8 && validated.theoretical_basis < 0.2) {
        this.validationWarnings.push('High consensus with low theoretical basis is unusual');
      }

      // Check for extreme values
      const values = [
        validated.empirical_support,
        validated.theoretical_basis,
        validated.methodological_rigor,
        validated.consensus_alignment
      ];
      
      if (values.every(v => v > 0.95)) {
        this.validationWarnings.push('All confidence dimensions extremely high - may indicate overconfidence');
      }
      
      if (values.every(v => v < 0.05)) {
        this.validationWarnings.push('All confidence dimensions extremely low - consider if node should exist');
      }

      return true;
    } catch (error) {
      this.validationErrors.push(`Invalid confidence vector: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Validate statistical power metadata (P1.26)
   */
  validateStatisticalPower(power: any): boolean {
    if (!power) return true; // Optional field

    try {
      Schemas.StatisticalPowerSchema.parse(power);
      
      // Logical consistency checks
      if (power.power && power.power < 0.8 && power.sample_size && power.sample_size > 1000) {
        this.validationWarnings.push('Large sample size with low statistical power may indicate effect size issues');
      }
      
      if (power.p_value && power.p_value < 0.001 && power.effect_size && Math.abs(power.effect_size) < 0.1) {
        this.validationWarnings.push('Very low p-value with small effect size may indicate multiple testing issues');
      }

      return true;
    } catch (error) {
      this.validationErrors.push(`Invalid statistical power: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Validate information theory metrics (P1.27)
   */
  validateInfoMetrics(metrics: any): boolean {
    if (!metrics) return true; // Optional field

    try {
      Schemas.InfoMetricsSchema.parse(metrics);
      
      // Check for logical bounds
      if (metrics.entropy && (metrics.entropy < 0 || metrics.entropy > 10)) {
        this.validationWarnings.push('Entropy value outside typical range [0, 10]');
      }
      
      if (metrics.kl_divergence && metrics.kl_divergence < 0) {
        this.validationErrors.push('KL divergence cannot be negative');
      }
      
      if (metrics.mutual_information && metrics.mutual_information < 0) {
        this.validationErrors.push('Mutual information cannot be negative');
      }

      return true;
    } catch (error) {
      this.validationErrors.push(`Invalid information metrics: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Validate topology metrics (P1.22)
   */
  validateTopologyMetrics(metrics: any): boolean {
    if (!metrics) return true; // Optional field

    try {
      Schemas.TopologyMetricsSchema.parse(metrics);
      
      // Check bounds
      if (metrics.centrality && (metrics.centrality < 0 || metrics.centrality > 1)) {
        this.validationErrors.push('Centrality must be between 0 and 1');
      }
      
      if (metrics.clustering_coefficient && (metrics.clustering_coefficient < 0 || metrics.clustering_coefficient > 1)) {
        this.validationErrors.push('Clustering coefficient must be between 0 and 1');
      }
      
      if (metrics.degree && metrics.degree < 0) {
        this.validationErrors.push('Degree cannot be negative');
      }

      return true;
    } catch (error) {
      this.validationErrors.push(`Invalid topology metrics: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Validate entire graph state for consistency
   */
  validateGraphState(graphState: any): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    statistics: {
      total_nodes: number;
      total_edges: number;
      orphaned_nodes: number;
      invalid_references: number;
    };
  } {
    this.resetValidation();
    
    const stats = {
      total_nodes: 0,
      total_edges: 0,
      orphaned_nodes: 0,
      invalid_references: 0
    };

    try {
      // Validate basic structure
      if (!graphState.vertices || !graphState.edges || !graphState.node_types) {
        this.validationErrors.push('Missing required graph state components');
        return { isValid: false, errors: this.validationErrors, warnings: this.validationWarnings, statistics: stats };
      }

      stats.total_nodes = graphState.vertices.size;
      stats.total_edges = graphState.edges.size;

      // Validate all nodes
      for (const [nodeId, node] of graphState.vertices.entries()) {
        const nodeValidation = this.validateNodeMetadata(node.metadata);
        if (!nodeValidation.isValid) {
          this.validationErrors.push(`Node ${nodeId}: ${nodeValidation.errors.join(', ')}`);
        }
      }

      // Validate all edges
      for (const [edgeId, edge] of graphState.edges.entries()) {
        const edgeValidation = this.validateEdgeMetadata(edge.metadata);
        if (!edgeValidation.isValid) {
          this.validationErrors.push(`Edge ${edgeId}: ${edgeValidation.errors.join(', ')}`);
        }

        // Check edge references
        if (!graphState.vertices.has(edge.source)) {
          this.validationErrors.push(`Edge ${edgeId} references non-existent source node ${edge.source}`);
          stats.invalid_references++;
        }
        if (!graphState.vertices.has(edge.target)) {
          this.validationErrors.push(`Edge ${edgeId} references non-existent target node ${edge.target}`);
          stats.invalid_references++;
        }
      }

      // Check for orphaned nodes
      const connectedNodes = new Set();
      for (const edge of graphState.edges.values()) {
        connectedNodes.add(edge.source);
        connectedNodes.add(edge.target);
      }
      
      for (const nodeId of graphState.vertices.keys()) {
        if (!connectedNodes.has(nodeId) && graphState.vertices.get(nodeId).metadata.type !== 'root') {
          stats.orphaned_nodes++;
          this.validationWarnings.push(`Node ${nodeId} is orphaned (no connections)`);
        }
      }

      // Validate layer consistency
      if (graphState.layers) {
        this.validateLayerConsistency(graphState);
      }

      return {
        isValid: this.validationErrors.length === 0,
        errors: this.validationErrors,
        warnings: this.validationWarnings,
        statistics: stats
      };

    } catch (error) {
      this.validationErrors.push(`Graph validation error: ${(error as Error).message}`);
      return {
        isValid: false,
        errors: this.validationErrors,
        warnings: this.validationWarnings,
        statistics: stats
      };
    }
  }

  /**
   * Sanitize and repair common validation issues
   */
  sanitizeMetadata(metadata: any, type: 'node' | 'edge'): any {
    const sanitized = { ...metadata };

    try {
      if (type === 'node') {
        // Ensure required fields exist
        if (!sanitized.node_id) {
          sanitized.node_id = `generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        
        if (!sanitized.timestamp) {
          sanitized.timestamp = new Date();
        }
        
        if (!sanitized.confidence) {
          sanitized.confidence = {
            empirical_support: 0.5,
            theoretical_basis: 0.5,
            methodological_rigor: 0.5,
            consensus_alignment: 0.5
          };
        }
        
        if (!sanitized.bias_flags) {
          sanitized.bias_flags = [];
        }
        
        if (!sanitized.revision_history) {
          sanitized.revision_history = [{
            timestamp: new Date(),
            change: 'Metadata sanitized',
            author: 'ASR-GoT Validator'
          }];
        }
        
        if (typeof sanitized.impact_score !== 'number') {
          sanitized.impact_score = 0.5;
        }

        // Clamp confidence values
        if (sanitized.confidence) {
          for (const key of ['empirical_support', 'theoretical_basis', 'methodological_rigor', 'consensus_alignment']) {
            if (typeof sanitized.confidence[key] !== 'number') {
              sanitized.confidence[key] = 0.5;
            } else {
              sanitized.confidence[key] = Math.max(0, Math.min(1, sanitized.confidence[key]));
            }
          }
        }

      } else if (type === 'edge') {
        // Ensure required edge fields
        if (!sanitized.edge_id) {
          sanitized.edge_id = `generated_edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        
        if (!sanitized.timestamp) {
          sanitized.timestamp = new Date();
        }
        
        if (!sanitized.confidence) {
          sanitized.confidence = {
            empirical_support: 0.5,
            theoretical_basis: 0.5,
            methodological_rigor: 0.5,
            consensus_alignment: 0.5
          };
        }
        
        if (!sanitized.edge_type) {
          sanitized.edge_type = 'other';
        }
      }

      return sanitized;

    } catch (error) {
      console.error('Sanitization failed:', error);
      return metadata; // Return original if sanitization fails
    }
  }

  // Private helper methods
  private resetValidation(): void {
    this.validationErrors = [];
    this.validationWarnings = [];
  }

  private validateSemanticConstraints(metadata: NodeMetadata): void {
    // Check that hypothesis nodes have falsification criteria
    if (metadata.type === 'hypothesis' && !metadata.falsification_criteria) {
      this.validationWarnings.push('Hypothesis nodes should have falsification criteria (P1.16)');
    }

    // Check that evidence nodes have statistical power data
    if (metadata.type === 'evidence' && !metadata.statistical_power) {
      this.validationWarnings.push('Evidence nodes should include statistical power analysis (P1.26)');
    }

    // Check impact score consistency with node type
    if (metadata.type === 'placeholder_gap' && metadata.impact_score > 0.8) {
      this.validationWarnings.push('Gap nodes typically should not have very high impact scores');
    }
  }

  private validateTemporalConsistency(metadata: NodeMetadata): void {
    const now = new Date();
    const creationTime = metadata.timestamp;
    
    if (creationTime > now) {
      this.validationErrors.push('Node timestamp cannot be in the future');
    }

    // Check revision history consistency
    for (const revision of metadata.revision_history) {
      if (revision.timestamp > now) {
        this.validationErrors.push('Revision timestamp cannot be in the future');
      }
      if (revision.timestamp < creationTime) {
        this.validationErrors.push('Revision timestamp cannot be before node creation');
      }
    }
  }

  private validateDisciplinaryTags(tags: string[]): void {
    if (tags.length === 0) {
      this.validationWarnings.push('Nodes should have at least one disciplinary tag');
    }

    // Check for overly generic tags
    const genericTags = ['general', 'other', 'misc', 'unknown'];
    if (tags.every(tag => genericTags.includes(tag.toLowerCase()))) {
      this.validationWarnings.push('Consider using more specific disciplinary tags');
    }

    // Check for excessive tags
    if (tags.length > 10) {
      this.validationWarnings.push('Consider reducing the number of disciplinary tags for clarity');
    }
  }

  private validateEdgeTypeConsistency(metadata: EdgeMetadata): void {
    // Check that causal edges have appropriate metadata
    if (metadata.edge_type === 'causal' && !metadata.causal_metadata) {
      this.validationWarnings.push('Causal edges should include causal metadata (P1.24)');
    }

    // Check temporal edges
    if (['temporal_precedence', 'sequential', 'delayed', 'cyclic'].includes(metadata.edge_type) && 
        !metadata.temporal_metadata) {
      this.validationWarnings.push('Temporal edges should include temporal metadata (P1.25)');
    }
  }

  private validateCausalMetadata(causalMetadata: any): void {
    if (!causalMetadata) return;

    if (causalMetadata.confounders && causalMetadata.confounders.length === 0 && causalMetadata.strength > 0.8) {
      this.validationWarnings.push('High causal strength with no identified confounders may indicate incomplete analysis');
    }
  }

  private validateTemporalMetadata(temporalMetadata: any): void {
    if (!temporalMetadata) return;

    if (temporalMetadata.delay_duration && temporalMetadata.delay_duration < 0) {
      this.validationErrors.push('Delay duration cannot be negative');
    }

    if (temporalMetadata.frequency && temporalMetadata.frequency <= 0) {
      this.validationErrors.push('Frequency must be positive');
    }
  }

  private validateLayerConsistency(graphState: any): void {
    // Check that all layer references in nodes exist in layers map
    for (const node of graphState.vertices.values()) {
      if (node.metadata.layer_id && !graphState.layers.has(node.metadata.layer_id)) {
        this.validationErrors.push(`Node ${node.id} references non-existent layer ${node.metadata.layer_id}`);
      }
    }

    // Check that all nodes in layer lists actually exist
    for (const [layerId, nodeIds] of graphState.layers.entries()) {
      for (const nodeId of nodeIds) {
        if (!graphState.vertices.has(nodeId)) {
          this.validationErrors.push(`Layer ${layerId} references non-existent node ${nodeId}`);
        }
      }
    }
  }

  /**
   * Generate validation report
   */
  generateValidationReport(validationResults: any[]): {
    summary: {
      total_validated: number;
      passed: number;
      failed: number;
      warnings: number;
    };
    details: any[];
    recommendations: string[];
  } {
    const summary = {
      total_validated: validationResults.length,
      passed: validationResults.filter(r => r.isValid).length,
      failed: validationResults.filter(r => !r.isValid).length,
      warnings: validationResults.reduce((total, r) => total + (r.warnings?.length || 0), 0)
    };

    const recommendations = [];
    
    if (summary.failed > 0) {
      recommendations.push('Fix validation errors before proceeding with analysis');
    }
    
    if (summary.warnings > summary.total_validated * 0.5) {
      recommendations.push('High number of warnings - consider reviewing metadata quality');
    }
    
    if (summary.passed === summary.total_validated && summary.warnings === 0) {
      recommendations.push('Validation successful - proceed with confidence');
    }

    return {
      summary,
      details: validationResults,
      recommendations
    };
  }
}
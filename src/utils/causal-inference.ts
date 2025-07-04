import { EdgeType } from '../types/index.js';

/**
 * Causal Inference System (P1.24)
 * Implements formal causal reasoning using Pearl's causal hierarchy
 */
export class CausalInference {
  private causalKeywords: Map<string, number> = new Map([
    // Strong causal indicators
    ['causes', 0.9], ['leads to', 0.8], ['results in', 0.8], ['triggers', 0.8],
    ['produces', 0.7], ['induces', 0.7], ['generates', 0.7],
    
    // Moderate causal indicators
    ['influences', 0.6], ['affects', 0.6], ['impacts', 0.6], ['contributes to', 0.5],
    ['associated with', 0.4], ['linked to', 0.4], ['related to', 0.3],
    
    // Weak/correlational
    ['correlates with', 0.2], ['co-occurs with', 0.2], ['appears with', 0.1]
  ]);

  private confoundingIndicators: RegExp[] = [
    /confound|confounder/i,
    /third.variable|mediating.variable/i,
    /spurious.correlation|spurious.relationship/i,
    /selection.bias|sample.bias/i,
    /unmeasured.variable|hidden.variable/i
  ];

  /**
   * Analyze causal relationships in content
   */
  analyzeCausalRelationships(content: string): {
    causal_claims: Array<{
      type: 'causal' | 'counterfactual' | 'correlational';
      strength: number;
      confidence: number;
      evidence_level: 'observational' | 'experimental' | 'meta_analysis';
      confounders: string[];
    }>;
    causal_structure: {
      direct_causes: string[];
      indirect_causes: string[];
      potential_confounders: string[];
    };
    hill_criteria_score: number;
  } {
    try {
      const causalClaims = this.extractCausalClaims(content);
      const causalStructure = this.analyzeCausalStructure(content);
      const hillScore = this.assessHillCriteria(content);

      return {
        causal_claims: causalClaims,
        causal_structure: causalStructure,
        hill_criteria_score: hillScore
      };

    } catch (error) {
      console.error('Causal analysis failed:', error);
      return {
        causal_claims: [],
        causal_structure: { direct_causes: [], indirect_causes: [], potential_confounders: [] },
        hill_criteria_score: 0
      };
    }
  }

  /**
   * Determine causal edge type based on content analysis
   */
  determineCausalEdgeType(
    sourceContent: string,
    targetContent: string,
    relationshipContent: string
  ): {
    edge_type: EdgeType;
    causal_strength: number;
    mechanism: string;
    confounders: string[];
    intervention_feasible: boolean;
  } {
    const analysis = this.analyzeCausalRelationships(relationshipContent);
    
    let edge_type = EdgeType.CORRELATIVE;
    let causal_strength = 0;

    if (analysis.causal_claims.length > 0) {
      const strongestClaim = analysis.causal_claims.reduce((max, claim) => 
        claim.strength > max.strength ? claim : max
      );

      if (strongestClaim.type === 'causal' && strongestClaim.strength > 0.7) {
        edge_type = EdgeType.CAUSAL;
      } else if (strongestClaim.type === 'counterfactual') {
        edge_type = EdgeType.COUNTERFACTUAL;
      } else if (analysis.causal_structure.potential_confounders.length > 0) {
        edge_type = EdgeType.CONFOUNDED;
      }

      causal_strength = strongestClaim.strength;
    }

    const mechanism = this.extractCausalMechanism(relationshipContent);
    const confounders = analysis.causal_structure.potential_confounders;
    const intervention_feasible = this.assessInterventionFeasibility(relationshipContent);

    return {
      edge_type,
      causal_strength,
      mechanism,
      confounders,
      intervention_feasible
    };
  }

  /**
   * Apply Bradford Hill criteria for causal inference
   */
  assessHillCriteria(content: string): number {
    const criteria = {
      strength: this.assessStrengthOfAssociation(content),
      consistency: this.assessConsistency(content),
      temporality: this.assessTemporality(content),
      dose_response: this.assessDoseResponse(content),
      plausibility: this.assessBiologicalPlausibility(content),
      coherence: this.assessCoherence(content),
      experiment: this.assessExperimentalEvidence(content),
      analogy: this.assessAnalogy(content),
      specificity: this.assessSpecificity(content)
    };

    // Weighted sum of criteria
    const weights = {
      strength: 0.15,
      consistency: 0.15,
      temporality: 0.20, // Most important
      dose_response: 0.10,
      plausibility: 0.10,
      coherence: 0.10,
      experiment: 0.10,
      analogy: 0.05,
      specificity: 0.05
    };

    let totalScore = 0;
    for (const [criterion, score] of Object.entries(criteria)) {
      totalScore += score * weights[criterion as keyof typeof weights];
    }

    return Math.max(0, Math.min(1, totalScore));
  }

  /**
   * Generate causal DAG representation
   */
  generateCausalDAG(
    nodes: Array<{ id: string; label: string; type: string }>,
    relationships: Array<{ source: string; target: string; content: string }>
  ): {
    nodes: Array<{ id: string; label: string; causal_role: 'cause' | 'effect' | 'mediator' | 'confounder' }>;
    edges: Array<{ 
      source: string; 
      target: string; 
      type: EdgeType; 
      strength: number;
      mechanism: string;
    }>;
    backdoor_paths: string[][];
    identification_strategy: string;
  } {
    const dagNodes = nodes.map(node => ({
      ...node,
      causal_role: this.determineCausalRole(node, relationships) as 'cause' | 'effect' | 'mediator' | 'confounder'
    }));

    const dagEdges = relationships.map(rel => {
      const causalInfo = this.determineCausalEdgeType('', '', rel.content);
      return {
        source: rel.source,
        target: rel.target,
        type: causalInfo.edge_type,
        strength: causalInfo.causal_strength,
        mechanism: causalInfo.mechanism
      };
    });

    const backdoorPaths = this.identifyBackdoorPaths(dagNodes, dagEdges);
    const identificationStrategy = this.suggestIdentificationStrategy(backdoorPaths, dagNodes);

    return {
      nodes: dagNodes,
      edges: dagEdges,
      backdoor_paths: backdoorPaths,
      identification_strategy: identificationStrategy
    };
  }

  /**
   * Assess counterfactual reasoning
   */
  assessCounterfactualReasoning(content: string): {
    counterfactual_claims: string[];
    validity_score: number;
    alternative_scenarios: string[];
    assumptions: string[];
  } {
    const counterfactualPatterns = [
      /if.*had.*would/i,
      /had.*not.*would not/i,
      /suppose.*then/i,
      /imagine.*instead/i,
      /alternative.*scenario/i
    ];

    const counterfactualClaims = [];
    for (const pattern of counterfactualPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        counterfactualClaims.push(...matches);
      }
    }

    const validityScore = this.assessCounterfactualValidity(content, counterfactualClaims);
    const alternativeScenarios = this.extractAlternativeScenarios(content);
    const assumptions = this.extractAssumptions(content);

    return {
      counterfactual_claims: counterfactualClaims,
      validity_score: validityScore,
      alternative_scenarios: alternativeScenarios,
      assumptions: assumptions
    };
  }

  // Private helper methods
  private extractCausalClaims(content: string): Array<{
    type: 'causal' | 'counterfactual' | 'correlational';
    strength: number;
    confidence: number;
    evidence_level: 'observational' | 'experimental' | 'meta_analysis';
    confounders: string[];
  }> {
    const claims = [];
    const contentLower = content.toLowerCase();

    // Check for causal keywords
    for (const [keyword, strength] of this.causalKeywords.entries()) {
      if (contentLower.includes(keyword)) {
        const evidenceLevel = this.determineEvidenceLevel(content);
        const confounders = this.identifyConfounders(content);
        
        claims.push({
          type: strength > 0.5 ? 'causal' as const : 'correlational' as const,
          strength,
          confidence: this.calculateCausalConfidence(content, keyword),
          evidence_level: evidenceLevel,
          confounders
        });
      }
    }

    // Check for counterfactual claims
    if (/if.*had.*would|counterfactual/i.test(content)) {
      claims.push({
        type: 'counterfactual' as const,
        strength: 0.7,
        confidence: 0.6,
        evidence_level: 'observational' as const,
        confounders: this.identifyConfounders(content)
      });
    }

    return claims;
  }

  private analyzeCausalStructure(content: string): {
    direct_causes: string[];
    indirect_causes: string[];
    potential_confounders: string[];
  } {
    const directCauses = this.extractDirectCauses(content);
    const indirectCauses = this.extractIndirectCauses(content);
    const potentialConfounders = this.identifyConfounders(content);

    return {
      direct_causes: directCauses,
      indirect_causes: indirectCauses,
      potential_confounders: potentialConfounders
    };
  }

  private extractDirectCauses(content: string): string[] {
    const directPatterns = [
      /directly causes/i,
      /immediate cause/i,
      /direct effect/i,
      /primary cause/i
    ];

    const causes = [];
    for (const pattern of directPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        causes.push(...matches);
      }
    }

    return causes;
  }

  private extractIndirectCauses(content: string): string[] {
    const indirectPatterns = [
      /indirectly causes/i,
      /mediates/i,
      /through.*affects/i,
      /via.*influences/i
    ];

    const causes = [];
    for (const pattern of indirectPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        causes.push(...matches);
      }
    }

    return causes;
  }

  private identifyConfounders(content: string): string[] {
    const confounders = [];
    
    for (const pattern of this.confoundingIndicators) {
      const matches = content.match(pattern);
      if (matches) {
        confounders.push(...matches);
      }
    }

    return confounders;
  }

  private extractCausalMechanism(content: string): string {
    const mechanismPatterns = [
      /mechanism.*is/i,
      /works.*by/i,
      /process.*involves/i,
      /pathway.*includes/i
    ];

    for (const pattern of mechanismPatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return 'mechanism_unspecified';
  }

  private assessInterventionFeasibility(content: string): boolean {
    const interventionIndicators = [
      /intervention/i,
      /treatment/i,
      /manipulation/i,
      /experiment/i,
      /randomized/i,
      /controlled/i
    ];

    return interventionIndicators.some(pattern => pattern.test(content));
  }

  private determineEvidenceLevel(content: string): 'observational' | 'experimental' | 'meta_analysis' {
    if (/meta.analysis|systematic.review/i.test(content)) {
      return 'meta_analysis';
    } else if (/experiment|randomized|controlled.trial|rct/i.test(content)) {
      return 'experimental';
    } else {
      return 'observational';
    }
  }

  private calculateCausalConfidence(content: string, keyword: string): number {
    const baseStrength = this.causalKeywords.get(keyword) || 0.5;
    const evidenceLevel = this.determineEvidenceLevel(content);
    
    const evidenceBonus = {
      'meta_analysis': 0.2,
      'experimental': 0.15,
      'observational': 0
    };

    return Math.min(0.95, baseStrength + evidenceBonus[evidenceLevel]);
  }

  // Hill criteria assessment methods
  private assessStrengthOfAssociation(content: string): number {
    const strengthIndicators = /strong.*association|large.*effect|significant.*relationship/i;
    return strengthIndicators.test(content) ? 0.8 : 0.4;
  }

  private assessConsistency(content: string): number {
    const consistencyIndicators = /consistent|replicated|reproducible|multiple.*studies/i;
    return consistencyIndicators.test(content) ? 0.8 : 0.3;
  }

  private assessTemporality(content: string): number {
    const temporalIndicators = /before|precedes|temporal.*sequence|cause.*before.*effect/i;
    return temporalIndicators.test(content) ? 0.9 : 0.2;
  }

  private assessDoseResponse(content: string): number {
    const doseResponseIndicators = /dose.response|gradient|more.*greater|linear.*relationship/i;
    return doseResponseIndicators.test(content) ? 0.7 : 0.3;
  }

  private assessBiologicalPlausibility(content: string): number {
    const plausibilityIndicators = /plausible|mechanism|biological.*basis|makes.*sense/i;
    return plausibilityIndicators.test(content) ? 0.6 : 0.3;
  }

  private assessCoherence(content: string): number {
    const coherenceIndicators = /coherent|consistent.*with|aligns.*with|supports/i;
    return coherenceIndicators.test(content) ? 0.6 : 0.3;
  }

  private assessExperimentalEvidence(content: string): number {
    const experimentalIndicators = /experiment|trial|intervention|randomized/i;
    return experimentalIndicators.test(content) ? 0.9 : 0.2;
  }

  private assessAnalogy(content: string): number {
    const analogyIndicators = /similar.*to|analogous|comparable|like.*other/i;
    return analogyIndicators.test(content) ? 0.5 : 0.2;
  }

  private assessSpecificity(content: string): number {
    const specificityIndicators = /specific|unique|particular|distinct/i;
    return specificityIndicators.test(content) ? 0.6 : 0.4;
  }

  private determineCausalRole(
    node: { id: string; label: string; type: string },
    relationships: Array<{ source: string; target: string; content: string }>
  ): string {
    const incoming = relationships.filter(rel => rel.target === node.id).length;
    const outgoing = relationships.filter(rel => rel.source === node.id).length;

    if (incoming === 0 && outgoing > 0) {
      return 'cause';
    } else if (incoming > 0 && outgoing === 0) {
      return 'effect';
    } else if (incoming > 0 && outgoing > 0) {
      return 'mediator';
    } else {
      return 'confounder';
    }
  }

  private identifyBackdoorPaths(nodes: any[], edges: any[]): string[][] {
    // Simplified backdoor path identification
    // In a real implementation, this would use graph algorithms
    const backdoorPaths = [];
    
    // Find paths that go through confounders
    const confounders = nodes.filter(n => n.causal_role === 'confounder');
    for (const confounder of confounders) {
      const pathsThrough = this.findPathsThroughNode(confounder.id, edges);
      backdoorPaths.push(...pathsThrough);
    }

    return backdoorPaths;
  }

  private findPathsThroughNode(nodeId: string, edges: any[]): string[][] {
    // Simplified path finding - would need proper graph traversal
    const paths = [];
    const incomingEdges = edges.filter(e => e.target === nodeId);
    const outgoingEdges = edges.filter(e => e.source === nodeId);

    for (const incoming of incomingEdges) {
      for (const outgoing of outgoingEdges) {
        paths.push([incoming.source, nodeId, outgoing.target]);
      }
    }

    return paths;
  }

  private suggestIdentificationStrategy(backdoorPaths: string[][], nodes: any[]): string {
    if (backdoorPaths.length === 0) {
      return 'No confounding detected - direct causal identification possible';
    }

    const confounders = nodes.filter(n => n.causal_role === 'confounder');
    if (confounders.length > 0) {
      return `Control for confounders: ${confounders.map(c => c.label).join(', ')}`;
    }

    return 'Instrumental variable or natural experiment may be needed';
  }

  private assessCounterfactualValidity(content: string, claims: string[]): number {
    if (claims.length === 0) return 0;

    let validityScore = 0.5; // Base score

    // Check for proper counterfactual structure
    if (claims.some(claim => /if.*had.*would/i.test(claim))) {
      validityScore += 0.2;
    }

    // Check for consideration of alternatives
    if (/alternative|other.*possibility|different.*outcome/i.test(content)) {
      validityScore += 0.1;
    }

    // Check for acknowledgment of assumptions
    if (/assume|assumption|given.*that/i.test(content)) {
      validityScore += 0.1;
    }

    return Math.min(0.9, validityScore);
  }

  private extractAlternativeScenarios(content: string): string[] {
    const scenarios = [];
    const scenarioPatterns = [
      /alternative.*scenario/i,
      /different.*outcome/i,
      /instead.*of/i,
      /other.*possibility/i
    ];

    for (const pattern of scenarioPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        scenarios.push(...matches);
      }
    }

    return scenarios;
  }

  private extractAssumptions(content: string): string[] {
    const assumptions = [];
    const assumptionPatterns = [
      /assume.*that/i,
      /assuming/i,
      /given.*that/i,
      /premise.*is/i
    ];

    for (const pattern of assumptionPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        assumptions.push(...matches);
      }
    }

    return assumptions;
  }
}
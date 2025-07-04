/**
 * Bias Detection System (P1.17)
 * Implements protocols for active bias detection and mitigation
 */
export class BiasDetector {
  private knownBiases: Map<string, string[]> = new Map([
    ['confirmation', ['selective evidence', 'cherry-picking', 'motivated reasoning']],
    ['availability', ['recent events', 'memorable cases', 'media coverage']],
    ['anchoring', ['first impression', 'reference point', 'initial estimate']],
    ['publication', ['positive results', 'significant findings', 'file drawer effect']],
    ['selection', ['sampling bias', 'survivorship bias', 'non-response bias']],
    ['cognitive', ['overconfidence', 'dunning-kruger', 'planning fallacy']],
    ['cultural', ['western-centric', 'gender bias', 'racial bias']],
    ['disciplinary', ['methodological preference', 'paradigm lock-in', 'silo thinking']]
  ]);

  private biasPatterns: RegExp[] = [
    /obviously|clearly|undoubtedly/i, // Overconfidence indicators
    /always|never|all|none|everyone|nobody/i, // Absolutist language
    /correlation.*causation|cause.*effect/i, // Causal inference issues
    /significant|proven|demonstrates/i, // Statistical misinterpretation
    /sample.*representative|generaliz/i // Generalization issues
  ];

  /**
   * Detect potential biases in text content
   */
  detectBiases(content: string, context: string = ''): string[] {
    const detectedBiases: string[] = [];

    try {
      // Validate input
      if (!content || typeof content !== 'string') {
        return ['invalid_input_for_bias_detection'];
      }

      const safeContent = content.toLowerCase().trim();
      const safeContext = (context || '').toLowerCase().trim();

      // Pattern-based detection with error handling
      for (const pattern of this.biasPatterns) {
        try {
          if (pattern.test(safeContent)) {
            detectedBiases.push(this.getPatternBias(pattern));
          }
        } catch (patternError) {
          console.warn('Pattern matching error:', patternError);
        }
      }

      // Context-based detection with error handling
      try {
        const contextBiases = this.detectContextualBiases(safeContent, safeContext);
        detectedBiases.push(...contextBiases);
      } catch (contextError) {
        console.warn('Context bias detection error:', contextError);
        detectedBiases.push('context_analysis_failed');
      }

      // Domain-specific bias detection with error handling
      try {
        const domainBiases = this.detectDomainBiases(safeContent);
        detectedBiases.push(...domainBiases);
      } catch (domainError) {
        console.warn('Domain bias detection error:', domainError);
        detectedBiases.push('domain_analysis_failed');
      }

      return [...new Set(detectedBiases)]; // Remove duplicates

    } catch (error) {
      console.error('Bias detection failed:', error);
      return ['bias_detection_error'];
    }
  }

  /**
   * Detect biases based on content context
   */
  private detectContextualBiases(content: string, context: string): string[] {
    const biases: string[] = [];
    const contentLower = content.toLowerCase();
    // contextLower could be used for future context-aware bias detection
    context.toLowerCase();

    // Sample size bias
    if (contentLower.includes('small sample') || contentLower.includes('n=')) {
      biases.push('small_sample_bias');
    }

    // Publication bias indicators
    if (contentLower.includes('significant') && !contentLower.includes('not significant')) {
      biases.push('publication_bias_risk');
    }

    // Temporal bias
    if (contentLower.includes('recent') || contentLower.includes('current')) {
      biases.push('recency_bias');
    }

    // Geographic/cultural bias
    if (this.hasGeographicBias(contentLower)) {
      biases.push('geographic_bias');
    }

    // Gender/demographic bias
    if (this.hasDemographicBias(contentLower)) {
      biases.push('demographic_bias');
    }

    return biases;
  }

  /**
   * Detect domain-specific biases
   */
  private detectDomainBiases(content: string): string[] {
    const biases: string[] = [];
    const contentLower = content.toLowerCase();

    // Medical/health biases
    if (this.isMedicalContent(contentLower)) {
      if (contentLower.includes('cure') || contentLower.includes('treatment')) {
        biases.push('medical_overgeneralization');
      }
      if (!contentLower.includes('side effect') && !contentLower.includes('adverse')) {
        biases.push('medical_benefit_bias');
      }
    }

    // Technology biases
    if (this.isTechContent(contentLower)) {
      if (contentLower.includes('ai') || contentLower.includes('machine learning')) {
        biases.push('tech_solutionism');
      }
    }

    // Research methodology biases
    if (this.isResearchContent(contentLower)) {
      if (!contentLower.includes('limitation') && !contentLower.includes('constraint')) {
        biases.push('methodology_overconfidence');
      }
    }

    return biases;
  }

  /**
   * Suggest debiasing techniques for detected biases
   */
  suggestDebiasingTechniques(biases: string[]): string[] {
    const techniques: string[] = [];

    for (const bias of biases) {
      switch (bias) {
        case 'confirmation_bias':
          techniques.push('Seek disconfirming evidence', 'Devil\'s advocate approach');
          break;
        case 'availability_bias':
          techniques.push('Use base rates', 'Systematic literature review');
          break;
        case 'publication_bias_risk':
          techniques.push('Include gray literature', 'Funnel plot analysis');
          break;
        case 'small_sample_bias':
          techniques.push('Power analysis', 'Effect size reporting');
          break;
        case 'geographic_bias':
          techniques.push('Multi-site studies', 'Cross-cultural validation');
          break;
        case 'demographic_bias':
          techniques.push('Diverse sampling', 'Stratified analysis');
          break;
        case 'medical_overgeneralization':
          techniques.push('Precision medicine approach', 'Subgroup analysis');
          break;
        case 'tech_solutionism':
          techniques.push('Human-centered design', 'Ethical impact assessment');
          break;
        default:
          techniques.push('Critical peer review', 'Structured decision-making');
      }
    }

    return [...new Set(techniques)];
  }

  /**
   * Assess bias risk level
   */
  assessBiasRisk(biases: string[], contentLength: number = 100): {
    level: 'low' | 'medium' | 'high';
    score: number;
    recommendations: string[];
  } {
    let riskScore = 0;
    const highRiskBiases = ['confirmation_bias', 'publication_bias_risk', 'medical_overgeneralization'];
    const mediumRiskBiases = ['availability_bias', 'geographic_bias', 'demographic_bias'];

    // Calculate base risk from bias types
    for (const bias of biases) {
      if (highRiskBiases.includes(bias)) {
        riskScore += 3;
      } else if (mediumRiskBiases.includes(bias)) {
        riskScore += 2;
      } else {
        riskScore += 1;
      }
    }

    // Adjust for content length (longer content may have lower bias density)
    const biaseDensity = biases.length / (contentLength / 100);
    riskScore *= Math.min(2, Math.max(0.5, biaseDensity));

    // Normalize to 0-10 scale
    const normalizedScore = Math.min(10, riskScore);

    let level: 'low' | 'medium' | 'high';
    if (normalizedScore < 3) {
      level = 'low';
    } else if (normalizedScore < 7) {
      level = 'medium';
    } else {
      level = 'high';
    }

    const recommendations = this.getRecommendations(level, biases);

    return {
      level,
      score: normalizedScore,
      recommendations
    };
  }

  /**
   * Generate bias mitigation recommendations
   */
  private getRecommendations(riskLevel: string, biases: string[]): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'high') {
      recommendations.push('Mandatory peer review required');
      recommendations.push('Consider systematic review methodology');
      recommendations.push('Implement structured bias checklist');
    }

    if (riskLevel === 'medium' || riskLevel === 'high') {
      recommendations.push('Include diverse perspectives');
      recommendations.push('Document methodology limitations');
    }

    recommendations.push(...this.suggestDebiasingTechniques(biases));

    return [...new Set(recommendations)];
  }

  // Helper methods for bias detection
  private getPatternBias(pattern: RegExp): string {
    const patternMap = new Map([
      [/obviously|clearly|undoubtedly/i, 'overconfidence_bias'],
      [/always|never|all|none|everyone|nobody/i, 'absolutist_thinking'],
      [/correlation.*causation|cause.*effect/i, 'causal_inference_error'],
      [/significant|proven|demonstrates/i, 'statistical_misinterpretation'],
      [/sample.*representative|generaliz/i, 'generalization_bias']
    ]);

    for (const [pat, bias] of patternMap.entries()) {
      if (pattern.toString() === pat.toString()) {
        return bias;
      }
    }
    return 'unknown_pattern_bias';
  }

  private hasGeographicBias(content: string): boolean {
    const westernTerms = ['western', 'american', 'european', 'developed countries', 'first world'];
    return westernTerms.some(term => content.includes(term)) && 
           !content.includes('diverse') && !content.includes('global');
  }

  private hasDemographicBias(content: string): boolean {
    const demographicTerms = ['men', 'women', 'male', 'female', 'age', 'elderly', 'young'];
    const hasDemoTerms = demographicTerms.some(term => content.includes(term));
    const hasInclusivity = content.includes('diverse') || content.includes('inclusive') || 
                          content.includes('representative');
    
    return hasDemoTerms && !hasInclusivity;
  }

  private isMedicalContent(content: string): boolean {
    const medicalTerms = ['patient', 'treatment', 'therapy', 'medical', 'clinical', 'diagnosis', 'symptom'];
    return medicalTerms.some(term => content.includes(term));
  }

  private isTechContent(content: string): boolean {
    const techTerms = ['technology', 'software', 'algorithm', 'ai', 'machine learning', 'digital'];
    return techTerms.some(term => content.includes(term));
  }

  private isResearchContent(content: string): boolean {
    const researchTerms = ['study', 'research', 'analysis', 'methodology', 'experiment', 'hypothesis'];
    return researchTerms.some(term => content.includes(term));
  }

  /**
   * Create bias flags for metadata
   */
  createBiasFlags(content: string, context: string = ''): {
    flags: string[];
    risk_level: string;
    mitigation_required: boolean;
    techniques: string[];
  } {
    const biases = this.detectBiases(content, context);
    const riskAssessment = this.assessBiasRisk(biases, content.length);
    
    return {
      flags: biases,
      risk_level: riskAssessment.level,
      mitigation_required: riskAssessment.level !== 'low',
      techniques: riskAssessment.recommendations
    };
  }
}
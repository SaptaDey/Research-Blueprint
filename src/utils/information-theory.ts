import { ConfidenceVector, InfoMetrics } from '../types/index.js';

export class InformationTheory {
  /**
   * Calculate Shannon entropy for a confidence vector (P1.27)
   */
  calculateEntropy(confidence: ConfidenceVector): number {
    try {
      const values = [
        confidence.empirical_support,
        confidence.theoretical_basis,
        confidence.methodological_rigor,
        confidence.consensus_alignment
      ];

      // Normalize to create probability distribution
      const sum = values.reduce((a, b) => a + b, 0);
      if (sum === 0) return 0;
      
      const probabilities = values.map(v => v / sum);
      
      // Calculate Shannon entropy: H(X) = -Σ p(x) * log2(p(x))
      let entropy = 0;
      for (const p of probabilities) {
        if (p > 0) {
          entropy -= p * Math.log2(p);
        }
      }
      
      return entropy;
    } catch (error) {
      console.error('Entropy calculation failed:', error);
      return 0;
    }
  }

  /**
   * Calculate KL divergence between two confidence distributions
   */
  calculateKLDivergence(p: ConfidenceVector, q: ConfidenceVector): number {
    try {
      const pValues = [p.empirical_support, p.theoretical_basis, p.methodological_rigor, p.consensus_alignment];
      const qValues = [q.empirical_support, q.theoretical_basis, q.methodological_rigor, q.consensus_alignment];

      // Normalize distributions
      const pSum = pValues.reduce((a, b) => a + b, 0);
      const qSum = qValues.reduce((a, b) => a + b, 0);
      
      if (pSum === 0 || qSum === 0) return Infinity;
      
      const pProbs = pValues.map(v => v / pSum);
      const qProbs = qValues.map(v => v / qSum);

      // Calculate KL divergence: D_KL(P||Q) = Σ p(x) * log(p(x)/q(x))
      let kl = 0;
      for (let i = 0; i < pProbs.length; i++) {
        if (pProbs[i] > 0) {
          if (qProbs[i] === 0) return Infinity;
          kl += pProbs[i] * Math.log(pProbs[i] / qProbs[i]);
        }
      }
      
      return kl;
    } catch (error) {
      console.error('KL divergence calculation failed:', error);
      return Infinity;
    }
  }

  /**
   * Calculate mutual information between two nodes
   */
  calculateMutualInformation(
    conf1: ConfidenceVector,
    conf2: ConfidenceVector,
    jointConfidence?: ConfidenceVector
  ): number {
    try {
      if (!jointConfidence) {
        // Approximate joint distribution as product (assuming independence)
        jointConfidence = {
          empirical_support: conf1.empirical_support * conf2.empirical_support,
          theoretical_basis: conf1.theoretical_basis * conf2.theoretical_basis,
          methodological_rigor: conf1.methodological_rigor * conf2.methodological_rigor,
          consensus_alignment: conf1.consensus_alignment * conf2.consensus_alignment
        };
      }

      // MI(X,Y) = H(X) + H(Y) - H(X,Y)
      const h1 = this.calculateEntropy(conf1);
      const h2 = this.calculateEntropy(conf2);
      const hJoint = this.calculateEntropy(jointConfidence);
      
      return h1 + h2 - hJoint;
    } catch (error) {
      console.error('Mutual information calculation failed:', error);
      return 0;
    }
  }

  /**
   * Calculate Minimum Description Length (MDL) score
   */
  calculateMDL(
    modelComplexity: number,
    dataLikelihood: number,
    sampleSize: number = 100
  ): number {
    try {
      // MDL = -log(likelihood) + (model_complexity * log(n)) / 2
      const descriptionLength = -Math.log(Math.max(1e-10, dataLikelihood)) + 
                               (modelComplexity * Math.log(sampleSize)) / 2;
      
      return descriptionLength;
    } catch (error) {
      console.error('MDL calculation failed:', error);
      return Infinity;
    }
  }

  /**
   * Calculate Expected Value of Information (EVoI) for intervention planning
   */
  calculateEVoI(
    currentUncertainty: number,
    expectedUncertaintyReduction: number,
    interventionCost: number,
    potentialImpact: number
  ): number {
    try {
      // EVoI = (uncertainty_reduction * potential_impact) - intervention_cost
      const informationValue = expectedUncertaintyReduction * potentialImpact;
      return informationValue - interventionCost;
    } catch (error) {
      console.error('EVoI calculation failed:', error);
      return -Infinity;
    }
  }

  /**
   * Calculate information gain from evidence
   */
  calculateInformationGain(
    priorConfidence: ConfidenceVector,
    posteriorConfidence: ConfidenceVector
  ): number {
    try {
      const priorEntropy = this.calculateEntropy(priorConfidence);
      const posteriorEntropy = this.calculateEntropy(posteriorConfidence);
      
      // Information gain = reduction in entropy
      return priorEntropy - posteriorEntropy;
    } catch (error) {
      console.error('Information gain calculation failed:', error);
      return 0;
    }
  }

  /**
   * Calculate all information metrics for a node
   */
  calculateAllMetrics(
    confidence: ConfidenceVector,
    priorConfidence?: ConfidenceVector,
    modelComplexity: number = 1,
    sampleSize: number = 100
  ): InfoMetrics {
    const metrics: InfoMetrics = {
      entropy: this.calculateEntropy(confidence)
    };

    if (priorConfidence) {
      metrics.kl_divergence = this.calculateKLDivergence(confidence, priorConfidence);
      
      // Use KL divergence as a proxy for mutual information when joint distribution unknown
      metrics.mutual_information = Math.max(0, metrics.kl_divergence);
    }

    // Calculate MDL using average confidence as likelihood proxy
    const avgConfidence = (confidence.empirical_support + confidence.theoretical_basis + 
                          confidence.methodological_rigor + confidence.consensus_alignment) / 4;
    metrics.mdl_score = this.calculateMDL(modelComplexity, avgConfidence, sampleSize);

    return metrics;
  }

  /**
   * Rank hypotheses by information content
   */
  rankByInformationContent(
    hypotheses: Array<{ id: string; confidence: ConfidenceVector; complexity: number }>
  ): Array<{ id: string; score: number; metrics: InfoMetrics }> {
    const ranked = hypotheses.map(hyp => {
      const metrics = this.calculateAllMetrics(hyp.confidence, undefined, hyp.complexity);
      
      // Composite score: high information (low entropy), low complexity (low MDL)
      const score = (2 - (metrics.entropy || 0)) - ((metrics.mdl_score || 0) / 10);
      
      return { id: hyp.id, score, metrics };
    });

    return ranked.sort((a, b) => b.score - a.score);
  }

  /**
   * Detect information theoretic anomalies (e.g., unexpectedly high/low entropy)
   */
  detectAnomalies(
    confidence: ConfidenceVector,
    expectedEntropy: number,
    threshold: number = 0.5
  ): { isAnomaly: boolean; deviation: number; type: 'high_entropy' | 'low_entropy' | 'normal' } {
    const actualEntropy = this.calculateEntropy(confidence);
    const deviation = Math.abs(actualEntropy - expectedEntropy);
    
    const isAnomaly = deviation > threshold;
    let type: 'high_entropy' | 'low_entropy' | 'normal';
    
    if (isAnomaly) {
      type = actualEntropy > expectedEntropy ? 'high_entropy' : 'low_entropy';
    } else {
      type = 'normal';
    }
    
    return { isAnomaly, deviation, type };
  }
}
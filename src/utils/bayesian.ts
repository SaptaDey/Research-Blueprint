import { ConfidenceVector, StatisticalPower } from '../types/index.js';

export class BayesianUpdater {
  /**
   * Update confidence using Bayesian inference (P1.14)
   * Incorporates statistical power and evidence reliability
   */
  updateConfidence(
    prior: ConfidenceVector,
    likelihood: ConfidenceVector,
    evidence?: {
      reliability: number;
      statistical_power?: StatisticalPower;
      sample_size?: number;
    }
  ): ConfidenceVector {
    try {
      // Base Bayesian update for each dimension
      const posterior: ConfidenceVector = {
        empirical_support: this.updateDimension(
          prior.empirical_support,
          likelihood.empirical_support,
          evidence?.reliability || 0.5
        ),
        theoretical_basis: this.updateDimension(
          prior.theoretical_basis,
          likelihood.theoretical_basis,
          evidence?.reliability || 0.5
        ),
        methodological_rigor: this.updateDimension(
          prior.methodological_rigor,
          likelihood.methodological_rigor,
          evidence?.reliability || 0.5
        ),
        consensus_alignment: this.updateDimension(
          prior.consensus_alignment,
          likelihood.consensus_alignment,
          evidence?.reliability || 0.5
        )
      };

      // Adjust based on statistical power if available
      if (evidence?.statistical_power) {
        return this.adjustForStatisticalPower(posterior, evidence.statistical_power);
      }

      return posterior;
    } catch (error) {
      console.error('Bayesian update failed:', error);
      return prior; // Fallback to prior if update fails
    }
  }

  private updateDimension(prior: number, likelihood: number, reliability: number): number {
    // Simplified Bayesian update with reliability weighting
    // posterior ∝ likelihood * prior, adjusted for reliability
    
    // Convert to Beta distribution parameters (approximate)
    const priorAlpha = prior * 10 + 1;
    const priorBeta = (1 - prior) * 10 + 1;
    
    // Evidence strength based on likelihood and reliability
    const evidenceStrength = likelihood * reliability;
    const evidenceAlpha = evidenceStrength * 10;
    const evidenceBeta = (1 - evidenceStrength) * 10;
    
    // Update Beta parameters
    const posteriorAlpha = priorAlpha + evidenceAlpha;
    const posteriorBeta = priorBeta + evidenceBeta;
    
    // Convert back to probability (mean of Beta distribution)
    const posterior = posteriorAlpha / (posteriorAlpha + posteriorBeta);
    
    // Ensure bounds [0, 1]
    return Math.max(0, Math.min(1, posterior));
  }

  private adjustForStatisticalPower(
    confidence: ConfidenceVector,
    power: StatisticalPower
  ): ConfidenceVector {
    // Adjust empirical support based on statistical power
    let adjustment = 1.0;
    
    if (power.power) {
      // Higher statistical power increases confidence in empirical findings
      adjustment *= 0.5 + (power.power * 0.5);
    }
    
    if (power.sample_size) {
      // Larger sample sizes increase confidence
      const sizeAdjustment = Math.min(1.0, Math.log(power.sample_size) / Math.log(1000));
      adjustment *= 0.7 + (sizeAdjustment * 0.3);
    }
    
    if (power.effect_size) {
      // Larger effect sizes increase confidence
      const effectAdjustment = Math.min(1.0, Math.abs(power.effect_size));
      adjustment *= 0.8 + (effectAdjustment * 0.2);
    }

    return {
      ...confidence,
      empirical_support: Math.max(0, Math.min(1, confidence.empirical_support * adjustment))
    };
  }

  /**
   * Calculate uncertainty propagation through graph edges
   */
  propagateUncertainty(
    sourceConfidence: ConfidenceVector,
    edgeReliability: number
  ): ConfidenceVector {
    const propagationFactor = Math.max(0.1, edgeReliability);
    
    return {
      empirical_support: sourceConfidence.empirical_support * propagationFactor,
      theoretical_basis: sourceConfidence.theoretical_basis * propagationFactor,
      methodological_rigor: sourceConfidence.methodological_rigor * propagationFactor,
      consensus_alignment: sourceConfidence.consensus_alignment * propagationFactor
    };
  }

  /**
   * Calculate confidence interval for a confidence vector
   */
  calculateConfidenceInterval(
    confidence: ConfidenceVector,
    sampleSize: number = 100
  ): { lower: ConfidenceVector; upper: ConfidenceVector } {
    const z = 1.96; // 95% confidence interval
    const margin = z / Math.sqrt(sampleSize);

    const lower: ConfidenceVector = {
      empirical_support: Math.max(0, confidence.empirical_support - margin),
      theoretical_basis: Math.max(0, confidence.theoretical_basis - margin),
      methodological_rigor: Math.max(0, confidence.methodological_rigor - margin),
      consensus_alignment: Math.max(0, confidence.consensus_alignment - margin)
    };

    const upper: ConfidenceVector = {
      empirical_support: Math.min(1, confidence.empirical_support + margin),
      theoretical_basis: Math.min(1, confidence.theoretical_basis + margin),
      methodological_rigor: Math.min(1, confidence.methodological_rigor + margin),
      consensus_alignment: Math.min(1, confidence.consensus_alignment + margin)
    };

    return { lower, upper };
  }

  /**
   * Compare two confidence vectors and determine which is stronger
   */
  compareConfidence(conf1: ConfidenceVector, conf2: ConfidenceVector): number {
    const score1 = this.getConfidenceScore(conf1);
    const score2 = this.getConfidenceScore(conf2);
    
    return score1 - score2; // Positive if conf1 > conf2
  }

  private getConfidenceScore(confidence: ConfidenceVector): number {
    // Weighted sum of confidence dimensions
    return (
      confidence.empirical_support * 0.3 +
      confidence.theoretical_basis * 0.25 +
      confidence.methodological_rigor * 0.25 +
      confidence.consensus_alignment * 0.2
    );
  }

  /**
   * Detect if confidence has converged (for iterative updates)
   */
  hasConverged(
    previous: ConfidenceVector,
    current: ConfidenceVector,
    threshold: number = 0.01
  ): boolean {
    const diff = Math.abs(this.getConfidenceScore(current) - this.getConfidenceScore(previous));
    return diff < threshold;
  }
}
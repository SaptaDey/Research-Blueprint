import { EdgeType } from '../types/index.js';

/**
 * Temporal Analysis System (P1.18, P1.25)
 * Handles temporal dynamics and pattern detection
 */
export class TemporalAnalyzer {
  private temporalPatterns: Map<string, RegExp> = new Map([
    ['sequential', /then|next|after|following|subsequently/i],
    ['cyclic', /cycle|periodic|recurring|repeating|cyclical/i],
    ['delayed', /delay|lag|later|eventually|gradual/i],
    ['immediate', /immediate|instant|direct|right away|at once/i],
    ['conditional', /if.*then|when.*then|depends on|conditional/i],
    ['causal_chain', /leads to|results in|causes|triggers|initiates/i]
  ]);

  /**
   * Detect temporal patterns in content
   */
  detectTemporalPatterns(content: string): {
    patterns: Array<{
      type: string;
      confidence: number;
      description: string;
      edge_type: EdgeType;
    }>;
    temporal_markers: string[];
    sequence_indicators: string[];
  } {
    const patterns = [];
    const temporal_markers: string[] = [];
    const sequence_indicators: string[] = [];

    try {
      // Pattern detection
      for (const [patternType, regex] of this.temporalPatterns.entries()) {
        const matches = content.match(regex);
        if (matches) {
          const confidence = this.calculatePatternConfidence(patternType, matches.length, content.length);
          patterns.push({
            type: patternType,
            confidence,
            description: this.getPatternDescription(patternType),
            edge_type: this.mapToEdgeType(patternType)
          });
          
          temporal_markers.push(...matches);
        }
      }

      // Sequence indicator detection
      const sequenceWords = this.extractSequenceIndicators(content);
      sequence_indicators.push(...sequenceWords);

      return { patterns, temporal_markers, sequence_indicators };

    } catch (error) {
      console.error('Temporal pattern detection failed:', error);
      return { patterns: [], temporal_markers: [], sequence_indicators: [] };
    }
  }

  /**
   * Apply temporal decay to confidence values
   */
  applyTemporalDecay(
    originalConfidence: number,
    timestamp: Date,
    decayRate: number = 0.1,
    halfLife: number = 365 // days
  ): number {
    const daysSince = (Date.now() - timestamp.getTime()) / (1000 * 60 * 60 * 24);
    const effectiveDecayRate = Math.max(decayRate, 0.01); // Minimum decay rate
    const decayFactor = Math.exp(-Math.log(2) * daysSince / halfLife * effectiveDecayRate);
    
    return originalConfidence * decayFactor;
  }

  /**
   * Calculate temporal relevance score
   */
  calculateTemporalRelevance(
    timestamp: Date,
    currentDate: Date = new Date(),
    domain: string = 'general'
  ): {
    score: number;
    category: 'current' | 'recent' | 'dated' | 'historical';
    recommendation: string;
  } {
    const daysDiff = (currentDate.getTime() - timestamp.getTime()) / (1000 * 60 * 60 * 24);
    
    // Domain-specific relevance thresholds
    const thresholds = this.getTemporalThresholds(domain);
    
    let score: number;
    let category: 'current' | 'recent' | 'dated' | 'historical';
    let recommendation: string;

    if (daysDiff <= thresholds.current) {
      score = 1.0;
      category = 'current';
      recommendation = 'Highly relevant and current';
    } else if (daysDiff <= thresholds.recent) {
      score = 0.8 - (daysDiff - thresholds.current) / (thresholds.recent - thresholds.current) * 0.3;
      category = 'recent';
      recommendation = 'Recent and relevant';
    } else if (daysDiff <= thresholds.dated) {
      score = 0.5 - (daysDiff - thresholds.recent) / (thresholds.dated - thresholds.recent) * 0.3;
      category = 'dated';
      recommendation = 'May need verification with recent sources';
    } else {
      score = Math.max(0.1, 0.2 - (daysDiff - thresholds.dated) / 3650 * 0.1);
      category = 'historical';
      recommendation = 'Historical perspective - verify current relevance';
    }

    return { score: Math.max(0, Math.min(1, score)), category, recommendation };
  }

  /**
   * Analyze temporal trends in confidence over time
   */
  analyzeTrends(
    confidenceHistory: Array<{ timestamp: Date; confidence: number }>,
    windowDays: number = 30
  ): {
    trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    slope: number;
    volatility: number;
    prediction: number;
    confidence_interval: [number, number];
  } {
    if (confidenceHistory.length < 2) {
      return {
        trend: 'stable',
        slope: 0,
        volatility: 0,
        prediction: confidenceHistory[0]?.confidence || 0.5,
        confidence_interval: [0.4, 0.6]
      };
    }

    // Sort by timestamp
    const sortedHistory = confidenceHistory.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // Calculate linear trend
    const slope = this.calculateLinearTrend(sortedHistory);
    
    // Calculate volatility (standard deviation of changes)
    const volatility = this.calculateVolatility(sortedHistory);
    
    // Determine trend category
    const trend = this.categorizeTrend(slope, volatility);
    
    // Simple prediction (last value + trend)
    const lastConfidence = sortedHistory[sortedHistory.length - 1].confidence;
    const prediction = Math.max(0, Math.min(1, lastConfidence + slope * windowDays));
    
    // Confidence interval based on volatility
    const margin = volatility * 1.96; // 95% confidence
    const confidence_interval: [number, number] = [
      Math.max(0, prediction - margin),
      Math.min(1, prediction + margin)
    ];

    return { trend, slope, volatility, prediction, confidence_interval };
  }

  /**
   * Detect temporal anomalies
   */
  detectTemporalAnomalies(
    events: Array<{ timestamp: Date; value: number; description: string }>,
    threshold: number = 2.0 // standard deviations
  ): Array<{
    timestamp: Date;
    value: number;
    description: string;
    anomaly_type: 'spike' | 'drop' | 'gap' | 'pattern_break';
    severity: number;
  }> {
    const anomalies: Array<{
      timestamp: Date;
      value: number;
      description: string;
      anomaly_type: 'spike' | 'drop' | 'gap' | 'pattern_break';
      severity: number;
    }> = [];

    if (events.length < 3) return anomalies;

    const sortedEvents = events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const values = sortedEvents.map(e => e.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const std = Math.sqrt(values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length);

    for (let i = 1; i < sortedEvents.length - 1; i++) {
      const event = sortedEvents[i];
      const zScore = Math.abs(event.value - mean) / std;

      if (zScore > threshold) {
        const anomaly_type: 'spike' | 'drop' = event.value > mean ? 'spike' : 'drop';
        const severity = Math.min(1, zScore / (threshold * 2));

        anomalies.push({
          timestamp: event.timestamp,
          value: event.value,
          description: event.description,
          anomaly_type,
          severity
        });
      }

      // Check for temporal gaps
      const prevTime = sortedEvents[i - 1].timestamp.getTime();
      const currTime = event.timestamp.getTime();
      const nextTime = sortedEvents[i + 1].timestamp.getTime();
      
      const avgGap = (nextTime - prevTime) / 2;
      const actualGap = currTime - prevTime;
      
      if (actualGap > avgGap * 3) { // Significant gap
        anomalies.push({
          timestamp: event.timestamp,
          value: event.value,
          description: event.description,
          anomaly_type: 'gap' as const,
          severity: Math.min(1, actualGap / (avgGap * 5))
        });
      }
    }

    return anomalies;
  }

  /**
   * Create temporal metadata for edges
   */
  createTemporalMetadata(
    sourceTimestamp: Date,
    targetTimestamp: Date,
    patternType: string,
    content: string = ''
  ): {
    delay_duration?: number;
    pattern_type: string;
    frequency?: number;
    confidence: number;
    temporal_relationship: string;
  } {
    const timeDiff = targetTimestamp.getTime() - sourceTimestamp.getTime();
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

    const metadata: any = {
      pattern_type: patternType,
      confidence: this.calculatePatternConfidence(patternType, 1, content.length)
    };

    if (daysDiff > 0) {
      metadata.delay_duration = daysDiff;
      metadata.temporal_relationship = 'follows';
    } else if (daysDiff < 0) {
      metadata.delay_duration = Math.abs(daysDiff);
      metadata.temporal_relationship = 'precedes';
    } else {
      metadata.temporal_relationship = 'concurrent';
    }

    // Estimate frequency for cyclic patterns
    if (patternType === 'cyclic') {
      metadata.frequency = this.estimateFrequency(content, daysDiff);
    }

    return metadata;
  }

  // Helper methods
  private calculatePatternConfidence(patternType: string, matchCount: number, contentLength: number): number {
    const baseConfidence = Math.min(0.9, matchCount / 10); // Up to 90% for many matches
    const lengthAdjustment = Math.min(1, contentLength / 1000); // Adjust for content length
    const patternWeight = this.getPatternWeight(patternType);
    
    return Math.max(0.1, Math.min(0.9, baseConfidence * lengthAdjustment * patternWeight));
  }

  private getPatternWeight(patternType: string): number {
    const weights = new Map([
      ['causal_chain', 1.0],
      ['sequential', 0.9],
      ['conditional', 0.8],
      ['cyclic', 0.8],
      ['delayed', 0.7],
      ['immediate', 0.6]
    ]);
    
    return weights.get(patternType) || 0.5;
  }

  private getPatternDescription(patternType: string): string {
    const descriptions = new Map([
      ['sequential', 'Events follow in sequence'],
      ['cyclic', 'Recurring or periodic pattern'],
      ['delayed', 'Time lag between cause and effect'],
      ['immediate', 'Direct temporal relationship'],
      ['conditional', 'Conditional temporal dependency'],
      ['causal_chain', 'Causal sequence of events']
    ]);
    
    return descriptions.get(patternType) || 'Unspecified temporal pattern';
  }

  private mapToEdgeType(patternType: string): EdgeType {
    const mapping = new Map([
      ['sequential', EdgeType.SEQUENTIAL],
      ['cyclic', EdgeType.CYCLIC],
      ['delayed', EdgeType.DELAYED],
      ['immediate', EdgeType.TEMPORAL_PRECEDENCE],
      ['conditional', EdgeType.TEMPORAL_PRECEDENCE],
      ['causal_chain', EdgeType.CAUSAL]
    ]);
    
    return mapping.get(patternType) || EdgeType.OTHER;
  }

  private extractSequenceIndicators(content: string): string[] {
    const indicators = [];
    const sequencePattern = /\b(first|second|third|then|next|finally|subsequently|meanwhile|simultaneously)\b/gi;
    const matches = content.match(sequencePattern);
    
    if (matches) {
      indicators.push(...matches.map(match => match.toLowerCase()));
    }
    
    return [...new Set(indicators)];
  }

  private getTemporalThresholds(domain: string): {
    current: number;
    recent: number;
    dated: number;
  } {
    const domainThresholds = new Map([
      ['technology', { current: 30, recent: 180, dated: 730 }],
      ['medicine', { current: 90, recent: 365, dated: 1825 }],
      ['policy', { current: 180, recent: 730, dated: 2190 }],
      ['science', { current: 180, recent: 1095, dated: 3650 }],
      ['general', { current: 90, recent: 365, dated: 1825 }]
    ]);
    
    return domainThresholds.get(domain) || domainThresholds.get('general')!;
  }

  private calculateLinearTrend(sortedHistory: Array<{ timestamp: Date; confidence: number }>): number {
    const n = sortedHistory.length;
    if (n < 2) return 0;

    const xValues = sortedHistory.map((_, i) => i);
    const yValues = sortedHistory.map(h => h.confidence);
    
    const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
    const yMean = yValues.reduce((sum, y) => sum + y, 0) / n;
    
    const numerator = xValues.reduce((sum, x, i) => sum + (x - xMean) * (yValues[i] - yMean), 0);
    const denominator = xValues.reduce((sum, x) => sum + (x - xMean) ** 2, 0);
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private calculateVolatility(sortedHistory: Array<{ timestamp: Date; confidence: number }>): number {
    if (sortedHistory.length < 2) return 0;

    const changes = [];
    for (let i = 1; i < sortedHistory.length; i++) {
      changes.push(sortedHistory[i].confidence - sortedHistory[i - 1].confidence);
    }

    const mean = changes.reduce((sum, change) => sum + change, 0) / changes.length;
    const variance = changes.reduce((sum, change) => sum + (change - mean) ** 2, 0) / changes.length;
    
    return Math.sqrt(variance);
  }

  private categorizeTrend(slope: number, volatility: number): 'increasing' | 'decreasing' | 'stable' | 'volatile' {
    const slopeThreshold = 0.01;
    const volatilityThreshold = 0.1;

    if (volatility > volatilityThreshold) {
      return 'volatile';
    } else if (slope > slopeThreshold) {
      return 'increasing';
    } else if (slope < -slopeThreshold) {
      return 'decreasing';
    } else {
      return 'stable';
    }
  }

  private estimateFrequency(content: string, daysDiff: number): number {
    // Simple heuristic for frequency estimation
    const frequencyKeywords = new Map([
      ['daily', 1],
      ['weekly', 7],
      ['monthly', 30],
      ['quarterly', 90],
      ['annually', 365],
      ['yearly', 365]
    ]);

    for (const [keyword, days] of frequencyKeywords.entries()) {
      if (content.toLowerCase().includes(keyword)) {
        return days;
      }
    }

    // Default to time difference if no explicit frequency found
    return Math.abs(daysDiff) || 30;
  }
}
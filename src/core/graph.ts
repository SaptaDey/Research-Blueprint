import { v4 as uuidv4 } from 'uuid';
import { 
  ASRGoTGraphState, 
  GraphNode, 
  GraphEdge, 
  Hyperedge,
  NodeMetadata, 
  EdgeMetadata,
  NodeType,
  EdgeType,
  ConfidenceVector,
  TopologyMetrics
} from '../types/index.js';
import { BayesianUpdater } from '../utils/bayesian.js';
import { InformationTheory } from '../utils/information-theory.js';

export class ASRGoTGraph {
  private state: ASRGoTGraphState;
  private bayesianUpdater: BayesianUpdater;
  private infoTheory: InformationTheory;

  constructor() {
    this.state = {
      timestamp: new Date(),
      vertices: new Map(),
      edges: new Map(),
      hyperedges: new Map(),
      layers: new Map(),
      node_types: new Map(),
      confidence_function: new Map(),
      metadata_function: new Map(),
      info_metrics: new Map()
    };
    this.bayesianUpdater = new BayesianUpdater();
    this.infoTheory = new InformationTheory();
  }

  // Node Management
  addNode(metadata: NodeMetadata): string {
    try {
      // Validate metadata
      if (!metadata || !metadata.node_id) {
        throw new Error('Invalid metadata: node_id is required');
      }

      // Check for duplicate IDs
      if (this.state.vertices.has(metadata.node_id)) {
        console.warn(`Node ${metadata.node_id} already exists, generating new ID`);
        metadata.node_id = uuidv4();
      }

      const node: GraphNode = {
        id: metadata.node_id,
        metadata: {
          ...metadata,
          // Ensure required fields have defaults
          confidence: metadata.confidence || {
            empirical_support: 0.5,
            theoretical_basis: 0.5,
            methodological_rigor: 0.5,
            consensus_alignment: 0.5
          },
          disciplinary_tags: metadata.disciplinary_tags || ['general'],
          bias_flags: metadata.bias_flags || [],
          revision_history: metadata.revision_history || [{
            timestamp: new Date(),
            change: 'Node created',
            author: 'ASR-GoT System'
          }],
          impact_score: metadata.impact_score || 0.5
        }
      };

      this.state.vertices.set(node.id, node);
      this.state.node_types.set(node.id, metadata.type);
      this.state.confidence_function.set(node.id, node.metadata.confidence);
      this.state.metadata_function.set(node.id, node.metadata);

      // Handle layer assignment (P1.23)
      if (metadata.layer_id) {
        if (!this.state.layers.has(metadata.layer_id)) {
          this.state.layers.set(metadata.layer_id, []);
        }
        this.state.layers.get(metadata.layer_id)!.push(node.id);
      }

      this.updateTimestamp();
      return node.id;
    } catch (error) {
      console.error('Failed to add node:', error);
      throw new Error(`Node creation failed: ${(error as Error).message}`);
    }
  }

  getNode(nodeId: string): GraphNode | undefined {
    return this.state.vertices.get(nodeId);
  }

  updateNodeConfidence(nodeId: string, newConfidence: ConfidenceVector, evidence?: any): boolean {
    try {
      const node = this.state.vertices.get(nodeId);
      if (!node) return false;

      // Apply Bayesian update (P1.14)
      const updatedConfidence = this.bayesianUpdater.updateConfidence(
        node.metadata.confidence,
        newConfidence,
        evidence
      );

      node.metadata.confidence = updatedConfidence;
      this.state.confidence_function.set(nodeId, updatedConfidence);
      
      // Update revision history
      node.metadata.revision_history.push({
        timestamp: new Date(),
        change: `Confidence updated via Bayesian inference`,
        author: 'ASR-GoT System'
      });

      this.updateTimestamp();
      return true;
    } catch (error) {
      console.error(`Failed to update confidence for node ${nodeId}:`, error);
      return false;
    }
  }

  // Edge Management
  addEdge(sourceId: string, targetId: string, metadata: EdgeMetadata): string {
    try {
      // Validate edge parameters
      if (!sourceId || !targetId || !metadata || !metadata.edge_id) {
        throw new Error('Invalid edge parameters: sourceId, targetId, and metadata.edge_id are required');
      }

      // Check if source and target nodes exist
      if (!this.state.vertices.has(sourceId)) {
        throw new Error(`Source node ${sourceId} does not exist`);
      }
      if (!this.state.vertices.has(targetId)) {
        throw new Error(`Target node ${targetId} does not exist`);
      }

      // Check for duplicate edge IDs
      if (this.state.edges.has(metadata.edge_id)) {
        console.warn(`Edge ${metadata.edge_id} already exists, generating new ID`);
        metadata.edge_id = uuidv4();
      }

      const edge: GraphEdge = {
        id: metadata.edge_id,
        source: sourceId,
        target: targetId,
        metadata: {
          ...metadata,
          // Ensure confidence has defaults
          confidence: metadata.confidence || {
            empirical_support: 0.5,
            theoretical_basis: 0.5,
            methodological_rigor: 0.5,
            consensus_alignment: 0.5
          },
          timestamp: metadata.timestamp || new Date()
        }
      };

      this.state.edges.set(edge.id, edge);
      this.updateTimestamp();
      return edge.id;
    } catch (error) {
      console.error('Failed to add edge:', error);
      throw new Error(`Edge creation failed: ${(error as Error).message}`);
    }
  }

  getEdge(edgeId: string): GraphEdge | undefined {
    return this.state.edges.get(edgeId);
  }

  // Hyperedge Management (P1.9)
  addHyperedge(nodeIds: string[], metadata: EdgeMetadata): string {
    const hyperedge: Hyperedge = {
      id: metadata.edge_id,
      nodes: nodeIds,
      metadata
    };

    this.state.hyperedges.set(hyperedge.id, hyperedge);
    this.updateTimestamp();
    return hyperedge.id;
  }

  // Interdisciplinary Bridge Node Creation (P1.8)
  createIBN(sourceNodeId: string, targetNodeId: string, semantic_similarity: number): string | null {
    try {
      const sourceNode = this.getNode(sourceNodeId);
      const targetNode = this.getNode(targetNodeId);

      if (!sourceNode || !targetNode) return null;

      const sourceTags = sourceNode.metadata.disciplinary_tags;
      const targetTags = targetNode.metadata.disciplinary_tags;

      // Check for interdisciplinary criteria (P1.8)
      const hasIntersection = sourceTags.some(tag => targetTags.includes(tag));
      if (hasIntersection || semantic_similarity <= 0.5) return null;

      // Create IBN
      const ibnMetadata: NodeMetadata = {
        node_id: uuidv4(),
        label: `IBN: ${sourceNode.metadata.label} ↔ ${targetNode.metadata.label}`,
        type: NodeType.IBN,
        timestamp: new Date(),
        provenance: `Interdisciplinary Bridge between ${sourceNodeId} and ${targetNodeId}`,
        confidence: this.averageConfidence(sourceNode.metadata.confidence, targetNode.metadata.confidence),
        epistemic_status: 'interdisciplinary_bridge',
        disciplinary_tags: [...sourceTags, ...targetTags],
        bias_flags: [],
        revision_history: [{
          timestamp: new Date(),
          change: 'IBN created automatically',
          author: 'ASR-GoT System'
        }],
        impact_score: Math.max(sourceNode.metadata.impact_score, targetNode.metadata.impact_score)
      };

      const ibnId = this.addNode(ibnMetadata);

      // Create connecting edges
      this.addEdge(sourceNodeId, ibnId, {
        edge_id: uuidv4(),
        edge_type: EdgeType.OTHER,
        confidence: sourceNode.metadata.confidence,
        timestamp: new Date()
      });

      this.addEdge(ibnId, targetNodeId, {
        edge_id: uuidv4(),
        edge_type: EdgeType.OTHER,
        confidence: targetNode.metadata.confidence,
        timestamp: new Date()
      });

      return ibnId;
    } catch (error) {
      console.error('Failed to create IBN:', error);
      return null;
    }
  }

  // Dynamic Topology Operations (P1.22)
  updateTopologyMetrics(nodeId: string): TopologyMetrics {
    const metrics: TopologyMetrics = {
      degree: this.getNodeDegree(nodeId),
      centrality: this.calculateCentrality(nodeId),
      clustering_coefficient: this.calculateClusteringCoefficient(nodeId),
      betweenness: this.calculateBetweenness(nodeId)
    };

    const node = this.getNode(nodeId);
    if (node) {
      node.metadata.topology_metrics = metrics;
    }

    return metrics;
  }

  // Graph Analysis Methods
  private getNodeDegree(nodeId: string): number {
    let degree = 0;
    for (const edge of this.state.edges.values()) {
      if (edge.source === nodeId || edge.target === nodeId) {
        degree++;
      }
    }
    return degree;
  }

  private calculateCentrality(nodeId: string): number {
    // Simplified degree centrality calculation
    const totalNodes = this.state.vertices.size;
    if (totalNodes <= 1) return 0;
    
    return this.getNodeDegree(nodeId) / (totalNodes - 1);
  }

  private calculateClusteringCoefficient(nodeId: string): number {
    // Simplified clustering coefficient calculation
    const neighbors = this.getNeighbors(nodeId);
    if (neighbors.length < 2) return 0;

    let triangles = 0;
    const possibleTriangles = (neighbors.length * (neighbors.length - 1)) / 2;

    for (let i = 0; i < neighbors.length; i++) {
      for (let j = i + 1; j < neighbors.length; j++) {
        if (this.areConnected(neighbors[i], neighbors[j])) {
          triangles++;
        }
      }
    }

    return triangles / possibleTriangles;
  }

  private calculateBetweenness(nodeId: string): number {
    // Simplified betweenness centrality (placeholder - would need full shortest path calculation)
    return this.getNodeDegree(nodeId) / this.state.vertices.size;
  }

  getNeighbors(nodeId: string): string[] {
    const neighbors: string[] = [];
    for (const edge of this.state.edges.values()) {
      if (edge.source === nodeId) {
        neighbors.push(edge.target);
      } else if (edge.target === nodeId) {
        neighbors.push(edge.source);
      }
    }
    return neighbors;
  }

  private areConnected(nodeId1: string, nodeId2: string): boolean {
    for (const edge of this.state.edges.values()) {
      if ((edge.source === nodeId1 && edge.target === nodeId2) ||
          (edge.source === nodeId2 && edge.target === nodeId1)) {
        return true;
      }
    }
    return false;
  }

  // Utility Methods
  private averageConfidence(conf1: ConfidenceVector, conf2: ConfidenceVector): ConfidenceVector {
    return {
      empirical_support: (conf1.empirical_support + conf2.empirical_support) / 2,
      theoretical_basis: (conf1.theoretical_basis + conf2.theoretical_basis) / 2,
      methodological_rigor: (conf1.methodological_rigor + conf2.methodological_rigor) / 2,
      consensus_alignment: (conf1.consensus_alignment + conf2.consensus_alignment) / 2
    };
  }

  private updateTimestamp(): void {
    this.state.timestamp = new Date();
  }

  // Pruning and Merging (P1.5)
  pruneNodes(confidenceThreshold: number = 0.2, impactThreshold: number = 0.1): string[] {
    const prunedNodes: string[] = [];

    for (const [nodeId, node] of this.state.vertices.entries()) {
      const avgConfidence = this.getAverageConfidence(node.metadata.confidence);
      
      if (avgConfidence < confidenceThreshold && node.metadata.impact_score < impactThreshold) {
        this.removeNode(nodeId);
        prunedNodes.push(nodeId);
      }
    }

    return prunedNodes;
  }

  mergeNodes(nodeId1: string, nodeId2: string, semanticOverlap: number): string | null {
    if (semanticOverlap < 0.8) return null;

    const node1 = this.getNode(nodeId1);
    const node2 = this.getNode(nodeId2);

    if (!node1 || !node2) return null;

    // Create merged node
    const mergedMetadata: NodeMetadata = {
      node_id: uuidv4(),
      label: `${node1.metadata.label} + ${node2.metadata.label}`,
      type: node1.metadata.type,
      timestamp: new Date(),
      provenance: `Merged from ${nodeId1} and ${nodeId2}`,
      confidence: this.averageConfidence(node1.metadata.confidence, node2.metadata.confidence),
      epistemic_status: 'merged',
      disciplinary_tags: [...new Set([...node1.metadata.disciplinary_tags, ...node2.metadata.disciplinary_tags])],
      bias_flags: [...new Set([...node1.metadata.bias_flags, ...node2.metadata.bias_flags])],
      revision_history: [
        ...node1.metadata.revision_history,
        ...node2.metadata.revision_history,
        {
          timestamp: new Date(),
          change: 'Node created by merging',
          author: 'ASR-GoT System'
        }
      ],
      impact_score: Math.max(node1.metadata.impact_score, node2.metadata.impact_score)
    };

    const mergedId = this.addNode(mergedMetadata);

    // Transfer edges
    this.transferEdges(nodeId1, mergedId);
    this.transferEdges(nodeId2, mergedId);

    // Remove original nodes
    this.removeNode(nodeId1);
    this.removeNode(nodeId2);

    return mergedId;
  }

  removeNode(nodeId: string): void {
    this.state.vertices.delete(nodeId);
    this.state.node_types.delete(nodeId);
    this.state.confidence_function.delete(nodeId);
    this.state.metadata_function.delete(nodeId);
    this.state.info_metrics.delete(nodeId);

    // Remove from layers
    for (const [, nodeIds] of this.state.layers.entries()) {
      const index = nodeIds.indexOf(nodeId);
      if (index > -1) {
        nodeIds.splice(index, 1);
      }
    }

    // Remove connected edges
    const edgesToRemove: string[] = [];
    for (const [edgeId, edge] of this.state.edges.entries()) {
      if (edge.source === nodeId || edge.target === nodeId) {
        edgesToRemove.push(edgeId);
      }
    }
    edgesToRemove.forEach(edgeId => this.state.edges.delete(edgeId));
  }

  private transferEdges(fromNodeId: string, toNodeId: string): void {
    for (const edge of this.state.edges.values()) {
      if (edge.source === fromNodeId) {
        edge.source = toNodeId;
      } else if (edge.target === fromNodeId) {
        edge.target = toNodeId;
      }
    }
  }

  private getAverageConfidence(confidence: ConfidenceVector): number {
    return (confidence.empirical_support + confidence.theoretical_basis + 
            confidence.methodological_rigor + confidence.consensus_alignment) / 4;
  }

  // Getters
  getState(): ASRGoTGraphState {
    return { ...this.state };
  }

  getNodeCount(): number {
    return this.state.vertices.size;
  }

  getEdgeCount(): number {
    return this.state.edges.size;
  }

  getHyperedgeCount(): number {
    return this.state.hyperedges.size;
  }

  isEmpty(): boolean {
    return this.getNodeCount() === 0 && this.getEdgeCount() === 0;
  }

  hasNode(nodeId: string): boolean {
    return this.state.vertices.has(nodeId);
  }

  hasEdge(edgeId: string): boolean {
    return this.state.edges.has(edgeId);
  }

  // Subgraph extraction (P1.6)
  extractSubgraph(criteria: {
    confidence_threshold?: number;
    node_types?: NodeType[];
    edge_types?: EdgeType[];
    layer_ids?: string[];
    impact_threshold?: number;
    temporal_recency_days?: number;
  }): { nodes: GraphNode[]; edges: GraphEdge[] } {
    try {
      const filteredNodes: GraphNode[] = [];
      const filteredEdges: GraphEdge[] = [];

      // Filter nodes with error handling
      for (const node of this.state.vertices.values()) {
        try {
          if (this.matchesCriteria(node, criteria)) {
            filteredNodes.push(node);
          }
        } catch (nodeError) {
          console.warn(`Error filtering node ${node.id}:`, nodeError);
          // Continue with next node
        }
      }

      const nodeIds = new Set(filteredNodes.map(n => n.id));

      // Filter edges that connect filtered nodes
      for (const edge of this.state.edges.values()) {
        try {
          if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
            if (!criteria.edge_types || criteria.edge_types.includes(edge.metadata.edge_type)) {
              filteredEdges.push(edge);
            }
          }
        } catch (edgeError) {
          console.warn(`Error filtering edge ${edge.id}:`, edgeError);
          // Continue with next edge
        }
      }

      // Ensure we return something even if filtering failed
      if (filteredNodes.length === 0 && this.state.vertices.size > 0) {
        // Emergency fallback: return first few nodes
        const allNodes = Array.from(this.state.vertices.values());
        const emergencyNodes = allNodes.slice(0, Math.min(5, allNodes.length));
        console.warn('Subgraph extraction failed, returning emergency subset');
        return { nodes: emergencyNodes, edges: [] };
      }

      return { nodes: filteredNodes, edges: filteredEdges };
    } catch (error) {
      console.error('Subgraph extraction failed:', error);
      // Ultimate fallback: return all nodes
      const allNodes = Array.from(this.state.vertices.values());
      const allEdges = Array.from(this.state.edges.values());
      return { nodes: allNodes, edges: allEdges };
    }
  }

  private matchesCriteria(node: GraphNode, criteria: any): boolean {
    try {
      // Ensure node and metadata exist
      if (!node || !node.metadata) {
        return false;
      }

      // Confidence threshold
      if (criteria.confidence_threshold) {
        try {
          const avgConfidence = this.getAverageConfidence(node.metadata.confidence);
          if (avgConfidence < criteria.confidence_threshold) {
            return false;
          }
        } catch (confError) {
          console.warn(`Confidence check failed for node ${node.id}:`, confError);
          // If confidence check fails, use default threshold
          if (criteria.confidence_threshold > 0.5) {
            return false;
          }
        }
      }

      // Node types
      if (criteria.node_types && criteria.node_types.length > 0) {
        if (!node.metadata.type || !criteria.node_types.includes(node.metadata.type)) {
          return false;
        }
      }

      // Layer IDs
      if (criteria.layer_ids && criteria.layer_ids.length > 0) {
        if (!node.metadata.layer_id || !criteria.layer_ids.includes(node.metadata.layer_id)) {
          return false;
        }
      }

      // Impact threshold
      if (criteria.impact_threshold !== undefined) {
        const impact = node.metadata.impact_score ?? 0.5;
        if (impact < criteria.impact_threshold) {
          return false;
        }
      }

      // Temporal recency
      if (criteria.temporal_recency_days) {
        try {
          const timestamp = node.metadata.timestamp;
          if (timestamp) {
            const daysDiff = (Date.now() - timestamp.getTime()) / (1000 * 60 * 60 * 24);
            if (daysDiff > criteria.temporal_recency_days) {
              return false;
            }
          }
        } catch (timeError) {
          console.warn(`Temporal check failed for node ${node.id}:`, timeError);
          // If timestamp is invalid, assume it's recent enough
        }
      }

      return true;
    } catch (error) {
      console.warn(`Criteria matching failed for node ${node?.id}:`, error);
      return false;
    }
  }
}

// Export types used in tests
export { GraphNode, GraphEdge };
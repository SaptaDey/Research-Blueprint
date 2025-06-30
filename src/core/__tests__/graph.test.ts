import { Graph, GraphNode, GraphEdge } from '../graph';

describe('Graph', () => {
  let graph: Graph;

  beforeEach(() => {
    graph = new Graph();
  });

  describe('Node Management', () => {
    describe('addNode', () => {
      test('should add a node with data', () => {
        const nodeData = { name: 'test', value: 42 };
        graph.addNode('node1', nodeData);
        
        expect(graph.hasNode('node1')).toBe(true);
        expect(graph.getNodeCount()).toBe(1);
        
        const retrievedNode = graph.getNode('node1');
        expect(retrievedNode).toEqual({ id: 'node1', data: nodeData });
      });

      test('should add multiple nodes', () => {
        graph.addNode('node1', { value: 1 });
        graph.addNode('node2', { value: 2 });
        graph.addNode('node3', { value: 3 });
        
        expect(graph.getNodeCount()).toBe(3);
        expect(graph.hasNode('node1')).toBe(true);
        expect(graph.hasNode('node2')).toBe(true);
        expect(graph.hasNode('node3')).toBe(true);
      });

      test('should handle duplicate node IDs by updating data', () => {
        graph.addNode('duplicate', { version: 1 });
        graph.addNode('duplicate', { version: 2 });
        
        expect(graph.getNodeCount()).toBe(1);
        const node = graph.getNode('duplicate');
        expect(node?.data).toEqual({ version: 2 });
      });

      test('should throw error for empty node ID', () => {
        expect(() => graph.addNode('', { data: 'test' })).toThrow('Node ID cannot be empty');
        expect(() => graph.addNode(null as any, { data: 'test' })).toThrow('Node ID cannot be empty');
        expect(() => graph.addNode(undefined as any, { data: 'test' })).toThrow('Node ID cannot be empty');
      });

      test('should handle nodes with null or undefined data', () => {
        graph.addNode('null-data', null);
        graph.addNode('undefined-data', undefined);
        
        expect(graph.hasNode('null-data')).toBe(true);
        expect(graph.hasNode('undefined-data')).toBe(true);
        expect(graph.getNode('null-data')?.data).toBeNull();
        expect(graph.getNode('undefined-data')?.data).toBeUndefined();
      });

      test('should handle complex nested data structures', () => {
        const complexData = {
          nested: { deep: { value: 'test' } },
          array: [1, 2, { inner: true }],
          function: () => 'test',
          date: new Date(),
          map: new Map([['key', 'value']]),
          set: new Set([1, 2, 3])
        };
        
        graph.addNode('complex', complexData);
        const retrieved = graph.getNode('complex');
        expect(retrieved?.data).toEqual(complexData);
      });
    });

    describe('removeNode', () => {
      beforeEach(() => {
        graph.addNode('node1', { value: 1 });
        graph.addNode('node2', { value: 2 });
        graph.addNode('node3', { value: 3 });
        graph.addEdge('node1', 'node2');
        graph.addEdge('node2', 'node3');
        graph.addEdge('node3', 'node1');
      });

      test('should remove existing node and return true', () => {
        const result = graph.removeNode('node2');
        
        expect(result).toBe(true);
        expect(graph.hasNode('node2')).toBe(false);
        expect(graph.getNodeCount()).toBe(2);
      });

      test('should remove all edges connected to the removed node', () => {
        graph.removeNode('node2');
        
        expect(graph.hasEdge('node1', 'node2')).toBe(false);
        expect(graph.hasEdge('node2', 'node3')).toBe(false);
        expect(graph.getEdgeCount()).toBe(1); // Only node3->node1 should remain
      });

      test('should return false for non-existent node', () => {
        const result = graph.removeNode('non-existent');
        expect(result).toBe(false);
        expect(graph.getNodeCount()).toBe(3);
      });

      test('should handle removing node with self-loop', () => {
        graph.addEdge('node1', 'node1');
        expect(graph.hasEdge('node1', 'node1')).toBe(true);
        
        graph.removeNode('node1');
        expect(graph.hasNode('node1')).toBe(false);
        expect(graph.hasEdge('node1', 'node1')).toBe(false);
      });
    });

    describe('hasNode', () => {
      test('should return true for existing nodes', () => {
        graph.addNode('existing', {});
        expect(graph.hasNode('existing')).toBe(true);
      });

      test('should return false for non-existent nodes', () => {
        expect(graph.hasNode('non-existent')).toBe(false);
      });

      test('should handle null and undefined inputs gracefully', () => {
        expect(graph.hasNode(null as any)).toBe(false);
        expect(graph.hasNode(undefined as any)).toBe(false);
      });
    });

    describe('getNode', () => {
      test('should return node data for existing nodes', () => {
        const nodeData = { name: 'test node', id: 123 };
        graph.addNode('test', nodeData);
        
        const result = graph.getNode('test');
        expect(result).toEqual({ id: 'test', data: nodeData });
      });

      test('should return undefined for non-existent nodes', () => {
        expect(graph.getNode('non-existent')).toBeUndefined();
      });
    });

    describe('getNodes', () => {
      test('should return empty array for empty graph', () => {
        expect(graph.getNodes()).toEqual([]);
      });

      test('should return all nodes', () => {
        graph.addNode('node1', { value: 1 });
        graph.addNode('node2', { value: 2 });
        
        const nodes = graph.getNodes();
        expect(nodes).toHaveLength(2);
        expect(nodes.map(n => n.id)).toContain('node1');
        expect(nodes.map(n => n.id)).toContain('node2');
      });

      test('should return nodes with their data intact', () => {
        const data1 = { type: 'first' };
        const data2 = { type: 'second' };
        
        graph.addNode('node1', data1);
        graph.addNode('node2', data2);
        
        const nodes = graph.getNodes();
        const node1 = nodes.find(n => n.id === 'node1');
        const node2 = nodes.find(n => n.id === 'node2');
        
        expect(node1?.data).toEqual(data1);
        expect(node2?.data).toEqual(data2);
      });
    });
  });

  describe('Edge Management', () => {
    beforeEach(() => {
      graph.addNode('source', { type: 'start' });
      graph.addNode('target', { type: 'end' });
      graph.addNode('middle', { type: 'intermediate' });
    });

    describe('addEdge', () => {
      test('should add edge between existing nodes', () => {
        graph.addEdge('source', 'target');
        
        expect(graph.hasEdge('source', 'target')).toBe(true);
        expect(graph.getEdgeCount()).toBe(1);
      });

      test('should add edge with data', () => {
        const edgeData = { weight: 5, type: 'connection' };
        graph.addEdge('source', 'target', edgeData);
        
        const edge = graph.getEdge('source', 'target');
        expect(edge).toEqual({
          source: 'source',
          target: 'target',
          data: edgeData
        });
      });

      test('should throw error when source node does not exist', () => {
        expect(() => graph.addEdge('non-existent', 'target'))
          .toThrow('Both source and target nodes must exist');
      });

      test('should throw error when target node does not exist', () => {
        expect(() => graph.addEdge('source', 'non-existent'))
          .toThrow('Both source and target nodes must exist');
      });

      test('should allow self-loops', () => {
        graph.addEdge('source', 'source', { type: 'self-loop' });
        
        expect(graph.hasEdge('source', 'source')).toBe(true);
        expect(graph.getNeighbors('source')).toContain('source');
      });

      test('should handle duplicate edges by overwriting', () => {
        graph.addEdge('source', 'target', { weight: 1 });
        graph.addEdge('source', 'target', { weight: 2 });
        
        expect(graph.getEdgeCount()).toBe(1);
        const edge = graph.getEdge('source', 'target');
        expect(edge?.data).toEqual({ weight: 2 });
      });
    });

    describe('removeEdge', () => {
      beforeEach(() => {
        graph.addEdge('source', 'target', { type: 'test' });
        graph.addEdge('target', 'middle');
      });

      test('should remove existing edge and return true', () => {
        const result = graph.removeEdge('source', 'target');
        
        expect(result).toBe(true);
        expect(graph.hasEdge('source', 'target')).toBe(false);
        expect(graph.getEdgeCount()).toBe(1);
      });

      test('should return false for non-existent edge', () => {
        const result = graph.removeEdge('middle', 'source');
        
        expect(result).toBe(false);
        expect(graph.getEdgeCount()).toBe(2);
      });

      test('should not affect other edges', () => {
        graph.removeEdge('source', 'target');
        
        expect(graph.hasEdge('target', 'middle')).toBe(true);
      });
    });

    describe('hasEdge', () => {
      test('should return true for existing edges', () => {
        graph.addEdge('source', 'target');
        expect(graph.hasEdge('source', 'target')).toBe(true);
      });

      test('should return false for non-existent edges', () => {
        expect(graph.hasEdge('source', 'target')).toBe(false);
      });

      test('should be directional', () => {
        graph.addEdge('source', 'target');
        
        expect(graph.hasEdge('source', 'target')).toBe(true);
        expect(graph.hasEdge('target', 'source')).toBe(false);
      });
    });

    describe('getEdge', () => {
      test('should return edge data for existing edges', () => {
        const edgeData = { weight: 10, color: 'red' };
        graph.addEdge('source', 'target', edgeData);
        
        const edge = graph.getEdge('source', 'target');
        expect(edge).toEqual({
          source: 'source',
          target: 'target',
          data: edgeData
        });
      });

      test('should return undefined for non-existent edges', () => {
        expect(graph.getEdge('source', 'target')).toBeUndefined();
      });
    });

    describe('getEdges', () => {
      test('should return empty array for graph with no edges', () => {
        expect(graph.getEdges()).toEqual([]);
      });

      test('should return all edges', () => {
        graph.addEdge('source', 'target', { type: 'first' });
        graph.addEdge('target', 'middle', { type: 'second' });
        
        const edges = graph.getEdges();
        expect(edges).toHaveLength(2);
        
        const edgeTypes = edges.map(e => e.data?.type);
        expect(edgeTypes).toContain('first');
        expect(edgeTypes).toContain('second');
      });
    });

    describe('getNeighbors', () => {
      beforeEach(() => {
        graph.addEdge('source', 'target');
        graph.addEdge('source', 'middle');
      });

      test('should return neighbors of a node', () => {
        const neighbors = graph.getNeighbors('source');
        
        expect(neighbors).toHaveLength(2);
        expect(neighbors).toContain('target');
        expect(neighbors).toContain('middle');
      });

      test('should return empty array for node with no outgoing edges', () => {
        const neighbors = graph.getNeighbors('target');
        expect(neighbors).toEqual([]);
      });

      test('should return empty array for non-existent node', () => {
        const neighbors = graph.getNeighbors('non-existent');
        expect(neighbors).toEqual([]);
      });

      test('should include self in neighbors for self-loops', () => {
        graph.addEdge('source', 'source');
        const neighbors = graph.getNeighbors('source');
        
        expect(neighbors).toContain('source');
      });
    });
  });

  describe('Graph Properties', () => {
    describe('getNodeCount', () => {
      test('should return 0 for empty graph', () => {
        expect(graph.getNodeCount()).toBe(0);
      });

      test('should return correct count after adding nodes', () => {
        graph.addNode('node1', {});
        expect(graph.getNodeCount()).toBe(1);
        
        graph.addNode('node2', {});
        expect(graph.getNodeCount()).toBe(2);
      });

      test('should decrease after removing nodes', () => {
        graph.addNode('node1', {});
        graph.addNode('node2', {});
        
        graph.removeNode('node1');
        expect(graph.getNodeCount()).toBe(1);
      });
    });

    describe('getEdgeCount', () => {
      beforeEach(() => {
        graph.addNode('node1', {});
        graph.addNode('node2', {});
      });

      test('should return 0 for graph with no edges', () => {
        expect(graph.getEdgeCount()).toBe(0);
      });

      test('should return correct count after adding edges', () => {
        graph.addEdge('node1', 'node2');
        expect(graph.getEdgeCount()).toBe(1);
      });

      test('should decrease after removing edges', () => {
        graph.addEdge('node1', 'node2');
        graph.removeEdge('node1', 'node2');
        expect(graph.getEdgeCount()).toBe(0);
      });
    });

    describe('isEmpty', () => {
      test('should return true for empty graph', () => {
        expect(graph.isEmpty()).toBe(true);
      });

      test('should return false for graph with nodes', () => {
        graph.addNode('node1', {});
        expect(graph.isEmpty()).toBe(false);
      });

      test('should return true after removing all nodes', () => {
        graph.addNode('node1', {});
        graph.removeNode('node1');
        expect(graph.isEmpty()).toBe(true);
      });
    });
  });

  describe('Graph Traversal', () => {
    beforeEach(() => {
      // Create a sample graph: A -> B -> D, A -> C -> D
      graph.addNode('A', { name: 'start' });
      graph.addNode('B', { name: 'middle1' });
      graph.addNode('C', { name: 'middle2' });
      graph.addNode('D', { name: 'end' });
      
      graph.addEdge('A', 'B');
      graph.addEdge('A', 'C');
      graph.addEdge('B', 'D');
      graph.addEdge('C', 'D');
    });

    describe('breadthFirstSearch', () => {
      test('should return empty array for non-existent start node', () => {
        const result = graph.breadthFirstSearch('non-existent');
        expect(result).toEqual([]);
      });

      test('should perform BFS traversal correctly', () => {
        const result = graph.breadthFirstSearch('A');
        
        expect(result).toContain('A');
        expect(result).toContain('B');
        expect(result).toContain('C');
        expect(result).toContain('D');
        expect(result).toHaveLength(4);
        
        // A should be first
        expect(result[0]).toBe('A');
        
        // B and C should come before D (BFS property)
        const indexB = result.indexOf('B');
        const indexC = result.indexOf('C');
        const indexD = result.indexOf('D');
        
        expect(Math.min(indexB, indexC)).toBeLessThan(indexD);
      });

      test('should handle single node traversal', () => {
        const singleGraph = new Graph();
        singleGraph.addNode('single', {});
        
        const result = singleGraph.breadthFirstSearch('single');
        expect(result).toEqual(['single']);
      });

      test('should handle cycles correctly', () => {
        graph.addEdge('D', 'A'); // Create cycle
        
        const result = graph.breadthFirstSearch('A');
        
        // Should visit each node exactly once despite cycle
        expect(result).toHaveLength(4);
        expect(new Set(result).size).toBe(4);
      });

      test('should handle disconnected components', () => {
        // Add disconnected component
        graph.addNode('E', {});
        graph.addNode('F', {});
        graph.addEdge('E', 'F');
        
        const result = graph.breadthFirstSearch('A');
        
        // Should not reach disconnected component
        expect(result).not.toContain('E');
        expect(result).not.toContain('F');
      });
    });

    describe('depthFirstSearch', () => {
      test('should return empty array for non-existent start node', () => {
        const result = graph.depthFirstSearch('non-existent');
        expect(result).toEqual([]);
      });

      test('should perform DFS traversal correctly', () => {
        const result = graph.depthFirstSearch('A');
        
        expect(result).toContain('A');
        expect(result).toContain('B');
        expect(result).toContain('C');
        expect(result).toContain('D');
        expect(result).toHaveLength(4);
        
        // A should be first
        expect(result[0]).toBe('A');
      });

      test('should handle deep recursion without stack overflow', () => {
        // Create linear chain
        const chainGraph = new Graph();
        const chainLength = 100;
        
        for (let i = 0; i < chainLength; i++) {
          chainGraph.addNode(`node${i}`, { id: i });
          if (i > 0) {
            chainGraph.addEdge(`node${i-1}`, `node${i}`);
          }
        }
        
        const result = chainGraph.depthFirstSearch('node0');
        expect(result).toHaveLength(chainLength);
      });

      test('should handle cycles correctly', () => {
        graph.addEdge('D', 'A'); // Create cycle
        
        const result = graph.depthFirstSearch('A');
        
        // Should visit each node exactly once despite cycle
        expect(result).toHaveLength(4);
        expect(new Set(result).size).toBe(4);
      });
    });

    describe('findShortestPath', () => {
      test('should return empty array for non-existent start node', () => {
        const result = graph.findShortestPath('non-existent', 'A');
        expect(result).toEqual([]);
      });

      test('should return empty array for non-existent end node', () => {
        const result = graph.findShortestPath('A', 'non-existent');
        expect(result).toEqual([]);
      });

      test('should return single node path for same start and end', () => {
        const result = graph.findShortestPath('A', 'A');
        expect(result).toEqual(['A']);
      });

      test('should find direct path', () => {
        const result = graph.findShortestPath('A', 'B');
        expect(result).toEqual(['A', 'B']);
      });

      test('should find shortest path through multiple hops', () => {
        const result = graph.findShortestPath('A', 'D');
        
        expect(result).toHaveLength(3);
        expect(result[0]).toBe('A');
        expect(result[2]).toBe('D');
        expect(['B', 'C']).toContain(result[1]);
      });

      test('should return empty array for unreachable nodes', () => {
        graph.addNode('isolated', {});
        const result = graph.findShortestPath('A', 'isolated');
        expect(result).toEqual([]);
      });

      test('should handle complex graph with multiple paths', () => {
        // Add more complex connections
        graph.addNode('E', {});
        graph.addEdge('A', 'E');
        graph.addEdge('E', 'D');
        
        const result = graph.findShortestPath('A', 'D');
        
        // Should find one of the shortest paths (length 3)
        expect(result).toHaveLength(3);
        expect(result[0]).toBe('A');
        expect(result[2]).toBe('D');
      });
    });

    describe('topologicalSort', () => {
      test('should return empty array for empty graph', () => {
        const emptyGraph = new Graph();
        const result = emptyGraph.topologicalSort();
        expect(result).toEqual([]);
      });

      test('should return topological order for DAG', () => {
        const result = graph.topologicalSort();
        
        expect(result).toHaveLength(4);
        expect(result).toContain('A');
        expect(result).toContain('B');
        expect(result).toContain('C');
        expect(result).toContain('D');
        
        // A should come before B and C
        const indexA = result.indexOf('A');
        const indexB = result.indexOf('B');
        const indexC = result.indexOf('C');
        const indexD = result.indexOf('D');
        
        expect(indexA).toBeLessThan(indexB);
        expect(indexA).toBeLessThan(indexC);
        expect(indexB).toBeLessThan(indexD);
        expect(indexC).toBeLessThan(indexD);
      });

      test('should return empty array for cyclic graph', () => {
        graph.addEdge('D', 'A'); // Create cycle
        const result = graph.topologicalSort();
        expect(result).toEqual([]);
      });

      test('should handle single node', () => {
        const singleGraph = new Graph();
        singleGraph.addNode('single', {});
        
        const result = singleGraph.topologicalSort();
        expect(result).toEqual(['single']);
      });

      test('should handle disconnected components', () => {
        graph.addNode('E', {});
        graph.addNode('F', {});
        graph.addEdge('E', 'F');
        
        const result = graph.topologicalSort();
        
        expect(result).toHaveLength(6);
        expect(result).toContain('E');
        expect(result).toContain('F');
        
        const indexE = result.indexOf('E');
        const indexF = result.indexOf('F');
        expect(indexE).toBeLessThan(indexF);
      });
    });
  });

  describe('Serialization', () => {
    beforeEach(() => {
      graph.addNode('node1', { value: 1, name: 'first' });
      graph.addNode('node2', { value: 2, name: 'second' });
      graph.addEdge('node1', 'node2', { weight: 5, type: 'connection' });
    });

    describe('toJSON', () => {
      test('should serialize empty graph', () => {
        const emptyGraph = new Graph();
        const json = emptyGraph.toJSON();
        
        expect(() => JSON.parse(json)).not.toThrow();
        const parsed = JSON.parse(json);
        expect(parsed.nodes).toEqual([]);
        expect(parsed.edges).toEqual([]);
      });

      test('should serialize graph with nodes and edges', () => {
        const json = graph.toJSON();
        const parsed = JSON.parse(json);
        
        expect(parsed.nodes).toHaveLength(2);
        expect(parsed.edges).toHaveLength(1);
        
        expect(parsed.nodes.map((n: any) => n.id)).toContain('node1');
        expect(parsed.nodes.map((n: any) => n.id)).toContain('node2');
        
        expect(parsed.edges[0]).toEqual({
          source: 'node1',
          target: 'node2',
          data: { weight: 5, type: 'connection' }
        });
      });

      test('should handle complex data types in serialization', () => {
        const complexGraph = new Graph();
        complexGraph.addNode('complex', {
          date: new Date('2023-01-01'),
          nested: { deep: { value: 42 } },
          array: [1, 2, 3]
        });
        
        const json = complexGraph.toJSON();
        expect(() => JSON.parse(json)).not.toThrow();
      });
    });

    describe('fromJSON', () => {
      test('should deserialize empty graph', () => {
        const emptyJson = '{"nodes":[],"edges":[]}';
        const deserialized = Graph.fromJSON(emptyJson);
        
        expect(deserialized.isEmpty()).toBe(true);
        expect(deserialized.getNodeCount()).toBe(0);
        expect(deserialized.getEdgeCount()).toBe(0);
      });

      test('should deserialize graph with nodes and edges', () => {
        const json = graph.toJSON();
        const deserialized = Graph.fromJSON(json);
        
        expect(deserialized.getNodeCount()).toBe(2);
        expect(deserialized.getEdgeCount()).toBe(1);
        
        expect(deserialized.hasNode('node1')).toBe(true);
        expect(deserialized.hasNode('node2')).toBe(true);
        expect(deserialized.hasEdge('node1', 'node2')).toBe(true);
        
        const node1 = deserialized.getNode('node1');
        expect(node1?.data).toEqual({ value: 1, name: 'first' });
        
        const edge = deserialized.getEdge('node1', 'node2');
        expect(edge?.data).toEqual({ weight: 5, type: 'connection' });
      });

      test('should throw error for invalid JSON', () => {
        expect(() => Graph.fromJSON('invalid-json')).toThrow();
        expect(() => Graph.fromJSON('')).toThrow();
        expect(() => Graph.fromJSON('null')).toThrow();
      });

      test('should handle malformed graph data gracefully', () => {
        const malformedJson = '{"nodes":[{"id":"test"}],"edges":[]}';
        
        expect(() => Graph.fromJSON(malformedJson)).not.toThrow();
        const deserialized = Graph.fromJSON(malformedJson);
        expect(deserialized.hasNode('test')).toBe(true);
      });

      test('should maintain graph integrity after round-trip serialization', () => {
        // Create complex graph
        graph.addNode('node3', { value: 3 });
        graph.addEdge('node2', 'node3', { weight: 10 });
        graph.addEdge('node3', 'node1', { weight: 15 });
        
        const json = graph.toJSON();
        const deserialized = Graph.fromJSON(json);
        
        // Verify structure
        expect(deserialized.getNodeCount()).toBe(graph.getNodeCount());
        expect(deserialized.getEdgeCount()).toBe(graph.getEdgeCount());
        
        // Verify traversal works the same
        const originalBFS = graph.breadthFirstSearch('node1');
        const deserializedBFS = deserialized.breadthFirstSearch('node1');
        expect(new Set(originalBFS)).toEqual(new Set(deserializedBFS));
      });
    });
  });

  describe('Advanced Operations', () => {
    describe('findMutualConnections', () => {
      beforeEach(() => {
        // Create network: A connects to B,C,D; E connects to C,D,F
        graph.addNode('A', {});
        graph.addNode('B', {});
        graph.addNode('C', {});
        graph.addNode('D', {});
        graph.addNode('E', {});
        graph.addNode('F', {});
        
        graph.addEdge('A', 'B');
        graph.addEdge('A', 'C');
        graph.addEdge('A', 'D');
        graph.addEdge('E', 'C');
        graph.addEdge('E', 'D');
        graph.addEdge('E', 'F');
      });

      test('should find mutual connections between nodes', () => {
        const mutual = graph.findMutualConnections('A', 'E');
        
        expect(mutual).toHaveLength(2);
        expect(mutual).toContain('C');
        expect(mutual).toContain('D');
      });

      test('should return empty array for nodes with no mutual connections', () => {
        const mutual = graph.findMutualConnections('A', 'F');
        expect(mutual).toEqual([]);
      });

      test('should return empty array for non-existent nodes', () => {
        expect(graph.findMutualConnections('non-existent', 'A')).toEqual([]);
        expect(graph.findMutualConnections('A', 'non-existent')).toEqual([]);
        expect(graph.findMutualConnections('non-existent1', 'non-existent2')).toEqual([]);
      });

      test('should handle self-connections in mutual connections', () => {
        graph.addEdge('A', 'A');
        graph.addEdge('E', 'A');
        
        const mutual = graph.findMutualConnections('A', 'E');
        expect(mutual).toContain('A'); // A connects to itself and E connects to A
      });
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    test('should handle operations on very large graphs', () => {
      const nodeCount = 1000;
      
      // Add nodes
      for (let i = 0; i < nodeCount; i++) {
        graph.addNode(`node${i}`, { id: i });
      }
      
      // Create connected graph (each node connects to next)
      for (let i = 0; i < nodeCount - 1; i++) {
        graph.addEdge(`node${i}`, `node${i + 1}`);
      }
      
      expect(graph.getNodeCount()).toBe(nodeCount);
      expect(graph.getEdgeCount()).toBe(nodeCount - 1);
      
      // Test traversal on large graph
      const bfsResult = graph.breadthFirstSearch('node0');
      expect(bfsResult).toHaveLength(nodeCount);
    });

    test('should handle concurrent-like modifications', () => {
      // Simulate rapid additions and removals
      for (let i = 0; i < 100; i++) {
        graph.addNode(`temp${i}`, { id: i });
        if (i > 0) {
          graph.addEdge(`temp${i-1}`, `temp${i}`);
        }
        
        if (i % 10 === 0 && i > 0) {
          graph.removeNode(`temp${i-5}`);
        }
      }
      
      expect(graph.getNodeCount()).toBeGreaterThan(0);
      expect(() => graph.breadthFirstSearch('temp0')).not.toThrow();
    });

    test('should maintain adjacency list consistency after complex operations', () => {
      graph.addNode('hub', {});
      
      // Add spokes
      for (let i = 0; i < 10; i++) {
        graph.addNode(`spoke${i}`, {});
        graph.addEdge('hub', `spoke${i}`);
      }
      
      // Remove some spokes
      graph.removeNode('spoke5');
      graph.removeNode('spoke7');
      
      const neighbors = graph.getNeighbors('hub');
      expect(neighbors).not.toContain('spoke5');
      expect(neighbors).not.toContain('spoke7');
      expect(neighbors).toHaveLength(8);
    });

    test('should handle empty string and special character node IDs', () => {
      // Test various edge cases for node IDs
      const specialIds = [
        'node with spaces',
        'node-with-dashes',
        'node_with_underscores',
        'node.with.dots',
        'node/with/slashes',
        'node\\with\\backslashes',
        'node"with"quotes',
        "node'with'apostrophes",
        'node[with]brackets',
        'node{with}braces',
        'node(with)parentheses',
        'node@with@symbols',
        'node#with#hash',
        'node$with$dollar',
        'node%with%percent',
        'node^with^caret',
        'node&with&ampersand',
        'node*with*asterisk',
        'node+with+plus',
        'node=with=equals',
        'node|with|pipe',
        'node?with?question',
        'node<with>angles',
        'node~with~tilde',
        'node`with`backtick'
      ];
      
      specialIds.forEach(id => {
        expect(() => graph.addNode(id, { special: true })).not.toThrow();
        expect(graph.hasNode(id)).toBe(true);
      });
      
      // Test edges between special IDs
      graph.addEdge(specialIds[0], specialIds[1]);
      expect(graph.hasEdge(specialIds[0], specialIds[1])).toBe(true);
    });

    test('should handle extreme data values', () => {
      const extremeValues = [
        null,
        undefined,
        0,
        -0,
        Infinity,
        -Infinity,
        NaN,
        Number.MAX_VALUE,
        Number.MIN_VALUE,
        Number.MAX_SAFE_INTEGER,
        Number.MIN_SAFE_INTEGER,
        '',
        ' ',
        '\n',
        '\t',
        '\0',
        'very'.repeat(10000), // Very long string
        {},
        [],
        { recursive: null as any },
        new Date(),
        /regex/,
--- a/src/core/graph.ts
+++ b/src/core/graph.ts
@@ class ASRGoTGraph {
   // …existing methods…

+  toJSON(): Record<string, any> {
+    const { timestamp, vertices, edges, hyperedges, layers, node_types } = this.state;
+    const serialize = <T>(value: T): any => {
+      if (typeof value === 'symbol' || typeof value === 'function') {
+        return value.toString();
+      }
+      if (value instanceof Map) {
+        return Object.fromEntries(
+          Array.from(value.entries()).map(([k, v]) => [k, serialize(v)])
+        );
+      }
+      if (value instanceof Set) {
+        return Array.from(value).map(serialize);
+      }
+      // skip WeakMap/WeakSet or handle per your requirements
+      return value;
+    };
+
+    return {
+      timestamp,
+      vertices: serialize(vertices),
+      edges: serialize(edges),
+      hyperedges: serialize(hyperedges),
+      layers: serialize(layers),
+      node_types: serialize(node_types),
+    };
+  }
 }
      
      extremeValues.forEach((value, index) => {
        const nodeId = `extreme${index}`;
        expect(() => graph.addNode(nodeId, value)).not.toThrow();
        expect(graph.hasNode(nodeId)).toBe(true);
      });
    });
  });

  describe('Type Safety and Generics', () => {
    test('should work with typed node data', () => {
      interface NodeData {
        name: string;
        value: number;
      }
      
      interface EdgeData {
        weight: number;
        type: string;
      }
      
      const typedGraph = new Graph<NodeData, EdgeData>();
      
      typedGraph.addNode('typed1', { name: 'first', value: 1 });
      typedGraph.addNode('typed2', { name: 'second', value: 2 });
      typedGraph.addEdge('typed1', 'typed2', { weight: 5.5, type: 'strong' });
      
      const node = typedGraph.getNode('typed1');
      expect(node?.data.name).toBe('first');
      expect(node?.data.value).toBe(1);
      
      const edge = typedGraph.getEdge('typed1', 'typed2');
      expect(edge?.data?.weight).toBe(5.5);
      expect(edge?.data?.type).toBe('strong');
    });

    test('should work with complex generic types', () => {
      interface ComplexNodeData {
        metadata: {
          tags: string[];
          properties: Record<string, any>;
        };
        connections: number[];
      }
      
      const complexGraph = new Graph<ComplexNodeData>();
      
      complexGraph.addNode('complex1', {
        metadata: {
          tags: ['important', 'test'],
          properties: { color: 'red', size: 'large' }
        },
        connections: [1, 2, 3]
      });
      
      const node = complexGraph.getNode('complex1');
      expect(node?.data.metadata.tags).toContain('important');
      expect(node?.data.metadata.properties.color).toBe('red');
      expect(node?.data.connections).toEqual([1, 2, 3]);
    });
  });
});
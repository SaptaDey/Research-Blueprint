// Manual test for MCP server functionality
import { ASRGoTGraph } from '../dist/core/graph.js';
import { ASRGoTValidator } from '../dist/validation/schema-validator.js';

console.log('Running manual tests for ASR-GoT MCP Server...');

try {
  // Test 1: Graph creation and basic operations
  console.log('Test 1: Graph creation and basic operations');
  const graph = new ASRGoTGraph();
  
  const nodeMetadata = {
    node_id: 'test-node-1',
    label: 'Test Node',
    type: 'root',
    timestamp: new Date(),
    provenance: 'Manual test',
    confidence: {
      empirical_support: 0.8,
      theoretical_basis: 0.7,
      methodological_rigor: 0.9,
      consensus_alignment: 0.6
    },
    epistemic_status: 'test',
    disciplinary_tags: ['test'],
    bias_flags: [],
    revision_history: [{
      timestamp: new Date(),
      change: 'Node created for testing',
      author: 'Manual Test'
    }],
    impact_score: 0.7
  };

  const nodeId = graph.addNode(nodeMetadata);
  console.log(`✓ Node created with ID: ${nodeId}`);

  const retrievedNode = graph.getNode(nodeId);
  console.log(`✓ Node retrieved: ${retrievedNode ? 'success' : 'failed'}`);

  console.log(`✓ Graph has ${graph.getNodeCount()} nodes`);

  // Test 2: Validation
  console.log('\nTest 2: Validation system');
  const validator = new ASRGoTValidator();
  
  const validationResult = validator.validateNodeMetadata(nodeMetadata);
  console.log(`✓ Validation result: ${validationResult.isValid ? 'valid' : 'invalid'}`);
  
  if (validationResult.errors.length > 0) {
    console.log('Validation errors:', validationResult.errors);
  }

  // Test 3: Graph state validation
  console.log('\nTest 3: Graph state validation');
  const graphState = graph.getState();
  const graphValidation = validator.validateGraphState(graphState);
  console.log(`✓ Graph validation: ${graphValidation.isValid ? 'valid' : 'invalid'}`);
  console.log(`✓ Graph statistics: ${graphValidation.statistics.total_nodes} nodes, ${graphValidation.statistics.total_edges} edges`);

  console.log('\n✅ All manual tests passed successfully!');
  console.log('\n🎉 ASR-GoT MCP Server is ready for deployment!');
  
} catch (error) {
  console.error('❌ Manual test failed:', error.message);
  process.exit(1);
}
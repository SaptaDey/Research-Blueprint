# ASR-GoT Scientific Reasoning DXT Extension

## Overview

This Desktop Extension (DXT) implements the Advanced Scientific Reasoning Graph-of-Thoughts (ASR-GoT) framework as an MCP server for systematic scientific analysis and hypothesis generation. The extension enables researchers to perform comprehensive scientific reasoning through an 8-stage graph-based methodology.

## Features

- **8-Stage ASR-GoT Pipeline**: Complete scientific reasoning workflow
- **Graph-Based Analysis**: Multi-layer network representation of research concepts
- **Interdisciplinary Connections**: Automated identification of cross-domain insights
- **Causal Inference**: Pearl's causal hierarchy and counterfactual reasoning
- **Bias Detection**: Comprehensive bias identification and mitigation
- **Hypothesis Generation**: Systematic hypothesis creation and validation
- **Evidence Integration**: Multi-dimensional confidence tracking
- **Fail-Safe Mechanisms**: Robust error handling and recovery

## Installation

### Prerequisites

- Node.js >= 18.0.0
- Claude Desktop >= 0.10.0
- Compatible with macOS, Windows, and Linux

### Installation Steps

1. Download the DXT package
2. Install through Claude Desktop's extension manager
3. Configure user preferences (optional)

## Usage

### Available Tools

#### 1. `execute_asr_got_analysis`
Execute complete ASR-GoT analysis pipeline on a research query.

**Parameters:**
- `query` (required): Research question or topic to analyze
- `domain` (optional): Disciplinary domains array (default: ['general'])
- `complexity_level` (optional): 'basic', 'intermediate', or 'advanced' (default: 'intermediate')
- `expected_depth` (optional): 'overview', 'detailed', or 'comprehensive' (default: 'detailed')
- `interdisciplinary` (optional): Focus on interdisciplinary connections (default: true)
- `user_profile` (optional): Researcher profile configuration

**Example:**
```json
{
  "query": "What are the potential therapeutic targets for cutaneous T-cell lymphoma?",
  "domain": ["immunology", "dermatology", "oncology"],
  "complexity_level": "advanced",
  "expected_depth": "comprehensive"
}
```

#### 2. `get_analysis_status`
Get the status of an ongoing or completed analysis.

**Parameters:**
- `context_id` (required): ID of the analysis context

#### 3. `extract_subgraph`
Extract specific subgraph from completed analysis based on criteria.

**Parameters:**
- `context_id` (required): ID of the analysis context
- `criteria` (optional): Filtering criteria including confidence thresholds, node types, edge types

#### 4. `validate_graph_structure`
Validate the integrity and consistency of graph structures.

**Parameters:**
- `context_id` (required): ID of the analysis context
- `validation_level` (optional): 'basic' or 'comprehensive' (default: 'basic')

#### 5. `get_research_insights`
Generate specific research insights and recommendations.

**Parameters:**
- `context_id` (required): ID of the analysis context
- `focus_area` (optional): 'gaps', 'interventions', 'causality', 'temporal_patterns', or 'interdisciplinary' (default: 'gaps')

### Configuration Options

The extension supports extensive user configuration:

- **Research Domain**: Primary field of research
- **Confidence Threshold**: Minimum confidence for hypothesis consideration (0.0-1.0)
- **Max Hypotheses per Dimension**: Limit hypothesis generation (1-10)
- **Multi-Layer Networks**: Enable complex system representation
- **Temporal Decay Factor**: Evidence impact decay over time (0.0-1.0)
- **Citation Style**: Preferred format (Vancouver, APA, Harvard, Nature)
- **Research Workspace**: Directory for data storage
- **Collaboration Features**: Multi-researcher support
- **Statistical Power Threshold**: Minimum power for evidence (0.0-1.0)
- **Impact Estimation Model**: Basic, comprehensive, or domain-specific

### Specialized Prompts

The extension includes four specialized prompts:

1. **ASR-GoT Research Assistant**: Formal academic communication with immunology/dermatology expertise
2. **Interdisciplinary Bridge Finder**: Identifies cross-domain connections
3. **Hypothesis Falsification Analyzer**: Evaluates falsifiability and experimental design
4. **Causal Inference Expert**: Pearl's causal hierarchy and counterfactual reasoning

## Technical Architecture

### MCP Server Implementation

- Built with `@modelcontextprotocol/sdk`
- Stdio transport for communication
- Comprehensive error handling and logging
- Graceful shutdown mechanisms
- Timeout protection (5-minute default)

### Graph Structure

- **Nodes**: Root, dimension, hypothesis, evidence, placeholder gaps, interdisciplinary bridges
- **Edges**: Correlative, supportive, contradictory, prerequisite, causal, temporal precedence
- **Hyperedges**: Complex multi-node relationships
- **Layers**: Multi-dimensional representation

### Performance Features

- Context management for multiple concurrent analyses
- Memory-efficient graph operations
- Incremental processing with checkpoints
- Fail-safe mechanisms for robust operation

## Development

### Building from Source

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint
```

### Project Structure

```
src/
├── index.ts              # Main MCP server implementation
├── core/
│   └── graph.ts         # Graph data structure
├── stages/
│   └── pipeline.ts      # 8-stage ASR-GoT pipeline
├── types/
│   └── index.ts         # Type definitions
├── utils/               # Analysis utilities
│   ├── bayesian.ts
│   ├── bias-detector.ts
│   ├── causal-inference.ts
│   ├── information-theory.ts
│   └── temporal-analyzer.ts
└── validation/
    └── schema-validator.ts
```

## Error Handling

The extension implements comprehensive error handling:

- **Input Validation**: Schema validation for all tool parameters
- **Timeout Protection**: Prevents hanging operations
- **Graceful Degradation**: Fail-safe mechanisms provide partial results
- **Detailed Logging**: Enhanced debugging capabilities
- **Context Recovery**: Maintains state across failures

## Troubleshooting

### Common Issues

1. **Analysis Timeout**: Reduce complexity level or query scope
2. **Memory Issues**: Clear old contexts or restart extension
3. **Invalid Context ID**: Check available contexts with error messages
4. **Tool Not Found**: Verify extension is properly installed and activated

### Debug Mode

Enable detailed logging by monitoring stderr output:
- Tool execution tracking
- Parameter validation
- Performance metrics
- Error stack traces

## Support

- **Repository**: https://github.com/SaptaDey/scientific-research-claude-extension
- **Issues**: https://github.com/SaptaDey/scientific-research-claude-extension/issues
- **Documentation**: https://github.com/SaptaDey/scientific-research-claude-extension/blob/main/README.md

## License

MIT License - see LICENSE file for details.

## Author

Dr. Saptaswa Dey  
Email: saptaswa.dey@medunigraz.at  
Specialization: Immunology, Dermatology, Machine Learning

---

*Generated for Desktop Extension (DXT) compatibility - Version 1.0.0*
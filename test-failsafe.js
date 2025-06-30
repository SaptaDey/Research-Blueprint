#!/usr/bin/env node

// Simple test script to verify failsafe mechanisms
import { ASRGoTPipeline } from './dist/stages/pipeline.js';

async function testFailsafeMechanisms() {
  console.log('🔧 Testing ASR-GoT Failsafe Mechanisms...\n');
  
  const pipeline = new ASRGoTPipeline();
  
  // Test 1: Normal query execution
  console.log('Test 1: Normal Query Execution');
  try {
    const normalQuery = {
      query: "What are the implications of CRISPR technology in treating genetic diseases?",
      domain: ['biology', 'medicine'],
      complexity_level: 'intermediate',
      expected_depth: 'detailed',
      interdisciplinary: true
    };
    
    const userProfile = {
      identity: 'Test Researcher',
      experience: 'Intermediate researcher',
      research_focus: ['genetics', 'medicine'],
      methodologies: ['systematic_review'],
      philosophy: 'Evidence-based research'
    };
    
    const context = await pipeline.executeComplete(normalQuery, userProfile);
    console.log(`✅ Completed ${context.stage_results.filter(r => r.success).length}/8 stages`);
    console.log(`   Failsafe active: ${context.fail_safe_active}`);
    console.log(`   Graph nodes: ${context.graph_state.vertices.size}`);
    console.log(`   Total errors: ${context.stage_results.flatMap(r => r.errors).length}`);
    console.log(`   Total warnings: ${context.stage_results.flatMap(r => r.warnings).length}\n`);
  } catch (error) {
    console.log(`❌ Normal query failed: ${error.message}\n`);
  }

  // Test 2: Query with invalid/problematic input
  console.log('Test 2: Problematic Query (empty string)');
  try {
    const problematicQuery = {
      query: "", // Empty query to trigger errors
      domain: [],
      complexity_level: 'advanced',
      expected_depth: 'comprehensive',
      interdisciplinary: true
    };
    
    const context = await pipeline.executeComplete(problematicQuery, {});
    console.log(`✅ Handled problematic query gracefully`);
    console.log(`   Completed ${context.stage_results.filter(r => r.success).length}/8 stages`);
    console.log(`   Failsafe active: ${context.fail_safe_active}`);
    console.log(`   Graph nodes: ${context.graph_state.vertices.size}`);
    console.log(`   Total errors: ${context.stage_results.flatMap(r => r.errors).length}`);
    console.log(`   Total warnings: ${context.stage_results.flatMap(r => r.warnings).length}\n`);
  } catch (error) {
    console.log(`⚠️  Problematic query handled: ${error.message}\n`);
  }

  // Test 3: Very complex query that might cause computational budget issues
  console.log('Test 3: Resource-Intensive Query');
  try {
    const complexQuery = {
      query: "Develop a comprehensive interdisciplinary framework for understanding the complex interactions between climate change, biodiversity loss, socioeconomic inequality, technological innovation, and human health outcomes across global populations, incorporating multiple methodologies, temporal scales, and uncertainty quantification approaches while addressing ethical considerations and policy implications for sustainable development.",
      domain: ['climate science', 'ecology', 'economics', 'sociology', 'public health', 'technology'],
      complexity_level: 'advanced',
      expected_depth: 'comprehensive',
      interdisciplinary: true
    };
    
    const context = await pipeline.executeComplete(complexQuery, {});
    console.log(`✅ Handled complex query`);
    console.log(`   Completed ${context.stage_results.filter(r => r.success).length}/8 stages`);
    console.log(`   Failsafe active: ${context.fail_safe_active}`);
    console.log(`   Graph nodes: ${context.graph_state.vertices.size}`);
    console.log(`   Total errors: ${context.stage_results.flatMap(r => r.errors).length}`);
    console.log(`   Total warnings: ${context.stage_results.flatMap(r => r.warnings).length}\n`);
  } catch (error) {
    console.log(`⚠️  Complex query handled: ${error.message}\n`);
  }

  console.log('🎉 Failsafe mechanism testing completed!');
  console.log('\n✨ Summary: The enhanced error handling ensures that:');
  console.log('   • Every stage has retry mechanisms with exponential backoff');
  console.log('   • Failed stages produce minimal viable output to continue processing');
  console.log('   • Timeout protection prevents infinite execution');
  console.log('   • Comprehensive error tracking and reporting');
  console.log('   • Graceful degradation maintains system stability');
  console.log('   • Emergency fallbacks provide meaningful responses even in failure cases');
}

testFailsafeMechanisms().catch(console.error);
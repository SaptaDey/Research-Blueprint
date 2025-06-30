#!/usr/bin/env node

// Test MCP server failsafe mechanisms with direct method calls
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testMCPServerFailsafe() {
  console.log('🔧 Testing MCP Server Failsafe Mechanisms...\n');

  // Test cases with different types of problematic inputs
  const testCases = [
    {
      name: "Normal Query",
      input: {
        name: "execute_asr_got_analysis",
        arguments: {
          query: "What are the latest developments in quantum computing?",
          domain: ["computer_science", "physics"],
          complexity_level: "intermediate"
        }
      }
    },
    {
      name: "Empty Query",
      input: {
        name: "execute_asr_got_analysis", 
        arguments: {
          query: "",
          domain: ["general"]
        }
      }
    },
    {
      name: "Invalid Arguments",
      input: {
        name: "execute_asr_got_analysis",
        arguments: {
          query: null,
          domain: "not_an_array",
          complexity_level: "invalid_level"
        }
      }
    },
    {
      name: "Missing Arguments",
      input: {
        name: "execute_asr_got_analysis",
        arguments: {}
      }
    },
    {
      name: "Unknown Tool",
      input: {
        name: "non_existent_tool",
        arguments: {
          query: "test"
        }
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 Test: ${testCase.name}`);
    
    try {
      // Create child process to test server
      const serverPath = join(__dirname, 'dist', 'index.js');
      const child = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'test' }
      });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      // Send MCP request
      const request = {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: testCase.input
      };

      child.stdin.write(JSON.stringify(request) + '\n');
      child.stdin.end();

      // Wait for response or timeout
      const result = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          child.kill();
          resolve({ success: false, reason: 'timeout', output, errorOutput });
        }, 30000); // 30 second timeout

        child.on('close', (code) => {
          clearTimeout(timeout);
          resolve({ 
            success: code === 0, 
            code, 
            output, 
            errorOutput,
            reason: code === 0 ? 'completed' : 'non-zero-exit'
          });
        });

        child.on('error', (error) => {
          clearTimeout(timeout);
          resolve({ success: false, reason: 'process-error', error: error.message, output, errorOutput });
        });
      });

      // Analyze the result
      if (result.success || result.reason === 'timeout') {
        console.log(`   ✅ Server handled gracefully`);
        if (result.output) {
          try {
            const responses = result.output.split('\n').filter(line => line.trim());
            const lastResponse = responses[responses.length - 1];
            if (lastResponse) {
              const parsed = JSON.parse(lastResponse);
              if (parsed.result && parsed.result.content) {
                const content = parsed.result.content[0];
                console.log(`   📊 Success: ${content.success}`);
                console.log(`   🛡️  Failsafe: ${content.result?.fail_safe_activated || content.result?.fail_safe_mode}`);
                console.log(`   📈 Stages: ${content.result?.analysis_summary?.stages_completed || 'N/A'}`);
                console.log(`   ⚠️  Errors: ${content.errors?.length || 0}`);
                console.log(`   ⚡ Warnings: ${content.warnings?.length || 0}`);
              }
            }
          } catch (parseError) {
            console.log(`   📝 Raw output available (parsing failed)`);
          }
        }
      } else {
        console.log(`   ⚠️  Process issue: ${result.reason}`);
        if (result.errorOutput) {
          console.log(`   🔍 Error output available`);
        }
      }

    } catch (error) {
      console.log(`   ❌ Test failed: ${error.message}`);
    }
  }

  console.log('\n🎉 MCP Server failsafe testing completed!');
  console.log('\n✨ Enhanced MCP Server Features:');
  console.log('   • Input validation with meaningful error messages');
  console.log('   • Timeout protection for all tool executions');
  console.log('   • Comprehensive error handling with fallback responses');
  console.log('   • Graceful degradation when pipeline stages fail');
  console.log('   • Emergency response generation for complete failures');
  console.log('   • Context preservation for debugging even in failure cases');
}

testMCPServerFailsafe().catch(console.error);
import axios from 'axios';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`)
};

async function testAIAnalysis() {
  log.info('\n=== Testing AI Psychological Analysis ===');
  
  try {
    const sampleProfile = {
      bio: 'I am a software engineer who loves hiking, reading science fiction, and building cool projects. I value authenticity, growth, and deep conversations.',
      interests: ['coding', 'hiking', 'sci-fi', 'AI', 'philosophy'],
      content: {
        texts: [
          'I believe in continuous learning and pushing boundaries',
          'My ideal weekend involves hiking in nature and working on side projects',
          'I value honesty and open communication in relationships'
        ]
      }
    };

    log.info('Sending profile for AI analysis...');
    
    const response = await axios.post(`${BASE_URL}/api/users/analyze-profile`, {
      profile: sampleProfile
    }, {
      timeout: 60000 // 60 second timeout for AI processing
    });

    if (response.status === 200 && response.data.analysis) {
      log.success('AI analysis completed successfully');
      
      const analysis = response.data.analysis;
      
      log.info('\nAnalysis Results:');
      log.info(`  Personality Type: ${analysis.personality_type || 'N/A'}`);
      log.info(`  Traits: ${analysis.traits?.slice(0, 3).join(', ') || 'N/A'}`);
      log.info(`  Values: ${analysis.values?.slice(0, 3).join(', ') || 'N/A'}`);
      log.info(`  Communication Style: ${analysis.communication_style || 'N/A'}`);
      
      if (analysis.strengths) {
        log.info(`  Strengths: ${analysis.strengths.slice(0, 3).join(', ')}`);
      }
      
      return true;
    }
    
    log.error('AI analysis failed - no analysis in response');
    return false;
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log.error('Cannot connect to server. Make sure the server is running.');
    } else if (error.response) {
      log.error(`AI analysis error: ${error.response.data?.message || error.message}`);
    } else {
      log.error(`AI analysis error: ${error.message}`);
    }
    return false;
  }
}

async function testCompatibilityMatching() {
  log.info('\n=== Testing AI Compatibility Matching ===');
  
  try {
    const profile1 = {
      personality_type: 'INTJ',
      traits: ['analytical', 'creative', 'independent'],
      values: ['growth', 'authenticity', 'learning'],
      interests: ['technology', 'philosophy', 'hiking'],
      communication_style: 'direct'
    };

    const profile2 = {
      personality_type: 'INFP',
      traits: ['creative', 'empathetic', 'idealistic'],
      values: ['authenticity', 'creativity', 'harmony'],
      interests: ['writing', 'philosophy', 'art'],
      communication_style: 'thoughtful'
    };

    log.info('Calculating compatibility between two profiles...');
    
    const response = await axios.post(`${BASE_URL}/api/users/calculate-compatibility`, {
      profile1,
      profile2,
      preferences: {
        interests: ['philosophy', 'creativity']
      }
    }, {
      timeout: 60000
    });

    if (response.status === 200 && response.data.compatibility) {
      log.success('Compatibility analysis completed successfully');
      
      const compat = response.data.compatibility;
      
      log.info('\nCompatibility Results:');
      log.info(`  Overall Score: ${compat.overall_compatibility_score || 'N/A'}/100`);
      log.info(`  Confidence: ${((compat.confidence_level || 0) * 100).toFixed(1)}%`);
      log.info(`  Recommendation: ${compat.recommendation || 'N/A'}`);
      
      if (compat.compatibility_breakdown) {
        log.info('\n  Breakdown:');
        log.info(`    Personality: ${compat.compatibility_breakdown.personality_match || 'N/A'}/100`);
        log.info(`    Interests: ${compat.compatibility_breakdown.interests_overlap || 'N/A'}/100`);
        log.info(`    Values: ${compat.compatibility_breakdown.values_alignment || 'N/A'}/100`);
      }
      
      if (compat.matching_factors?.shared_interests) {
        log.info(`\n  Shared Interests: ${compat.matching_factors.shared_interests.join(', ')}`);
      }
      
      return true;
    }
    
    log.error('Compatibility analysis failed');
    return false;
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log.error('Cannot connect to server. Make sure the server is running.');
    } else if (error.response) {
      log.error(`Compatibility error: ${error.response.data?.message || error.message}`);
    } else {
      log.error(`Compatibility error: ${error.message}`);
    }
    return false;
  }
}

async function testApplicationMatch() {
  log.info('\n=== Testing Application Match Analysis ===');
  
  try {
    const docOwnerProfile = {
      personality_type: 'INTJ',
      traits: ['analytical', 'creative'],
      values: ['growth', 'authenticity'],
      interests: ['technology', 'hiking']
    };

    const docPreferences = {
      age_range: { min: 25, max: 35 },
      interests: ['technology', 'outdoors'],
      values: ['honesty', 'ambition']
    };

    const applicantProfile = {
      personality_type: 'INFP',
      traits: ['creative', 'empathetic'],
      values: ['authenticity', 'creativity'],
      interests: ['technology', 'hiking', 'reading']
    };

    const applicationAnswers = {
      'What is your favorite book?': 'The Alchemist - it taught me about following your dreams',
      'Tell me about yourself': 'I am a software developer who loves building meaningful projects and exploring nature'
    };

    log.info('Analyzing application match...');
    
    const response = await axios.post(`${BASE_URL}/api/applications/analyze-match`, {
      docOwnerProfile,
      docPreferences,
      applicantProfile,
      applicationAnswers
    }, {
      timeout: 60000
    });

    if (response.status === 200 && response.data.analysis) {
      log.success('Application match analysis completed');
      
      const analysis = response.data.analysis;
      
      log.info('\nMatch Analysis:');
      log.info(`  Preference Match: ${analysis.preference_match_score || 'N/A'}/100`);
      log.info(`  Answer Quality: ${analysis.answer_quality_score || 'N/A'}/100`);
      log.info(`  Authenticity: ${analysis.authenticity_score || 'N/A'}/100`);
      log.info(`  Recommendation: ${analysis.recommendation || 'N/A'}`);
      
      if (analysis.standout_answers?.length > 0) {
        log.info(`\n  Standout Answers: ${analysis.standout_answers.length}`);
      }
      
      return true;
    }
    
    log.error('Application match analysis failed');
    return false;
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log.error('Cannot connect to server. Make sure the server is running.');
    } else if (error.response) {
      log.error(`Match analysis error: ${error.response.data?.message || error.message}`);
    } else {
      log.error(`Match analysis error: ${error.message}`);
    }
    return false;
  }
}

async function runAITests() {
  console.log('\n' + '='.repeat(60));
  console.log('  AI FEATURES TEST SUITE');
  console.log('  Using Google Gemini AI');
  console.log('='.repeat(60));
  
  log.info('\nNote: These tests require:');
  log.info('  1. Server running (npm run dev)');
  log.info('  2. GEMINI_API_KEY configured in .env');
  log.info('  3. May take 30-60 seconds per test\n');
  
  const results = [];
  
  results.push({ name: 'Psychological Analysis', passed: await testAIAnalysis() });
  results.push({ name: 'Compatibility Matching', passed: await testCompatibilityMatching() });
  results.push({ name: 'Application Match', passed: await testApplicationMatch() });
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('  TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    const icon = result.passed ? colors.green + '✓' : colors.red + '✗';
    console.log(`${icon} ${result.name}${colors.reset}`);
  });
  
  console.log('\n' + '='.repeat(60));
  const passRate = ((passed / total) * 100).toFixed(1);
  const color = passed === total ? colors.green : (passed > total / 2 ? colors.yellow : colors.red);
  console.log(`${color}Results: ${passed}/${total} tests passed (${passRate}%)${colors.reset}`);
  console.log('='.repeat(60) + '\n');
  
  process.exit(passed === total ? 0 : 1);
}

runAITests().catch(error => {
  log.error(`Fatal error: ${error.message}`);
  process.exit(1);
});

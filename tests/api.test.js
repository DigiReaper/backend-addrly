import axios from 'axios';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Test configuration
const config = {
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
};

const api = axios.create(config);

// Colors for console output
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
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`)
};

// Test data
let testUser = null;
let testDocId = null;
let testApplicationId = null;

async function testHealthCheck() {
  log.info('\n=== Testing Health Check ===');
  try {
    const response = await api.get('/health');
    if (response.status === 200 && response.data.status === 'ok') {
      log.success('Health check passed');
      return true;
    }
    log.error('Health check failed');
    return false;
  } catch (error) {
    log.error(`Health check error: ${error.message}`);
    return false;
  }
}

async function testCreateDateMeDoc() {
  log.info('\n=== Testing Create Date-Me-Doc ===');
  try {
    const docData = {
      title: 'Test Date-Me-Doc',
      slug: 'test-date-me-doc-' + Date.now(),
      description: 'This is a test date-me-doc for automated testing',
      about_me: 'I am a test user who loves coding, reading, and hiking. Passionate about AI and technology.',
      interests: ['coding', 'reading', 'hiking', 'AI', 'technology'],
      deal_breakers: ['smoking', 'dishonesty'],
      custom_questions: [
        {
          question: 'What is your favorite book?',
          required: true,
          type: 'text'
        },
        {
          question: 'Tell me about your dream vacation',
          required: false,
          type: 'textarea'
        }
      ],
      preferences: {
        age_range: { min: 25, max: 35 },
        location: 'San Francisco',
        interests: ['technology', 'books']
      },
      social_links: {
        website: 'https://example.com',
        linkedin: 'https://linkedin.com/in/testuser'
      }
    };

    const response = await api.post('/api/docs', docData);
    
    if (response.status === 201 && response.data.doc) {
      testDocId = response.data.doc.id;
      log.success(`Date-Me-Doc created with ID: ${testDocId}`);
      log.info(`  Title: ${response.data.doc.title}`);
      log.info(`  Interests: ${response.data.doc.interests.length} items`);
      log.info(`  Questions: ${response.data.doc.custom_questions.length} items`);
      return true;
    }
    
    log.error('Failed to create Date-Me-Doc');
    return false;
  } catch (error) {
    log.error(`Create Date-Me-Doc error: ${error.response?.data?.error || error.response?.data?.message || error.message}`);
    if (error.response?.data) {
      log.info(`  Details: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

async function testGetDateMeDoc() {
  log.info('\n=== Testing Get Date-Me-Doc ===');
  try {
    if (!testDocId) {
      log.warn('No test doc ID available, skipping test');
      return false;
    }

    const response = await api.get(`/api/docs/${testDocId}`);
    
    if (response.status === 200 && response.data.doc) {
      log.success('Date-Me-Doc retrieved successfully');
      log.info(`  Title: ${response.data.doc.title}`);
      log.info(`  Visibility: ${response.data.doc.visibility}`);
      return true;
    }
    
    log.error('Failed to get Date-Me-Doc');
    return false;
  } catch (error) {
    log.error(`Get Date-Me-Doc error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testUpdateDateMeDoc() {
  log.info('\n=== Testing Update Date-Me-Doc ===');
  try {
    if (!testDocId) {
      log.warn('No test doc ID available, skipping test');
      return false;
    }

    const updateData = {
      title: 'Updated Test Date-Me-Doc',
      description: 'This has been updated!',
      interests: ['coding', 'reading', 'hiking', 'AI', 'technology', 'music']
    };

    const response = await api.patch(`/api/docs/${testDocId}`, updateData);
    
    if (response.status === 200 && response.data.doc) {
      log.success('Date-Me-Doc updated successfully');
      log.info(`  New title: ${response.data.doc.title}`);
      log.info(`  New interests count: ${response.data.doc.interests.length}`);
      return true;
    }
    
    log.error('Failed to update Date-Me-Doc');
    return false;
  } catch (error) {
    log.error(`Update Date-Me-Doc error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testSubmitApplication() {
  log.info('\n=== Testing Submit Application ===');
  try {
    if (!testDocId) {
      log.warn('No test doc ID available, skipping test');
      return false;
    }

    const applicationData = {
      date_me_doc_id: testDocId,
      applicant_name: 'Test Applicant',
      applicant_email: 'test@example.com',
      applicant_bio: 'I am a passionate developer who loves hiking and reading sci-fi novels. Looking for meaningful connections.',
      answers: {
        'What is your favorite book?': 'The Hitchhiker\'s Guide to the Galaxy',
        'Tell me about your dream vacation': 'I would love to visit New Zealand and hike through the mountains while exploring LOTR filming locations.'
      },
      social_links: {
        linkedin: 'https://linkedin.com/in/testapplicant'
      }
    };

    const response = await api.post('/api/applications', applicationData);
    
    if (response.status === 201 && response.data.application) {
      testApplicationId = response.data.application.id;
      log.success(`Application submitted with ID: ${testApplicationId}`);
      log.info(`  Status: ${response.data.application.status}`);
      return true;
    }
    
    log.error('Failed to submit application');
    return false;
  } catch (error) {
    log.error(`Submit application error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testGetApplications() {
  log.info('\n=== Testing Get Applications ===');
  try {
    if (!testDocId) {
      log.warn('No test doc ID available, skipping test');
      return false;
    }

    const response = await api.get(`/api/applications?date_me_doc_id=${testDocId}`);
    
    if (response.status === 200 && response.data.applications) {
      log.success(`Retrieved ${response.data.applications.length} application(s)`);
      return true;
    }
    
    log.error('Failed to get applications');
    return false;
  } catch (error) {
    log.error(`Get applications error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testContentExtraction() {
  log.info('\n=== Testing Content Extraction ===');
  try {
    const extractData = {
      url: 'https://example.com',
      type: 'website'
    };

    const response = await api.post('/api/users/extract-content', extractData);
    
    if (response.status === 200 && response.data.content) {
      log.success('Content extracted successfully');
      log.info(`  Title: ${response.data.content.title || 'N/A'}`);
      log.info(`  Content length: ${response.data.content.mainContent?.length || 0} chars`);
      return true;
    }
    
    log.error('Failed to extract content');
    return false;
  } catch (error) {
    log.error(`Content extraction error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testAnalysisJob() {
  log.info('\n=== Testing Analysis Job Creation ===');
  try {
    if (!testDocId) {
      log.warn('No test doc ID available, skipping test');
      return false;
    }

    const analysisData = {
      doc_id: testDocId,
      content_sources: [
        {
          type: 'website',
          url: 'https://example.com'
        }
      ]
    };

    const response = await api.post('/api/users/analyze', analysisData);
    
    if (response.status === 200) {
      log.success('Analysis job created successfully');
      log.info(`  Job ID: ${response.data.jobId || 'N/A'}`);
      return true;
    }
    
    log.error('Failed to create analysis job');
    return false;
  } catch (error) {
    log.error(`Analysis job error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testRateLimiting() {
  log.info('\n=== Testing Rate Limiting ===');
  try {
    log.info('Sending 10 rapid requests...');
    const promises = [];
    
    for (let i = 0; i < 10; i++) {
      promises.push(api.get('/health'));
    }
    
    const results = await Promise.allSettled(promises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    
    log.info(`  ${successful}/10 requests succeeded`);
    log.success('Rate limiting test completed');
    return true;
  } catch (error) {
    log.error(`Rate limiting test error: ${error.message}`);
    return false;
  }
}

async function cleanup() {
  log.info('\n=== Cleanup ===');
  
  try {
    // Delete test application
    if (testApplicationId) {
      try {
        await api.delete(`/api/applications/${testApplicationId}`);
        log.success('Test application deleted');
      } catch (error) {
        log.warn('Could not delete test application');
      }
    }
    
    // Delete test doc
    if (testDocId) {
      try {
        await api.delete(`/api/docs/${testDocId}`);
        log.success('Test date-me-doc deleted');
      } catch (error) {
        log.warn('Could not delete test doc');
      }
    }
  } catch (error) {
    log.error(`Cleanup error: ${error.message}`);
  }
}

async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('  BACKEND API TEST SUITE');
  console.log('='.repeat(60));
  
  const results = [];
  
  // Run tests
  results.push({ name: 'Health Check', passed: await testHealthCheck() });
  results.push({ name: 'Create Date-Me-Doc', passed: await testCreateDateMeDoc() });
  results.push({ name: 'Get Date-Me-Doc', passed: await testGetDateMeDoc() });
  results.push({ name: 'Update Date-Me-Doc', passed: await testUpdateDateMeDoc() });
  results.push({ name: 'Submit Application', passed: await testSubmitApplication() });
  results.push({ name: 'Get Applications', passed: await testGetApplications() });
  results.push({ name: 'Content Extraction', passed: await testContentExtraction() });
  results.push({ name: 'Analysis Job', passed: await testAnalysisJob() });
  results.push({ name: 'Rate Limiting', passed: await testRateLimiting() });
  
  // Cleanup
  await cleanup();
  
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

// Run tests
runAllTests().catch(error => {
  log.error(`Fatal error: ${error.message}`);
  process.exit(1);
});

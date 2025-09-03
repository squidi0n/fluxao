// Performance testing script for caching improvements
const { performance } = require('perf_hooks');

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3005';

class PerformanceTester {
  constructor() {
    this.results = [];
  }

  async measureEndpoint(name, url, iterations = 10) {
    console.log(`\n🧪 Testing ${name}...`);
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'PerformanceTester/1.0',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        await response.text(); // Consume the response
        const end = performance.now();
        const time = end - start;
        times.push(time);

        // Check for cache headers
        const cacheStatus = response.headers.get('x-cache') || 'UNKNOWN';
        const cacheControl = response.headers.get('cache-control') || 'none';

        if (i === 0) {
          console.log(`  Cache Status: ${cacheStatus}`);
          console.log(`  Cache-Control: ${cacheControl}`);
        }

        process.stdout.write(`  Request ${i + 1}/${iterations}: ${time.toFixed(2)}ms\r`);
      } catch (error) {
        console.error(`  ❌ Request ${i + 1} failed:`, error.message);
        times.push(null);
      }
    }

    const validTimes = times.filter((t) => t !== null);
    if (validTimes.length === 0) {
      console.log(`  ❌ All requests failed for ${name}`);
      return null;
    }

    const average = validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
    const min = Math.min(...validTimes);
    const max = Math.max(...validTimes);
    const p95 = validTimes.sort((a, b) => a - b)[Math.floor(validTimes.length * 0.95)];

    const result = {
      name,
      url,
      iterations: validTimes.length,
      average: average.toFixed(2),
      min: min.toFixed(2),
      max: max.toFixed(2),
      p95: p95.toFixed(2),
    };

    this.results.push(result);

    console.log(`\n  ✅ ${name} Results:`);
    console.log(`     Average: ${result.average}ms`);
    console.log(`     Min: ${result.min}ms`);
    console.log(`     Max: ${result.max}ms`);
    console.log(`     P95: ${result.p95}ms`);

    return result;
  }

  async runAllTests() {
    console.log('🚀 Starting Performance Tests...');
    console.log(`Base URL: ${BASE_URL}`);

    const tests = [
      // API Endpoints
      {
        name: 'Posts API (Cached)',
        url: `${BASE_URL}/api/posts/cached?page=1&limit=12`,
      },

      // Static Assets
      {
        name: 'Homepage',
        url: `${BASE_URL}/`,
      },

      // Profile Pages (Social features)
      {
        name: 'User Profile',
        url: `${BASE_URL}/profile/alicedev`,
      },

      // Admin Dashboard
      {
        name: 'Admin Dashboard',
        url: `${BASE_URL}/admin`,
      },
    ];

    // Warm up cache first
    console.log('\n🔥 Warming up cache...');
    for (const test of tests) {
      try {
        await fetch(test.url);
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.warn(`Warning: Could not warm up ${test.name}:`, error.message);
      }
    }

    console.log('Cache warmed up, starting measurements...');

    // Run performance tests
    for (const test of tests) {
      await this.measureEndpoint(test.name, test.url, 5);
      await new Promise((resolve) => setTimeout(resolve, 500)); // Brief pause between tests
    }

    this.printSummary();
  }

  printSummary() {
    console.log('\n📊 Performance Test Summary');
    console.log('='.repeat(80));
    console.log('| Endpoint                    | Avg (ms) | Min (ms) | Max (ms) | P95 (ms) |');
    console.log('|' + '-'.repeat(78) + '|');

    this.results.forEach((result) => {
      const name = result.name.padEnd(28);
      const avg = result.average.padStart(8);
      const min = result.min.padStart(8);
      const max = result.max.padStart(8);
      const p95 = result.p95.padStart(8);

      console.log(`| ${name} | ${avg} | ${min} | ${max} | ${p95} |`);
    });

    console.log('='.repeat(80));

    // Performance recommendations
    console.log('\n🎯 Performance Analysis:');

    const avgResponse =
      this.results.reduce((sum, r) => sum + parseFloat(r.average), 0) / this.results.length;

    if (avgResponse < 100) {
      console.log('✅ Excellent performance! Average response time under 100ms');
    } else if (avgResponse < 300) {
      console.log('🟡 Good performance. Average response time under 300ms');
    } else {
      console.log('🔴 Performance needs improvement. Average response time over 300ms');
    }

    // Check for caching effectiveness
    const cacheableEndpoints = this.results.filter(
      (r) => r.name.includes('API') || r.name.includes('Profile'),
    );
    if (cacheableEndpoints.length > 0) {
      const avgCachedTime =
        cacheableEndpoints.reduce((sum, r) => sum + parseFloat(r.average), 0) /
        cacheableEndpoints.length;

      if (avgCachedTime < 50) {
        console.log('✅ Cache is working effectively! API responses under 50ms');
      } else {
        console.log('🔴 Cache may not be working optimally. Consider checking Redis connection');
      }
    }

    console.log('\n💡 Optimization Tips:');
    console.log('   • Ensure Redis is running for optimal caching');
    console.log('   • Check network latency if times are consistently high');
    console.log('   • Monitor cache hit rates in admin dashboard');
    console.log('   • Consider CDN for static assets in production');
  }
}

// Memory benchmark
async function benchmarkMemory() {
  console.log('\n💾 Memory Usage Analysis:');

  if (typeof process !== 'undefined' && process.memoryUsage) {
    const mem = process.memoryUsage();
    console.log(`   RSS: ${Math.round(mem.rss / 1024 / 1024)}MB`);
    console.log(`   Heap Used: ${Math.round(mem.heapUsed / 1024 / 1024)}MB`);
    console.log(`   Heap Total: ${Math.round(mem.heapTotal / 1024 / 1024)}MB`);
    console.log(`   External: ${Math.round(mem.external / 1024 / 1024)}MB`);
  } else {
    console.log('   Memory usage not available in this environment');
  }
}

// Cache performance test
async function testCachePerformance() {
  console.log('\n🗄️  Cache Performance Test:');

  const testUrl = `${BASE_URL}/api/posts/cached?page=1&limit=12`;

  // Clear cache first (if possible)
  console.log('   Testing cold cache...');
  const coldStart = performance.now();
  try {
    const coldResponse = await fetch(testUrl);
    const coldEnd = performance.now();
    const coldTime = coldEnd - coldStart;
    const cacheStatus = coldResponse.headers.get('x-cache') || 'UNKNOWN';

    console.log(`   Cold cache: ${coldTime.toFixed(2)}ms (Status: ${cacheStatus})`);

    // Test warm cache
    console.log('   Testing warm cache...');
    const warmStart = performance.now();
    const warmResponse = await fetch(testUrl);
    const warmEnd = performance.now();
    const warmTime = warmEnd - warmStart;
    const warmCacheStatus = warmResponse.headers.get('x-cache') || 'UNKNOWN';

    console.log(`   Warm cache: ${warmTime.toFixed(2)}ms (Status: ${warmCacheStatus})`);

    const improvement = ((coldTime - warmTime) / coldTime) * 100;
    console.log(`   Cache improvement: ${improvement.toFixed(1)}%`);
  } catch (error) {
    console.error('   Cache test failed:', error.message);
  }
}

// Main execution
async function main() {
  console.log('FluxAO Performance Test Suite');
  console.log('============================');

  const tester = new PerformanceTester();

  try {
    await benchmarkMemory();
    await testCachePerformance();
    await tester.runAllTests();

    console.log('\n🎉 Performance testing completed!');
    console.log('💡 Visit http://localhost:3005/admin/cache to view cache statistics');
  } catch (error) {
    console.error('❌ Performance testing failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { PerformanceTester };

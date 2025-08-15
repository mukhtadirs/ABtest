// Test cases for QA validation of statistical functions
import { decide } from './decision';
import type { Input } from './decision';

export const testCases: Array<{ name: string; input: Input; expectedBehavior: string }> = [
  // Small counts edge cases
  {
    name: "Very small counts - should use Fisher's exact",
    input: {
      metric: "ctr",
      variants: [
        { name: "A", traffic: 10, successes: 1 },
        { name: "B", traffic: 12, successes: 3 }
      ]
    },
    expectedBehavior: "Should use Fisher's exact test due to small sample sizes"
  },
  
  // Zero traffic edge case
  {
    name: "Zero traffic variant",
    input: {
      metric: "conversion", 
      variants: [
        { name: "A", traffic: 100, successes: 5 },
        { name: "B", traffic: 0, successes: 0 }
      ]
    },
    expectedBehavior: "Should handle zero traffic gracefully"
  },
  
  // Perfect conversion edge case
  {
    name: "100% conversion rate",
    input: {
      metric: "conversion",
      variants: [
        { name: "A", traffic: 50, successes: 25 },
        { name: "B", traffic: 50, successes: 50 }
      ]
    },
    expectedBehavior: "Should handle 100% conversion rate"
  },
  
  // Equal rates tie case
  {
    name: "Exact tie scenario",
    input: {
      metric: "ctr",
      variants: [
        { name: "A", traffic: 1000, successes: 50 },
        { name: "B", traffic: 1000, successes: 50 }
      ]
    },
    expectedBehavior: "Should detect tie and show appropriate messaging"
  },
  
  // Multi-variant test
  {
    name: "Multi-variant A/B/C test",
    input: {
      metric: "ctr",
      variants: [
        { name: "A", traffic: 1000, successes: 50 },
        { name: "B", traffic: 1100, successes: 66 },
        { name: "C", traffic: 1200, successes: 84 }
      ]
    },
    expectedBehavior: "Should use Chi-square test for 3+ variants"
  },
  
  // Large sample sizes
  {
    name: "Large sample sizes",
    input: {
      metric: "conversion",
      variants: [
        { name: "A", traffic: 100000, successes: 5000 },
        { name: "B", traffic: 100000, successes: 5500 }
      ]
    },
    expectedBehavior: "Should use z-test with large samples"
  }
];

// Run QA tests
export function runQATests(): { passed: number; failed: number; results: any[] } {
  const results = [];
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    try {
      const result = decide(testCase.input);
      
      // Basic sanity checks
      const checks = [
        { name: "p-value is valid", pass: result.pValue >= 0 && result.pValue <= 1 },
        { name: "has test name", pass: !!result.testName },
        { name: "variants data complete", pass: result.variants.length === testCase.input.variants.length },
        { name: "confidence intervals valid", pass: result.variants.every(v => v.ciLow <= v.rate && v.rate <= v.ciHigh) }
      ];
      
      const allPassed = checks.every(c => c.pass);
      
      if (allPassed) {
        passed++;
      } else {
        failed++;
      }
      
      results.push({
        testName: testCase.name,
        passed: allPassed,
        result,
        checks,
        expectedBehavior: testCase.expectedBehavior
      });
      
    } catch (error) {
      failed++;
      results.push({
        testName: testCase.name,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        expectedBehavior: testCase.expectedBehavior
      });
    }
  }
  
  return { passed, failed, results };
}

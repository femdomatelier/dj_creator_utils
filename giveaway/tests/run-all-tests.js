#!/usr/bin/env node

const path = require('path');
const chalk = require('chalk');

// Test runner without Jest dependency
class SimpleTestRunner {
    constructor() {
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
        this.currentSuite = '';
    }

    describe(name, fn) {
        this.currentSuite = name;
        console.log(chalk.bold.blue(`\n📋 ${name}`));
        console.log(chalk.gray('─'.repeat(50)));
        fn();
    }

    test(name, fn) {
        this.totalTests++;
        try {
            fn();
            this.passedTests++;
            console.log(chalk.green(`  ✅ ${name}`));
        } catch (error) {
            this.failedTests++;
            console.log(chalk.red(`  ❌ ${name}`));
            console.log(chalk.gray(`     Suite: ${this.currentSuite}`));
            console.log(chalk.gray(`     Error: ${error.message}`));
            if (error.stack) {
                console.log(chalk.gray(`     Stack: ${error.stack.split('\n')[1]?.trim()}`));
            }
        }
    }

    expect(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`Expected ${expected}, got ${actual}`);
                }
            },
            toHaveLength: (expected) => {
                if (!actual || actual.length !== expected) {
                    throw new Error(`Expected length ${expected}, got ${actual?.length || 'undefined'}`);
                }
            },
            toEqual: (expected) => {
                if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                    throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
                }
            },
            toContain: (expected) => {
                if (!actual || !actual.includes(expected)) {
                    throw new Error(`Expected array to contain ${expected}`);
                }
            },
            not: {
                toContain: (expected) => {
                    if (actual && actual.includes(expected)) {
                        throw new Error(`Expected array NOT to contain ${expected}`);
                    }
                }
            },
            toHaveProperty: (prop) => {
                if (!actual || !(prop in actual)) {
                    throw new Error(`Expected object to have property ${prop}`);
                }
            },
            toBeGreaterThan: (expected) => {
                if (actual <= expected) {
                    throw new Error(`Expected ${actual} to be greater than ${expected}`);
                }
            },
            toThrow: (expectedMessage) => {
                let threw = false;
                let thrownMessage = '';
                try {
                    actual();
                } catch (error) {
                    threw = true;
                    thrownMessage = error.message;
                }
                if (!threw) {
                    throw new Error('Expected function to throw an error');
                }
                if (expectedMessage && !thrownMessage.includes(expectedMessage)) {
                    throw new Error(`Expected error message to contain "${expectedMessage}", got "${thrownMessage}"`);
                }
            },
            arrayContaining: (expected) => {
                return expected.every(item => actual.includes(item));
            }
        };
    }

    async runTests() {
        console.log(chalk.bold.cyan('🧪 Running X/Twitter Lottery System Tests\n'));

        // Set up global test functions
        global.describe = this.describe.bind(this);
        global.test = this.test.bind(this);
        global.expect = this.expect.bind(this);

        // Run unit tests
        console.log(chalk.bold.yellow('📦 Unit Tests'));
        require('./unit/data-parser.test');
        require('./unit/lottery-engine.test');
        require('./unit/output.test');

        // Run integration tests
        console.log(chalk.bold.yellow('\n🔗 Integration Tests'));
        require('./integration/full-lottery-flow.test');

        // Show summary
        console.log('\n' + chalk.bold.blue('='.repeat(60)));
        console.log(chalk.bold.white('📊 TEST SUMMARY'));
        console.log(chalk.bold.blue('='.repeat(60)));
        console.log(`Total Tests: ${chalk.cyan(this.totalTests)}`);
        console.log(`Passed: ${chalk.green(this.passedTests)}`);
        console.log(`Failed: ${chalk.red(this.failedTests)}`);
        
        const successRate = Math.round((this.passedTests / this.totalTests) * 100);
        const coloredRate = successRate >= 90 ? chalk.green(`${successRate}%`) : chalk.yellow(`${successRate}%`);
        console.log(`Success Rate: ${coloredRate}`);

        if (this.failedTests === 0) {
            console.log(chalk.bold.green('\n🎉 All tests passed!'));
            process.exit(0);
        } else {
            console.log(chalk.bold.red(`\n💥 ${this.failedTests} test(s) failed`));
            process.exit(1);
        }
    }
}

// Run tests
const runner = new SimpleTestRunner();
runner.runTests().catch(error => {
    console.error(chalk.red('Test runner error:', error));
    process.exit(1);
});
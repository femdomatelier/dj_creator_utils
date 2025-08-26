const LotteryEngine = require('../../src/lottery/lottery-engine');

describe('LotteryEngine Unit Tests', () => {
    test('should draw correct number of winners', () => {
        const engine = new LotteryEngine({ seed: 12345 });
        const participants = [
            { username: 'user1' },
            { username: 'user2' },
            { username: 'user3' },
            { username: 'user4' },
            { username: 'user5' }
        ];

        const result = engine.drawWinners(participants, 3);

        expect(result.winners).toHaveLength(3);
        expect(result.totalParticipants).toBe(5);
        expect(result.drawMethod).toBe('random');
        expect(result.seed).toBe(12345);
    });

    test('should handle weighted lottery', () => {
        const engine = new LotteryEngine({ 
            seed: 12345,
            weightedMode: true 
        });
        
        const participants = [
            { username: 'user1', weight: 1 },
            { username: 'user2', weight: 3 }, // Higher chance
            { username: 'user3', weight: 1 }
        ];

        const result = engine.drawWinners(participants, 2);

        expect(result.winners).toHaveLength(2);
        expect(result.drawMethod).toBe('weighted');
        expect(result.winners[0]).toHaveProperty('weight');
    });

    test('should validate draw results', () => {
        const engine = new LotteryEngine();
        const participants = [
            { username: 'user1' },
            { username: 'user2' }
        ];

        const result = engine.drawWinners(participants, 1);
        const validation = engine.validateDraw(result, participants, 1);

        expect(validation.valid).toBe(true);
    });

    test('should reject invalid draws', () => {
        const engine = new LotteryEngine();
        const participants = [{ username: 'user1' }];
        
        const invalidResult = {
            winners: [{ username: 'nonexistent' }]
        };
        
        const validation = engine.validateDraw(invalidResult, participants, 1);

        expect(validation.valid).toBe(false);
        expect(validation.reason).toContain('not in participant list');
    });

    test('should handle empty participants', () => {
        const engine = new LotteryEngine();
        
        expect(() => {
            engine.drawWinners([], 1);
        }).toThrow('No participants available');
    });

    test('should handle too many winners requested', () => {
        const engine = new LotteryEngine();
        const participants = [{ username: 'user1' }];
        
        expect(() => {
            engine.drawWinners(participants, 5);
        }).toThrow('Cannot select 5 winners from 1 participants');
    });

    test('should assign winner ranks correctly', () => {
        const engine = new LotteryEngine({ seed: 12345 });
        const participants = [
            { username: 'user1' },
            { username: 'user2' },
            { username: 'user3' }
        ];

        const result = engine.drawWinners(participants, 3);

        expect(result.winners[0].rank).toBe(1);
        expect(result.winners[1].rank).toBe(2);
        expect(result.winners[2].rank).toBe(3);
    });
});

// Mock Jest functions if not available
if (typeof describe === 'undefined') {
    const { describe, test, expect } = require('./data-parser.test');
    global.describe = describe;
    global.test = test;
    global.expect = expect;
}
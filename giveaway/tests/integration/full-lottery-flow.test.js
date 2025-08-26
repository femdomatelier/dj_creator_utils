const DataParser = require('../../src/parsers/data-parser');
const LotteryEngine = require('../../src/lottery/lottery-engine');
const OutputManager = require('../../src/utils/output');
const fs = require('fs').promises;
const path = require('path');

describe('Integration Tests - Full Lottery Flow', () => {
    // Mock data similar to what would come from TwitterScraper
    const mockRetweeters = ['user1', 'user2', 'user3', 'user4'];
    const mockLikers = ['user2', 'user3', 'user5', 'user6', 'user7'];
    const mockFollowers = ['user1', 'user3', 'user6', 'user8', 'user9'];

    test('should complete full lottery flow with like-only filter', async () => {
        // Step 1: Parse data
        const parser = new DataParser({
            filters: { requireLike: true }
        });
        
        const participants = parser.parseUsers([], mockLikers, []);
        
        expect(participants).toHaveLength(5);
        expect(participants.every(p => p.type === 'like')).toBe(true);
        
        // Step 2: Run lottery
        const engine = new LotteryEngine({ seed: 12345 });
        const result = engine.drawWinners(participants, 3);
        
        expect(result.winners).toHaveLength(3);
        expect(result.totalParticipants).toBe(5);
        
        // Step 3: Validate
        const validation = engine.validateDraw(result, participants, 3);
        expect(validation.valid).toBe(true);
        
        // Step 4: Format output
        const outputData = {
            result,
            statistics: parser.getStatistics(participants),
            participants,
            metadata: {
                timestamp: new Date().toISOString(),
                tweetUrl: 'https://x.com/test/status/123'
            }
        };
        
        const outputManager = new OutputManager({ format: 'json' });
        const jsonOutput = outputManager.formatSimplifiedJSON(outputData);
        const parsed = JSON.parse(jsonOutput);
        
        expect(parsed.winners).toHaveLength(3);
        expect(parsed.participants).toHaveLength(5);
        expect(parsed.seed).toBe(12345);
    });

    test('should handle multiple filter requirements', async () => {
        const parser = new DataParser({
            filters: { 
                requireRetweet: true,
                requireLike: true 
            }
        });
        
        // Only users who both retweeted AND liked
        const participants = parser.parseUsers(mockRetweeters, mockLikers, []);
        
        // Should only include user2 and user3 (intersection)
        expect(participants).toHaveLength(2);
        expect(participants.map(p => p.username).sort()).toEqual(['user2', 'user3']);
        expect(participants.every(p => p.types.includes('retweet') && p.types.includes('like'))).toBe(true);
        
        const engine = new LotteryEngine();
        const result = engine.drawWinners(participants, 2);
        
        expect(result.winners).toHaveLength(2);
    });

    test('should handle weighted lottery with multiple actions', async () => {
        const parser = new DataParser({ removeDuplicates: true });
        const participants = parser.parseUsers(mockRetweeters, mockLikers, mockFollowers);
        
        // Find users with multiple actions
        const multiActionUsers = participants.filter(p => p.weight > 1);
        expect(multiActionUsers.length).toBeGreaterThan(0);
        
        const engine = new LotteryEngine({ 
            seed: 54321,
            weightedMode: true 
        });
        
        const result = engine.drawWinners(participants, 3);
        
        expect(result.winners).toHaveLength(3);
        expect(result.drawMethod).toBe('weighted');
        expect(result.winners.every(w => w.weight >= 1)).toBe(true);
    });

    test('should handle edge case with no qualifying participants', async () => {
        const parser = new DataParser({
            filters: { 
                requireRetweet: true,
                requireLike: true,
                requireFollow: true 
            }
        });
        
        // Very restrictive - need all three actions
        const participants = parser.parseUsers(['user1'], ['user2'], ['user3']);
        
        // No user satisfies all three requirements
        expect(participants).toHaveLength(0);
        
        const engine = new LotteryEngine();
        
        expect(() => {
            engine.drawWinners(participants, 1);
        }).toThrow('No participants available');
    });

    test('should produce consistent results with same seed', async () => {
        const parser = new DataParser({
            filters: { requireLike: true }
        });
        
        const participants = parser.parseUsers([], mockLikers, []);
        
        const engine1 = new LotteryEngine({ seed: 99999 });
        const engine2 = new LotteryEngine({ seed: 99999 });
        
        const result1 = engine1.drawWinners(participants, 3);
        const result2 = engine2.drawWinners(participants, 3);
        
        expect(result1.winners.map(w => w.username)).toEqual(
            result2.winners.map(w => w.username)
        );
    });

    test('should filter out excluded usernames', async () => {
        const parser = new DataParser({
            filters: { 
                requireLike: true,
                excludeUsernames: ['user2', 'user5']
            }
        });
        
        const participants = parser.parseUsers([], mockLikers, []);
        
        expect(participants.map(p => p.username)).not.toContain('user2');
        expect(participants.map(p => p.username)).not.toContain('user5');
        expect(participants).toHaveLength(3); // user3, user6, user7
    });

    test('should generate file output in correct format', async () => {
        const parser = new DataParser({
            filters: { requireLike: true }
        });
        
        const participants = parser.parseUsers([], mockLikers.slice(0, 3), []);
        const engine = new LotteryEngine({ seed: 11111 });
        const result = engine.drawWinners(participants, 2);
        
        const outputData = {
            result,
            statistics: parser.getStatistics(participants),
            participants,
            metadata: {
                timestamp: '2024-01-01T12:00:00.000Z',
                tweetUrl: 'https://x.com/test/status/123'
            }
        };
        
        const outputManager = new OutputManager();
        const fileOutput = outputManager.formatSimplifiedJSON(outputData);
        const parsed = JSON.parse(fileOutput);
        
        // Verify structure
        expect(parsed).toHaveProperty('winners');
        expect(parsed).toHaveProperty('participants');
        expect(parsed).toHaveProperty('seed');
        expect(parsed).toHaveProperty('timestamp');
        
        // Verify content
        expect(parsed.winners).toHaveLength(2);
        expect(parsed.participants).toHaveLength(3);
        expect(parsed.seed).toBe(11111);
        expect(parsed.timestamp).toBe('2024-01-01T12:00:00.000Z');
        
        // Verify winners are subset of participants
        const allWinnersInParticipants = parsed.winners.every(winner => 
            parsed.participants.includes(winner)
        );
        expect(allWinnersInParticipants).toBe(true);
    });
});

// Mock Jest functions if not available
if (typeof describe === 'undefined') {
    const { describe, test, expect } = require('../unit/data-parser.test');
    global.describe = describe;
    global.test = test;
    global.expect = expect;
}
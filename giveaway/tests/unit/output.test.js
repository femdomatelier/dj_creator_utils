const OutputManager = require('../../src/utils/output');
const fs = require('fs').promises;
const path = require('path');

describe('OutputManager Unit Tests', () => {
    const testData = {
        result: {
            winners: [
                { username: 'winner1', rank: 1 },
                { username: 'winner2', rank: 2 }
            ],
            totalParticipants: 10,
            drawMethod: 'random',
            seed: 12345
        },
        statistics: {
            total: 10,
            retweeters: 5,
            likers: 7,
            multipleActions: 2
        },
        participants: [
            { username: 'user1' },
            { username: 'user2' },
            { username: 'winner1' },
            { username: 'winner2' }
        ],
        metadata: {
            timestamp: '2024-01-01T12:00:00.000Z',
            tweetUrl: 'https://x.com/test/status/123'
        }
    };

    test('should format simplified JSON for file output', () => {
        const output = new OutputManager({ format: 'json' });
        const result = output.formatSimplifiedJSON(testData);
        const parsed = JSON.parse(result);

        expect(parsed.winners).toEqual(['winner1', 'winner2']);
        expect(parsed.participants).toEqual(['user1', 'user2', 'winner1', 'winner2']);
        expect(parsed.seed).toBe(12345);
        expect(parsed.timestamp).toBe('2024-01-01T12:00:00.000Z');
    });

    test('should format full JSON for console output', () => {
        const output = new OutputManager({ format: 'json' });
        const result = output.formatJSON(testData);
        const parsed = JSON.parse(result);

        expect(parsed.result.winners).toHaveLength(2);
        expect(parsed.statistics.total).toBe(10);
        expect(parsed.metadata.tweetUrl).toBe('https://x.com/test/status/123');
    });



    test('should get correct type labels', () => {
        const output = new OutputManager();
        
        expect(output.getTypeIcon('retweet')).toBe('retweet');
        expect(output.getTypeIcon('like')).toBe('like');
        expect(output.getTypeIcon('follower')).toBe('follower');
        expect(output.getTypeIcon('unknown')).toBe('unknown');
    });

    test('should handle missing data gracefully', () => {
        const output = new OutputManager();
        const emptyData = {
            result: { winners: [] },
            statistics: { total: 0 },
            participants: [],
            metadata: {}
        };

        const result = output.formatSimplifiedJSON(emptyData);
        const parsed = JSON.parse(result);

        expect(parsed.winners).toEqual([]);
        expect(parsed.participants).toEqual([]);
        expect(parsed.seed).toBe(null);
    });
});

// Mock Jest functions if not available
if (typeof describe === 'undefined') {
    const { describe, test, expect } = require('./data-parser.test');
    global.describe = describe;
    global.test = test;
    global.expect = expect;
}
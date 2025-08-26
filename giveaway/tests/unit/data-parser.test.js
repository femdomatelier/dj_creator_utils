const DataParser = require("../../src/parsers/data-parser");

describe("DataParser Unit Tests", () => {
  test("should parse users from different sources", () => {
    const parser = new DataParser();
    const retweeters = ["user1", "user2"];
    const likers = ["user2", "user3"];
    const followers = ["user1", "user4"];

    const result = parser.parseUsers(retweeters, likers, followers);

    expect(result).toHaveLength(4);
    const usernames = result.map((u) => u.username).sort();
    const expected = ["user1", "user2", "user3", "user4"].sort();
    expect(usernames).toEqual(expected);
  });

  test("should deduplicate users correctly", () => {
    const parser = new DataParser({ removeDuplicates: true });
    const retweeters = ["user1", "user2"];
    const likers = ["user2", "user3"];

    const result = parser.parseUsers(retweeters, likers, []);

    const user2 = result.find((u) => u.username === "user2");
    expect(user2.types).toContain("retweet");
    expect(user2.types).toContain("like");
    expect(user2.weight).toBe(2);
  });

  test("should apply requireRetweet filter", () => {
    const parser = new DataParser({
      filters: { requireRetweet: true },
    });

    const retweeters = ["user1"];
    const likers = ["user2"];
    const result = parser.parseUsers(retweeters, likers, []);

    expect(result).toHaveLength(1);
    expect(result[0].username).toBe("user1");
  });

  test("should apply requireLike filter", () => {
    const parser = new DataParser({
      filters: { requireLike: true },
    });

    const retweeters = ["user1"];
    const likers = ["user2"];
    const result = parser.parseUsers(retweeters, likers, []);

    expect(result).toHaveLength(1);
    expect(result[0].username).toBe("user2");
  });

  test("should apply multiple filters (AND logic)", () => {
    const parser = new DataParser({
      filters: {
        requireRetweet: true,
        requireLike: true,
      },
    });

    const retweeters = ["user1", "user2"];
    const likers = ["user2", "user3"];
    const result = parser.parseUsers(retweeters, likers, []);

    expect(result).toHaveLength(1);
    expect(result[0].username).toBe("user2");
    expect(result[0].types).toContain("retweet");
    expect(result[0].types).toContain("like");
  });

  test("should exclude specified usernames", () => {
    const parser = new DataParser({
      filters: {
        excludeUsernames: ["bot1", "spam2"],
      },
    });

    const likers = ["user1", "bot1", "user3", "spam2"];
    const result = parser.parseUsers([], likers, []);

    expect(result).toHaveLength(2);
    expect(result.map((u) => u.username)).toEqual(["user1", "user3"]);
  });

  test("should calculate statistics correctly", () => {
    const parser = new DataParser();
    const users = [
      { username: "user1", types: ["retweet"] },
      { username: "user2", types: ["like"] },
      { username: "user3", types: ["retweet", "like"] },
    ];

    const stats = parser.getStatistics(users);

    expect(stats.total).toBe(3);
    expect(stats.retweeters).toBe(2);
    expect(stats.likers).toBe(2);
    expect(stats.multipleActions).toBe(1);
  });
});

// Mock Jest functions if not available
if (typeof describe === "undefined") {
  global.describe = (name, fn) => {
    console.log(`\n=== ${name} ===`);
    fn();
  };

  global.test = (name, fn) => {
    try {
      fn();
      console.log(`✅ ${name}`);
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
    }
  };

  global.expect = (actual) => ({
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`);
      }
    },
    toHaveLength: (expected) => {
      if (actual.length !== expected) {
        throw new Error(`Expected length ${expected}, got ${actual.length}`);
      }
    },
    toEqual: (expected) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(
          `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
        );
      }
    },
    toContain: (expected) => {
      if (!actual.includes(expected)) {
        throw new Error(`Expected array to contain ${expected}`);
      }
    },
    arrayContaining: (expected) => expected,
  });
}

module.exports = { describe, test, expect };

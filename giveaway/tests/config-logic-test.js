const DataParser = require("../src/parsers/data-parser");

// Mock data for testing
const mockRetweeters = ["user1", "user2", "user3"];
const mockLikers = ["user2", "user4", "user5"];
const mockFollowers = ["user1", "user3", "user6"];

function testConfigLogic() {
  console.log("=".repeat(60));
  console.log("Testing Configuration Logic");
  console.log("=".repeat(60));

  // Test case 1: Current problematic config
  console.log("\n1. Current problematic config:");
  console.log(
    "   interactions: { likes: true, retweets: false, followers: false }",
  );
  console.log("   filters: { requireRetweet: true, requireFollow: true }");

  const parser1 = new DataParser({
    filters: {
      requireRetweet: true,
      requireFollow: true,
      requireLike: false,
    },
  });

  // Simulate what happens: only collect likers, but require retweet + follow
  const result1 = parser1.parseUsers([], mockLikers, []); // No retweeters, no followers
  console.log(`   Result: ${result1.length} participants (Expected: 0)`);
  console.log("   ❌ Problem: Collected likers but filtered them out!");

  // Test case 2: Logical config - only require likes
  console.log("\n2. Logical config - only require likes:");
  console.log(
    "   filters: { requireLike: true, requireRetweet: false, requireFollow: false }",
  );

  const parser2 = new DataParser({
    filters: {
      requireRetweet: false,
      requireFollow: false,
      requireLike: true,
    },
  });

  const result2 = parser2.parseUsers([], mockLikers, []);
  console.log(`   Result: ${result2.length} participants (Expected: 3)`);
  console.log("   ✅ Works correctly");

  // Test case 3: Require multiple types
  console.log("\n3. Require multiple types (retweet AND follow):");
  console.log("   filters: { requireRetweet: true, requireFollow: true }");

  const parser3 = new DataParser({
    filters: {
      requireRetweet: true,
      requireFollow: true,
      requireLike: false,
    },
  });

  // Need to collect ALL types to find overlaps
  const result3 = parser3.parseUsers(mockRetweeters, [], mockFollowers);
  console.log(`   Result: ${result3.length} participants`);
  console.log(
    `   Users who are both retweeters AND followers: ${result3.map((u) => u.username).join(", ")}`,
  );

  // Test case 4: Smart auto-collection logic (what we want)
  console.log("\n4. Smart auto-collection logic:");
  console.log("   If requireRetweet=true → auto collect retweets");
  console.log("   If requireFollow=true → auto collect followers");
  console.log("   If requireLike=true → auto collect likes");

  const smartFilters = {
    requireRetweet: true,
    requireFollow: true,
    requireLike: false,
  };

  // This is what the system SHOULD do automatically
  const shouldCollectRetweets = smartFilters.requireRetweet;
  const shouldCollectFollowers = smartFilters.requireFollow;
  const shouldCollectLikes = smartFilters.requireLike;

  console.log(
    `   Auto-collect: retweets=${shouldCollectRetweets}, followers=${shouldCollectFollowers}, likes=${shouldCollectLikes}`,
  );

  const parser4 = new DataParser({ filters: smartFilters });
  const smartResult = parser4.parseUsers(
    shouldCollectRetweets ? mockRetweeters : [],
    shouldCollectLikes ? mockLikers : [],
    shouldCollectFollowers ? mockFollowers : [],
  );

  console.log(`   Smart result: ${smartResult.length} participants`);
  console.log("   ✅ This is the logic we should implement!");

  console.log("\n" + "=".repeat(60));
  console.log("CONCLUSION: interactions config is redundant!");
  console.log("The system should auto-collect based on filter requirements.");
  console.log("=".repeat(60));
}

// Run the test
testConfigLogic();

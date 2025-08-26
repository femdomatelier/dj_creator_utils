#!/usr/bin/env node

const { program } = require("commander");
const chalk = require("chalk");
const fs = require("fs").promises;
const TwitterScraper = require("./scrapers/twitter-scraper");
const DataParser = require("./parsers/data-parser");
const LotteryEngine = require("./lottery/lottery-engine");
const OutputManager = require("./utils/output");
require("dotenv").config();

program
  .name("x-lottery")
  .description(
    "Twitter/X Lottery System - Draw winners from tweet interactions",
  )
  .version("1.0.0");

program
  .option("-u, --url <url>", "Tweet URL to scrape")
  .option("-c, --config <path>", "Path to JSON config file")
  .option("-w, --winners <number>", "Number of winners to select", parseInt, 1)
  .option("-o, --output <format>", "Output format (text, json, csv)", "text")
  .option("-f, --file <path>", "Output to file instead of stdout")
  .option("--retweets", "Include retweeters in lottery", false)
  .option("--likes", "Include likers in lottery", false)
  .option("--followers", "Include followers in lottery", false)
  .option("--require-retweet", "Require participants to have retweeted")
  .option("--require-like", "Require participants to have liked")
  .option("--require-follow", "Require participants to be followers")
  .option("--weighted", "Use weighted lottery (more actions = higher chance)")
  .option("--exclude <users>", "Comma-separated list of usernames to exclude")
  .option("--auth-token <token>", "X auth_token for authentication")
  .option("--csrf-token <token>", "X CSRF token (ct0) for authentication")
  .option("--cookies-file <path>", "Path to cookies JSON file")
  .option("--headless", "Run browser in headless mode", true)
  .option("--verbose", "Enable verbose output")
  .option(
    "--timeout <ms>",
    "Navigation timeout in milliseconds",
    parseInt,
    60000,
  )
  .option("--retry <n>", "Number of retry attempts", parseInt, 2)
  .option("--debug", "Enable debug mode with screenshots")
  .option("--seed <value>", "Seed for random number generation")
  .action(async (options) => {
    let config = {};
    if (options.config) {
      try {
        const configContent = await fs.readFile(options.config, "utf8");
        const jsonConfig = JSON.parse(configContent);

        config = {
          url: jsonConfig.url,
          winners: jsonConfig.winners || 1,
          retweets: jsonConfig.interactions?.retweets || false,
          likes: jsonConfig.interactions?.likes || false,
          followers: jsonConfig.interactions?.followers || false,
          requireRetweet: jsonConfig.filters?.requireRetweet || false,
          requireLike: jsonConfig.filters?.requireLike || false,
          requireFollow: jsonConfig.filters?.requireFollow || false,
          weighted: jsonConfig.lottery?.weighted || false,
          seed: jsonConfig.lottery?.seed,
          output: jsonConfig.output?.format || "text",
          file: jsonConfig.output?.file,
          headless: jsonConfig.browser?.headless !== false,
          timeout: jsonConfig.browser?.timeout || 60000,
          retry: jsonConfig.browser?.retry || 2,
          exclude: jsonConfig.filters?.excludeUsernames?.join(",") || null,
        };

        if (options.url) config.url = options.url;
        if (options.winners && options.winners !== 1)
          config.winners = options.winners;
        if (options.output && options.output !== "text")
          config.output = options.output;
        if (options.file) config.file = options.file;
        if (options.exclude) config.exclude = options.exclude;
        if (options.seed) config.seed = options.seed;
        if (options.authToken) config.authToken = options.authToken;
        if (options.csrfToken) config.csrfToken = options.csrfToken;
        if (options.cookiesFile) config.cookiesFile = options.cookiesFile;
        if (options.verbose) config.verbose = options.verbose;
        if (options.debug) config.debug = options.debug;

        if (process.argv.includes("--retweets")) config.retweets = true;
        if (process.argv.includes("--likes")) config.likes = true;
        if (process.argv.includes("--followers")) config.followers = true;
        if (process.argv.includes("--require-retweet"))
          config.requireRetweet = true;
        if (process.argv.includes("--require-like")) config.requireLike = true;
        if (process.argv.includes("--require-follow"))
          config.requireFollow = true;
        if (process.argv.includes("--weighted")) config.weighted = true;
        if (process.argv.includes("--no-headless")) config.headless = false;

        console.log(
          chalk.green("✓ Loaded configuration from " + options.config),
        );
      } catch (error) {
        console.error(chalk.red("Failed to load config file:"), error.message);
        process.exit(1);
      }
    } else {
      config = { ...options };
    }

    if (!config.url) {
      console.error(
        chalk.red(
          "Error: Tweet URL is required (use -u or specify in config file)",
        ),
      );
      process.exit(1);
    }

    const outputManager = new OutputManager({
      format: config.output,
      filePath: config.file,
      verbose: config.verbose,
    });

    try {
      console.log(chalk.bold.cyan("\n🎲 X/Twitter Lottery System Started\n"));

      const needRetweets = config.requireRetweet;
      const needLikes = config.requireLike;
      const needFollowers = config.requireFollow;

      if (!needRetweets && !needLikes && !needFollowers) {
        config.retweets = true;
        config.requireRetweet = false;
        outputManager.outputWarning(
          "No filters specified, collecting retweets only",
        );
      } else {
        config.retweets = needRetweets;
        config.likes = needLikes;
        config.followers = needFollowers;
        outputManager.outputInfo(
          `Auto-collection: retweets=${needRetweets}, likes=${needLikes}, followers=${needFollowers}`,
        );
      }

      outputManager.outputInfo(`Target URL: ${config.url}`);
      outputManager.outputInfo(`Winners to select: ${config.winners}`);

      if (config.verbose) {
        outputManager.outputInfo(
          `Configuration - Retweets: ${config.retweets}, Likes: ${config.likes}, Followers: ${config.followers}`,
        );
        outputManager.outputInfo(
          `Filters - RequireRetweet: ${config.requireRetweet}, RequireFollow: ${config.requireFollow}`,
        );
      }

      if (config.requireRetweet && !config.retweets) {
        outputManager.outputWarning(
          "Configuration inconsistency: requireRetweet is true but retweets collection is disabled",
        );
      }
      if (config.requireFollow && !config.followers) {
        outputManager.outputWarning(
          "Configuration inconsistency: requireFollow is true but followers collection is disabled",
        );
      }
      if (config.requireLike && !config.likes) {
        outputManager.outputWarning(
          "Configuration inconsistency: requireLike is true but likes collection is disabled",
        );
      }

      const progressCallback = config.verbose
        ? (progress) => {
            if (progress.type === "user_found") {
              console.log(
                chalk.gray(
                  `  → Found user: @${progress.username} (Total: ${progress.total})`,
                ),
              );
            } else if (
              progress.type === "scroll_progress" &&
              progress.scrollCount % 5 === 0
            ) {
              console.log(
                chalk.yellow(
                  `  📊 Progress: ${progress.totalUsers} users after ${progress.elapsedTime}s`,
                ),
              );
            }
          }
        : null;

      const scraper = new TwitterScraper({
        headless: config.headless,
        timeout: config.timeout,
        authToken: config.authToken,
        csrfToken: config.csrfToken,
        cookiesFile: config.cookiesFile,
        progressCallback,
      });

      console.log(chalk.yellow("🔍 Initializing browser..."));
      await scraper.initialize();

      if (config.authToken || config.csrfToken || config.cookiesFile) {
        console.log(chalk.yellow("🔐 Verifying authentication..."));
        const isAuthenticated = await scraper.verifyAuthentication();
        if (!isAuthenticated) {
          outputManager.outputWarning(
            "Authentication verification failed - proceeding anyway",
          );
        }
      }

      console.log(chalk.yellow("📍 Navigating to tweet..."));

      let navigationSuccess = false;
      let retryCount = 0;
      const maxRetries = config.retry || 2;

      while (!navigationSuccess && retryCount <= maxRetries) {
        try {
          if (retryCount > 0) {
            outputManager.outputInfo(
              `Retry attempt ${retryCount}/${maxRetries}`,
            );
          }
          await scraper.navigateToTweet(config.url);
          navigationSuccess = true;

          if (config.debug) {
            await scraper.debugPageState("after-navigation");
          }
        } catch (navError) {
          retryCount++;
          if (retryCount > maxRetries) {
            if (config.debug) {
              await scraper.debugPageState("navigation-failed");
            }
            throw navError;
          }
          outputManager.outputWarning(
            `Navigation failed, retrying... (${retryCount}/${maxRetries})`,
          );
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }

      let retweeters = [];
      let likers = [];
      let followers = [];
      let tweetAuthor = null;

      if (config.followers) {
        tweetAuthor = await scraper.extractTweetAuthor();
        if (tweetAuthor) {
          outputManager.outputInfo(`Tweet author: @${tweetAuthor}`);
        } else {
          outputManager.outputWarning("Could not determine tweet author");
        }
      }

      if (config.retweets) {
        console.log(chalk.yellow("🔄 Extracting retweeters..."));
        retweeters = await scraper.extractRetweeters();
        outputManager.outputInfo(`Found ${retweeters.length} retweeters`);
      }

      if (config.likes) {
        console.log(chalk.yellow("❤️  Extracting likers..."));
        likers = await scraper.extractLikers();
        outputManager.outputInfo(`Found ${likers.length} likers`);
      }

      if (config.followers && tweetAuthor) {
        console.log(chalk.yellow("👥 Extracting followers..."));

        if (config.debug) {
          await scraper.debugPageState("before-followers-extraction");
        }

        followers = await scraper.extractFollowers(tweetAuthor);
        outputManager.outputInfo(
          `Found ${followers.length} followers of @${tweetAuthor}`,
        );

        if (config.debug && followers.length === 0) {
          await scraper.debugPageState("no-followers-found");
        }
      }

      await scraper.close();

      const filters = {
        requireRetweet: config.requireRetweet,
        requireLike: config.requireLike,
        requireFollow: config.requireFollow,
      };

      if (config.exclude) {
        filters.excludeUsernames = config.exclude
          .split(",")
          .map((u) => u.trim());
        outputManager.outputInfo(
          `Excluding: ${filters.excludeUsernames.join(", ")}`,
        );
      }

      const parser = new DataParser({
        removeDuplicates: true,
        filters,
      });

      console.log(chalk.yellow("🔧 Processing participants..."));
      const participants = parser.parseUsers(retweeters, likers, followers);
      const statistics = parser.getStatistics(participants);

      if (participants.length === 0) {
        throw new Error("No participants found matching the criteria");
      }

      outputManager.outputSuccess(
        `${participants.length} participants qualified for lottery`,
      );

      const lotteryEngine = new LotteryEngine({
        weightedMode: config.weighted,
        seed: config.seed || Date.now(),
      });

      console.log(chalk.yellow(`🎰 Drawing ${config.winners} winners...`));
      const result = lotteryEngine.drawWinners(participants, config.winners);

      const validation = lotteryEngine.validateDraw(
        result,
        participants,
        config.winners,
      );
      if (!validation.valid) {
        throw new Error(`Invalid lottery result: ${validation.reason}`);
      }

      const outputData = {
        result,
        statistics,
        participants,
        metadata: {
          tweetUrl: config.url,
          timestamp: new Date().toISOString(),
          filters: Object.keys(filters).filter((k) => filters[k]),
        },
      };

      console.log(chalk.green("\n✨ Lottery completed successfully!\n"));
      await outputManager.output(outputData);
    } catch (error) {
      outputManager.outputError(error);
      process.exit(1);
    }
  });

program.parse(process.argv);

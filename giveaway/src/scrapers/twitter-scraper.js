const { chromium } = require("playwright");
const winston = require("winston");

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console({
      silent: process.env.NODE_ENV === "test",
    }),
  ],
});

class TwitterScraper {
  constructor(options = {}) {
    this.headless = options.headless !== false;
    this.timeout = options.timeout || 30000;
    this.userAgent =
      options.userAgent ||
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
    this.browser = null;
    this.page = null;
    this.authToken = options.authToken || process.env.X_AUTH_TOKEN;
    this.csrfToken = options.csrfToken || process.env.X_CSRF_TOKEN;
    this.cookiesFile = options.cookiesFile || process.env.X_COOKIES_FILE;
    this.progressCallback = options.progressCallback || null;
    this.originalTweetUrl = null;
  }

  async initialize() {
    try {
      this.browser = await chromium.launch({
        headless: this.headless,
        args: [
          "--disable-blink-features=AutomationControlled",
          "--disable-dev-shm-usage",
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-accelerated-2d-canvas",
          "--disable-gpu",
        ],
      });

      const context = await this.browser.newContext({
        userAgent: this.userAgent,
        viewport: { width: 1920, height: 1080 },
        ignoreHTTPSErrors: true,
        bypassCSP: true,
      });

      this.page = await context.newPage();

      await this.loadAuthentication();

      await this.page.route(
        "**/*.{png,jpg,jpeg,gif,webp,svg,ico,woff,woff2,ttf,eot}",
        (route) => route.abort(),
      );

      await this.page.setExtraHTTPHeaders({
        "Accept-Language": "en-US,en;q=0.9",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      });

      logger.info("Browser initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize browser:", error);
      throw error;
    }
  }

  async navigateToTweet(tweetUrl) {
    try {
      logger.info(`Navigating to tweet: ${tweetUrl}`);
      this.originalTweetUrl = tweetUrl;

      await this.page.goto(tweetUrl, {
        waitUntil: "domcontentloaded",
        timeout: this.timeout,
      });

      try {
        await this.page.waitForSelector("article", {
          timeout: 10000,
        });
      } catch (selectorError) {
        logger.warn(
          "Article element not found, checking for alternative selectors",
        );
        await this.page
          .waitForSelector('[data-testid="tweet"]', {
            timeout: 5000,
          })
          .catch(() => {
            logger.warn("Tweet element not found, continuing anyway");
          });
      }

      await this.page.waitForTimeout(2000);

      const isLoginRequired = await this.checkLoginRequired();
      if (isLoginRequired) {
        logger.warn("Login may be required for full data access");
      }

      return true;
    } catch (error) {
      logger.error("Failed to navigate to tweet:", error.message);

      if (error.message.includes("Timeout")) {
        logger.info("Attempting alternative navigation strategy...");
        try {
          await this.page.goto(tweetUrl, {
            waitUntil: "load",
            timeout: 60000,
          });
          await this.page.waitForTimeout(3000);
          return true;
        } catch (retryError) {
          logger.error(
            "Alternative navigation also failed:",
            retryError.message,
          );
        }
      }
      throw error;
    }
  }

  async loadAuthentication() {
    try {
      if (this.cookiesFile) {
        const fs = require("fs").promises;
        const cookiesString = await fs.readFile(this.cookiesFile, "utf8");
        const cookies = JSON.parse(cookiesString);
        await this.page.context().addCookies(cookies);
        logger.info("Loaded cookies from file");
      } else if (this.authToken && this.csrfToken) {
        const cookies = [
          {
            name: "auth_token",
            value: this.authToken,
            domain: ".x.com",
            path: "/",
            httpOnly: true,
            secure: true,
          },
          {
            name: "ct0",
            value: this.csrfToken,
            domain: ".x.com",
            path: "/",
            secure: true,
          },
        ];
        await this.page.context().addCookies(cookies);
        logger.info("Loaded auth tokens");
      } else {
        logger.warn(
          "No authentication provided - may not be able to access all content",
        );
      }
    } catch (error) {
      logger.warn("Failed to load authentication:", error.message);
    }
  }

  async verifyAuthentication() {
    try {
      logger.info("Verifying authentication status...");

      await this.page.goto("https://x.com", {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      await this.page.waitForTimeout(3000);

      const userMenu = await this.page.$(
        '[data-testid="SideNav_AccountSwitcher_Button"]',
      );
      const loginButton = await this.page.$('[data-testid="loginButton"]');

      if (userMenu) {
        const usernameElement = await this.page.$(
          '[data-testid="SideNav_AccountSwitcher_Button"] [dir="ltr"]',
        );
        const username = usernameElement
          ? await usernameElement.textContent()
          : "Unknown";
        logger.info(`✓ Authentication successful - logged in as: ${username}`);
        return true;
      } else if (loginButton) {
        logger.error(
          "✗ Authentication failed - not logged in (login button visible)",
        );
        return false;
      } else {
        const isLoginPage = await this.page.$('input[name="text"]');
        if (isLoginPage) {
          logger.error("✗ Authentication failed - redirected to login page");
          return false;
        } else {
          logger.warn("? Authentication status unclear - proceeding anyway");
          return true;
        }
      }
    } catch (error) {
      logger.warn("Could not verify authentication:", error.message);
      return false;
    }
  }

  async checkLoginRequired() {
    try {
      const loginPrompt = await this.page.$('[data-testid="login"]');
      return !!loginPrompt;
    } catch {
      return false;
    }
  }

  async extractRetweeters() {
    try {
      logger.info("Extracting retweeters...");

      let retweetButton = await this.page.$('[data-testid="retweet"]');
      if (!retweetButton) {
        retweetButton = await this.page.$('[data-testid="unretweet"]');
      }
      if (!retweetButton) {
        retweetButton = await this.page.$(
          'div[role="button"][aria-label*="Retweet"]',
        );
      }
      if (!retweetButton) {
        retweetButton = await this.page.$(
          'div[role="button"]:has(svg[viewBox="0 0 24 24"])',
        );
      }

      if (!retweetButton) {
        logger.warn("Retweet button not found - trying alternative approach");

        const retweetCountElement = await this.page
          .$('span:has-text("retweet")')
          .catch(() => null);
        if (retweetCountElement) {
          logger.info("Found retweet count element, but no clickable button");
        } else {
          logger.warn("No retweet interactions found on this tweet");
          return [];
        }
      }

      let retweetCount = 0;
      try {
        if (retweetButton) {
          const retweetText = await retweetButton.innerText().catch(() => "");
          retweetCount = parseInt(retweetText.replace(/[^0-9]/g, "") || "0");

          if (retweetCount === 0) {
            const ariaLabel =
              (await retweetButton.getAttribute("aria-label")) || "";
            const match = ariaLabel.match(/(\d+)/);
            if (match) {
              retweetCount = parseInt(match[1]);
            }
          }
        }
      } catch (error) {
        logger.warn("Could not determine retweet count:", error.message);
      }

      if (retweetCount === 0) {
        logger.info("No retweets found on this tweet");
        return [];
      }

      logger.info(
        `Found ${retweetCount} retweets, attempting to access retweet list`,
      );

      if (retweetButton) {
        await retweetButton.click();
        await this.page.waitForTimeout(2000);

        const viewRetweetsOption = await this.page
          .$('div[role="menuitem"]:has-text("View retweets")')
          .catch(() => null);
        if (viewRetweetsOption) {
          await viewRetweetsOption.click();
          await this.page.waitForTimeout(2000);

          const users = await this.scrollAndExtractUsers();
          logger.info(`Extracted ${users.length} retweeters`);
          return users;
        }

        const originalUrl = this.page.url();
        const tweetId = originalUrl.match(/status\/(\d+)/)?.[1];
        if (tweetId) {
          const retweetsUrl = originalUrl.replace(
            /\/status\/\d+.*/,
            `/status/${tweetId}/retweets`,
          );
          logger.info(`Trying direct navigation to: ${retweetsUrl}`);

          await this.page.goto(retweetsUrl, {
            waitUntil: "domcontentloaded",
            timeout: 30000,
          });
          await this.page.waitForTimeout(2000);

          const users = await this.scrollAndExtractUsers();
          logger.info(`Extracted ${users.length} retweeters`);

          await this.returnToOriginalTweet();

          return users;
        }
      }

      logger.warn(
        "Could not access retweet list - may require authentication or tweet may be private",
      );
      return [];
    } catch (error) {
      logger.error("Failed to extract retweeters:", error.message);
      return [];
    }
  }

  async extractLikers() {
    try {
      logger.info("Extracting likers...");

      let likeButton = await this.page.$('[data-testid="like"]');
      if (!likeButton) {
        likeButton = await this.page.$('[data-testid="unlike"]');
      }
      if (!likeButton) {
        likeButton = await this.page.$(
          'div[role="button"][aria-label*="Like"]',
        );
      }
      if (!likeButton) {
        likeButton = await this.page.$(
          'div[role="button"][aria-label*="like"]',
        );
      }

      if (!likeButton) {
        logger.warn("Like button not found - trying alternative approach");

        const likeCountElement = await this.page
          .$('span:has-text("like")')
          .catch(() => null);
        if (likeCountElement) {
          logger.info("Found like count element, but no clickable button");
        } else {
          logger.warn("No like interactions found on this tweet");
          return [];
        }
      }

      let likeCount = 0;
      try {
        if (likeButton) {
          const likeText = await likeButton.innerText().catch(() => "");
          likeCount = parseInt(likeText.replace(/[^0-9]/g, "") || "0");

          if (likeCount === 0) {
            const ariaLabel =
              (await likeButton.getAttribute("aria-label")) || "";
            const match = ariaLabel.match(/(\d+)/);
            if (match) {
              likeCount = parseInt(match[1]);
            }
          }
        }
      } catch (error) {
        logger.warn("Could not determine like count:", error.message);
      }

      if (likeCount === 0) {
        logger.info("No likes found on this tweet");
        return [];
      }

      logger.info(`Found ${likeCount} likes, attempting to access like list`);

      if (likeButton) {
        await likeButton.click();
        await this.page.waitForTimeout(2000);

        const likedByLink = await this.page
          .$('a[href*="/likes"]')
          .catch(() => null);
        if (likedByLink) {
          await likedByLink.click();
          await this.page.waitForTimeout(2000);

          const users = await this.scrollAndExtractUsers();
          logger.info(`Extracted ${users.length} likers`);
          return users;
        }

        const originalUrl = this.page.url();
        const tweetId = originalUrl.match(/status\/(\d+)/)?.[1];
        if (tweetId) {
          const likesUrl = originalUrl.replace(
            /\/status\/\d+.*/,
            `/status/${tweetId}/likes`,
          );
          logger.info(`Trying direct navigation to: ${likesUrl}`);

          await this.page.goto(likesUrl, {
            waitUntil: "domcontentloaded",
            timeout: 30000,
          });
          await this.page.waitForTimeout(2000);

          const users = await this.scrollAndExtractUsers();
          logger.info(`Extracted ${users.length} likers`);

          await this.returnToOriginalTweet();

          return users;
        }
      }

      logger.warn(
        "Could not access like list - may require authentication or tweet may be private",
      );
      return [];
    } catch (error) {
      logger.error("Failed to extract likers:", error.message);
      return [];
    }
  }

  async scrollAndExtractUsers(maxScrolls = 50) {
    const users = new Set();
    let previousHeight = 0;
    let scrollCount = 0;
    let noNewUsersCount = 0;
    let previousUsersCount = 0;
    const startTime = Date.now();

    logger.info("Starting user extraction (no timeout)...");

    while (scrollCount < maxScrolls) {
      const userElements = await this.page
        .$$('[data-testid="UserCell"]')
        .catch(() => []);

      let newUsersThisScroll = 0;
      for (const element of userElements) {
        try {
          let username = null;

          const directLink = await element.$('a[href^="/"]');
          if (directLink) {
            const href = await directLink.getAttribute("href");
            const extracted = href.replace("/", "").split("/")[0];
            if (extracted && !extracted.includes("/") && extracted.length > 0) {
              username = extracted;
            }
          }

          if (!username) {
            const userNameElement = await element.$('[data-testid="UserName"]');
            if (userNameElement) {
              const usernameSpan = await userNameElement.$(
                "div:nth-child(2) span",
              );
              if (usernameSpan) {
                const text = await usernameSpan.textContent();
                if (text && text.startsWith("@")) {
                  username = text.substring(1);
                }
              }
            }
          }

          if (!username) {
            const atElements = await element.$$("span");
            for (const span of atElements) {
              const text = await span.textContent().catch(() => "");
              if (text.startsWith("@") && text.length > 1) {
                username = text.substring(1);
                break;
              }
            }
          }

          if (username && username.length > 0 && !username.includes("/")) {
            const sizeBefore = users.size;
            users.add(username);
            if (users.size > sizeBefore) {
              newUsersThisScroll++;
              if (this.progressCallback) {
                this.progressCallback({
                  type: "user_found",
                  username,
                  total: users.size,
                });
              }
            }
          }
        } catch (error) {
          continue;
        }
      }

      const currentHeight = await this.page.evaluate(
        () => document.body.scrollHeight,
      );

      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      logger.info(
        `[${elapsedSeconds}s] Scroll ${scrollCount + 1}: Found ${users.size} unique users (+${newUsersThisScroll} new)`,
      );

      if (this.progressCallback) {
        this.progressCallback({
          type: "scroll_progress",
          scrollCount: scrollCount + 1,
          totalUsers: users.size,
          newUsers: newUsersThisScroll,
          elapsedTime: elapsedSeconds,
        });
      }

      if (users.size === previousUsersCount) {
        noNewUsersCount++;
        if (noNewUsersCount >= 3) {
          logger.info(
            "No new users found in last 3 scrolls, stopping extraction",
          );
          break;
        }
      } else {
        noNewUsersCount = 0;
      }

      previousUsersCount = users.size;

      if (currentHeight === previousHeight) {
        logger.info("Reached end of list (no more content to scroll)");
        break;
      }

      previousHeight = currentHeight;
      await this.page.evaluate(() =>
        window.scrollTo(0, document.body.scrollHeight),
      );
      await this.page.waitForTimeout(2000);
      scrollCount++;
    }

    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    logger.info(
      `Extraction complete: ${users.size} users found in ${totalTime} seconds`,
    );

    return Array.from(users);
  }

  async extractFollowers(username) {
    try {
      logger.info(`Extracting followers for @${username}...`);

      const followersUrl = `https://x.com/${username}/followers`;
      logger.info(`Navigating to followers page: ${followersUrl}`);

      await this.page.goto(followersUrl, {
        waitUntil: "domcontentloaded",
        timeout: this.timeout,
      });

      try {
        await this.page.waitForSelector('[data-testid="primaryColumn"]', {
          timeout: 10000,
        });
        logger.info("Primary column loaded successfully");
      } catch (error) {
        logger.warn("Primary column selector not found, continuing anyway");
      }

      await this.page.waitForTimeout(3000);

      const isAccessible = await this.checkFollowersAccessible();
      if (!isAccessible) {
        logger.warn(
          "Cannot access followers list - may require authentication or be private",
        );
        return [];
      }

      const followersCount = await this.getFollowersCount(username);
      if (followersCount === 0) {
        logger.info("User has no followers or followers are not visible");
        return [];
      }

      logger.info(`Found ${followersCount} followers, starting extraction...`);

      const users = await this.scrollAndExtractUsers();
      logger.info(`Extracted ${users.length} followers`);
      return users;
    } catch (error) {
      logger.error("Failed to extract followers:", error.message);
      return [];
    }
  }

  async checkFollowersAccessible() {
    try {
      const loginButton = await this.page.$('[data-testid="loginButton"]');
      if (loginButton) {
        logger.warn("Login required to view followers");
        return false;
      }

      const protectedText = await this.page
        .$(':has-text("This account")')
        .catch(() => null);
      if (protectedText) {
        const text = await protectedText.textContent();
        if (text.includes("protected") || text.includes("private")) {
          logger.warn("Account is protected - followers not visible");
          return false;
        }
      }

      await this.page.waitForTimeout(2000);
      const userCells = await this.page.$$('[data-testid="UserCell"]');
      logger.info(`Found ${userCells.length} user cells on followers page`);

      return true;
    } catch (error) {
      logger.warn("Error checking followers accessibility:", error.message);
      return true;
    }
  }

  async getFollowersCount(username) {
    try {
      const followersLink = await this.page.$(
        `a[href="/${username}/followers"]`,
      );
      if (followersLink) {
        const followersText = await followersLink.textContent();
        const match = followersText.match(/([0-9,]+)\s*Followers?/i);
        if (match) {
          const count = parseInt(match[1].replace(/,/g, ""));
          logger.info(`User has ${count} followers`);
          return count;
        }
      }

      const pageTitle = await this.page.title();
      if (pageTitle.includes("Followers")) {
        logger.info("On followers page, proceeding with extraction");
        return -1;
      }

      logger.warn("Could not determine followers count, but proceeding");
      return -1;
    } catch (error) {
      logger.warn("Error getting followers count:", error.message);
      return -1;
    }
  }

  async extractTweetAuthor() {
    try {
      const currentUrl = this.page.url();
      const urlMatch = currentUrl.match(/x\.com\/([^\/]+)\/status/);
      if (urlMatch && urlMatch[1]) {
        logger.info(`Tweet author from URL: @${urlMatch[1]}`);
        return urlMatch[1];
      }

      logger.warn("Could not extract author from URL");
      return null;
    } catch (error) {
      logger.error("Failed to extract tweet author:", error.message);
      return null;
    }
  }

  async returnToOriginalTweet() {
    if (!this.originalTweetUrl) {
      logger.warn("No original tweet URL stored");
      return;
    }

    try {
      logger.info("Returning to original tweet");
      await this.page.goto(this.originalTweetUrl, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      await this.page.waitForTimeout(2000);
    } catch (error) {
      logger.error("Failed to return to original tweet:", error.message);
    }
  }

  async debugPageState(description = "debug") {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `debug-${description}-${timestamp}.png`;

      await this.page.screenshot({
        path: filename,
        fullPage: true,
      });

      logger.info(`Debug screenshot saved: ${filename}`);

      const url = this.page.url();
      const title = await this.page.title();
      logger.info(`Current page: ${title} - ${url}`);

      const tweet = await this.page.$('[data-testid="tweet"]');
      const retweetBtn = await this.page.$('[data-testid="retweet"]');
      const likeBtn = await this.page.$('[data-testid="like"]');

      logger.info(
        `Elements found - Tweet: ${!!tweet}, Retweet: ${!!retweetBtn}, Like: ${!!likeBtn}`,
      );
    } catch (error) {
      logger.warn("Failed to capture debug info:", error.message);
    }
  }

  async close() {
    try {
      if (this.browser) {
        await this.browser.close();
        logger.info("Browser closed");
      }
    } catch (error) {
      logger.error("Failed to close browser:", error);
    }
  }
}

module.exports = TwitterScraper;

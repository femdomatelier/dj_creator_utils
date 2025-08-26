# X/Twitter Lottery System

A command-line tool for running lotteries based on Twitter/X post interactions (retweets, likes, followers) without using the API.

## Features

- Extract retweeters from any tweet
- Extract users who liked a tweet  
- Extract followers of the tweet author
- Random or weighted lottery drawing
- Multiple output formats (text, JSON, CSV)
- Advanced filtering options
- No API required

## Installation

```bash
npm install
npx playwright install chromium
```

## Usage

### Basic Example

Draw 1 winner from retweeters:
```bash
node src/cli.js --url "https://x.com/user/status/123456" --retweets
```

### Advanced Examples

Draw 5 winners from retweeters and likers, save to CSV:
```bash
node src/cli.js --url "https://x.com/user/status/123456" \
  --winners 5 \
  --retweets --likes \
  --output csv \
  --file winners.csv
```

Weighted lottery (users with multiple actions have higher chance):
```bash
node src/cli.js --url "https://x.com/user/status/123456" \
  --winners 3 \
  --retweets --likes --followers \
  --weighted
```

Filter participants (must retweet AND follow):
```bash
node src/cli.js --url "https://x.com/user/status/123456" \
  --winners 10 \
  --retweets --followers \
  --require-retweet --require-follow
```

Exclude specific users:
```bash
node src/cli.js --url "https://x.com/user/status/123456" \
  --winners 5 \
  --retweets \
  --exclude "bot1,bot2,testuser"
```

### Using JSON Configuration

Create a task configuration file:
```bash
node src/cli.js --config config/task-example.json
```

### Authentication for R18/Private Content

Method 1 - Using tokens:
```bash
node src/cli.js --url "https://x.com/user/status/123456" \
  --auth-token "your_auth_token" \
  --csrf-token "your_csrf_token" \
  --retweets
```

Method 2 - Using cookies file:
```bash
node src/cli.js --url "https://x.com/user/status/123456" \
  --cookies-file cookies.json \
  --retweets
```

Method 3 - Environment variables:
```bash
export X_AUTH_TOKEN="your_auth_token"
export X_CSRF_TOKEN="your_csrf_token" 
node src/cli.js --url "https://x.com/user/status/123456" --retweets
```

### Verbose Mode with Progress Tracking

For large datasets, use verbose mode to see real-time progress:
```bash
node src/cli.js --url "https://x.com/user/status/123456" \
  --retweets --verbose
```

This will show:
- Individual users as they're discovered
- Progress updates every 5 scrolls
- Time elapsed and total users found

## Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `-u, --url <url>` | Tweet URL to scrape | - |
| `-c, --config <path>` | JSON configuration file | - |
| `-w, --winners <n>` | Number of winners to select | 1 |
| `-o, --output <format>` | Output format (text/json/csv) | text |
| `-f, --file <path>` | Save output to file | stdout |
| `--retweets` | Include retweeters | false |
| `--likes` | Include likers | false |
| `--followers` | Include followers | false |
| `--require-retweet` | Only users who retweeted | false |
| `--require-like` | Only users who liked | false |
| `--require-follow` | Only users who follow | false |
| `--weighted` | Weighted lottery mode | false |
| `--exclude <users>` | Comma-separated exclusion list | - |
| `--auth-token <token>` | X authentication token | - |
| `--csrf-token <token>` | X CSRF token (ct0) | - |
| `--cookies-file <path>` | Path to cookies JSON file | - |
| `--headless` | Run browser in headless mode | true |
| `--verbose` | Enable verbose logging and progress | false |
| `--timeout <ms>` | Navigation timeout | 60000 |
| `--retry <n>` | Number of retry attempts | 2 |
| `--debug` | Enable debug mode with screenshots | false |
| `--seed <value>` | Random seed for reproducibility | timestamp |

## Output Formats

### Text (Default)
Human-readable format with colors:
```
==================================================
LOTTERY RESULTS
==================================================

STATISTICS:
Total Participants: 150
Retweeters: 100
Likers: 75
Multiple Actions: 25

WINNERS:
#1 - @winner1 (retweet)
#2 - @winner2 (retweet, like)
#3 - @winner3 (retweet)

METADATA:
Draw Method: random
Timestamp: 2024-01-01T12:00:00.000Z
Tweet: https://x.com/user/status/123456
Seed: 12345
```

### JSON
Structured data for programmatic use:
```json
{
  "result": {
    "winners": [...],
    "totalParticipants": 150,
    "drawMethod": "random"
  },
  "statistics": {...},
  "metadata": {...}
}
```

### CSV
Spreadsheet-compatible format with headers.

## Configuration

Create a `.env` file for default settings:
```bash
cp .env.example .env
```

## Important Notes

- This tool uses browser automation and may be affected by X/Twitter's anti-bot measures
- Respect X/Twitter's Terms of Service
- Large participant lists may take time to load
- Login may be required for some features

## Troubleshooting

1. **Browser won't start**: Run `npx playwright install chromium`
2. **Can't access tweet**: Tweet may be private or deleted
3. **No participants found**: Check your filter settings
4. **Rate limited**: Add delays or reduce frequency

## License

ISC
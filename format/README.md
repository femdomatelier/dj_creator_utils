# Format Tools

Template-based file generation tools for DLsite products and giveaway notifications.

## Features

### DLsite Tool
Generate product announcement files with:
- Automatic date and price calculations
- Discount period calculations
- Multiple date formats (international and Japanese)
- Price formatting with currency symbols

### Giveaway Notification Tool
Generate personalized winner notifications by:
- Matching winners from JSON with serial numbers from CSV
- Creating individual notification files for each winner
- Automatic serial number assignment

## Installation

```bash
cd format
npm install
```

## Usage

### DLsite Product Announcement
```bash
node src/cli.js dlsite <input.json> <template-name> [--output <path>]
```

Example:
```bash
node src/cli.js dlsite examples/dlsite-sample.json dlsite-product-announcement
```

### Giveaway Winner Notifications
```bash
node src/cli.js giveaway <winners.json> <serials.csv> <template-name> [--output-dir <path>]
```

Example:
```bash
node src/cli.js giveaway examples/winners-sample.json examples/serials-sample.csv giveaway-winner-notification
```

### List Available Example Templates
```bash
node src/cli.js list-templates
```

### Test All Templates
```bash
# Interactive test with detailed output
./test-templates.sh

# Quick test without interaction
./quick-test.sh
```

## Templates

Templates use `{{variable}}` syntax for variable substitution. All template files should be created by users and placed in the examples directory or any custom location.

### Date Format
For date inputs in JSON files, use simple `YYYY-MM-DD` format (e.g., `"2024-03-20"`). No need to include time information.

### Available Variables for DLsite Templates:

**Basic Information:**
- `{{title}}`, `{{productId}}`, `{{genre}}`

**Date Variables (Japanese as default):**
- `{{date}}` - Full date in Japanese (2024年02月14日)
- `{{dateNoYear}}` - Date without year (2月14日)
- `{{weekday}}` - Weekday in Japanese (水曜日)
- `{{dateISO}}` - ISO format (2024-02-14)
- `{{dateMD}}` - Month/Day (02/14)

**Price Variables:**
- `{{price}}` - Original price (¥2,000)
- `{{salePrice}}` - Discounted price (¥1,500)
- `{{savings}}` - Savings amount (¥500)
- `{{off}}` - Discount percentage (25)

**Discount Period:**
- `{{startDate}}`, `{{endDate}}` - Discount period dates
- `{{days}}` - Discount duration days

**Current Time:**
- `{{now}}` - Current date in Japanese
- `{{nowTime}}` - Current date and time
- `{{nowISO}}` - Current date in ISO format

**Legacy Variables (for compatibility):**
- All original variable names still supported

### Available Variables for Giveaway Templates:
- `{{winnerUsername}}`, `{{winnerRank}}`, `{{rankOrdinal}}`
- `{{serialNumber}}`
- `{{participationTypes}}`
- `{{matchIndex}}`, `{{totalWinners}}`
- `{{nowTime}}` - Current date and time

## File Structure

```
format/
├── src/
│   ├── cli.js                    # Main CLI entry point
│   ├── dlsite-tool.js           # DLsite product tool
│   ├── giveaway-notification.js # Giveaway notification tool
│   ├── template-engine.js       # Template processing engine
│   └── utils/
│       ├── date-calculator.js   # Date calculation utilities
│       ├── price-calculator.js  # Price calculation utilities
│       └── file-processor.js    # File I/O utilities
├── examples/                    # Sample templates and input files
└── output/                      # Generated files (ignored by git)
    └── notifications/           # Giveaway notification files
```
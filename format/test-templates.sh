#!/bin/bash

# Format Tools Template Test Script
# This script demonstrates all available templates with sample data

echo "🎯 Format Tools - Template Test Script"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -f "src/cli.js" ]; then
    echo "❌ Error: Please run this script from the format directory"
    echo "   Current directory: $(pwd)"
    echo "   Expected files: src/cli.js"
    exit 1
fi

# Check if node modules are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Clean up previous output
if [ -d "output" ]; then
    echo "🧹 Cleaning up previous output..."
    rm -rf output/*
    echo ""
fi

echo "📋 Available Templates:"
node src/cli.js list-templates
echo ""

echo "🚀 Starting Template Tests..."
echo "=============================="
echo ""

# Test 1: Basic Template
echo "🔥 Test 1: Basic Template (dlsite-basic)"
echo "----------------------------------------"
echo "Input: examples/dlsite-basic-sample.json"
echo "Template: dlsite-basic"
echo ""
node src/cli.js dlsite examples/dlsite-basic-sample.json dlsite-basic
echo ""
echo "Generated output preview:"
echo "------------------------"
head -10 output/rj01234567_*.txt 2>/dev/null || echo "❌ File not found"
echo ""
echo "Press Enter to continue..."
read

# Test 2: Discount Template
echo "🔥 Test 2: Discount Template (dlsite-discount)"
echo "----------------------------------------------"
echo "Input: examples/dlsite-discount-sample.json"
echo "Template: dlsite-discount"
echo ""
node src/cli.js dlsite examples/dlsite-discount-sample.json dlsite-discount
echo ""
echo "Generated output preview:"
echo "------------------------"
head -15 output/rj02345678_*.txt 2>/dev/null || echo "❌ File not found"
echo ""
echo "Press Enter to continue..."
read

# Test 3: Voice Actors Template
echo "🔥 Test 3: Voice Actors Template (dlsite-voice-actors)"
echo "----------------------------------------------------"
echo "Input: examples/dlsite-voice-actors-sample.json"
echo "Template: dlsite-voice-actors"
echo ""
node src/cli.js dlsite examples/dlsite-voice-actors-sample.json dlsite-voice-actors
echo ""
echo "Generated output preview:"
echo "------------------------"
head -20 output/rj03456789_*.txt 2>/dev/null || echo "❌ File not found"
echo ""
echo "Press Enter to continue..."
read

# Test 4: Full Product Announcement Template
echo "🔥 Test 4: Full Product Announcement (dlsite-product-announcement)"
echo "-----------------------------------------------------------------"
echo "Input: examples/dlsite-sample.json"
echo "Template: dlsite-product-announcement"
echo ""
node src/cli.js dlsite examples/dlsite-sample.json dlsite-product-announcement
echo ""
echo "Generated output preview:"
echo "------------------------"
head -25 output/rj12345678_*.txt 2>/dev/null || echo "❌ File not found"
echo ""
echo "Press Enter to continue..."
read

# Test 5: Giveaway Notification Template
echo "🔥 Test 5: Giveaway Notification Template"
echo "----------------------------------------"
echo "Input: examples/winners-sample.json + examples/serials-sample.csv"
echo "Template: giveaway-winner-notification"
echo ""
node src/cli.js giveaway examples/winners-sample.json examples/serials-sample.csv giveaway-winner-notification
echo ""
echo "Generated notification preview:"
echo "------------------------------"
if [ -f "output/notifications/notification_1_alice_gamer.txt" ]; then
    head -15 output/notifications/notification_1_alice_gamer.txt
else
    echo "❌ Notification file not found"
fi
echo ""
echo "Press Enter to continue..."
read

echo "📊 Test Summary"
echo "==============="
echo ""
echo "📁 Generated Files:"
echo "DLsite outputs:"
ls -la output/*.txt 2>/dev/null | wc -l | xargs echo "  DLsite files:"
echo ""
echo "Giveaway notifications:"
ls -la output/notifications/*.txt 2>/dev/null | wc -l | xargs echo "  Notification files:"
echo ""

echo "🎉 All template tests completed!"
echo ""
echo "💡 Next Steps:"
echo "  1. Check the 'output/' directory for DLsite generated files"
echo "  2. Check the 'output/notifications/' directory for giveaway notifications"
echo "  3. Create your own templates by copying and modifying existing ones"
echo "  4. Use your own JSON data files with the templates"
echo ""
echo "📖 Template Variable Reference:"
echo "  - See README.md for complete variable list"
echo "  - Date format: YYYY-MM-DD (e.g., '2024-03-20')"
echo "  - Custom variables: Add any field to JSON, use {{fieldName}} in template"
echo ""
echo "🛠️  Usage Examples:"
echo "  node src/cli.js dlsite your-data.json your-template"
echo "  node src/cli.js giveaway winners.json serials.csv notification-template"
echo "  node src/cli.js list-templates"
echo ""
echo "✨ Happy templating!"
#!/bin/bash

# Format Tools Quick Test Script
# Runs all template tests without manual interaction

echo "🚀 Format Tools - Quick Test"
echo "============================"
echo ""

# Check if we're in the right directory
if [ ! -f "src/cli.js" ]; then
    echo "❌ Error: Please run this script from the format directory"
    exit 1
fi

# Clean up previous output
rm -rf output/* 2>/dev/null

echo "🔥 Testing all templates..."
echo ""

# Test all DLsite templates
echo "1️⃣ Testing Basic Template..."
node src/cli.js dlsite examples/dlsite-basic-sample.json dlsite-basic

echo "2️⃣ Testing Discount Template..."
node src/cli.js dlsite examples/dlsite-discount-sample.json dlsite-discount

echo "3️⃣ Testing Voice Actors Template..."
node src/cli.js dlsite examples/dlsite-voice-actors-sample.json dlsite-voice-actors

echo "4️⃣ Testing Full Product Template..."
node src/cli.js dlsite examples/dlsite-sample.json dlsite-product-announcement

echo "5️⃣ Testing Giveaway Notifications..."
node src/cli.js giveaway examples/winners-sample.json examples/serials-sample.csv giveaway-winner-notification

echo ""
echo "📊 Test Results:"
echo "==============="
echo "DLsite files generated: $(ls output/*.txt 2>/dev/null | wc -l)"
echo "Notification files generated: $(ls output/notifications/*.txt 2>/dev/null | wc -l)"
echo ""

if [ "$(ls output/*.txt 2>/dev/null | wc -l)" -eq 4 ] && [ "$(ls output/notifications/*.txt 2>/dev/null | wc -l)" -eq 3 ]; then
    echo "✅ All tests PASSED! All templates working correctly."
else
    echo "❌ Some tests FAILED! Check output directory."
fi

echo ""
echo "📁 Generated files:"
echo "DLsite outputs:"
ls -1 output/*.txt 2>/dev/null | sed 's/^/  /'
echo "Giveaway notifications:"
ls -1 output/notifications/*.txt 2>/dev/null | sed 's/^/  /'
echo ""
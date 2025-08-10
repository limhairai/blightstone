#!/bin/bash

# Simple wrapper to run the dev script from project root
# This allows you to run ./start-dev.sh from anywhere in the project

echo "🚀 Starting Blightstone CRM..."
echo ""

# Check if we're in the project root
if [ ! -f "dev-scripts/start-dev.sh" ]; then
    echo "❌ Error: Must be run from the project root directory"
    echo "💡 Make sure you're in /Users/hairai/Documents/Code/blightstonecrm"
    exit 1
fi

# Make sure the script is executable
chmod +x dev-scripts/start-dev.sh

# Run the actual dev script
exec ./dev-scripts/start-dev.sh
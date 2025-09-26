#!/bin/bash

# Script to copy routing changes to your local Clovie project
# Run this from your local Clovie root directory

echo "🔄 Copying Clovie routing changes to local project..."

# Backup existing files
echo "📦 Creating backups..."
cp lib/main.js lib/main.js.backup 2>/dev/null || echo "  No existing main.js to backup"
cp lib/core/server.js lib/core/server.js.backup 2>/dev/null || echo "  No existing server.js to backup"
cp config/clovie.config.js config/clovie.config.js.backup 2>/dev/null || echo "  No existing config to backup"

echo ""
echo "📁 Files to copy from remote environment:"
echo "  1. lib/core/router.js (NEW - 306 lines)"
echo "  2. lib/main.js (UPDATED - routing integration)" 
echo "  3. lib/core/server.js (UPDATED - live mode support)"
echo "  4. config/clovie.config.js (UPDATED - routing config)"
echo ""

echo "📋 Copy these files manually, or:"
echo "  1. Use the file contents I'll provide below"
echo "  2. Or copy the entire modified files from the remote environment"
echo ""

echo "✅ Backups created. Ready to apply routing changes!"
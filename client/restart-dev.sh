#!/bin/bash

echo "🔄 Restarting Frontend Development Server"
echo "=========================================="

# Kill any existing Vite processes
echo "🛑 Stopping existing Vite processes..."
pkill -f "vite" || true

# Clear node modules cache
echo "🧹 Clearing node modules cache..."
rm -rf node_modules/.vite

# Clear browser cache (optional - uncomment if needed)
# echo "🧹 Clearing browser cache..."
# rm -rf ~/.cache/chromium/Default/Cache/* 2>/dev/null || true

# Reinstall dependencies (optional - uncomment if needed)
# echo "📦 Reinstalling dependencies..."
# npm install

# Start the development server
echo "🚀 Starting development server..."
npm run dev

echo "✅ Frontend server restarted!"
echo "💡 If you're still seeing timeout issues, try:"
echo "   1. Hard refresh your browser (Ctrl+F5 or Cmd+Shift+R)"
echo "   2. Clear browser cache completely"
echo "   3. Check if the backend is running properly"


#!/bin/bash

echo "🚀 Starting Clovie Live Server Test..."

# Start the server in the background
node ../bin/cli.js --config live.config.js --watch &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Test endpoints
echo ""
echo "🏠 Testing Home Page:"
curl -s http://localhost:3002/ | grep -o '<title>.*</title>'

echo ""
echo "📖 Testing About Page:"
curl -s http://localhost:3002/about | grep -o '<title>.*</title>'

echo ""
echo "📝 Testing Blog Post with Parameters:"
curl -s http://localhost:3002/blog/hello-world | grep -o '<title>.*</title>'

echo ""
echo "🔒 Testing Protected Admin (should fail):"
curl -s -w "%{http_code}" http://localhost:3002/admin | tail -1

echo ""
echo "🔑 Testing Admin with Auth (should work):"
curl -s -H "Authorization: Bearer admin-token" http://localhost:3002/admin | grep -o '<title>.*</title>'

echo ""
echo "🔗 Testing API Endpoints:"
echo "GET /api/posts:"
curl -s http://localhost:3002/api/posts | head -3

echo ""
echo "GET /api/posts/hello-world:"
curl -s http://localhost:3002/api/posts/hello-world | head -3

echo ""
echo "✅ Tests completed!"

# Stop the server
kill $SERVER_PID
echo "🛑 Server stopped"
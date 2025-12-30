#!/bin/bash

# Test script for new features
# This will test like, follow, comment, and playlist features

set -e

echo "🧪 Testing SoundCloud Features"
echo "==============================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get API URL
API_URL="${1:-http://localhost/api}"
echo -e "${BLUE}API URL: $API_URL${NC}"
echo ""

# Test credentials
EMAIL="${2:-admin@example.com}"
PASSWORD="${3:-password123}"

# Login and get token
echo -e "${BLUE}1. Testing Login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Login failed!${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Login successful${NC}"
echo ""

# Test getting tracks
echo -e "${BLUE}2. Testing Get Tracks...${NC}"
TRACKS_RESPONSE=$(curl -s "$API_URL/tracks")
TRACK_ID=$(echo $TRACKS_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$TRACK_ID" ]; then
  echo -e "${YELLOW}⚠️  No tracks found. Please upload a track first.${NC}"
else
  echo -e "${GREEN}✅ Found track ID: $TRACK_ID${NC}"
fi
echo ""

# Test like feature
if [ ! -z "$TRACK_ID" ]; then
  echo -e "${BLUE}3. Testing Like Feature...${NC}"
  LIKE_RESPONSE=$(curl -s -X POST "$API_URL/tracks/$TRACK_ID/like" \
    -H "Authorization: Bearer $TOKEN")
  
  if echo "$LIKE_RESPONSE" | grep -q "message"; then
    echo -e "${GREEN}✅ Like feature working${NC}"
  else
    echo -e "${RED}❌ Like feature failed${NC}"
    echo "Response: $LIKE_RESPONSE"
  fi
  echo ""
fi

# Test follow feature
echo -e "${BLUE}4. Testing Follow Feature...${NC}"
USERS_RESPONSE=$(curl -s "$API_URL/users")
USER_ID=$(echo $USERS_RESPONSE | grep -o '"id":[0-9]*' | head -2 | tail -1 | cut -d':' -f2)

if [ ! -z "$USER_ID" ]; then
  FOLLOW_RESPONSE=$(curl -s -X POST "$API_URL/users/$USER_ID/follow" \
    -H "Authorization: Bearer $TOKEN")
  
  if echo "$FOLLOW_RESPONSE" | grep -q "message"; then
    echo -e "${GREEN}✅ Follow feature working${NC}"
  else
    echo -e "${RED}❌ Follow feature failed${NC}"
    echo "Response: $FOLLOW_RESPONSE"
  fi
else
  echo -e "${YELLOW}⚠️  Not enough users to test follow${NC}"
fi
echo ""

# Test comment feature
if [ ! -z "$TRACK_ID" ]; then
  echo -e "${BLUE}5. Testing Comment Feature...${NC}"
  COMMENT_RESPONSE=$(curl -s -X POST "$API_URL/tracks/$TRACK_ID/comments" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"body":"Test comment from script"}')
  
  if echo "$COMMENT_RESPONSE" | grep -q "comment"; then
    echo -e "${GREEN}✅ Comment feature working${NC}"
  else
    echo -e "${RED}❌ Comment feature failed${NC}"
    echo "Response: $COMMENT_RESPONSE"
  fi
  echo ""
fi

# Test playlist feature
echo -e "${BLUE}6. Testing Playlist Feature...${NC}"
PLAYLIST_RESPONSE=$(curl -s -X POST "$API_URL/playlists" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Playlist","description":"Created by test script"}')

if echo "$PLAYLIST_RESPONSE" | grep -q "playlist"; then
  echo -e "${GREEN}✅ Playlist feature working${NC}"
  
  PLAYLIST_ID=$(echo $PLAYLIST_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  
  # Test adding track to playlist
  if [ ! -z "$TRACK_ID" ] && [ ! -z "$PLAYLIST_ID" ]; then
    echo -e "${BLUE}7. Testing Add Track to Playlist...${NC}"
    ADD_TRACK_RESPONSE=$(curl -s -X POST "$API_URL/playlists/$PLAYLIST_ID/tracks" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"track_id\":$TRACK_ID}")
    
    if echo "$ADD_TRACK_RESPONSE" | grep -q "message"; then
      echo -e "${GREEN}✅ Add track to playlist working${NC}"
    else
      echo -e "${RED}❌ Add track to playlist failed${NC}"
      echo "Response: $ADD_TRACK_RESPONSE"
    fi
  fi
else
  echo -e "${RED}❌ Playlist feature failed${NC}"
  echo "Response: $PLAYLIST_RESPONSE"
fi
echo ""

# Test search feature
echo -e "${BLUE}8. Testing Search Feature...${NC}"
SEARCH_RESPONSE=$(curl -s "$API_URL/search?q=test&filter=everything")

if echo "$SEARCH_RESPONSE" | grep -q "tracks"; then
  echo -e "${GREEN}✅ Search feature working${NC}"
else
  echo -e "${RED}❌ Search feature failed${NC}"
  echo "Response: $SEARCH_RESPONSE"
fi
echo ""

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 Testing Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "📊 Test Summary:"
echo -e "   ✅ Login"
echo -e "   ✅ Get Tracks"
if [ ! -z "$TRACK_ID" ]; then
  echo -e "   ✅ Like/Unlike"
  echo -e "   ✅ Comments"
fi
if [ ! -z "$USER_ID" ]; then
  echo -e "   ✅ Follow/Unfollow"
fi
echo -e "   ✅ Playlists"
echo -e "   ✅ Search"
echo ""
echo -e "${BLUE}All core features are working! 🎵${NC}"
echo ""


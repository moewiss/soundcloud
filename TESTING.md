# API Testing Guide

Complete guide for testing the SoundCloud Clone API.

## 🔧 Setup

Set your server URL:

```bash
export API_URL="http://localhost"  # or your server IP/domain
```

## 1. Authentication Flow

### Register New User

```bash
curl -X POST $API_URL/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "password_confirmation": "password123"
  }'
```

**Expected Response:**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "profile": {
      "display_name": "John Doe",
      "bio": null,
      "avatar_path": null
    }
  },
  "token": "1|abc123..."
}
```

Save the token:

```bash
export TOKEN="YOUR_TOKEN_HERE"
```

### Login

```bash
curl -X POST $API_URL/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Get Current User

```bash
curl -X GET $API_URL/api/me \
  -H "Authorization: Bearer $TOKEN"
```

### Logout

```bash
curl -X POST $API_URL/api/logout \
  -H "Authorization: Bearer $TOKEN"
```

## 2. Profile Management

### Update Profile

```bash
curl -X PUT $API_URL/api/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "DJ John",
    "bio": "Music producer and DJ from Berlin"
  }'
```

### Upload Avatar

```bash
curl -X PUT $API_URL/api/profile \
  -H "Authorization: Bearer $TOKEN" \
  -F "avatar=@/path/to/avatar.jpg"
```

### View User Profile (Public)

```bash
curl -X GET $API_URL/api/profiles/1
```

## 3. Track Management

### Upload Track

```bash
curl -X POST $API_URL/api/tracks \
  -H "Authorization: Bearer $TOKEN" \
  -F "title=Summer Vibes" \
  -F "description=Chill beats for summer" \
  -F "file=@/path/to/track.mp3" \
  -F "cover=@/path/to/cover.jpg" \
  -F "tags[]=electronic" \
  -F "tags[]=chill"
```

**Expected Response:**
```json
{
  "message": "Track uploaded successfully and is being processed",
  "track": {
    "id": 1,
    "user_id": 1,
    "title": "Summer Vibes",
    "status": "pending",
    ...
  }
}
```

### Get All Approved Tracks (Public)

```bash
curl -X GET $API_URL/api/tracks
```

### Get Single Track (Public)

```bash
curl -X GET $API_URL/api/tracks/1
```

This will:
- Return track details with audio URL
- Increment play count
- Show if current user liked it (if authenticated)

### Get My Tracks

```bash
curl -X GET $API_URL/api/me/tracks \
  -H "Authorization: Bearer $TOKEN"
```

### Delete Track

```bash
curl -X DELETE $API_URL/api/tracks/1 \
  -H "Authorization: Bearer $TOKEN"
```

## 4. Likes

### Like a Track

```bash
curl -X POST $API_URL/api/tracks/1/like \
  -H "Authorization: Bearer $TOKEN"
```

### Unlike a Track

```bash
curl -X DELETE $API_URL/api/tracks/1/like \
  -H "Authorization: Bearer $TOKEN"
```

### Get My Liked Tracks

```bash
curl -X GET $API_URL/api/me/likes \
  -H "Authorization: Bearer $TOKEN"
```

## 5. Admin Functions

First, login as admin:

```bash
curl -X POST $API_URL/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "password": "YOUR_ADMIN_PASSWORD"
  }'

export ADMIN_TOKEN="ADMIN_TOKEN_HERE"
```

### Get Pending Tracks

```bash
curl -X GET $API_URL/api/admin/tracks/pending \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Approve Track

```bash
curl -X PATCH $API_URL/api/admin/tracks/1/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Reject Track

```bash
curl -X PATCH $API_URL/api/admin/tracks/1/reject \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Get All Tracks (with filters)

```bash
# All tracks
curl -X GET $API_URL/api/admin/tracks \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Filter by status
curl -X GET "$API_URL/api/admin/tracks?status=approved" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## 🎯 Complete Test Scenario

Here's a complete flow to test everything:

```bash
#!/bin/bash

API_URL="http://localhost"

echo "=== 1. Register User ==="
REGISTER_RESPONSE=$(curl -s -X POST $API_URL/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "password_confirmation": "password123"
  }')

echo $REGISTER_RESPONSE | jq .

TOKEN=$(echo $REGISTER_RESPONSE | jq -r .token)
echo "Token: $TOKEN"

echo "\n=== 2. Get Current User ==="
curl -s -X GET $API_URL/api/me \
  -H "Authorization: Bearer $TOKEN" | jq .

echo "\n=== 3. Update Profile ==="
curl -s -X PUT $API_URL/api/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "DJ Test",
    "bio": "Testing the API"
  }' | jq .

echo "\n=== 4. Upload Track ==="
TRACK_RESPONSE=$(curl -s -X POST $API_URL/api/tracks \
  -H "Authorization: Bearer $TOKEN" \
  -F "title=Test Track" \
  -F "description=This is a test" \
  -F "file=@test.mp3")

echo $TRACK_RESPONSE | jq .
TRACK_ID=$(echo $TRACK_RESPONSE | jq -r .track.id)

echo "\n=== 5. Check My Tracks ==="
curl -s -X GET $API_URL/api/me/tracks \
  -H "Authorization: Bearer $TOKEN" | jq .

echo "\n=== 6. Login as Admin ==="
ADMIN_RESPONSE=$(curl -s -X POST $API_URL/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "password": "YOUR_ADMIN_PASSWORD"
  }')

ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | jq -r .token)

echo "\n=== 7. Check Pending Tracks ==="
curl -s -X GET $API_URL/api/admin/tracks/pending \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

echo "\n=== 8. Approve Track ==="
curl -s -X PATCH $API_URL/api/admin/tracks/$TRACK_ID/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

echo "\n=== 9. Get Public Tracks ==="
curl -s -X GET $API_URL/api/tracks | jq .

echo "\n=== 10. Like Track ==="
curl -s -X POST $API_URL/api/tracks/$TRACK_ID/like \
  -H "Authorization: Bearer $TOKEN" | jq .

echo "\n=== 11. View Track Details ==="
curl -s -X GET $API_URL/api/tracks/$TRACK_ID \
  -H "Authorization: Bearer $TOKEN" | jq .

echo "\n=== 12. Get Liked Tracks ==="
curl -s -X GET $API_URL/api/me/likes \
  -H "Authorization: Bearer $TOKEN" | jq .

echo "\n✅ All tests completed!"
```

## 📊 Expected Flow

1. **User uploads track** → Status: `pending`
2. **Queue processes** → Transcodes to MP3, extracts duration & waveform
3. **Admin reviews** → Sees in pending list
4. **Admin approves** → Status: `approved`
5. **Track appears publicly** → Users can stream, like, comment

## 🎧 Streaming Test

Once you have an approved track:

```bash
# Get track details (includes audio_url)
curl -X GET $API_URL/api/tracks/1 | jq .audio_url

# Copy the presigned URL and play it:
# Use VLC, browser, or:
curl "PRESIGNED_URL" -o downloaded.mp3
```

## 🔍 Debugging

### Check Queue Processing

```bash
# On server
docker compose logs -f queue
```

### Check Track Status

```bash
# In Laravel tinker
docker compose exec app php artisan tinker

# Then:
App\Models\Track::find(1);
```

### Check Storage Files

```bash
# Check MinIO
docker compose exec minio mc ls local/sc-bucket/audio/
docker compose exec minio mc ls local/sc-bucket/covers/
```

## 📝 Response Codes

- `200` - Success
- `201` - Created
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (not admin)
- `404` - Not Found
- `422` - Validation Error
- `500` - Server Error

## 🎨 Postman Collection

Import this JSON into Postman for easy testing:

```json
{
  "info": {
    "name": "SoundCloud Clone API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"John Doe\",\n  \"email\": \"john@example.com\",\n  \"password\": \"password123\",\n  \"password_confirmation\": \"password123\"\n}"
            },
            "url": "{{base_url}}/api/register"
          }
        }
      ]
    }
  ],
  "variable": [
    {"key": "base_url", "value": "http://localhost"}
  ]
}
```

---

Happy Testing! 🎵


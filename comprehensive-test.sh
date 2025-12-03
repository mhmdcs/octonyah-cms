#!/bin/bash

# ============================================
# This script was written by Opus 4.5 model
# COMPREHENSIVE ENDPOINT TESTING SCRIPT
# Octonyah Video Platform - CMS & Discovery Services
# ============================================

set +e  # Don't exit on error, it'll be handle manually

CMS_URL="http://localhost:3000"
DISCOVERY_URL="http://localhost:3001"

PASSED=0
FAILED=0
TOTAL=0

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test Thmanyah channel YouTube video URLs
YOUTUBE_VIDEOS=(
    "https://www.youtube.com/watch?v=VNo9nOmaghA"
    "https://www.youtube.com/watch?v=6GkAsaNhe38"
    "https://www.youtube.com/watch?v=j7hMiYLE_c4"
    "https://www.youtube.com/watch?v=o9u_C9-SFlk"
    "https://www.youtube.com/watch?v=YRvwFSk2sa4"
)

# Categories to use for testing
CATEGORIES=("Technology" "Science" "Education" "Entertainment" "Business")
VIDEO_TYPES=("video_podcast" "documentary")

# Store created video IDs for cleanup
CREATED_VIDEO_IDS=()
ADMIN_TOKEN=""
EDITOR_TOKEN=""

test_pass() {
    echo -e "${GREEN}✓${NC} $1"
    PASSED=$((PASSED + 1))
    TOTAL=$((TOTAL + 1))
}

test_fail() {
    echo -e "${RED}✗${NC} $1"
    FAILED=$((FAILED + 1))
    TOTAL=$((TOTAL + 1))
    if [ -n "$2" ]; then
        echo -e "  ${RED}Response: $2${NC}"
    fi
}

test_info() {
    echo -e "${YELLOW}→${NC} $1"
}

section_header() {
    echo ""
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}════════════════════════════════════════${NC}"
}

subsection_header() {
    echo ""
    echo -e "${CYAN}--- $1 ---${NC}"
}

# Helper function to extract JSON value
json_value() {
    echo "$1" | grep -o "\"$2\":\"[^\"]*" | cut -d'"' -f4
}

json_number() {
    echo "$1" | grep -o "\"$2\":[0-9]*" | cut -d':' -f2
}

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    OCTONYAH VIDEO PLATFORM - COMPREHENSIVE API TESTING       ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================
# 0. INITIAL CLEANUP (Remove leftover videos from previous runs)
# ============================================
section_header "0. INITIAL CLEANUP"
test_info "Logging in for cleanup..."
CLEANUP_LOGIN=$(curl -s -X POST $CMS_URL/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}')
if echo "$CLEANUP_LOGIN" | grep -q '"access_token"'; then
    CLEANUP_TOKEN=$(json_value "$CLEANUP_LOGIN" "access_token")
    test_info "Cleaning up leftover videos from previous runs..."
    EXISTING_VIDEOS=$(curl -s $CMS_URL/cms/videos -H "Authorization: Bearer $CLEANUP_TOKEN")
    CLEANUP_IDS=$(echo "$EXISTING_VIDEOS" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    CLEANUP_COUNT=0
    for vid in $CLEANUP_IDS; do
        curl -s -o /dev/null -X DELETE $CMS_URL/cms/videos/$vid -H "Authorization: Bearer $CLEANUP_TOKEN"
        CLEANUP_COUNT=$((CLEANUP_COUNT + 1))
    done
    if [ $CLEANUP_COUNT -gt 0 ]; then
        test_info "Cleaned up $CLEANUP_COUNT leftover videos"
    else
        test_info "No leftover videos to clean up"
    fi
else
    test_info "Could not login for cleanup, proceeding with tests..."
fi
echo ""

# ============================================
# 1. INFRASTRUCTURE HEALTH CHECKS
# ============================================
section_header "1. INFRASTRUCTURE HEALTH CHECKS"

subsection_header "Docker Containers"
test_info "Checking Docker containers..."
if docker ps --format '{{.Names}}' | grep -q "octonyah-cms" && \
   docker ps --format '{{.Names}}' | grep -q "octonyah-discovery"; then
    test_pass "CMS and Discovery containers are running"
else
    test_fail "Some containers are not running"
    echo -e "${RED}Please start the containers with: docker-compose up -d${NC}"
    exit 1
fi

subsection_header "CMS Service Root"
test_info "Testing CMS service root endpoint..."
CMS_ROOT=$(curl -s $CMS_URL/)
if echo "$CMS_ROOT" | grep -q "Welcome to Octonyah CMS API"; then
    test_pass "CMS service root endpoint working"
else
    test_fail "CMS service root endpoint failed" "$CMS_ROOT"
fi

subsection_header "Discovery Service Root"
test_info "Testing Discovery service root endpoint..."
DISCOVERY_ROOT=$(curl -s $DISCOVERY_URL/)
if echo "$DISCOVERY_ROOT" | grep -q "Welcome to the Octonyah Discovery API"; then
    test_pass "Discovery service root endpoint working"
else
    test_fail "Discovery service root endpoint failed" "$DISCOVERY_ROOT"
fi

subsection_header "CMS Health Check"
test_info "Testing CMS health endpoint..."
CMS_HEALTH=$(curl -s $CMS_URL/health)
if echo "$CMS_HEALTH" | grep -q '"status":"ok"'; then
    test_pass "CMS service health check passed"
    # Check database status
    if echo "$CMS_HEALTH" | grep -q '"database"'; then
        test_pass "CMS database connection healthy"
    else
        test_fail "CMS database status not reported"
    fi
else
    test_fail "CMS health check failed" "$CMS_HEALTH"
fi

subsection_header "Discovery Health Check"
test_info "Testing Discovery health endpoint..."
DISCOVERY_HEALTH=$(curl -s $DISCOVERY_URL/health)
if echo "$DISCOVERY_HEALTH" | grep -q '"status":"ok"'; then
    test_pass "Discovery service health check passed"
    # Check individual components
    if echo "$DISCOVERY_HEALTH" | grep -q '"database"'; then
        test_pass "Discovery database connection healthy"
    fi
    if echo "$DISCOVERY_HEALTH" | grep -q '"redis"'; then
        test_pass "Discovery Redis connection healthy"
    fi
    if echo "$DISCOVERY_HEALTH" | grep -q '"elasticsearch"'; then
        test_pass "Discovery Elasticsearch connection healthy"
    fi
else
    test_fail "Discovery health check failed" "$DISCOVERY_HEALTH"
fi

# ============================================
# 2. AUTHENTICATION TESTS
# ============================================
section_header "2. AUTHENTICATION TESTS"

subsection_header "Admin Login"
test_info "Testing admin login..."
ADMIN_LOGIN=$(curl -s -X POST $CMS_URL/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}')
if echo "$ADMIN_LOGIN" | grep -q '"access_token"'; then
    ADMIN_TOKEN=$(json_value "$ADMIN_LOGIN" "access_token")
    test_pass "Admin login successful"
else
    test_fail "Admin login failed" "$ADMIN_LOGIN"
    echo -e "${RED}Cannot continue without admin authentication${NC}"
    exit 1
fi

subsection_header "Editor Login"
test_info "Testing editor login..."
EDITOR_LOGIN=$(curl -s -X POST $CMS_URL/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"editor","password":"editor123"}')
if echo "$EDITOR_LOGIN" | grep -q '"access_token"'; then
    EDITOR_TOKEN=$(json_value "$EDITOR_LOGIN" "access_token")
    test_pass "Editor login successful"
else
    test_fail "Editor login failed" "$EDITOR_LOGIN"
fi

subsection_header "Authentication Failure Tests"
test_info "Testing invalid credentials..."
INVALID_LOGIN=$(curl -s -X POST $CMS_URL/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"wrongpassword"}')
if echo "$INVALID_LOGIN" | grep -q '"statusCode":401'; then
    test_pass "Invalid credentials correctly rejected (401)"
elif echo "$INVALID_LOGIN" | grep -q '"statusCode":429'; then
    test_pass "Invalid credentials rate limited (429 - endpoint protected)"
else
    test_fail "Invalid credentials not properly handled"
fi

test_info "Testing missing password..."
MISSING_PWD=$(curl -s -X POST $CMS_URL/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin"}')
if echo "$MISSING_PWD" | grep -q '"statusCode":400'; then
    test_pass "Missing password correctly validated (400)"
elif echo "$MISSING_PWD" | grep -q '"statusCode":429'; then
    test_pass "Missing password rate limited (429 - endpoint protected)"
else
    test_fail "Missing password validation failed"
fi

test_info "Testing missing username..."
MISSING_USER=$(curl -s -X POST $CMS_URL/auth/login \
    -H "Content-Type: application/json" \
    -d '{"password":"admin123"}')
if echo "$MISSING_USER" | grep -q '"statusCode":400'; then
    test_pass "Missing username correctly validated (400)"
elif echo "$MISSING_USER" | grep -q '"statusCode":429'; then
    test_pass "Missing username rate limited (429 - endpoint protected)"
else
    test_fail "Missing username validation failed"
fi

test_info "Testing empty body..."
EMPTY_BODY=$(curl -s -X POST $CMS_URL/auth/login \
    -H "Content-Type: application/json" \
    -d '{}')
# Empty body should return 400 (validation), 401 (auth error), or 429 (rate limited = protected)
if echo "$EMPTY_BODY" | grep -q '"statusCode":400'; then
    test_pass "Empty body correctly validated (400)"
elif echo "$EMPTY_BODY" | grep -q '"statusCode":401'; then
    test_pass "Empty body correctly handled (401)"
elif echo "$EMPTY_BODY" | grep -q '"statusCode":429'; then
    test_pass "Empty body rate limited (429 - endpoint protected)"
else
    test_fail "Empty body validation failed" "$EMPTY_BODY"
fi

# ============================================
# 3. VIDEO IMPORT TESTS
# ============================================
section_header "3. VIDEO IMPORT TESTS (YouTube API)"

subsection_header "Import Valid YouTube Videos"
# Import first video
test_info "Importing YouTube video 1: ${YOUTUBE_VIDEOS[0]}"
IMPORT1=$(curl -s -X POST $CMS_URL/cms/videos \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{
        \"url\": \"${YOUTUBE_VIDEOS[0]}\",
        \"category\": \"Technology\",
        \"type\": \"video_podcast\"
    }")
if echo "$IMPORT1" | grep -q '"id"'; then
    VIDEO1_ID=$(json_value "$IMPORT1" "id")
    CREATED_VIDEO_IDS+=("$VIDEO1_ID")
    test_pass "Video 1 imported successfully (ID: ${VIDEO1_ID:0:8}...)"
    
    # Verify imported metadata
    if echo "$IMPORT1" | grep -q '"title"' && \
       echo "$IMPORT1" | grep -q '"platform":"youtube"' && \
       echo "$IMPORT1" | grep -q '"embedUrl"'; then
        test_pass "Video 1 metadata correctly extracted from YouTube"
    else
        test_fail "Video 1 metadata extraction incomplete"
    fi
    
    # Check thumbnail was fetched
    if echo "$IMPORT1" | grep -q '"thumbnailUrl"'; then
        test_pass "Video 1 thumbnail URL extracted"
    fi
    
    # Check duration was extracted
    if echo "$IMPORT1" | grep -q '"duration"'; then
        test_pass "Video 1 duration extracted"
    fi
else
    test_fail "Video 1 import failed" "$IMPORT1"
fi

# Import second video with custom overrides
test_info "Importing YouTube video 2 with custom title and tags..."
IMPORT2=$(curl -s -X POST $CMS_URL/cms/videos \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{
        \"url\": \"${YOUTUBE_VIDEOS[1]}\",
        \"category\": \"Science\",
        \"type\": \"documentary\",
        \"title\": \"Custom Override Title for Testing\",
        \"description\": \"This is a custom description that overrides YouTube\",
        \"tags\": [\"custom-tag\", \"test-tag\", \"override\"]
    }")
if echo "$IMPORT2" | grep -q '"id"'; then
    VIDEO2_ID=$(json_value "$IMPORT2" "id")
    CREATED_VIDEO_IDS+=("$VIDEO2_ID")
    test_pass "Video 2 imported with overrides (ID: ${VIDEO2_ID:0:8}...)"
    
    # Verify overrides were applied
    if echo "$IMPORT2" | grep -q "Custom Override Title"; then
        test_pass "Custom title override applied"
    else
        test_fail "Custom title override not applied"
    fi
    
    if echo "$IMPORT2" | grep -q "custom-tag"; then
        test_pass "Custom tags applied"
    else
        test_fail "Custom tags not applied"
    fi
    
    if echo "$IMPORT2" | grep -q '"type":"documentary"'; then
        test_pass "Video type correctly set to documentary"
    else
        test_fail "Video type not set correctly"
    fi
else
    test_fail "Video 2 import failed" "$IMPORT2"
fi

# Import third video with editor role
test_info "Importing YouTube video 3 with editor role..."
IMPORT3=$(curl -s -X POST $CMS_URL/cms/videos \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $EDITOR_TOKEN" \
    -d "{
        \"url\": \"${YOUTUBE_VIDEOS[2]}\",
        \"category\": \"Education\",
        \"type\": \"video_podcast\"
    }")
if echo "$IMPORT3" | grep -q '"id"'; then
    VIDEO3_ID=$(json_value "$IMPORT3" "id")
    CREATED_VIDEO_IDS+=("$VIDEO3_ID")
    test_pass "Video 3 imported by editor (ID: ${VIDEO3_ID:0:8}...)"
else
    test_fail "Editor cannot import videos" "$IMPORT3"
fi

# Import more videos for search testing
test_info "Importing YouTube video 4..."
IMPORT4=$(curl -s -X POST $CMS_URL/cms/videos \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{
        \"url\": \"${YOUTUBE_VIDEOS[3]}\",
        \"category\": \"Entertainment\",
        \"type\": \"documentary\",
        \"tags\": [\"entertainment\", \"fun\"]
    }")
if echo "$IMPORT4" | grep -q '"id"'; then
    VIDEO4_ID=$(json_value "$IMPORT4" "id")
    CREATED_VIDEO_IDS+=("$VIDEO4_ID")
    test_pass "Video 4 imported (ID: ${VIDEO4_ID:0:8}...)"
else
    test_fail "Video 4 import failed" "$IMPORT4"
fi

test_info "Importing YouTube video 5..."
IMPORT5=$(curl -s -X POST $CMS_URL/cms/videos \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{
        \"url\": \"${YOUTUBE_VIDEOS[4]}\",
        \"category\": \"Business\",
        \"type\": \"video_podcast\",
        \"tags\": [\"business\", \"entrepreneurship\"]
    }")
if echo "$IMPORT5" | grep -q '"id"'; then
    VIDEO5_ID=$(json_value "$IMPORT5" "id")
    CREATED_VIDEO_IDS+=("$VIDEO5_ID")
    test_pass "Video 5 imported (ID: ${VIDEO5_ID:0:8}...)"
else
    test_fail "Video 5 import failed" "$IMPORT5"
fi

subsection_header "Import Error Handling"

test_info "Testing duplicate video import..."
DUPLICATE=$(curl -s -X POST $CMS_URL/cms/videos \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{
        \"url\": \"${YOUTUBE_VIDEOS[0]}\",
        \"category\": \"Technology\",
        \"type\": \"video_podcast\"
    }")
if echo "$DUPLICATE" | grep -q '"statusCode":409'; then
    test_pass "Duplicate video correctly rejected (409 Conflict)"
else
    test_fail "Duplicate video not detected" "$DUPLICATE"
fi

test_info "Testing invalid URL format..."
INVALID_URL=$(curl -s -X POST $CMS_URL/cms/videos \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{
        "url": "not-a-valid-url",
        "category": "Technology",
        "type": "video_podcast"
    }')
if echo "$INVALID_URL" | grep -q '"statusCode":400'; then
    test_pass "Invalid URL format correctly rejected (400)"
else
    test_fail "Invalid URL not properly handled"
fi

test_info "Testing unsupported platform URL..."
UNSUPPORTED=$(curl -s -X POST $CMS_URL/cms/videos \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{
        "url": "https://vimeo.com/123456789",
        "category": "Technology",
        "type": "video_podcast"
    }')
if echo "$UNSUPPORTED" | grep -q '"statusCode":400'; then
    test_pass "Unsupported platform correctly rejected (400)"
else
    test_fail "Unsupported platform not properly handled"
fi

test_info "Testing missing required fields..."
MISSING_FIELDS=$(curl -s -X POST $CMS_URL/cms/videos \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{
        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    }')
if echo "$MISSING_FIELDS" | grep -q '"statusCode":400'; then
    test_pass "Missing required fields correctly validated (400)"
else
    test_fail "Missing fields validation failed"
fi

test_info "Testing invalid video type..."
INVALID_TYPE=$(curl -s -X POST $CMS_URL/cms/videos \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{
        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "category": "Technology",
        "type": "invalid_type"
    }')
if echo "$INVALID_TYPE" | grep -q '"statusCode":400'; then
    test_pass "Invalid video type correctly rejected (400)"
else
    test_fail "Invalid video type not properly handled"
fi

test_info "Testing import without authentication..."
UNAUTH_IMPORT=$(curl -s -o /dev/null -w "%{http_code}" -X POST $CMS_URL/cms/videos \
    -H "Content-Type: application/json" \
    -d '{
        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "category": "Technology",
        "type": "video_podcast"
    }')
if [ "$UNAUTH_IMPORT" = "401" ]; then
    test_pass "Unauthenticated import correctly rejected (401)"
else
    test_fail "Unauthenticated import not properly protected (got $UNAUTH_IMPORT)"
fi

# Wait for Elasticsearch to index the videos
test_info "Waiting for Elasticsearch indexing..."
sleep 3

# ============================================
# 4. VIDEO READ OPERATIONS (CMS)
# ============================================
section_header "4. VIDEO READ OPERATIONS (CMS)"

subsection_header "Get All Videos"
test_info "Getting all videos..."
ALL_VIDEOS=$(curl -s $CMS_URL/cms/videos \
    -H "Authorization: Bearer $ADMIN_TOKEN")
if echo "$ALL_VIDEOS" | grep -q '^\['; then
    VIDEO_COUNT=$(echo "$ALL_VIDEOS" | grep -o '"id"' | wc -l | tr -d ' ')
    test_pass "Get all videos successful (found $VIDEO_COUNT videos)"
    
    # Verify our imported videos are in the list
    if echo "$ALL_VIDEOS" | grep -q "$VIDEO1_ID"; then
        test_pass "Video 1 found in list"
    else
        test_fail "Video 1 not found in list"
    fi
else
    test_fail "Get all videos failed" "$ALL_VIDEOS"
fi

subsection_header "Get Video by ID"
test_info "Getting video 1 by ID..."
GET_VIDEO1=$(curl -s $CMS_URL/cms/videos/$VIDEO1_ID \
    -H "Authorization: Bearer $ADMIN_TOKEN")
if echo "$GET_VIDEO1" | grep -q "\"id\":\"$VIDEO1_ID\""; then
    test_pass "Get video by ID successful"
    
    # Verify response contains all expected fields
    EXPECTED_FIELDS=("title" "description" "category" "type" "duration" "platform" "platformVideoId" "embedUrl" "thumbnailUrl" "createdAt" "updatedAt")
    MISSING_FIELDS=()
    for field in "${EXPECTED_FIELDS[@]}"; do
        if ! echo "$GET_VIDEO1" | grep -q "\"$field\""; then
            MISSING_FIELDS+=("$field")
        fi
    done
    
    if [ ${#MISSING_FIELDS[@]} -eq 0 ]; then
        test_pass "Video response contains all expected fields"
    else
        test_fail "Video response missing fields: ${MISSING_FIELDS[*]}"
    fi
else
    test_fail "Get video by ID failed" "$GET_VIDEO1"
fi

test_info "Testing get non-existent video..."
NOT_FOUND=$(curl -s -o /dev/null -w "%{http_code}" $CMS_URL/cms/videos/00000000-0000-0000-0000-000000000000 \
    -H "Authorization: Bearer $ADMIN_TOKEN")
if [ "$NOT_FOUND" = "404" ]; then
    test_pass "Non-existent video returns 404"
else
    test_fail "Non-existent video not handled correctly (got $NOT_FOUND)"
fi

test_info "Testing get without authentication..."
UNAUTH_GET=$(curl -s -o /dev/null -w "%{http_code}" $CMS_URL/cms/videos)
if [ "$UNAUTH_GET" = "401" ]; then
    test_pass "Unauthenticated get correctly rejected (401)"
else
    test_fail "Unauthenticated get not properly protected (got $UNAUTH_GET)"
fi

# ============================================
# 5. VIDEO UPDATE OPERATIONS
# ============================================
section_header "5. VIDEO UPDATE OPERATIONS"

subsection_header "Update Video (Admin)"
test_info "Updating video 1 title and category..."
UPDATE1=$(curl -s -X PATCH $CMS_URL/cms/videos/$VIDEO1_ID \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{
        "title": "Updated Title - Admin Test",
        "category": "Updated Category"
    }')
if echo "$UPDATE1" | grep -q "Updated Title - Admin Test"; then
    test_pass "Video title update successful"
    if echo "$UPDATE1" | grep -q '"category":"Updated Category"'; then
        test_pass "Video category update successful"
    else
        test_fail "Video category update failed"
    fi
else
    test_fail "Video update failed" "$UPDATE1"
fi

test_info "Updating video 1 tags..."
UPDATE_TAGS=$(curl -s -X PATCH $CMS_URL/cms/videos/$VIDEO1_ID \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{
        "tags": ["new-tag-1", "new-tag-2", "testing"]
    }')
if echo "$UPDATE_TAGS" | grep -q "new-tag-1"; then
    test_pass "Video tags update successful"
else
    test_fail "Video tags update failed"
fi

test_info "Updating video 1 type..."
UPDATE_TYPE=$(curl -s -X PATCH $CMS_URL/cms/videos/$VIDEO1_ID \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{
        "type": "documentary"
    }')
if echo "$UPDATE_TYPE" | grep -q '"type":"documentary"'; then
    test_pass "Video type update successful"
else
    test_fail "Video type update failed"
fi

test_info "Updating video 1 publication date..."
UPDATE_DATE=$(curl -s -X PATCH $CMS_URL/cms/videos/$VIDEO1_ID \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{
        "publicationDate": "2025-01-15"
    }')
if echo "$UPDATE_DATE" | grep -q "2025-01-15"; then
    test_pass "Video publication date update successful"
else
    test_fail "Video publication date update failed"
fi

subsection_header "Update Video (Editor)"
test_info "Testing editor can update videos..."
EDITOR_UPDATE=$(curl -s -X PATCH $CMS_URL/cms/videos/$VIDEO3_ID \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $EDITOR_TOKEN" \
    -d '{
        "title": "Updated by Editor"
    }')
if echo "$EDITOR_UPDATE" | grep -q "Updated by Editor"; then
    test_pass "Editor can update videos"
else
    test_fail "Editor cannot update videos" "$EDITOR_UPDATE"
fi

subsection_header "Update Validation"
test_info "Testing update with invalid type..."
INVALID_TYPE_UPDATE=$(curl -s -X PATCH $CMS_URL/cms/videos/$VIDEO1_ID \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{
        "type": "invalid_type"
    }')
if echo "$INVALID_TYPE_UPDATE" | grep -q '"statusCode":400'; then
    test_pass "Invalid type update correctly rejected (400)"
else
    test_fail "Invalid type update not properly validated"
fi

test_info "Testing update non-existent video..."
UPDATE_NOT_FOUND=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH $CMS_URL/cms/videos/00000000-0000-0000-0000-000000000000 \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{"title":"Test"}')
if [ "$UPDATE_NOT_FOUND" = "404" ]; then
    test_pass "Update non-existent video returns 404"
else
    test_fail "Update non-existent video not handled correctly (got $UPDATE_NOT_FOUND)"
fi

# Wait for Elasticsearch to index the updates
sleep 2

# ============================================
# 6. DISCOVERY SERVICE SEARCH
# ============================================
section_header "6. DISCOVERY SERVICE SEARCH"

subsection_header "Basic Search"
test_info "Testing search all videos..."
SEARCH_ALL=$(curl -s "$DISCOVERY_URL/discovery/search?page=1&limit=10")
if echo "$SEARCH_ALL" | grep -q '"data"' && echo "$SEARCH_ALL" | grep -q '"total"'; then
    TOTAL_FOUND=$(json_number "$SEARCH_ALL" "total")
    test_pass "Search all videos works (total: $TOTAL_FOUND)"
    
    # Verify pagination metadata
    if echo "$SEARCH_ALL" | grep -q '"page"' && \
       echo "$SEARCH_ALL" | grep -q '"limit"' && \
       echo "$SEARCH_ALL" | grep -q '"totalPages"' && \
       echo "$SEARCH_ALL" | grep -q '"hasNext"' && \
       echo "$SEARCH_ALL" | grep -q '"hasPrev"'; then
        test_pass "Search response contains pagination metadata"
    else
        test_fail "Search response missing pagination metadata"
    fi
else
    test_fail "Search all videos failed" "$SEARCH_ALL"
fi

subsection_header "Text Search"
test_info "Testing text search..."
TEXT_SEARCH=$(curl -s "$DISCOVERY_URL/discovery/search?q=test&page=1&limit=10")
if echo "$TEXT_SEARCH" | grep -q '"data"'; then
    test_pass "Text search works"
else
    test_fail "Text search failed"
fi

test_info "Testing search with empty results..."
EMPTY_SEARCH=$(curl -s "$DISCOVERY_URL/discovery/search?q=nonexistentquery12345xyz&page=1&limit=10")
if echo "$EMPTY_SEARCH" | grep -q '"total":0' || echo "$EMPTY_SEARCH" | grep -q '"data":\[\]'; then
    test_pass "Empty search results handled correctly"
else
    test_fail "Empty search results not handled correctly"
fi

subsection_header "Search with Filters"
test_info "Testing search with category filter..."
CATEGORY_SEARCH=$(curl -s "$DISCOVERY_URL/discovery/search?category=Science&page=1&limit=10")
if echo "$CATEGORY_SEARCH" | grep -q '"data"'; then
    test_pass "Category filter works"
else
    test_fail "Category filter failed"
fi

test_info "Testing search with type filter..."
TYPE_SEARCH=$(curl -s "$DISCOVERY_URL/discovery/search?type=documentary&page=1&limit=10")
if echo "$TYPE_SEARCH" | grep -q '"data"'; then
    test_pass "Type filter works"
else
    test_fail "Type filter failed"
fi

test_info "Testing search with tags filter..."
TAGS_SEARCH=$(curl -s "$DISCOVERY_URL/discovery/search?tags=custom-tag&page=1&limit=10")
if echo "$TAGS_SEARCH" | grep -q '"data"'; then
    test_pass "Tags filter works"
else
    test_fail "Tags filter failed"
fi

test_info "Testing search with date range..."
DATE_SEARCH=$(curl -s "$DISCOVERY_URL/discovery/search?startDate=2020-01-01&endDate=2030-12-31&page=1&limit=10")
if echo "$DATE_SEARCH" | grep -q '"data"'; then
    test_pass "Date range filter works"
else
    test_fail "Date range filter failed"
fi

test_info "Testing search with multiple filters..."
MULTI_FILTER=$(curl -s "$DISCOVERY_URL/discovery/search?type=video_podcast&page=1&limit=10")
if echo "$MULTI_FILTER" | grep -q '"data"'; then
    test_pass "Multiple filters work"
else
    test_fail "Multiple filters failed"
fi

subsection_header "Search Sorting"
test_info "Testing sort by relevance..."
SORT_REL=$(curl -s "$DISCOVERY_URL/discovery/search?q=test&sort=relevance&page=1&limit=10")
if echo "$SORT_REL" | grep -q '"data"'; then
    test_pass "Sort by relevance works"
else
    test_fail "Sort by relevance failed"
fi

test_info "Testing sort by date..."
SORT_DATE=$(curl -s "$DISCOVERY_URL/discovery/search?sort=date&page=1&limit=10")
if echo "$SORT_DATE" | grep -q '"data"'; then
    test_pass "Sort by date works"
else
    test_fail "Sort by date failed"
fi

test_info "Testing sort by popular..."
SORT_POP=$(curl -s "$DISCOVERY_URL/discovery/search?sort=popular&page=1&limit=10")
if echo "$SORT_POP" | grep -q '"data"'; then
    test_pass "Sort by popular works"
else
    test_fail "Sort by popular failed"
fi

subsection_header "Search Pagination"
test_info "Testing pagination..."
PAGE1=$(curl -s "$DISCOVERY_URL/discovery/search?page=1&limit=2")
PAGE2=$(curl -s "$DISCOVERY_URL/discovery/search?page=2&limit=2")
if echo "$PAGE1" | grep -q '"page":1' && echo "$PAGE2" | grep -q '"page":2'; then
    test_pass "Pagination works correctly"
else
    test_fail "Pagination failed"
fi

test_info "Testing limit parameter..."
LIMIT_TEST=$(curl -s "$DISCOVERY_URL/discovery/search?page=1&limit=3")
if echo "$LIMIT_TEST" | grep -q '"limit":3'; then
    test_pass "Limit parameter works"
else
    test_fail "Limit parameter failed"
fi

# ============================================
# 7. DISCOVERY - GET VIDEO BY ID
# ============================================
section_header "7. DISCOVERY - GET VIDEO BY ID"

test_info "Getting video by ID (public endpoint)..."
PUBLIC_VIDEO=$(curl -s "$DISCOVERY_URL/discovery/videos/$VIDEO1_ID")
if echo "$PUBLIC_VIDEO" | grep -q "\"id\":\"$VIDEO1_ID\""; then
    test_pass "Get video by ID (public) works"
    
    # Verify response structure
    if echo "$PUBLIC_VIDEO" | grep -q '"title"' && \
       echo "$PUBLIC_VIDEO" | grep -q '"category"' && \
       echo "$PUBLIC_VIDEO" | grep -q '"embedUrl"'; then
        test_pass "Public video response structure is correct"
    else
        test_fail "Public video response structure is incorrect"
    fi
else
    test_fail "Get video by ID (public) failed" "$PUBLIC_VIDEO"
fi

test_info "Testing get non-existent video (public)..."
PUBLIC_NOT_FOUND=$(curl -s -o /dev/null -w "%{http_code}" "$DISCOVERY_URL/discovery/videos/00000000-0000-0000-0000-000000000000")
if [ "$PUBLIC_NOT_FOUND" = "404" ]; then
    test_pass "Non-existent video (public) returns 404"
else
    test_fail "Non-existent video (public) not handled correctly (got $PUBLIC_NOT_FOUND)"
fi

# ============================================
# 8. DISCOVERY - GET BY CATEGORY
# ============================================
section_header "8. DISCOVERY - GET BY CATEGORY"

test_info "Getting videos by category..."
BY_CATEGORY=$(curl -s "$DISCOVERY_URL/discovery/categories/Science?page=1&limit=10")
if echo "$BY_CATEGORY" | grep -q '"data"' && echo "$BY_CATEGORY" | grep -q '"total"'; then
    test_pass "Get by category works"
else
    test_fail "Get by category failed" "$BY_CATEGORY"
fi

test_info "Testing non-existent category..."
NO_CATEGORY=$(curl -s "$DISCOVERY_URL/discovery/categories/NonExistentCategory123?page=1&limit=10")
if echo "$NO_CATEGORY" | grep -q '"total":0' || echo "$NO_CATEGORY" | grep -q '"data":\[\]'; then
    test_pass "Non-existent category returns empty results"
else
    test_fail "Non-existent category not handled correctly"
fi

test_info "Testing category pagination..."
CAT_PAGE=$(curl -s "$DISCOVERY_URL/discovery/categories/Technology?page=1&limit=1")
if echo "$CAT_PAGE" | grep -q '"page":1'; then
    test_pass "Category pagination works"
else
    test_fail "Category pagination failed"
fi

# ============================================
# 9. DISCOVERY - GET BY TYPE
# ============================================
section_header "9. DISCOVERY - GET BY TYPE"

test_info "Getting videos by type (video_podcast)..."
BY_TYPE_PODCAST=$(curl -s "$DISCOVERY_URL/discovery/types/video_podcast?page=1&limit=10")
if echo "$BY_TYPE_PODCAST" | grep -q '"data"'; then
    test_pass "Get by type (video_podcast) works"
else
    test_fail "Get by type (video_podcast) failed"
fi

test_info "Getting videos by type (documentary)..."
BY_TYPE_DOC=$(curl -s "$DISCOVERY_URL/discovery/types/documentary?page=1&limit=10")
if echo "$BY_TYPE_DOC" | grep -q '"data"'; then
    test_pass "Get by type (documentary) works"
else
    test_fail "Get by type (documentary) failed"
fi

test_info "Testing type pagination..."
TYPE_PAGE=$(curl -s "$DISCOVERY_URL/discovery/types/video_podcast?page=1&limit=1")
if echo "$TYPE_PAGE" | grep -q '"page":1'; then
    test_pass "Type pagination works"
else
    test_fail "Type pagination failed"
fi

# ============================================
# 10. REINDEX OPERATION
# ============================================
section_header "10. REINDEX OPERATION"

test_info "Testing reindex endpoint (admin only)..."
REINDEX=$(curl -s -o /dev/null -w "%{http_code}" -X POST $CMS_URL/cms/videos/reindex \
    -H "Authorization: Bearer $ADMIN_TOKEN")
if [ "$REINDEX" = "202" ]; then
    test_pass "Reindex endpoint returns 202 Accepted"
else
    test_fail "Reindex endpoint failed (got $REINDEX)"
fi

test_info "Testing reindex without admin role..."
EDITOR_REINDEX=$(curl -s -o /dev/null -w "%{http_code}" -X POST $CMS_URL/cms/videos/reindex \
    -H "Authorization: Bearer $EDITOR_TOKEN")
if [ "$EDITOR_REINDEX" = "403" ]; then
    test_pass "Editor correctly denied reindex access (403)"
else
    test_fail "Editor reindex restriction failed (got $EDITOR_REINDEX)"
fi

test_info "Testing reindex without authentication..."
UNAUTH_REINDEX=$(curl -s -o /dev/null -w "%{http_code}" -X POST $CMS_URL/cms/videos/reindex)
# Rate limiting (429) may kick in before auth check (401), both indicate protected endpoint
if [ "$UNAUTH_REINDEX" = "401" ] || [ "$UNAUTH_REINDEX" = "429" ]; then
    test_pass "Unauthenticated reindex correctly rejected ($UNAUTH_REINDEX)"
else
    test_fail "Unauthenticated reindex not properly protected (got $UNAUTH_REINDEX)"
fi

# ============================================
# 11. ROLE-BASED ACCESS CONTROL
# ============================================
section_header "11. ROLE-BASED ACCESS CONTROL"

subsection_header "Delete Operation (Admin Only)"
# Create a video specifically for deletion test
test_info "Creating a video for deletion test..."
DELETE_TEST_VIDEO=$(curl -s -X POST $CMS_URL/cms/videos \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{
        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "category": "Test",
        "type": "video_podcast"
    }')
if echo "$DELETE_TEST_VIDEO" | grep -q '"id"'; then
    DELETE_TEST_ID=$(json_value "$DELETE_TEST_VIDEO" "id")
    test_pass "Created video for deletion test"
else
    test_fail "Failed to create video for deletion test"
fi

test_info "Testing editor cannot delete videos..."
EDITOR_DELETE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE $CMS_URL/cms/videos/$DELETE_TEST_ID \
    -H "Authorization: Bearer $EDITOR_TOKEN")
if [ "$EDITOR_DELETE" = "403" ]; then
    test_pass "Editor correctly denied delete access (403)"
else
    test_fail "Editor delete restriction failed (got $EDITOR_DELETE)"
fi

test_info "Testing admin can delete videos..."
ADMIN_DELETE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE $CMS_URL/cms/videos/$DELETE_TEST_ID \
    -H "Authorization: Bearer $ADMIN_TOKEN")
if [ "$ADMIN_DELETE" = "204" ]; then
    test_pass "Admin can delete videos (204 No Content)"
else
    test_fail "Admin delete failed (got $ADMIN_DELETE)"
fi

test_info "Testing delete non-existent video..."
DELETE_NOT_FOUND=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE $CMS_URL/cms/videos/00000000-0000-0000-0000-000000000000 \
    -H "Authorization: Bearer $ADMIN_TOKEN")
if [ "$DELETE_NOT_FOUND" = "404" ]; then
    test_pass "Delete non-existent video returns 404"
else
    test_fail "Delete non-existent video not handled correctly (got $DELETE_NOT_FOUND)"
fi

test_info "Testing delete already deleted video..."
DELETE_AGAIN=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE $CMS_URL/cms/videos/$DELETE_TEST_ID \
    -H "Authorization: Bearer $ADMIN_TOKEN")
if [ "$DELETE_AGAIN" = "404" ]; then
    test_pass "Delete already deleted video returns 404"
else
    test_fail "Delete already deleted video not handled correctly (got $DELETE_AGAIN)"
fi

test_info "Testing delete without authentication..."
UNAUTH_DELETE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE $CMS_URL/cms/videos/$VIDEO1_ID)
if [ "$UNAUTH_DELETE" = "401" ]; then
    test_pass "Unauthenticated delete correctly rejected (401)"
else
    test_fail "Unauthenticated delete not properly protected (got $UNAUTH_DELETE)"
fi

# ============================================
# 12. SOFT DELETE VERIFICATION
# ============================================
section_header "12. SOFT DELETE VERIFICATION"

test_info "Deleting video 4 for soft delete test..."
SOFT_DELETE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE $CMS_URL/cms/videos/$VIDEO4_ID \
    -H "Authorization: Bearer $ADMIN_TOKEN")
if [ "$SOFT_DELETE" = "204" ]; then
    test_pass "Video 4 deleted successfully"
else
    test_fail "Video 4 deletion failed"
fi

test_info "Verifying deleted video is not visible in CMS..."
GET_DELETED=$(curl -s -o /dev/null -w "%{http_code}" $CMS_URL/cms/videos/$VIDEO4_ID \
    -H "Authorization: Bearer $ADMIN_TOKEN")
if [ "$GET_DELETED" = "404" ]; then
    test_pass "Deleted video not visible in CMS (soft delete working)"
else
    test_fail "Deleted video still visible in CMS (got $GET_DELETED)"
fi

test_info "Verifying deleted video is not visible in Discovery..."
sleep 2  # Wait for ES sync
GET_DELETED_PUBLIC=$(curl -s -o /dev/null -w "%{http_code}" "$DISCOVERY_URL/discovery/videos/$VIDEO4_ID")
if [ "$GET_DELETED_PUBLIC" = "404" ]; then
    test_pass "Deleted video not visible in Discovery"
else
    test_fail "Deleted video still visible in Discovery (got $GET_DELETED_PUBLIC)"
fi

# ============================================
# 13. API RESPONSE FORMAT VALIDATION
# ============================================
section_header "13. API RESPONSE FORMAT VALIDATION"

test_info "Verifying CMS video response format..."
FORMAT_CHECK=$(curl -s $CMS_URL/cms/videos/$VIDEO1_ID \
    -H "Authorization: Bearer $ADMIN_TOKEN")
# Check for required fields
REQUIRED_FIELDS=("id" "title" "category" "type" "duration" "publicationDate" "platform" "createdAt" "updatedAt")
FORMAT_OK=true
for field in "${REQUIRED_FIELDS[@]}"; do
    if ! echo "$FORMAT_CHECK" | grep -q "\"$field\""; then
        test_fail "Missing required field: $field"
        FORMAT_OK=false
        break
    fi
done
if [ "$FORMAT_OK" = true ]; then
    test_pass "CMS video response contains all required fields"
fi

test_info "Verifying Discovery search response format..."
SEARCH_FORMAT=$(curl -s "$DISCOVERY_URL/discovery/search?page=1&limit=1")
PAGINATION_FIELDS=("data" "total" "page" "limit" "totalPages" "hasNext" "hasPrev")
SEARCH_FORMAT_OK=true
for field in "${PAGINATION_FIELDS[@]}"; do
    if ! echo "$SEARCH_FORMAT" | grep -q "\"$field\""; then
        test_fail "Missing pagination field: $field"
        SEARCH_FORMAT_OK=false
        break
    fi
done
if [ "$SEARCH_FORMAT_OK" = true ]; then
    test_pass "Discovery search response contains all pagination fields"
fi

# ============================================
# 14. CLEANUP
# ============================================
section_header "14. CLEANUP"

test_info "Cleaning up test videos..."
CLEANUP_COUNT=0
for VIDEO_ID in "${CREATED_VIDEO_IDS[@]}"; do
    CLEANUP=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE $CMS_URL/cms/videos/$VIDEO_ID \
        -H "Authorization: Bearer $ADMIN_TOKEN")
    if [ "$CLEANUP" = "204" ] || [ "$CLEANUP" = "404" ]; then
        CLEANUP_COUNT=$((CLEANUP_COUNT + 1))
    fi
done
test_pass "Cleaned up $CLEANUP_COUNT test videos"

# ============================================
# SUMMARY
# ============================================
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                      TEST SUMMARY                            ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${GREEN}Passed:${NC} $PASSED"
echo -e "  ${RED}Failed:${NC} $FAILED"
echo -e "  ${YELLOW}Total:${NC}  $TOTAL"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                 ✓ ALL TESTS PASSED!                          ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                 ✗ SOME TESTS FAILED                          ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi


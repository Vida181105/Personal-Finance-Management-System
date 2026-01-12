#!/bin/bash

# Auth Endpoints Testing Script
# Tests all authentication endpoints

BASE_URL="http://localhost:3001"
PASSED=0
FAILED=0

# Test credentials
TEST_EMAIL="test.user@example.com"
TEST_PASSWORD="Password123"
TEST_NAME="Test User"
TEST_INCOME="50000"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Global variables for tokens
ACCESS_TOKEN=""
REFRESH_TOKEN=""
USER_ID=""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔐 AUTH ENDPOINTS TESTING SUITE${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Helper function to test endpoint
test_endpoint() {
  local test_num=$1
  local test_name=$2
  local method=$3
  local endpoint=$4
  local data=$5
  local expected_status=$6
  local headers=$7

  echo -e "${YELLOW}TEST $test_num: $test_name${NC}"
  echo "Method: $method | Endpoint: $endpoint"
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}${endpoint}" \
      -H "Content-Type: application/json" \
      $headers)
  else
    response=$(curl -s -w "\n%{http_code}" -X $method "${BASE_URL}${endpoint}" \
      -H "Content-Type: application/json" \
      $headers \
      -d "$data")
  fi

  body=$(echo "$response" | head -n -1)
  status=$(echo "$response" | tail -n 1)

  echo "Expected Status: $expected_status | Got: $status"
  
  if [ "$status" = "$expected_status" ]; then
    echo -e "${GREEN}✓ PASSED${NC}\n"
    PASSED=$((PASSED + 1))
    return 0
  else
    echo -e "${RED}✗ FAILED${NC}"
    echo "Response: $body\n"
    FAILED=$((FAILED + 1))
    return 1
  fi
}

echo -e "${YELLOW}═════ TEST 1-4: REGISTRATION & LOGIN ═════${NC}\n"

# Test 1: Register with valid data
test_endpoint 1 "Register New User" "POST" "/api/auth/register" \
  "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"confirmPassword\":\"$TEST_PASSWORD\",\"name\":\"$TEST_NAME\",\"monthlyIncome\":$TEST_INCOME}" \
  "200" \
  "" && {
    # Extract tokens
    response=$(curl -s -X POST "${BASE_URL}/api/auth/register" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"confirmPassword\":\"$TEST_PASSWORD\",\"name\":\"$TEST_NAME\",\"monthlyIncome\":$TEST_INCOME}")
    
    ACCESS_TOKEN=$(echo "$response" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    REFRESH_TOKEN=$(echo "$response" | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)
    USER_ID=$(echo "$response" | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
    
    echo -e "${BLUE}Extracted Tokens:${NC}"
    echo "accessToken: ${ACCESS_TOKEN:0:20}..."
    echo "refreshToken: ${REFRESH_TOKEN:0:20}..."
    echo "userId: $USER_ID\n"
  }

# Test 2: Register with duplicate email (should fail)
test_endpoint 2 "Register Duplicate Email" "POST" "/api/auth/register" \
  "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"confirmPassword\":\"$TEST_PASSWORD\",\"name\":\"Another User\",\"monthlyIncome\":60000}" \
  "400" \
  ""

# Test 3: Register with missing fields
test_endpoint 3 "Register Missing Fields" "POST" "/api/auth/register" \
  "{\"email\":\"$TEST_EMAIL\"}" \
  "400" \
  ""

# Test 4: Register with password mismatch
test_endpoint 4 "Register Password Mismatch" "POST" "/api/auth/register" \
  "{\"email\":\"newuser@example.com\",\"password\":\"Pass123\",\"confirmPassword\":\"Pass456\",\"name\":\"New User\",\"monthlyIncome\":45000}" \
  "400" \
  ""

echo -e "${YELLOW}═════ TEST 5-7: LOGIN ═════${NC}\n"

# Test 5: Login with valid credentials
test_endpoint 5 "Login Valid Credentials" "POST" "/api/auth/login" \
  "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
  "200" \
  ""

# Test 6: Login with invalid email
test_endpoint 6 "Login Invalid Email" "POST" "/api/auth/login" \
  "{\"email\":\"nonexistent@example.com\",\"password\":\"$TEST_PASSWORD\"}" \
  "400" \
  ""

# Test 7: Login with wrong password
test_endpoint 7 "Login Wrong Password" "POST" "/api/auth/login" \
  "{\"email\":\"$TEST_EMAIL\",\"password\":\"WrongPassword123\"}" \
  "400" \
  ""

echo -e "${YELLOW}═════ TEST 8-10: PROFILE (PROTECTED) ═════${NC}\n"

# Test 8: Get profile with valid token
AUTH_HEADER="-H \"Authorization: Bearer $ACCESS_TOKEN\""
test_endpoint 8 "Get Profile Valid Token" "GET" "/api/auth/profile" \
  "" \
  "200" \
  "$AUTH_HEADER"

# Test 9: Get profile without token
test_endpoint 9 "Get Profile No Token" "GET" "/api/auth/profile" \
  "" \
  "401" \
  ""

# Test 10: Get profile with invalid token
INVALID_TOKEN="invalid.token.here"
INVALID_AUTH="-H \"Authorization: Bearer $INVALID_TOKEN\""
test_endpoint 10 "Get Profile Invalid Token" "GET" "/api/auth/profile" \
  "" \
  "401" \
  "$INVALID_AUTH"

echo -e "${YELLOW}═════ TEST 11-12: UPDATE PROFILE (PROTECTED) ═════${NC}\n"

# Test 11: Update profile with valid token
test_endpoint 11 "Update Profile Valid Data" "PUT" "/api/auth/profile" \
  "{\"name\":\"Updated Name\",\"profession\":\"Software Engineer\",\"city\":\"San Francisco\"}" \
  "200" \
  "$AUTH_HEADER"

# Test 12: Update profile with invalid age
test_endpoint 12 "Update Profile Invalid Age" "PUT" "/api/auth/profile" \
  "{\"age\":15}" \
  "400" \
  "$AUTH_HEADER"

echo -e "${YELLOW}═════ TEST 13-14: CHANGE PASSWORD (PROTECTED) ═════${NC}\n"

# Test 13: Change password with correct current password
test_endpoint 13 "Change Password Valid" "POST" "/api/auth/change-password" \
  "{\"currentPassword\":\"$TEST_PASSWORD\",\"newPassword\":\"NewPass123\",\"confirmPassword\":\"NewPass123\"}" \
  "200" \
  "$AUTH_HEADER"

# Test 14: Change password with wrong current password
test_endpoint 14 "Change Password Wrong Current" "POST" "/api/auth/change-password" \
  "{\"currentPassword\":\"WrongPass123\",\"newPassword\":\"AnotherPass123\",\"confirmPassword\":\"AnotherPass123\"}" \
  "400" \
  "$AUTH_HEADER"

echo -e "${YELLOW}═════ TEST 15-16: REFRESH TOKEN ═════${NC}\n"

# Test 15: Refresh token with valid refresh token
test_endpoint 15 "Refresh Token Valid" "POST" "/api/auth/refresh" \
  "{\"refreshToken\":\"$REFRESH_TOKEN\"}" \
  "200" \
  ""

# Test 16: Refresh token with invalid token
test_endpoint 16 "Refresh Token Invalid" "POST" "/api/auth/refresh" \
  "{\"refreshToken\":\"invalid.token.here\"}" \
  "401" \
  ""

echo -e "${YELLOW}═════ TEST 17: LOGOUT (PROTECTED) ═════${NC}\n"

# Test 17: Logout with valid token
test_endpoint 17 "Logout Valid Token" "POST" "/api/auth/logout" \
  "" \
  "200" \
  "$AUTH_HEADER"

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 TEST RESULTS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

TOTAL=$((PASSED + FAILED))
echo "Total Tests: $TOTAL"
echo -e "✓ Passed: ${GREEN}$PASSED${NC}"
echo -e "✗ Failed: ${RED}$FAILED${NC}"

if [ $TOTAL -gt 0 ]; then
  RATE=$((PASSED * 100 / TOTAL))
  echo "Success Rate: ${RATE}%"
fi

echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
  echo -e "${GREEN}Auth system is production-ready.${NC}\n"
  exit 0
else
  echo -e "${RED}⚠️  Some tests failed. Review errors above.${NC}\n"
  exit 1
fi

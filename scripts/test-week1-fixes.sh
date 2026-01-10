#!/bin/bash

# Week 1 Security Fixes - Test Script
# Tests all implemented critical security fixes

echo "========================================="
echo "WEEK 1 SECURITY FIXES - TEST SUITE"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Base URL (change for production)
BASE_URL="${1:-http://localhost:3000}"

echo "Testing against: $BASE_URL"
echo ""

# Test 1: Cookie Security Headers
echo "Test 1: Checking cookie security headers..."
COOKIE_RESPONSE=$(curl -sI "$BASE_URL/api/auth/signin" | grep -i "set-cookie")

if echo "$COOKIE_RESPONSE" | grep -qi "httponly"; then
    echo -e "${GREEN}✓${NC} HttpOnly flag present"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} HttpOnly flag missing"
    ((FAILED++))
fi

if echo "$COOKIE_RESPONSE" | grep -qi "samesite"; then
    echo -e "${GREEN}✓${NC} SameSite flag present"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} SameSite flag missing"
    ((FAILED++))
fi

if [[ "$BASE_URL" == *"https://"* ]]; then
    if echo "$COOKIE_RESPONSE" | grep -qi "secure"; then
        echo -e "${GREEN}✓${NC} Secure flag present (production)"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} Secure flag missing (production)"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⊘${NC} Secure flag not required (development)"
fi

echo ""

# Test 2: Open Redirect Protection
echo "Test 2: Testing open redirect protection..."

# Note: This is a manual test that requires browser interaction
echo -e "${YELLOW}⚠${NC}  Manual test required:"
echo "   1. Visit: $BASE_URL/login?callbackUrl=https://evil.com"
echo "   2. Login with valid credentials"
echo "   3. Verify you're redirected to $BASE_URL/app (NOT evil.com)"
echo "   4. Check console for: [Security] Blocked open redirect attempt"
echo ""

# Test 3: Password Hash Strength
echo "Test 3: Verifying bcrypt configuration..."

# Check if code has BCRYPT_ROUNDS = 12
if grep -q "BCRYPT_ROUNDS = 12" app/api/auth/signup/route.ts; then
    echo -e "${GREEN}✓${NC} Bcrypt rounds set to 12 in signup"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Bcrypt rounds not set to 12"
    ((FAILED++))
fi

if grep -q "bcrypt.getRounds" lib/auth.ts; then
    echo -e "${GREEN}✓${NC} Auto-upgrade logic present in auth"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Auto-upgrade logic missing"
    ((FAILED++))
fi

echo ""

# Test 4: PII Logger
echo "Test 4: Checking PII sanitization in logger..."

if [ -f "lib/logger.ts" ]; then
    echo -e "${GREEN}✓${NC} Logger utility file exists"
    ((PASSED++))
    
    if grep -q "hashPII" lib/logger.ts; then
        echo -e "${GREEN}✓${NC} PII hashing function present"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} PII hashing function missing"
        ((FAILED++))
    fi
    
    if grep -q "delete sanitized.email" lib/logger.ts; then
        echo -e "${GREEN}✓${NC} Email sanitization present"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} Email sanitization missing"
        ((FAILED++))
    fi
else
    echo -e "${RED}✗${NC} Logger utility file missing"
    ((FAILED+=3))
fi

echo ""

# Test 5: User Enumeration Fix
echo "Test 5: Checking user enumeration fix..."

if grep -q "Unable to create account" app/api/auth/signup/route.ts; then
    echo -e "${GREEN}✓${NC} Generic error message in signup"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} User enumeration still possible"
    ((FAILED++))
fi

echo ""

# Test 6: JWT Session Configuration
echo "Test 6: Verifying JWT session configuration..."

if grep -q "maxAge.*7.*24.*60.*60" lib/auth.ts; then
    echo -e "${GREEN}✓${NC} JWT maxAge set to 7 days"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} JWT maxAge not configured"
    ((FAILED++))
fi

if grep -q "updateAge.*24.*60.*60" lib/auth.ts; then
    echo -e "${GREEN}✓${NC} JWT updateAge set to 24 hours"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} JWT updateAge not configured"
    ((FAILED++))
fi

if grep -q "cookies:" lib/auth.ts; then
    echo -e "${GREEN}✓${NC} Cookie configuration present"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Cookie configuration missing"
    ((FAILED++))
fi

echo ""

# Test 7: Open Redirect Sanitizer
echo "Test 7: Checking callback URL sanitizer..."

if grep -q "sanitizeCallbackUrl" lib/auth-helpers.ts; then
    echo -e "${GREEN}✓${NC} sanitizeCallbackUrl function exists"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} sanitizeCallbackUrl function missing"
    ((FAILED++))
fi

if grep -q "import.*sanitizeCallbackUrl" app/[locale]/login/LoginClient.tsx; then
    echo -e "${GREEN}✓${NC} sanitizeCallbackUrl imported in login"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} sanitizeCallbackUrl not used in login"
    ((FAILED++))
fi

echo ""

# Summary
echo "========================================="
echo "TEST RESULTS SUMMARY"
echo "========================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All automated tests passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run manual test for open redirect (Test 2)"
    echo "2. Deploy to staging/production"
    echo "3. Verify cookie flags in production"
    echo "4. Check CloudWatch logs for PII"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please review.${NC}"
    exit 1
fi


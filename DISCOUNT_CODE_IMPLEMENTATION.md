# Discount Code System Implementation Guide

## Overview
This document provides complete implementation details for the custom discount code system in ProHorseMatch. The system supports flexible discount types including percentage discounts, fixed amounts, and months of free subscription.

## Database Schema

### 1. Discount Codes Table
```sql
CREATE TABLE discount_codes (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL, -- 'percentage', 'months_free', 'fixed_amount'
  discount_value INTEGER NOT NULL, -- percentage (0-100), months (1-12), or amount in cents
  max_uses INTEGER, -- null = unlimited uses
  used_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP,
  applicable_plans TEXT[], -- which subscription plans this applies to
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Discount Code Usage Table
```sql
CREATE TABLE discount_code_usage (
  id SERIAL PRIMARY KEY,
  discount_code_id INTEGER REFERENCES discount_codes(id),
  user_id INTEGER REFERENCES users(id),
  used_at TIMESTAMP DEFAULT NOW(),
  subscription_id TEXT -- Stripe subscription ID
);
```

## Pre-created Discount Code

The system already includes a 6-month free subscription code:

```sql
INSERT INTO discount_codes (
  code, 
  description, 
  discount_type, 
  discount_value, 
  max_uses, 
  applicable_plans
) VALUES (
  'PROMO6MONTHSFREE',
  '6 months free subscription promotion',
  'months_free',
  6,
  NULL, -- unlimited uses
  ARRAY['beta-seller', 'beta-searching']
);
```

## Backend Implementation

### Schema Types (shared/schema.ts)
```typescript
// Discount Code Schemas
export const insertDiscountCodeSchema = createInsertSchema(discount_codes).omit({
  id: true,
  used_count: true,
  created_at: true,
});

export const insertDiscountCodeUsageSchema = createInsertSchema(discount_code_usage).omit({
  id: true,
  used_at: true,
});

export type InsertDiscountCode = z.infer<typeof insertDiscountCodeSchema>;
export type DiscountCode = typeof discount_codes.$inferSelect;
export type InsertDiscountCodeUsage = z.infer<typeof insertDiscountCodeUsageSchema>;
export type DiscountCodeUsage = typeof discount_code_usage.$inferSelect;
```

### Storage Interface Methods
```typescript
// Discount Code methods
getDiscountCodes(): Promise<DiscountCode[]>;
getDiscountCodeById(id: number): Promise<DiscountCode | undefined>;
getDiscountCodeByCode(code: string): Promise<DiscountCode | undefined>;
createDiscountCode(discountCode: InsertDiscountCode): Promise<DiscountCode>;
updateDiscountCode(id: number, discountCode: Partial<DiscountCode>): Promise<DiscountCode>;
deleteDiscountCode(id: number): Promise<boolean>;
validateDiscountCode(code: string, userId: number, planType: string): Promise<{ valid: boolean; discountCode?: DiscountCode; error?: string }>;

// Discount Code Usage methods
createDiscountCodeUsage(usage: InsertDiscountCodeUsage): Promise<DiscountCodeUsage>;
getDiscountCodeUsagesByUserId(userId: number): Promise<DiscountCodeUsage[]>;
getDiscountCodeUsagesByCodeId(codeId: number): Promise<DiscountCodeUsage[]>;
```

### API Endpoints

#### 1. Validate Discount Code
```
POST /api/discount-codes/validate
```
**Request Body:**
```json
{
  "code": "PROMO6MONTHSFREE",
  "planType": "beta-seller"
}
```
**Response (Success):**
```json
{
  "valid": true,
  "discountCode": {
    "id": 1,
    "code": "PROMO6MONTHSFREE",
    "description": "6 months free subscription promotion",
    "discount_type": "months_free",
    "discount_value": 6,
    "max_uses": null,
    "used_count": 0,
    "active": true,
    "applicable_plans": ["beta-seller", "beta-searching"]
  },
  "message": "Discount code is valid"
}
```
**Response (Error):**
```json
{
  "valid": false,
  "error": "Discount code has expired"
}
```

#### 2. Apply Discount Code
```
POST /api/discount-codes/apply
```
**Request Body:**
```json
{
  "discountCodeId": 1,
  "subscriptionId": "sub_1234567890"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Discount code applied successfully",
  "usage": {
    "id": 1,
    "discount_code_id": 1,
    "user_id": 123,
    "used_at": "2025-06-10T21:00:00.000Z",
    "subscription_id": "sub_1234567890"
  }
}
```

#### 3. Get All Discount Codes (Admin)
```
GET /api/discount-codes
```
**Response:**
```json
[
  {
    "id": 1,
    "code": "PROMO6MONTHSFREE",
    "description": "6 months free subscription promotion",
    "discount_type": "months_free",
    "discount_value": 6,
    "max_uses": null,
    "used_count": 5,
    "active": true,
    "valid_from": "2025-06-10T00:00:00.000Z",
    "valid_until": null,
    "applicable_plans": ["beta-seller", "beta-searching"],
    "created_at": "2025-06-10T00:00:00.000Z"
  }
]
```

#### 4. Create New Discount Code (Admin)
```
POST /api/discount-codes
```
**Request Body:**
```json
{
  "code": "SUMMER25",
  "description": "25% off summer promotion",
  "discount_type": "percentage",
  "discount_value": 25,
  "max_uses": 100,
  "valid_until": "2025-08-31T23:59:59.000Z",
  "applicable_plans": ["beta-seller"]
}
```

## Discount Code Validation Logic

The system validates discount codes based on:

1. **Code Existence**: Code must exist in database
2. **Active Status**: Code must be active
3. **Date Validity**: Current date must be between valid_from and valid_until
4. **Usage Limits**: If max_uses is set, used_count must be less than max_uses
5. **User Usage**: User cannot use the same code twice
6. **Plan Applicability**: Code must be applicable to the selected subscription plan

## Discount Types

### 1. Percentage Discount
- `discount_type`: "percentage"
- `discount_value`: 0-100 (representing percentage)
- Example: 25% off subscription

### 2. Months Free
- `discount_type`: "months_free"
- `discount_value`: 1-12 (number of months)
- Example: 6 months free subscription

### 3. Fixed Amount
- `discount_type`: "fixed_amount"
- `discount_value`: Amount in cents
- Example: $50 off subscription (value: 5000)

## Frontend Integration

### Sample Usage in Subscription Flow
```typescript
// Validate discount code
const validateCode = async (code: string, planType: string) => {
  const response = await fetch('/api/discount-codes/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, planType })
  });
  return response.json();
};

// Apply discount code
const applyCode = async (discountCodeId: number, subscriptionId?: string) => {
  const response = await fetch('/api/discount-codes/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ discountCodeId, subscriptionId })
  });
  return response.json();
};
```

## Environment Variables Required

No additional environment variables are needed. The system uses the existing database connection.

## Testing

### Test Scenarios
1. **Valid Code**: Use "PROMO6MONTHSFREE" with plan "beta-seller"
2. **Invalid Code**: Use non-existent code
3. **Expired Code**: Create code with past valid_until date
4. **Usage Limit**: Create code with max_uses=1, use twice
5. **Wrong Plan**: Use code with plan not in applicable_plans

### Sample Test Data
```sql
-- Create a test percentage discount
INSERT INTO discount_codes (code, description, discount_type, discount_value, max_uses, applicable_plans)
VALUES ('TEST25', '25% off test discount', 'percentage', 25, 10, ARRAY['beta-seller']);

-- Create a test fixed amount discount
INSERT INTO discount_codes (code, description, discount_type, discount_value, max_uses, applicable_plans)
VALUES ('SAVE50', '$50 off subscription', 'fixed_amount', 5000, 50, ARRAY['beta-seller', 'beta-searching']);
```

## Development Database Connection

Your developer should use this development database for testing:

**Connection String:**
```
postgresql://neondb_owner:npg_0LMDBcTw9PgH@ep-shiny-sound-a4to0rtz.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Individual Details:**
- Host: ep-shiny-sound-a4to0rtz.us-east-1.aws.neon.tech
- Port: 5432
- Database: neondb
- Username: neondb_owner
- Password: npg_0LMDBcTw9PgH

## Security Considerations

1. **Code Uniqueness**: All codes are stored in uppercase and checked for uniqueness
2. **One-time Use**: Users cannot reuse the same discount code
3. **Usage Tracking**: All usage is logged with timestamps and user IDs
4. **Plan Validation**: Codes can only be applied to specific subscription plans
5. **Authentication**: All endpoints require user authentication

## Next Steps

1. Implement frontend discount code input form
2. Integrate with subscription creation flow
3. Add admin panel for managing discount codes
4. Implement email notifications for successful code usage
5. Add analytics for discount code performance

## Support

For questions or issues with this implementation, contact the development team with this documentation as reference.
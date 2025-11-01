# Data Model Review & Improvement Suggestions

## Current Collections Overview

1. **users** - User accounts (NextAuth + business profile)
2. **accounts** - OAuth provider accounts (NextAuth)
3. **sessions** - User sessions (NextAuth)
4. **teamMembers** - Staff/team members
5. **clients** - Clients/customers
6. **shifts** - Work assignments/shifts
7. **idTypes** - Reference data for ID types
8. **clientTypes** - Reference data for client types

---

## 🔍 Detailed Analysis

### 1. **Shifts Collection** ⚠️ **NEEDS MOST ATTENTION**

#### Current Issues:

**❌ Data Denormalization:**
- Shifts store **denormalized client data** (`clientName`, `clientLocation`, `clientType`, `clientEmail`, `clientPhoneNumber`, `clientContactPerson`, `clientContactPhone`)
- This creates data redundancy and inconsistency risks
- Client information duplicated across multiple shifts

**❌ Missing Foreign Key Reference:**
- No `clientId` field to reference the `clients` collection
- Makes it impossible to maintain data consistency
- Cannot update client info across all shifts automatically

**❌ Inconsistent Team Member References:**
- Has both `teamMemberId` (single) and `notifiedTeamMemberIds` (array)
- `teamMemberId` appears redundant when `notifiedTeamMemberIds[0]` exists
- Creates confusion about which field is the source of truth

**❌ Status Timestamps Inconsistency:**
- Multiple optional timestamp fields (`publishedAt`, `assignedAt`, `confirmedAt`, etc.)
- Could be consolidated into a status history array for better audit trail

#### Recommendations:

```javascript
// IMPROVED SHIFT SCHEMA
{
  _id: ObjectId,
  ownerEmail: String,           // ✅ Keep for multi-tenancy
  clientId: ObjectId,           // ✅ ADD: Reference to clients collection
  serviceDate: String,          // Consider Date type instead of String
  startTime: String,
  endTime: String,
  breakDuration: String,
  serviceType: String,
  status: Enum,
  note: String,
  
  // Team member references
  assignedTeamMemberId: ObjectId,     // ✅ Single assigned team member
  notifiedTeamMemberIds: [ObjectId],  // ✅ Array of notified members
  
  // Remove all client* fields - fetch from clients collection instead
  
  // Status tracking (better approach)
  statusHistory: [{                  // ✅ ADD: Better audit trail
    status: String,
    timestamp: Date,
    changedBy: String?              // Future: track who made the change
  }],
  
  archived: Boolean,
  archivedAt: Date?,
  createdAt: Date,
  updatedAt: Date
}
```

**Benefits:**
- ✅ Single source of truth for client data
- ✅ Automatic updates when client info changes
- ✅ Reduced storage space
- ✅ Better referential integrity
- ✅ Cleaner status tracking

---

### 2. **Team Members Collection** ✅ **GOOD, Minor Improvements**

#### Current Structure:
```javascript
{
  _id: ObjectId,
  ownerEmail: String,
  name: String,
  email: String,
  phone: String?,
  idTypeId: ObjectId,        // ✅ Good: Reference to idTypes
  idNumber: String?,
  address: String?,
  suburb: String?,
  state: String?,
  postcode: String?,
  active: Boolean,
  archived: Boolean,
  archivedAt: Date?,
  createdAt: Date,
  updatedAt: Date
}
```

#### Recommendations:

**✅ Consider Adding:**
- `email` unique constraint per `ownerEmail` (enforced in code, but should be DB index)
- `phone` validation/formatting
- `employeeId` or `staffNumber` for internal tracking
- `hireDate` / `terminationDate` for HR tracking
- `hourlyRate` / `payRate` if needed for payroll
- `skills` or `qualifications` array for matching with shift requirements

**Indexes Needed:**
```javascript
db.teamMembers.createIndex({ ownerEmail: 1, email: 1 }, { unique: true })
db.teamMembers.createIndex({ ownerEmail: 1, active: 1 })
db.teamMembers.createIndex({ ownerEmail: 1, archived: 1 })
```

---

### 3. **Clients Collection** ✅ **GOOD, Minor Improvements**

#### Current Structure:
```javascript
{
  _id: ObjectId,
  ownerEmail: String,
  name: String,
  address: String?,
  suburb: String?,
  state: String?,
  postcode: String?,
  clientTypeId: ObjectId,     // ✅ Good: Reference to clientTypes
  phoneNumber: String?,
  contactPerson: String?,
  contactPhone: String?,
  email: String?,
  note: String?,
  active: Boolean,
  archived: Boolean,
  archivedAt: Date?,
  createdAt: Date,
  updatedAt: Date
}
```

#### Recommendations:

**✅ Consider Adding:**
- `clientCode` or `accountNumber` for internal reference
- `billingAddress` (separate from service address)
- `contractStartDate` / `contractEndDate`
- `paymentTerms` (e.g., "Net 30", "Due on receipt")
- `defaultServiceTypes` array
- `preferredTeamMembers` array (ObjectId references)
- `tags` or `categories` array for flexible categorization

**Indexes Needed:**
```javascript
db.clients.createIndex({ ownerEmail: 1, name: 1 }, { unique: true })
db.clients.createIndex({ ownerEmail: 1, active: 1 })
db.clients.createIndex({ ownerEmail: 1, clientTypeId: 1 })
```

---

### 4. **Reference Data Collections** ✅ **WELL DESIGNED**

#### idTypes & clientTypes Collections:
Both are well-structured with:
- ✅ `name`, `order`, `active` fields
- ✅ Proper indexing on `active: true` + `order: 1`
- ✅ Soft delete pattern with `active` flag

**Minor Enhancement:**
- Consider adding `description` field for documentation
- Consider `metadata` object for future extensibility

---

### 5. **Users Collection** 📋 **REVIEW NEEDED**

#### Current Structure (from code):
```javascript
{
  _id: ObjectId,
  email: String,              // Unique
  password: String?,          // Hashed, optional (OAuth users don't have)
  name: String?,
  businessName: String?,
  streetAddress: String?,
  suburb: String?,
  state: String?,
  postcode: String?,
  phoneNumber: String?,
  businessWebsite: String?,
  businessABN: String?,
  emailVerified: Date?,
  createdAt: Date?,
  updatedAt: Date?
}
```

#### Recommendations:

**✅ Good:**
- Separates business profile from NextAuth core fields

**⚠️ Considerations:**
- `ownerEmail` is used throughout but stored as `email` - this is fine but be consistent
- Consider `businessLogo` URL field
- Consider `timezone` for proper date/time handling
- Consider `currency` and `locale` for internationalization
- Consider `subscriptionPlan` and `subscriptionStatus` for future billing

**Indexes:**
```javascript
db.users.createIndex({ email: 1 }, { unique: true })  // ✅ Already exists
```

---

## 🚨 Critical Issues to Address

### 1. **Shifts Client Data Denormalization**

**Impact:** HIGH
**Priority:** HIGH

**Problem:**
- Client information is copied into every shift
- If client email/phone changes, old shifts show outdated info
- No way to query "all shifts for client X" efficiently
- Data inconsistency risk

**Solution:**
1. Add `clientId: ObjectId` to shifts
2. Remove all `client*` fields from shifts
3. Populate client data when fetching shifts (application-level join)
4. Migration script to update existing shifts

---

### 2. **Missing Database Indexes**

**Impact:** MEDIUM
**Priority:** MEDIUM

**Current State:**
- Only `users.email` and `accounts` have indexes
- No indexes on frequently queried fields

**Recommended Indexes:**

```javascript
// Team Members
db.teamMembers.createIndex({ ownerEmail: 1, email: 1 }, { unique: true })
db.teamMembers.createIndex({ ownerEmail: 1, active: 1 })
db.teamMembers.createIndex({ ownerEmail: 1, archived: 1 })
db.teamMembers.createIndex({ ownerEmail: 1, idTypeId: 1 })

// Clients
db.clients.createIndex({ ownerEmail: 1, name: 1 }, { unique: true })
db.clients.createIndex({ ownerEmail: 1, active: 1 })
db.clients.createIndex({ ownerEmail: 1, clientTypeId: 1 })
db.clients.createIndex({ ownerEmail: 1, archived: 1 })

// Shifts (CRITICAL for performance)
db.shifts.createIndex({ ownerEmail: 1, serviceDate: -1 })
db.shifts.createIndex({ ownerEmail: 1, status: 1 })
db.shifts.createIndex({ ownerEmail: 1, archived: 1 })
db.shifts.createIndex({ ownerEmail: 1, teamMemberId: 1 })
db.shifts.createIndex({ ownerEmail: 1, clientId: 1 })  // After adding clientId
db.shifts.createIndex({ ownerEmail: 1, serviceDate: 1, status: 1 })  // Compound

// Reference Data
db.idTypes.createIndex({ active: 1, order: 1 })
db.clientTypes.createIndex({ active: 1, order: 1 })
```

---

### 3. **Date/Time Storage Inconsistency**

**Impact:** LOW-MEDIUM
**Priority:** MEDIUM

**Problem:**
- `serviceDate` stored as String instead of Date
- Some timestamps as Date, others might be String
- Makes date queries and sorting less efficient

**Recommendation:**
- Store all dates as `Date` type in MongoDB
- Parse/format at application layer
- Better for queries: `{ serviceDate: { $gte: new Date('2024-01-01') } }`

---

### 4. **Status Tracking Could Be Better**

**Impact:** LOW
**Priority:** LOW

**Current:**
- Multiple optional timestamp fields (publishedAt, assignedAt, etc.)

**Alternative:**
```javascript
statusHistory: [{
  status: String,
  timestamp: Date,
  changedBy: String?,        // Future: track who made change
  note: String?              // Optional reason for status change
}]
```

**Benefits:**
- Complete audit trail
- Easier to add new statuses
- Can query "when did status X occur"
- Supports status change reasons/notes

---

## 📊 Proposed Schema Improvements

### **Shifts Collection (Improved)**

```javascript
{
  _id: ObjectId,
  
  // Multi-tenancy
  ownerEmail: String,
  
  // References
  clientId: ObjectId,              // ✅ NEW: Reference to client
  assignedTeamMemberId: ObjectId?, // Renamed from teamMemberId
  notifiedTeamMemberIds: [ObjectId],
  
  // Service details
  serviceDate: Date,                // ✅ Changed to Date
  startTime: String,
  endTime: String,
  breakDuration: String,
  serviceType: String?,
  
  // Status
  status: Enum,
  statusHistory: [{                // ✅ NEW: Better tracking
    status: String,
    timestamp: Date,
    changedBy: String?
  }],
  
  // Notes
  note: String?,
  
  // Soft delete
  archived: Boolean,
  archivedAt: Date?,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

**Migration Path:**
1. Add `clientId` field
- Migrate existing shifts: find client by name, set `clientId`
- Add index on `clientId`
2. Remove `client*` fields after migration
3. Update application code to populate client data from reference

---

## 🔐 Data Integrity Recommendations

### 1. **Foreign Key Validation**

Since MongoDB doesn't enforce foreign keys, add application-level validation:

```typescript
// Before creating/updating shift
async validateShift(clientId: string, ownerEmail: string) {
  const client = await db.collection('clients').findOne({ 
    _id: new ObjectId(clientId), 
    ownerEmail 
  })
  if (!client) throw new BadRequestException('Client not found')
}

// Similar validation for teamMemberId
```

### 2. **Cascade Updates**

When client info changes, consider whether to:
- Update historical shifts (probably NO - preserve history)
- Update future shifts (maybe YES - user choice)
- Or just update client record and populate on read (recommended)

---

## 📈 Scalability Considerations

### 1. **Pagination**

All list queries should support pagination:
```typescript
// Instead of .toArray()
.find(query)
.sort({ createdAt: -1 })
.skip(page * limit)
.limit(limit)
.toArray()
```

### 2. **Data Archival Strategy**

Current soft-delete pattern is good. Consider:
- Periodic cleanup job for very old archived records
- Separate archive collection for long-term storage
- Compress old data if retention policies require

### 3. **Sharding Readiness**

With `ownerEmail` as partition key, schema is shard-friendly:
- All queries include `ownerEmail`
- Good distribution potential
- Consider this for very large scale

---

## ✅ What's Working Well

1. **Multi-tenancy**: Consistent use of `ownerEmail` for data isolation
2. **Soft Deletes**: Good pattern with `archived` flags
3. **Reference Data**: Proper normalization of `idTypes` and `clientTypes`
4. **Timestamps**: Consistent `createdAt`/`updatedAt` pattern
5. **Type Safety**: Good use of TypeScript and Zod validation

---

## 🎯 Priority Action Items

### **HIGH PRIORITY:**
1. ✅ Add `clientId` to shifts collection
2. ✅ Create database indexes for performance
3. ✅ Migrate shifts to use `clientId` instead of denormalized data

### **MEDIUM PRIORITY:**
4. ✅ Convert `serviceDate` to Date type
5. ✅ Add unique constraint on team member email per owner
6. ✅ Add status history tracking

### **LOW PRIORITY:**
7. ✅ Consider additional fields for clients/team members
8. ✅ Implement pagination for all list queries
9. ✅ Add cascade update options for client changes

---

## 📝 Summary

**Overall Assessment:** Good foundation with room for improvement

**Strengths:**
- Clean separation of concerns
- Proper reference data normalization
- Good multi-tenancy support

**Main Weaknesses:**
- Shifts collection has significant denormalization
- Missing critical indexes
- Date/time storage inconsistency

**Recommendation:** Prioritize fixing shifts denormalization and adding indexes. These will have the biggest impact on data integrity and performance.


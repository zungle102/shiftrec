# Data Model Summary

## 📊 Overview

Your application uses a **multi-tenant MongoDB database** with 8 main collections supporting a shift management system for healthcare/service providers.

---

## 🗂️ Collections

### 1. **users** 
**Purpose:** User accounts and business profiles (NextAuth integration)

**Key Fields:**
- `email` (unique) - Used as `ownerEmail` throughout the app
- `password` (hashed, optional for OAuth users)
- `businessName`, `streetAddress`, `suburb`, `state`, `postcode`
- `phoneNumber`, `businessWebsite`, `businessABN`
- `createdAt`, `updatedAt`

**Status:** ✅ Well-structured, has unique index on email

---

### 2. **accounts** & **sessions**
**Purpose:** NextAuth OAuth provider accounts and user sessions

**Status:** ✅ Managed by NextAuth

---

### 3. **teamMembers**
**Purpose:** Staff/team member profiles

**Key Fields:**
- `ownerEmail` - Multi-tenancy key
- `name`, `email`, `phone`
- `idTypeId` - Reference to `idTypes` collection (ObjectId)
- `idNumber`, `address`, `suburb`, `state`, `postcode`
- `active`, `archived`, `archivedAt`
- `createdAt`, `updatedAt`

**Status:** ✅ **GOOD**
- Properly normalized with `idTypeId` reference
- Has database indexes for performance:
  - Unique: `ownerEmail + email`
  - Regular: `ownerEmail + active`, `ownerEmail + archived`, `ownerEmail + idTypeId`

**Potential Enhancements:**
- Employee ID/staff number
- Hire/termination dates
- Hourly rate/pay rate
- Skills/qualifications array

---

### 4. **clients**
**Purpose:** Client/customer profiles

**Key Fields:**
- `ownerEmail` - Multi-tenancy key
- `name` (unique per owner)
- `address`, `suburb`, `state`, `postcode`
- `clientTypeId` - Reference to `clientTypes` collection (ObjectId)
- `phoneNumber`, `email`, `contactPerson`, `contactPhone`
- `note`, `active`, `archived`, `archivedAt`
- `createdAt`, `updatedAt`

**Status:** ✅ **GOOD**
- Properly normalized with `clientTypeId` reference
- Has database indexes:
  - Unique: `ownerEmail + name`
  - Regular: `ownerEmail + active`, `ownerEmail + clientTypeId`, `ownerEmail + archived`

**Potential Enhancements:**
- Client code/account number
- Billing address (separate from service address)
- Contract dates
- Payment terms
- Preferred team members
- Tags/categories

---

### 5. **shifts** ⚠️ **UNDERGOING IMPROVEMENT**
**Purpose:** Work assignments/shifts

**Key Fields:**
- `ownerEmail` - Multi-tenancy key
- **NEW:** `clientId` - Reference to `clients` collection (ObjectId) ✅
- `serviceDate` (String - consider Date type)
- `startTime`, `endTime`, `breakDuration`, `serviceType`
- `teamMemberId` - Single assigned team member (backward compatibility)
- `notifiedTeamMemberIds` - Array of notified team members (ObjectId[])
- `status` - Enum: Drafted, Pending, Assigned, Confirmed, Declined, In Progress, Completed, Missed, Canceled, Timesheet Submitted, Timesheet Approved
- `note`
- Multiple status timestamps: `publishedAt`, `assignedAt`, `confirmedAt`, etc.
- `archived`, `archivedAt`, `createdAt`, `updatedAt`

**Current State:**
- ✅ **IMPROVED:** `clientId` field added to DTOs and service
- ✅ **IMPROVED:** Service now populates client data from `clientId` when available
- ✅ **IMPROVED:** Falls back to denormalized client fields for backward compatibility
- ✅ Has database indexes:
  - `ownerEmail + serviceDate` (descending)
  - `ownerEmail + status`
  - `ownerEmail + archived`
  - `ownerEmail + teamMemberId`
  - `ownerEmail + serviceDate + status` (compound)

**Still Contains Denormalized Data (for backward compatibility):**
- `clientName`, `clientLocation`, `clientType`
- `clientEmail`, `clientPhoneNumber`
- `clientContactPerson`, `clientContactPhone`

**Recommendations (Future):**
- Convert `serviceDate` from String to Date type
- Replace multiple status timestamps with `statusHistory` array
- Remove denormalized client fields once migration is complete
- Add index on `ownerEmail + clientId` after full migration

---

### 6. **idTypes** ✅ **WELL DESIGNED**
**Purpose:** Reference data for ID types

**Key Fields:**
- `name` - e.g., "Australian Driver's License", "Australian Passport"
- `order`, `active`
- `createdAt`, `updatedAt`

**Status:** ✅ **EXCELLENT**
- Proper normalization
- Has index on `active + order`
- Used by `teamMembers.idTypeId`

---

### 7. **clientTypes** ✅ **WELL DESIGNED**
**Purpose:** Reference data for client types

**Key Fields:**
- `name` - e.g., "Aged Care", "NDIS", "Others"
- `order`, `active`
- `createdAt`, `updatedAt`

**Status:** ✅ **EXCELLENT**
- Proper normalization
- Has index on `active + order`
- Used by `clients.clientTypeId`

---

## 🏗️ Architecture Patterns

### ✅ **Multi-Tenancy**
- All business collections use `ownerEmail` for data isolation
- Consistent pattern across all collections
- Enables secure multi-tenant architecture

### ✅ **Soft Deletes**
- All main collections use `archived` boolean flag
- Optional `archivedAt` timestamp
- Allows data recovery while hiding from active views

### ✅ **Reference Data Normalization**
- `idTypes` and `clientTypes` properly normalized
- References use ObjectId for referential integrity
- Enables single source of truth for lookup data

### ✅ **Type Safety**
- TypeScript throughout
- Zod schema validation for API inputs
- Reduces runtime errors

---

## 🔄 Recent Improvements Made

### ✅ **HIGH PRIORITY - Completed:**
1. **Database Indexes Created** - All recommended indexes now in place for optimal query performance
2. **clientId Support Added** - Shifts can now reference clients via `clientId` field
3. **Migration Script Created** - `migrate-shifts-to-clientId.js` ready to migrate existing data
4. **Service Updated** - Shift service now populates client data from `clientId` when available, with backward compatibility

### 📋 **MEDIUM PRIORITY - Pending:**
1. Run migration script to populate `clientId` for existing shifts
2. Convert `serviceDate` from String to Date type
3. Consider adding status history tracking

### 📋 **LOW PRIORITY - Future:**
1. Add pagination to all list queries
2. Consider additional fields for business needs
3. Add foreign key validation at application level

---

## 📈 Data Relationships

```
users (ownerEmail)
  ├── teamMembers (ownerEmail, idTypeId → idTypes)
  ├── clients (ownerEmail, clientTypeId → clientTypes)
  └── shifts (ownerEmail, clientId → clients, teamMemberId → teamMembers, notifiedTeamMemberIds → teamMembers[])
```

**Relationship Flow:**
- Each user owns multiple team members, clients, and shifts
- Team members reference ID types
- Clients reference client types
- Shifts reference clients and team members (one-to-many for notified members)

---

## 🔍 Current Data Model Health

### **Strengths:**
✅ Consistent multi-tenancy pattern
✅ Proper reference data normalization
✅ Good soft-delete implementation
✅ Type-safe with TypeScript + Zod
✅ Comprehensive database indexes (recently added)
✅ Backward compatibility maintained during improvements

### **Areas Improved:**
✅ Database indexes for performance
✅ Started normalization of shifts → clients relationship
✅ Client data can now be populated from reference

### **Future Considerations:**
- Complete migration to `clientId` for all shifts
- Consider `statusHistory` array instead of multiple timestamps
- Convert date strings to Date objects for better querying
- Add application-level foreign key validation
- Implement pagination for large datasets

---

## 📊 Database Indexes Summary

### **Created Indexes:**
- ✅ `users.email` (unique)
- ✅ `accounts.providerId + providerAccountId` (unique)
- ✅ `teamMembers.ownerEmail + email` (unique)
- ✅ `teamMembers.ownerEmail + active`
- ✅ `teamMembers.ownerEmail + archived`
- ✅ `teamMembers.ownerEmail + idTypeId`
- ✅ `clients.ownerEmail + name` (unique)
- ✅ `clients.ownerEmail + active`
- ✅ `clients.ownerEmail + clientTypeId`
- ✅ `clients.ownerEmail + archived`
- ✅ `shifts.ownerEmail + serviceDate` (descending)
- ✅ `shifts.ownerEmail + status`
- ✅ `shifts.ownerEmail + archived`
- ✅ `shifts.ownerEmail + teamMemberId`
- ✅ `shifts.ownerEmail + serviceDate + status` (compound)
- ✅ `idTypes.active + order`
- ✅ `clientTypes.active + order`

### **Recommended (After Migration):**
- `shifts.ownerEmail + clientId` - Create after `clientId` migration completes

---

## 🎯 Next Steps

1. **Run Migration:** Execute `migrate-shifts-to-clientId.js` to populate `clientId` for existing shifts
2. **Monitor Performance:** Check query performance after indexes are in place
3. **Gradual Migration:** Frontend can start using `clientId` when creating/updating shifts
4. **Future Cleanup:** Once all shifts have `clientId`, consider removing denormalized client fields

---

**Last Updated:** After implementing database indexes and `clientId` support  
**Overall Assessment:** ✅ **Solid foundation with recent performance and normalization improvements**


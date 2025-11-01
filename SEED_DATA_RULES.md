# Seed Data Generation Rules

This document outlines the rules that govern how seed data is generated for shifts in the database.

## Staff Member Assignment Rules by Status

### 1. **Drafted** Status
- ✅ Can have assigned staff member (70% chance)
- ❌ Must NOT have notified staff members (always empty)
- **Rule**: `assignedStaffMemberId` can be set, but `notifiedStaffMemberIds` must be `[]`

### 2. **Pending** Status
- ❌ Must NOT have assigned staff member (always null)
- ✅ Must have notified staff members (1-3 staff members randomly selected)
- **Rule**: Only `notifiedStaffMemberIds` are set, never `assignedStaffMemberId`

### 3. **Assigned** Status
- ✅ MUST have assigned staff member (always assigned)
- ✅ Can have notified staff members
- **Rule**: `assignedStaffMemberId` is always set when status is "Assigned"

### 4. **Statuses Requiring Assignment** (Always Must Have Assigned Staff Member)
The following statuses **MUST** have an assigned staff member:
- **Assigned**
- **Declined**
- **Confirmed**
- **In Progress**
- **Completed**
- **Missed**
- **Canceled**
- **Timesheet Approved**
- **Timesheet Submitted**

**Rule**: All shifts with these statuses will have `assignedStaffMemberId` set.

### 5. **Other Statuses**
- ✅ Can have both assigned and notified staff members (70% chance of assignment)
- ✅ 30% chance of multiple staff members if more than 1 available

## Summary Table

| Status | Assigned Staff Member | Notified Staff Members | Notes |
|--------|----------------------|------------------------|-------|
| **Drafted** | Optional (70% chance) | ❌ None (always empty) | Can assign but never notify |
| **Pending** | ❌ None (always null) | ✅ Required (1-3 members) | Only notify, never assign |
| **Assigned** | ✅ Required | ✅ Optional (can have) | Always has assigned member |
| **Declined** | ✅ Required | ✅ Optional (can have) | Must have assigned member |
| **Confirmed** | ✅ Required | ✅ Optional (can have) | Must have assigned member |
| **In Progress** | ✅ Required | ✅ Optional (can have) | Must have assigned member |
| **Completed** | ✅ Required | ✅ Optional (can have) | Must have assigned member |
| **Missed** | ✅ Required | ✅ Optional (can have) | Must have assigned member |
| **Canceled** | ✅ Required | ✅ Optional (can have) | Must have assigned member |
| **Timesheet Approved** | ✅ Required | ✅ Optional (can have) | Must have assigned member |
| **Timesheet Submitted** | ✅ Required | ✅ Optional (can have) | Must have assigned member |

## Implementation Details

### Code Location
The rules are implemented in: `apps/web/scripts/seed-shifts.js`

### Key Logic
```javascript
// Statuses that MUST have assigned staff member
const statusesRequiringAssignment = [
  'Assigned', 
  'Declined', 
  'Confirmed', 
  'In Progress', 
  'Completed', 
  'Missed', 
  'Canceled', 
  'Timesheet Approved', 
  'Timesheet Submitted'
]

// Drafted: Can assign but never notify
if (status === 'Drafted') {
  // 70% chance of assignment
  // notifiedTeamMemberIds = []
}

// Pending: Only notify, never assign
if (status === 'Pending') {
  // assignedTeamMemberId = null
  // notifiedTeamMemberIds = [1-3 members]
}

// Required statuses: Always assign
if (statusesRequiringAssignment.includes(status)) {
  // assignedTeamMemberId = always set
  // notifiedTeamMemberIds = optional
}
```

## Data Quality Guarantees

When seed data is generated, you can expect:

1. ✅ **No "Pending" shifts** will have assigned staff members
2. ✅ **All "Assigned" shifts** will have assigned staff members
3. ✅ **All workflow statuses** (Declined, Confirmed, In Progress, Completed, Missed, Canceled, Timesheet Approved, Timesheet Submitted) will have assigned staff members
4. ✅ **No "Drafted" shifts** will have notified staff members
5. ✅ **All "Pending" shifts** will have at least one notified staff member


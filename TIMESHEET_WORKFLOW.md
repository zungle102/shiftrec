# Timesheet Status Workflow

## 📋 Overview

This document outlines the recommended workflow for managing shift status transitions, particularly focusing on the timesheet submission and approval process.

---

## 🔄 Complete Status Flow

### **Status Progression**

```
Drafted → Pending → Assigned → Confirmed → In Progress → Completed → Timesheet Submitted → Timesheet Approved
                                    ↓
                                 Declined
                                    ↓
                                Canceled/Missed
```

---

## 📊 Status Definitions

### **1. Drafted**
- **Who creates:** Manager/Admin
- **Description:** Shift created but not yet published
- **Actions allowed:**
  - Edit shift details
  - Delete shift
  - Assign staff member (optional)
  - Publish shift (moves to Pending)

### **2. Pending**
- **Who creates:** Manager/Admin (by publishing Drafted shift)
- **Description:** Shift published and notifications sent to staff
- **Requirements:** Must have notified staff members
- **Actions allowed:**
  - Notify additional staff
  - Assign staff member (moves to Assigned)
  - Edit shift details
  - Cancel shift

### **3. Assigned**
- **Who creates:** Manager/Admin (by assigning staff to shift)
- **Description:** Staff member has been assigned to the shift
- **Requirements:** Must have assigned staff member
- **Actions allowed:**
  - Staff member can confirm (moves to Confirmed)
  - Staff member can decline (moves to Declined)
  - Manager can un-assign (moves to Drafted)
  - Manager can edit shift details

### **4. Confirmed**
- **Who creates:** Staff member (by confirming assigned shift)
- **Description:** Staff member has confirmed they will work the shift
- **Requirements:** Must have assigned staff member
- **Actions allowed:**
  - Manager can mark as "In Progress" when shift starts
  - Staff member can decline before shift starts (moves to Declined)
  - Manager can cancel (moves to Canceled)

### **5. Declined**
- **Who creates:** Staff member (by declining assigned shift)
- **Description:** Staff member has declined the shift
- **Actions allowed:**
  - Manager can notify other staff members
  - Manager can assign different staff (moves to Assigned)
  - Manager can cancel shift (moves to Canceled)

### **6. In Progress**
- **Who creates:** Manager/Staff (when shift starts)
- **Description:** Shift is currently being worked
- **Requirements:** Must be Confirmed or Assigned status
- **When to use:** Set when staff member begins work
- **Actions allowed:**
  - Manager can mark as Completed when shift ends
  - Manager can mark as Missed if staff doesn't show

### **7. Completed**
- **Who creates:** Manager/Staff (when shift ends)
- **Description:** Shift has been completed
- **Requirements:** Must have assigned staff member
- **Actions allowed:**
  - Staff member can submit timesheet (moves to Timesheet Submitted)
  - Manager can mark as Missed if timesheet not submitted within deadline

### **8. Timesheet Submitted**
- **Who creates:** Staff member (by submitting timesheet)
- **Description:** Staff member has submitted their timesheet for approval
- **Requirements:** Must be Completed status
- **Actions allowed:**
  - Manager can approve (moves to Timesheet Approved)
  - Manager can reject and request resubmission (moves back to Completed)
  - Staff member can edit and resubmit (remains Timesheet Submitted)

### **9. Timesheet Approved**
- **Who creates:** Manager/Admin (by approving timesheet)
- **Description:** Timesheet has been approved and is ready for payroll
- **Requirements:** Must be Timesheet Submitted status
- **Final status:** No further actions (shift is complete)

### **10. Missed**
- **Who creates:** Manager/Admin
- **Description:** Staff member did not attend/complete the shift
- **Actions allowed:**
  - Can be marked as Completed later if work was done
  - Can remain as Missed (final status)

### **11. Canceled**
- **Who creates:** Manager/Admin
- **Description:** Shift has been canceled
- **Final status:** No further actions (shift is canceled)

---

## 🎯 Recommended Workflow Steps

### **Phase 1: Shift Creation & Assignment**

1. **Manager creates shift** → Status: `Drafted`
   - Fill in shift details (date, time, client, service type)
   - Optionally assign staff member directly

2. **Manager publishes shift** → Status: `Pending`
   - System sends notifications to selected staff members
   - Staff members receive notification

3. **Manager assigns staff OR Staff accepts** → Status: `Assigned`
   - If manager assigns: Status becomes `Assigned`
   - If staff accepts from notification: Status becomes `Assigned`

### **Phase 2: Shift Confirmation**

4. **Staff member confirms** → Status: `Confirmed`
   - Staff member explicitly confirms they will work
   - Optional step (can skip if already `Assigned`)

### **Phase 3: Shift Execution**

5. **Shift starts** → Status: `In Progress`
   - Manager or staff marks shift as started
   - Can be automated with time tracking integration

6. **Shift ends** → Status: `Completed`
   - Manager or staff marks shift as completed
   - System records actual end time if different from scheduled

### **Phase 4: Timesheet Submission**

7. **Staff submits timesheet** → Status: `Timesheet Submitted`
   - Staff member enters actual hours worked
   - Can include break duration adjustments
   - Can add notes about the shift
   - Submits for manager approval

### **Phase 5: Timesheet Approval**

8. **Manager reviews timesheet**
   - Manager reviews submitted hours
   - Compares with scheduled hours
   - Can approve or request changes

9a. **Manager approves** → Status: `Timesheet Approved`
   - Timesheet is approved
   - Ready for payroll processing
   - Final status

9b. **Manager rejects** → Status: `Completed` (revert)
   - Manager requests corrections
   - Staff member updates and resubmits (back to step 7)

---

## 🚨 Edge Cases & Alternative Flows

### **Declined Shift Flow**
```
Assigned → Declined → [Manager Actions]
                            ├─ Notify other staff → Pending
                            ├─ Assign different staff → Assigned
                            └─ Cancel shift → Canceled
```

### **Missed Shift Flow**
```
Confirmed/Assigned → In Progress → Missed
                           OR
Completed → Missed (if no timesheet submitted within deadline)
```

### **Canceled Shift Flow**
```
Any status → Canceled (final)
```

---

## 👥 Roles & Permissions

### **Manager/Admin Permissions:**
- ✅ Create, edit, delete shifts in any status
- ✅ Publish shifts (Drafted → Pending)
- ✅ Assign staff (any status → Assigned)
- ✅ Un-assign staff (Assigned → Drafted)
- ✅ Mark shifts as In Progress (Confirmed/Assigned → In Progress)
- ✅ Mark shifts as Completed (In Progress → Completed)
- ✅ Approve timesheets (Timesheet Submitted → Timesheet Approved)
- ✅ Reject timesheets (Timesheet Submitted → Completed)
- ✅ Mark shifts as Missed or Canceled (from any status)

### **Staff Member Permissions:**
- ✅ View assigned shifts
- ✅ Confirm assigned shifts (Assigned → Confirmed)
- ✅ Decline assigned shifts (Assigned → Declined)
- ✅ Mark shift as In Progress (when starting work)
- ✅ Mark shift as Completed (when finishing work)
- ✅ Submit timesheet (Completed → Timesheet Submitted)
- ✅ Edit submitted timesheet (if not yet approved)
- ❌ Cannot approve their own timesheets
- ❌ Cannot change status from Approved

---

## 💡 Implementation Recommendations

### **1. Status Transition Validation**

Create a validation matrix to ensure only valid transitions are allowed:

```typescript
const VALID_TRANSITIONS: Record<string, string[]> = {
  'Drafted': ['Pending', 'Canceled'],
  'Pending': ['Assigned', 'Canceled'],
  'Assigned': ['Confirmed', 'Declined', 'Drafted', 'In Progress', 'Canceled'],
  'Confirmed': ['In Progress', 'Declined', 'Canceled'],
  'Declined': ['Pending', 'Assigned', 'Canceled'],
  'In Progress': ['Completed', 'Missed'],
  'Completed': ['Timesheet Submitted', 'Missed'],
  'Timesheet Submitted': ['Timesheet Approved', 'Completed'],
  'Timesheet Approved': [], // Final status
  'Missed': ['Completed'], // Can be corrected
  'Canceled': [] // Final status
}
```

### **2. Automated Status Updates**

Consider automating certain status changes:
- **Auto-complete:** If shift end time passed and status is "In Progress"
- **Auto-mark missed:** If shift date passed and still "Confirmed" or "Assigned"
- **Reminder notifications:** Send reminders when shifts are not submitted within X days

### **3. Timesheet Submission Requirements**

When moving to "Timesheet Submitted":
- ✅ Actual start time
- ✅ Actual end time
- ✅ Break duration
- ✅ Optional: Notes about shift
- ✅ Optional: Adjustments to scheduled hours

### **4. Approval Workflow**

When approving timesheets:
- ✅ Review actual vs scheduled hours
- ✅ Check for overtime (if applicable)
- ✅ Verify break times
- ✅ Review notes for any issues
- ✅ Bulk approval option for multiple timesheets

### **5. Notifications**

Set up notifications for:
- 📧 Staff: When shift is assigned
- 📧 Manager: When timesheet is submitted
- 📧 Staff: When timesheet is approved/rejected
- 📧 Manager: Reminder for pending approvals

---

## 📅 Recommended Time Limits

1. **Timesheet Submission Deadline:** 7 days after shift completion
2. **Approval Deadline:** 3 days after submission
3. **Auto-Mark Missed:** If shift date passed + 1 day without status change
4. **Reminder Notifications:**
   - Days 3, 5, 7 after completion (if not submitted)
   - Day 2 after submission (if not approved)

---

## 🎨 UI/UX Recommendations

### **Status Change Buttons by Current Status**

**Drafted:**
- "Publish" → Pending
- "Cancel" → Canceled

**Pending:**
- "Notify Staff" → Send notifications
- "Assign" → Assigned
- "Cancel" → Canceled

**Assigned:**
- "Un-Assign" → Drafted (manager only)
- "Mark In Progress" → In Progress

**Confirmed:**
- "Mark In Progress" → In Progress
- "Cancel" → Canceled

**In Progress:**
- "Mark Completed" → Completed

**Completed:**
- "Submit Timesheet" → Timesheet Submitted (staff only)
- "Mark Missed" → Missed (manager only)

**Timesheet Submitted:**
- "Approve" → Timesheet Approved (manager only)
- "Request Changes" → Completed (manager only)
- "Edit Timesheet" → (staff only, remains Timesheet Submitted)

**Timesheet Approved:**
- (No actions - final status)

**Missed:**
- "Mark as Completed" → Completed (if work was done)

**Declined:**
- "Notify Other Staff" → Pending
- "Assign Different Staff" → Assigned
- "Cancel" → Canceled

---

## 🔍 Status History Tracking

Recommend implementing status history to track:
- Previous status
- New status
- Changed by (user email)
- Changed at (timestamp)
- Reason/notes (optional)

This provides audit trail for compliance and troubleshooting.

---

## ✅ Next Steps for Implementation

1. **Add status transition validation** in backend service
2. **Create role-based action buttons** in frontend
3. **Implement timesheet submission form** (separate modal/page)
4. **Add notification system** for status changes
5. **Create approval interface** for managers
6. **Add status history tracking** to database
7. **Set up automated reminders** via cron jobs or scheduled tasks
8. **Create reports** for pending approvals and submissions

---

## 📝 Notes

- **Flexibility:** Some workflows may vary by organization
- **Automation:** Consider what can be automated vs manual
- **Compliance:** Ensure workflow meets local labor law requirements
- **Integration:** Consider integration with payroll systems for approved timesheets


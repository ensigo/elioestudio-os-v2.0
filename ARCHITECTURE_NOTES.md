# Backend Architecture & Zero Error Logic

## 1. Critical Database Validations (Triggers/Constraints)

### A. The "Highlander" Rule (Time Overlap Prevention)
**Problem:** A user claims to work on Task A and Task B at the exact same time (09:00 - 10:00).
**Solution:** PostgreSQL Exclusion Constraint.
```sql
ALTER TABLE "TimeEntry"
ADD CONSTRAINT "no_time_overlap"
EXCLUDE USING GIST (
  "userId" WITH =,
  tstzrange("startTime", "endTime") WITH &&
);
```
*Effect:* The database will throw an error if an overlap is attempted. The API must catch this and return a 409 Conflict.

### B. The "Zombie" Prevention (Referential Integrity)
**Problem:** A Task is assigned to a User who has been "Deleted" (Soft Deleted).
**Solution:**
1. All queries for `User` must implicitly filter `where: { deletedAt: null }`.
2. `TimeEntry` creation validation: `CHECK (EXISTS (SELECT 1 FROM "User" WHERE id = "TimeEntry"."userId" AND "deletedAt" IS NULL))`

### C. The "Parent Paradox" (Task Closure)
**Problem:** Closing a Parent Task while Subtasks are still OPEN.
**Solution:** `BEFORE UPDATE` Trigger on `Task`.
```sql
CREATE FUNCTION check_subtasks_closed() RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'CLOSED' THEN
    IF EXISTS (SELECT 1 FROM "Task" WHERE "parentTaskId" = NEW.id AND status != 'CLOSED') THEN
      RAISE EXCEPTION 'Cannot close task with open subtasks.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## 2. Automated Logic (Cron Jobs / Event Bus)

### 1. The "Underperformer" Alert (Productivity Watchdog)
*   **Trigger:** Daily Cron (20:00).
*   **Logic:**
    *   Fetch all ACTIVE users.
    *   Sum `durationSeconds` from `TimeEntry` for `TODAY`.
    *   Exclude users with `LeaveRequest` status `APPROVED` for `TODAY`.
    *   **IF** `totalHours < 6` **THEN** Create `AuditLog` (Type: WARNING) + Send Notification to Manager.

### 2. The "Budget Burn" Alert
*   **Trigger:** On `TimeEntry` Create/Update.
*   **Logic:**
    *   Calculate `Project.totalHoursSpent`.
    *   Calculate `Project.burnedBudget = totalHoursSpent * User.hourlyCost`.
    *   **IF** `burnedBudget > Project.budget * 0.8` (80%) **AND** `AlertNotSent` **THEN** Email Project Manager.

### 3. The "Stale Task" Sweeper
*   **Trigger:** Weekly Cron.
*   **Logic:**
    *   Find Tasks with status `IN_PROGRESS` but no `TimeEntry` in last 7 days.
    *   Action: Downgrade status to `PENDING` or flag as `STALLED`.

## 3. Data Integrity & Money
*   All monetary values (`hourlyCost`, `budget`, `monthlyFee`) are stored as `Decimal(10,2)` or `Int` (cents).
*   **Never** use floating point arithmetic for billing calculations.

-- 003_add_loan_disbursement.down.sql

-- Note: PostgreSQL does not support removing enum values directly.
-- To rollback, you would need to:
-- 1. Delete all transactions with nature = 'LOAN_DISBURSEMENT'
-- 2. Drop and recreate the enum type without LOAN_DISBURSEMENT
-- 3. Recreate all tables that use the enum

-- This is complex and risky, so this migration is effectively irreversible.
-- If you need to rollback, restore from a backup before this migration.

-- 007_remove_loan_entity.down.sql
-- Restore LOAN as a valid entity_type value.
-- NOTE: existing rows that were migrated from LOAN to PERSONAL cannot be automatically
-- reverted since the original entity information was not preserved.

-- Step 1: Create enum with LOAN restored
CREATE TYPE entity_type_new AS ENUM ('PERSONAL', 'HOME', 'LOAN');

-- Step 2: Re-alter all columns back to entity_type_new
ALTER TABLE transactions
  ALTER COLUMN entity TYPE entity_type_new USING entity::text::entity_type_new;

ALTER TABLE categories
  ALTER COLUMN entity TYPE entity_type_new USING entity::text::entity_type_new;

ALTER TABLE transaction_templates
  ALTER COLUMN entity TYPE entity_type_new USING entity::text::entity_type_new;

-- Step 3: Drop new-sans-LOAN type and rename the full one back
DROP TYPE entity_type;
ALTER TYPE entity_type_new RENAME TO entity_type;

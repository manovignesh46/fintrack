-- 007_remove_loan_entity.up.sql
-- Migrate LOAN entity to PERSONAL, then remove LOAN from the entity_type enum.
-- PostgreSQL does not support removing enum values in-place, so we create a new type,
-- migrate all columns, drop the old type, and rename the new one.

-- Step 1: Migrate existing LOAN-entity rows to PERSONAL
UPDATE transactions        SET entity = 'PERSONAL' WHERE entity = 'LOAN';
UPDATE categories          SET entity = 'PERSONAL' WHERE entity = 'LOAN';
UPDATE transaction_templates SET entity = 'PERSONAL' WHERE entity = 'LOAN';

-- Step 2: Create the new enum without LOAN
CREATE TYPE entity_type_new AS ENUM ('PERSONAL', 'HOME');

-- Step 3: Alter all three columns to use the new type
ALTER TABLE transactions
  ALTER COLUMN entity TYPE entity_type_new USING entity::text::entity_type_new;

ALTER TABLE categories
  ALTER COLUMN entity TYPE entity_type_new USING entity::text::entity_type_new;

ALTER TABLE transaction_templates
  ALTER COLUMN entity TYPE entity_type_new USING entity::text::entity_type_new;

-- Step 4: Drop the old enum and rename the new one
DROP TYPE entity_type;
ALTER TYPE entity_type_new RENAME TO entity_type;

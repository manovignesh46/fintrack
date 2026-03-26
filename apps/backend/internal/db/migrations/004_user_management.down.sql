DROP INDEX IF EXISTS idx_transaction_templates_user_id;
DROP INDEX IF EXISTS idx_transactions_user_id;
DROP INDEX IF EXISTS idx_sub_categories_user_id;
DROP INDEX IF EXISTS idx_categories_user_id;
DROP INDEX IF EXISTS idx_accounts_user_id;

ALTER TABLE transaction_templates DROP COLUMN user_id;
ALTER TABLE transactions DROP COLUMN user_id;
ALTER TABLE sub_categories DROP COLUMN user_id;
ALTER TABLE categories DROP COLUMN user_id;
ALTER TABLE accounts DROP COLUMN user_id;

DROP TABLE IF EXISTS users;

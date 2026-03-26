-- 001_init.up.sql

CREATE TYPE entity_type AS ENUM ('PERSONAL', 'HOME', 'LOAN');
CREATE TYPE account_type AS ENUM ('ASSET', 'LIABILITY');
CREATE TYPE tx_nature AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER', 'EMI_PAYMENT');

-- Accounts: where money physically lives (Asset) or debts owed (Liability)
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type account_type NOT NULL,
    initial_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
    current_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Categories scoped by entity
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    entity entity_type NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, entity)
);

-- Sub-categories under a category
CREATE TABLE sub_categories (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category_id, name)
);

-- Transactions: every money movement
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    nature tx_nature NOT NULL,
    source_account_id INTEGER NOT NULL REFERENCES accounts(id),
    target_account_id INTEGER REFERENCES accounts(id),
    sub_category_id INTEGER REFERENCES sub_categories(id),
    entity entity_type NOT NULL,
    payment_method VARCHAR(50),
    notes TEXT,
    principal_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    interest_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Transaction templates for quick-add
CREATE TABLE transaction_templates (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    nature tx_nature NOT NULL,
    source_account_id INTEGER NOT NULL REFERENCES accounts(id),
    target_account_id INTEGER REFERENCES accounts(id),
    sub_category_id INTEGER REFERENCES sub_categories(id),
    entity entity_type NOT NULL,
    payment_method VARCHAR(50),
    principal_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    interest_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX idx_transactions_entity ON transactions(entity);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_nature ON transactions(nature);
CREATE INDEX idx_transactions_source ON transactions(source_account_id);
CREATE INDEX idx_categories_entity ON categories(entity);

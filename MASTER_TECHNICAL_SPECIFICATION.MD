# 📘 Project: FinTrack Omni-Ledger

**Architecture:** Single-Pool Virtual Allocation with Multi-Entity Support.

---

## 1. Core Logic: The "Virtual Layer"

The system assumes all money exists in a single physical pool (One Bank Account + Cash). The app acts as a **Virtual Ledger** to partition that money into logical "buckets."

*   **Physical Tally:** Matches your HDFC Bank SMS or Cash in pocket.
*   **Virtual Allocation:** Tells you how much of that HDFC balance belongs to **Home** vs. **Personal**.
*   **Debt Ledger:** Tracks the principal reduction of Loans without treating the whole loan as a "spent expense."

---

## 2. Data Hierarchy (The "Account" Model)

Instead of just categories, we use a **Source-Target Account** model to handle the complexity of Loans and ATM withdrawals.

| Component | Description | Examples |
| :--- | :--- | :--- |
| **Entities** | The high-level "Owner" of the transaction. | Personal, Home, Personal Loan. |
| **Asset Accounts** | Where the money physically lives. | HDFC Bank, Cash (Hand), Amazon Pay. |
| **Liability Accounts** | The debt accounts (Loans). | Manapuram (Gold), AM-Fincorp (Local). |
| **Nature** | The direction of the flow. | Income, Expense, Transfer (ATM), Payment (EMI). |

---

## 3. Database Schema (PostgreSQL)

```sql
-- 1. Core Enums
CREATE TYPE entity_type AS ENUM ('PERSONAL', 'HOME', 'LOAN');
CREATE TYPE account_type AS ENUM ('ASSET', 'LIABILITY');
CREATE TYPE tx_nature AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER', 'EMI_PAYMENT');

-- 2. Accounts Table (The "Where")
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type account_type NOT NULL,
    initial_balance NUMERIC(12, 2) DEFAULT 0,
    current_balance NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Categories & Sub-types (The "What")
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    entity entity_type NOT NULL
);

CREATE TABLE sub_categories (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id),
    name VARCHAR(100) NOT NULL
);

-- 4. Transactions Table (The "Movement")
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    nature tx_nature NOT NULL,
    source_account_id INTEGER REFERENCES accounts(id), -- e.g., HDFC
    target_account_id INTEGER REFERENCES accounts(id), -- e.g., Manapuram (for EMI)
    sub_category_id INTEGER REFERENCES sub_categories(id),
    entity entity_type NOT NULL,
    transaction_date DATE DEFAULT CURRENT_DATE
);
```

---

## 4. Key Workflows & Logic

### 4.1 The ATM Withdrawal (Location Transfer)

*   **Action:** Withdraw ₹5,000 from ATM.
*   **Nature:** `TRANSFER`.
*   **Source:** HDFC Bank (Asset).
*   **Target:** Cash Hand (Asset).
*   **Result:** Physical Tally for HDFC drops; Physical Tally for Cash increases. Total Assets remain unchanged.

### 4.2 The EMI Payment (Liability Reduction)

*   **Action:** Pay ₹2,500 EMI to Manapuram.
*   **Nature:** `EMI_PAYMENT`.
*   **Source:** HDFC Bank (Asset).
*   **Target:** Manapuram Gold Loan (Liability).
*   **Result:** HDFC balance drops; Manapuram Debt Principal drops.

### 4.3 The "Tally" Screen (Reconciliation)

The UI will present a simple form:

1.  **Input:** User enters actual HDFC balance from mobile app.
2.  **Logic:** `Diff = User_Input - (Initial_Balance + SUM(In) - SUM(Out))`.
3.  **Output:** If `Diff != 0`, show "Unaccounted Transactions Found."

---

## 5. Monorepo Structure (pnpm + Turbo)

```text
/root
├── apps/
│   ├── frontend/         # React + Vite + Tailwind
│   │   ├── src/components/EntitySwitcher.tsx
│   │   ├── src/components/TallyForm.tsx
│   │   └── src/hooks/useBalance.ts
│   └── backend/          # Go (Golang)
│       ├── cmd/api/main.go
│       ├── internal/db/      # pgx connection & migrations
│       └── internal/handlers/ # CRUD & Tally Logic
├── turbo.json            # Task orchestration
├── pnpm-workspace.yaml   # Monorepo config
└── docker-compose.yml    # Postgres setup
```

---

## 6. Business Logic Rules for Copilot

*   **Precision:** Always use `numeric` in SQL and `float64` (or `shopspring/decimal`) in Go. Never use standard floats for money.
*   **Atomicity:** Every EMI payment must atomically update both the transaction log and the `current_balance` of the Liability account.
*   **Dynamic UI:** Categories and Sub-categories must be fetched based on the selected Entity (Personal vs. Home).

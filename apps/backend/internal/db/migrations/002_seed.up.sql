-- 002_seed.up.sql

-- Asset accounts (banks + cash)
INSERT INTO accounts (name, type, initial_balance, current_balance) VALUES
    ('HDFC Bank', 'ASSET', 0, 0),
    ('Karnataka Bank', 'ASSET', 0, 0),
    ('SBI Bank', 'ASSET', 0, 0),
    ('Cash (Hand)', 'ASSET', 0, 0);

-- Liability accounts (loans)
INSERT INTO accounts (name, type, initial_balance, current_balance) VALUES
    ('Manapuram Gold Loan', 'LIABILITY', 25000, 25000),
    ('Society Bank Gold Loan', 'LIABILITY', 130000, 130000),
    ('AM-Fincorp Local Finance', 'LIABILITY', 20000, 20000),
    ('Vkl-Finance', 'LIABILITY', 180000, 180000),
    ('SBI Education Loan', 'LIABILITY', 180000, 180000);

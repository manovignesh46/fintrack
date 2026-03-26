-- 002_seed.down.sql
DELETE FROM accounts WHERE name IN (
    'HDFC Bank', 'Karnataka Bank', 'SBI Bank', 'Cash (Hand)',
    'Manapuram Gold Loan', 'Society Bank Gold Loan',
    'AM-Fincorp Local Finance', 'Vkl-Finance', 'SBI Education Loan'
);

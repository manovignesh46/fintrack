package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/fintrack/backend/internal/models"
)

type TransactionHandler struct {
	db *pgxpool.Pool
}

func NewTransactionHandler(db *pgxpool.Pool) *TransactionHandler {
	return &TransactionHandler{db: db}
}

func (h *TransactionHandler) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	query := `SELECT id, title, amount, nature, source_account_id,
		target_account_id, sub_category_id, entity, payment_method,
		notes, principal_amount, interest_amount, transaction_date, created_at
		FROM transactions WHERE 1=1`
	var args []interface{}
	argIdx := 1

	if v := q.Get("entity"); v != "" {
		query += fmt.Sprintf(" AND entity = $%d", argIdx)
		args = append(args, v)
		argIdx++
	}
	if v := q.Get("nature"); v != "" {
		query += fmt.Sprintf(" AND nature = $%d", argIdx)
		args = append(args, v)
		argIdx++
	}
	if v := q.Get("account_id"); v != "" {
		query += fmt.Sprintf(" AND (source_account_id = $%d OR target_account_id = $%d)", argIdx, argIdx)
		args = append(args, v)
		argIdx++
	}
	if v := q.Get("date_from"); v != "" {
		query += fmt.Sprintf(" AND transaction_date >= $%d", argIdx)
		args = append(args, v)
		argIdx++
	}
	if v := q.Get("date_to"); v != "" {
		query += fmt.Sprintf(" AND transaction_date <= $%d", argIdx)
		args = append(args, v)
		argIdx++
	}

	query += " ORDER BY transaction_date DESC, created_at DESC"

	// Pagination
	page, _ := strconv.Atoi(q.Get("page"))
	if page < 1 {
		page = 1
	}
	perPage, _ := strconv.Atoi(q.Get("per_page"))
	if perPage < 1 || perPage > 100 {
		perPage = 50
	}
	offset := (page - 1) * perPage
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	args = append(args, perPage, offset)

	rows, err := h.db.Query(r.Context(), query, args...)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch transactions")
		return
	}
	defer rows.Close()

	var transactions []models.Transaction
	for rows.Next() {
		t, err := scanTransaction(rows)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to scan transaction")
			return
		}
		transactions = append(transactions, t)
	}

	if transactions == nil {
		transactions = []models.Transaction{}
	}

	writeJSON(w, http.StatusOK, transactions)
}

func (h *TransactionHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid transaction ID")
		return
	}

	row := h.db.QueryRow(r.Context(),
		`SELECT id, title, amount, nature, source_account_id,
			target_account_id, sub_category_id, entity, payment_method,
			notes, principal_amount, interest_amount, transaction_date, created_at
		 FROM transactions WHERE id = $1`, id)

	t, err := scanTransactionRow(row)
	if err != nil {
		writeError(w, http.StatusNotFound, "Transaction not found")
		return
	}

	writeJSON(w, http.StatusOK, t)
}

func (h *TransactionHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreateTransactionReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := validateTransactionReq(&req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	tx, err := h.db.Begin(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to begin transaction")
		return
	}
	defer tx.Rollback(r.Context())

	// Insert the transaction
	var t models.Transaction
	row := tx.QueryRow(r.Context(),
		`INSERT INTO transactions (title, amount, nature, source_account_id, target_account_id,
			sub_category_id, entity, payment_method, notes, principal_amount, interest_amount, transaction_date)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
		 RETURNING id, title, amount, nature, source_account_id, target_account_id,
			sub_category_id, entity, payment_method, notes, principal_amount, interest_amount,
			transaction_date, created_at`,
		req.Title, req.Amount, req.Nature, req.SourceAccountID, req.TargetAccountID,
		req.SubCategoryID, req.Entity, nilIfEmpty(req.PaymentMethod), nilIfEmpty(req.Notes),
		req.PrincipalAmount, req.InterestAmount, req.TransactionDate,
	)
	t, err = scanTransactionRow(row)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create transaction")
		return
	}

	// Apply balance changes
	if err := applyBalanceChange(r.Context(), tx, req.Nature, req.SourceAccountID, req.TargetAccountID, req.Amount, req.PrincipalAmount); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to update account balances")
		return
	}

	if err := tx.Commit(r.Context()); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to commit transaction")
		return
	}

	writeJSON(w, http.StatusCreated, t)
}

func (h *TransactionHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid transaction ID")
		return
	}

	var req models.UpdateTransactionReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := validateTransactionReq(&req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	tx, err := h.db.Begin(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to begin transaction")
		return
	}
	defer tx.Rollback(r.Context())

	// Get existing transaction to reverse its balance impact
	row := tx.QueryRow(r.Context(),
		`SELECT id, title, amount, nature, source_account_id,
			target_account_id, sub_category_id, entity, payment_method,
			notes, principal_amount, interest_amount, transaction_date, created_at
		 FROM transactions WHERE id = $1 FOR UPDATE`, id)
	old, err := scanTransactionRow(row)
	if err != nil {
		writeError(w, http.StatusNotFound, "Transaction not found")
		return
	}

	// Reverse old balance impact
	if err := reverseBalanceChange(r.Context(), tx, old.Nature, old.SourceAccountID, old.TargetAccountID, old.Amount, old.PrincipalAmount); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to reverse old balance")
		return
	}

	// Update the transaction
	var t models.Transaction
	updateRow := tx.QueryRow(r.Context(),
		`UPDATE transactions SET title=$1, amount=$2, nature=$3, source_account_id=$4,
			target_account_id=$5, sub_category_id=$6, entity=$7, payment_method=$8,
			notes=$9, principal_amount=$10, interest_amount=$11, transaction_date=$12
		 WHERE id=$13
		 RETURNING id, title, amount, nature, source_account_id, target_account_id,
			sub_category_id, entity, payment_method, notes, principal_amount, interest_amount,
			transaction_date, created_at`,
		req.Title, req.Amount, req.Nature, req.SourceAccountID, req.TargetAccountID,
		req.SubCategoryID, req.Entity, nilIfEmpty(req.PaymentMethod), nilIfEmpty(req.Notes),
		req.PrincipalAmount, req.InterestAmount, req.TransactionDate, id,
	)
	t, err = scanTransactionRow(updateRow)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to update transaction")
		return
	}

	// Apply new balance changes
	if err := applyBalanceChange(r.Context(), tx, req.Nature, req.SourceAccountID, req.TargetAccountID, req.Amount, req.PrincipalAmount); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to update account balances")
		return
	}

	if err := tx.Commit(r.Context()); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to commit transaction")
		return
	}

	writeJSON(w, http.StatusOK, t)
}

func (h *TransactionHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid transaction ID")
		return
	}

	tx, err := h.db.Begin(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to begin transaction")
		return
	}
	defer tx.Rollback(r.Context())

	// Get existing transaction to reverse its balance
	row := tx.QueryRow(r.Context(),
		`SELECT id, title, amount, nature, source_account_id,
			target_account_id, sub_category_id, entity, payment_method,
			notes, principal_amount, interest_amount, transaction_date, created_at
		 FROM transactions WHERE id = $1 FOR UPDATE`, id)
	old, err := scanTransactionRow(row)
	if err != nil {
		writeError(w, http.StatusNotFound, "Transaction not found")
		return
	}

	// Reverse balance impact
	if err := reverseBalanceChange(r.Context(), tx, old.Nature, old.SourceAccountID, old.TargetAccountID, old.Amount, old.PrincipalAmount); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to reverse balance")
		return
	}

	// Delete the transaction
	_, err = tx.Exec(r.Context(), "DELETE FROM transactions WHERE id = $1", id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to delete transaction")
		return
	}

	if err := tx.Commit(r.Context()); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to commit")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// --- Balance Logic ---

func applyBalanceChange(ctx context.Context, tx pgx.Tx, nature models.TxNature, sourceID int, targetID *int, amount, principalAmount float64) error {
	switch nature {
	case models.NatureIncome:
		_, err := tx.Exec(ctx, "UPDATE accounts SET current_balance = current_balance + $1 WHERE id = $2", amount, sourceID)
		return err
	case models.NatureExpense:
		_, err := tx.Exec(ctx, "UPDATE accounts SET current_balance = current_balance - $1 WHERE id = $2", amount, sourceID)
		return err
	case models.NatureTransfer:
		if targetID == nil {
			return fmt.Errorf("target account required for transfer")
		}
		if _, err := tx.Exec(ctx, "UPDATE accounts SET current_balance = current_balance - $1 WHERE id = $2", amount, sourceID); err != nil {
			return err
		}
		_, err := tx.Exec(ctx, "UPDATE accounts SET current_balance = current_balance + $1 WHERE id = $2", amount, *targetID)
		return err
	case models.NatureEMIPayment:
		if targetID == nil {
			return fmt.Errorf("target loan account required for EMI payment")
		}
		// Source (bank) decreases by total amount (principal + interest)
		if _, err := tx.Exec(ctx, "UPDATE accounts SET current_balance = current_balance - $1 WHERE id = $2", amount, sourceID); err != nil {
			return err
		}
		// Target (loan) balance decreases by principal_amount only (interest is just a cost)
		// Subtract principal from loan balance to reduce the amount owed
		if principalAmount > 0 {
			_, err := tx.Exec(ctx, "UPDATE accounts SET current_balance = current_balance - $1 WHERE id = $2", principalAmount, *targetID)
			return err
		}
		return nil
	}
	return fmt.Errorf("unknown nature: %s", nature)
}

func reverseBalanceChange(ctx context.Context, tx pgx.Tx, nature models.TxNature, sourceID int, targetID *int, amount, principalAmount float64) error {
	switch nature {
	case models.NatureIncome:
		_, err := tx.Exec(ctx, "UPDATE accounts SET current_balance = current_balance - $1 WHERE id = $2", amount, sourceID)
		return err
	case models.NatureExpense:
		_, err := tx.Exec(ctx, "UPDATE accounts SET current_balance = current_balance + $1 WHERE id = $2", amount, sourceID)
		return err
	case models.NatureTransfer:
		if targetID == nil {
			return nil
		}
		if _, err := tx.Exec(ctx, "UPDATE accounts SET current_balance = current_balance + $1 WHERE id = $2", amount, sourceID); err != nil {
			return err
		}
		_, err := tx.Exec(ctx, "UPDATE accounts SET current_balance = current_balance - $1 WHERE id = $2", amount, *targetID)
		return err
	case models.NatureEMIPayment:
		if _, err := tx.Exec(ctx, "UPDATE accounts SET current_balance = current_balance + $1 WHERE id = $2", amount, sourceID); err != nil {
			return err
		}
		if targetID != nil && principalAmount > 0 {
			_, err := tx.Exec(ctx, "UPDATE accounts SET current_balance = current_balance + $1 WHERE id = $2", principalAmount, *targetID)
			return err
		}
		return nil
	}
	return nil
}

// --- Helpers ---

func validateTransactionReq(req *models.CreateTransactionReq) error {
	if strings.TrimSpace(req.Title) == "" {
		return fmt.Errorf("title is required")
	}
	if req.Amount <= 0 {
		return fmt.Errorf("amount must be positive")
	}
	if req.SourceAccountID <= 0 {
		return fmt.Errorf("source_account_id is required")
	}
	if req.TransactionDate == "" {
		return fmt.Errorf("transaction_date is required")
	}

	switch req.Nature {
	case models.NatureIncome, models.NatureExpense:
		// OK, no target needed
	case models.NatureTransfer, models.NatureEMIPayment:
		if req.TargetAccountID == nil || *req.TargetAccountID <= 0 {
			return fmt.Errorf("target_account_id is required for %s", req.Nature)
		}
	default:
		return fmt.Errorf("nature must be INCOME, EXPENSE, TRANSFER, or EMI_PAYMENT")
	}

	if req.Nature == models.NatureEMIPayment {
		if req.PrincipalAmount < 0 || req.InterestAmount < 0 {
			return fmt.Errorf("principal and interest amounts cannot be negative")
		}
		if req.PrincipalAmount+req.InterestAmount != req.Amount {
			return fmt.Errorf("principal + interest must equal total amount")
		}
	}

	switch req.Entity {
	case models.EntityPersonal, models.EntityHome, models.EntityLoan:
	default:
		return fmt.Errorf("entity must be PERSONAL, HOME, or LOAN")
	}

	return nil
}

func scanTransaction(rows pgx.Rows) (models.Transaction, error) {
	var t models.Transaction
	var paymentMethod, notes *string
	var txDate time.Time
	err := rows.Scan(&t.ID, &t.Title, &t.Amount, &t.Nature, &t.SourceAccountID,
		&t.TargetAccountID, &t.SubCategoryID, &t.Entity, &paymentMethod,
		&notes, &t.PrincipalAmount, &t.InterestAmount, &txDate, &t.CreatedAt)
	if paymentMethod != nil {
		t.PaymentMethod = *paymentMethod
	}
	if notes != nil {
		t.Notes = *notes
	}
	t.TransactionDate = txDate.Format("2006-01-02")
	return t, err
}

func scanTransactionRow(row pgx.Row) (models.Transaction, error) {
	var t models.Transaction
	var paymentMethod, notes *string
	var txDate time.Time
	err := row.Scan(&t.ID, &t.Title, &t.Amount, &t.Nature, &t.SourceAccountID,
		&t.TargetAccountID, &t.SubCategoryID, &t.Entity, &paymentMethod,
		&notes, &t.PrincipalAmount, &t.InterestAmount, &txDate, &t.CreatedAt)
	if paymentMethod != nil {
		t.PaymentMethod = *paymentMethod
	}
	if notes != nil {
		t.Notes = *notes
	}
	t.TransactionDate = txDate.Format("2006-01-02")
	return t, err
}

func nilIfEmpty(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

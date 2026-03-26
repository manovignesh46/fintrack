package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/fintrack/backend/internal/models"
)

type TallyHandler struct {
	db *pgxpool.Pool
}

func NewTallyHandler(db *pgxpool.Pool) *TallyHandler {
	return &TallyHandler{db: db}
}

// GetTally returns the calculated balance for an account
func (h *TallyHandler) GetTally(w http.ResponseWriter, r *http.Request) {
	userID, err := GetUserID(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid account ID")
		return
	}

	var name string
	var balance float64
	err = h.db.QueryRow(r.Context(),
		"SELECT name, current_balance FROM accounts WHERE id = $1 AND user_id = $2", id, userID).Scan(&name, &balance)
	if err != nil {
		writeError(w, http.StatusNotFound, "Account not found")
		return
	}

	writeJSON(w, http.StatusOK, models.TallyResponse{
		AccountID:         id,
		AccountName:       name,
		CalculatedBalance: balance,
	})
}

// CheckTally compares actual vs calculated balance
func (h *TallyHandler) CheckTally(w http.ResponseWriter, r *http.Request) {
	userID, err := GetUserID(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid account ID")
		return
	}

	var req models.TallyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	var name string
	var balance float64
	err = h.db.QueryRow(r.Context(),
		"SELECT name, current_balance FROM accounts WHERE id = $1 AND user_id = $2", id, userID).Scan(&name, &balance)
	if err != nil {
		writeError(w, http.StatusNotFound, "Account not found")
		return
	}

	diff := req.ActualBalance - balance

	writeJSON(w, http.StatusOK, models.TallyResponse{
		AccountID:         id,
		AccountName:       name,
		CalculatedBalance: balance,
		ActualBalance:     req.ActualBalance,
		Difference:        diff,
	})
}

// Summary returns monthly totals grouped by entity
func (h *TallyHandler) Summary(w http.ResponseWriter, r *http.Request) {
	userID, err := GetUserID(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	month := r.URL.Query().Get("month") // Format: 2026-03
	if month == "" {
		writeError(w, http.StatusBadRequest, "month query parameter is required (format: YYYY-MM)")
		return
	}

	dateFrom := month + "-01"
	dateTo := month + "-31"

	rows, err := h.db.Query(r.Context(), `
		SELECT entity,
			COALESCE(SUM(CASE WHEN nature = 'INCOME' THEN amount ELSE 0 END), 0) as total_income,
			COALESCE(SUM(CASE WHEN nature = 'EXPENSE' THEN amount ELSE 0 END), 0) as total_expense,
			COALESCE(SUM(CASE WHEN nature = 'EMI_PAYMENT' THEN amount ELSE 0 END), 0) as total_emi
		FROM transactions
		WHERE user_id = $1 AND transaction_date >= $2 AND transaction_date <= $3
		GROUP BY entity
		ORDER BY entity`,
		userID, dateFrom, dateTo)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch summary")
		return
	}
	defer rows.Close()

	var entities []models.EntitySummary
	for rows.Next() {
		var e models.EntitySummary
		if err := rows.Scan(&e.Entity, &e.TotalIncome, &e.TotalExpense, &e.TotalEMI); err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to scan summary")
			return
		}
		e.NetFlow = e.TotalIncome - e.TotalExpense - e.TotalEMI
		entities = append(entities, e)
	}

	if entities == nil {
		entities = []models.EntitySummary{}
	}

	writeJSON(w, http.StatusOK, models.SummaryResponse{
		Month:    month,
		Entities: entities,
	})
}

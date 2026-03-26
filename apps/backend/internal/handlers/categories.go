package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/fintrack/backend/internal/models"
)

type CategoryHandler struct {
	db *pgxpool.Pool
}

func NewCategoryHandler(db *pgxpool.Pool) *CategoryHandler {
	return &CategoryHandler{db: db}
}

func (h *CategoryHandler) List(w http.ResponseWriter, r *http.Request) {
	entity := r.URL.Query().Get("entity")

	categories := make([]models.Category, 0)

	query := `SELECT id, name, entity, created_at FROM categories`
	var args []interface{}
	if entity != "" {
		query += ` WHERE entity = $1`
		args = append(args, entity)
	}
	query += ` ORDER BY name`

	rows, err := h.db.Query(r.Context(), query, args...)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch categories")
		return
	}
	defer rows.Close()

	for rows.Next() {
		var c models.Category
		if err := rows.Scan(&c.ID, &c.Name, &c.Entity, &c.CreatedAt); err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to scan category")
			return
		}
		categories = append(categories, c)
	}

	// Fetch subcategories for each category
	for i := range categories {
		subRows, err := h.db.Query(r.Context(),
			`SELECT id, category_id, name, created_at FROM sub_categories WHERE category_id = $1 ORDER BY name`,
			categories[i].ID)
		if err != nil {
			continue
		}
		for subRows.Next() {
			var sc models.SubCategory
			if err := subRows.Scan(&sc.ID, &sc.CategoryID, &sc.Name, &sc.CreatedAt); err != nil {
				continue
			}
			categories[i].SubCategories = append(categories[i].SubCategories, sc)
		}
		subRows.Close()
	}

	writeJSON(w, http.StatusOK, categories)
}

func (h *CategoryHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreateCategoryReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Name == "" {
		writeError(w, http.StatusBadRequest, "Name is required")
		return
	}
	if req.Entity != models.EntityPersonal && req.Entity != models.EntityHome && req.Entity != models.EntityLoan {
		writeError(w, http.StatusBadRequest, "Entity must be PERSONAL, HOME, or LOAN")
		return
	}

	var c models.Category
	err := h.db.QueryRow(r.Context(),
		`INSERT INTO categories (name, entity) VALUES ($1, $2)
		 RETURNING id, name, entity, created_at`,
		req.Name, req.Entity).Scan(&c.ID, &c.Name, &c.Entity, &c.CreatedAt)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create category")
		return
	}

	writeJSON(w, http.StatusCreated, c)
}

func (h *CategoryHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid category ID")
		return
	}

	var req models.UpdateCategoryReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Name == "" {
		writeError(w, http.StatusBadRequest, "Name is required")
		return
	}

	tag, err := h.db.Exec(r.Context(), "UPDATE categories SET name = $1 WHERE id = $2", req.Name, id)
	if err != nil || tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "Category not found")
		return
	}

	var c models.Category
	h.db.QueryRow(r.Context(),
		`SELECT id, name, entity, created_at FROM categories WHERE id = $1`, id).Scan(
		&c.ID, &c.Name, &c.Entity, &c.CreatedAt)

	writeJSON(w, http.StatusOK, c)
}

func (h *CategoryHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid category ID")
		return
	}

	tag, err := h.db.Exec(r.Context(), "DELETE FROM categories WHERE id = $1", id)
	if err != nil || tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "Category not found")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// --- Sub-category handlers ---

func (h *CategoryHandler) CreateSubCategory(w http.ResponseWriter, r *http.Request) {
	categoryID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid category ID")
		return
	}

	var req models.CreateSubCategoryReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Name == "" {
		writeError(w, http.StatusBadRequest, "Name is required")
		return
	}

	var sc models.SubCategory
	err = h.db.QueryRow(r.Context(),
		`INSERT INTO sub_categories (category_id, name) VALUES ($1, $2)
		 RETURNING id, category_id, name, created_at`,
		categoryID, req.Name).Scan(&sc.ID, &sc.CategoryID, &sc.Name, &sc.CreatedAt)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create sub-category")
		return
	}

	writeJSON(w, http.StatusCreated, sc)
}

func (h *CategoryHandler) UpdateSubCategory(w http.ResponseWriter, r *http.Request) {
	subID, err := strconv.Atoi(chi.URLParam(r, "subId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid sub-category ID")
		return
	}

	var req models.UpdateSubCategoryReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Name == "" {
		writeError(w, http.StatusBadRequest, "Name is required")
		return
	}

	tag, err := h.db.Exec(r.Context(), "UPDATE sub_categories SET name = $1 WHERE id = $2", req.Name, subID)
	if err != nil || tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "Sub-category not found")
		return
	}

	var sc models.SubCategory
	h.db.QueryRow(r.Context(),
		`SELECT id, category_id, name, created_at FROM sub_categories WHERE id = $1`, subID).Scan(
		&sc.ID, &sc.CategoryID, &sc.Name, &sc.CreatedAt)

	writeJSON(w, http.StatusOK, sc)
}

func (h *CategoryHandler) DeleteSubCategory(w http.ResponseWriter, r *http.Request) {
	subID, err := strconv.Atoi(chi.URLParam(r, "subId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid sub-category ID")
		return
	}

	tag, err := h.db.Exec(r.Context(), "DELETE FROM sub_categories WHERE id = $1", subID)
	if err != nil || tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "Sub-category not found")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"runtime"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/fintrack/backend/internal/db"
	"github.com/fintrack/backend/internal/handlers"
)

func main() {
	ctx := context.Background()

	// Connect to database
	pool, err := db.Connect(ctx)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	// Run migrations
	migrationsDir := getMigrationsDir()
	if err := db.RunMigrations(ctx, pool, migrationsDir); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Create handlers
	accountH := handlers.NewAccountHandler(pool)
	categoryH := handlers.NewCategoryHandler(pool)
	transactionH := handlers.NewTransactionHandler(pool)
	templateH := handlers.NewTemplateHandler(pool)
	tallyH := handlers.NewTallyHandler(pool)

	// Setup router
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	// API routes
	r.Route("/api", func(r chi.Router) {
		// Accounts
		r.Route("/accounts", func(r chi.Router) {
			r.Get("/", accountH.List)
			r.Post("/", accountH.Create)
			r.Get("/{id}", accountH.Get)
			r.Put("/{id}", accountH.Update)
		})

		// Categories & Sub-categories
		r.Route("/categories", func(r chi.Router) {
			r.Get("/", categoryH.List)
			r.Post("/", categoryH.Create)
			r.Put("/{id}", categoryH.Update)
			r.Delete("/{id}", categoryH.Delete)
			r.Post("/{id}/subcategories", categoryH.CreateSubCategory)
			r.Put("/{id}/subcategories/{subId}", categoryH.UpdateSubCategory)
			r.Delete("/{id}/subcategories/{subId}", categoryH.DeleteSubCategory)
		})

		// Transactions
		r.Route("/transactions", func(r chi.Router) {
			r.Get("/", transactionH.List)
			r.Post("/", transactionH.Create)
			r.Get("/{id}", transactionH.Get)
			r.Put("/{id}", transactionH.Update)
			r.Delete("/{id}", transactionH.Delete)
		})

		// Templates
		r.Route("/templates", func(r chi.Router) {
			r.Get("/", templateH.List)
			r.Post("/", templateH.Create)
			r.Delete("/{id}", templateH.Delete)
			r.Post("/{id}/execute", templateH.Execute)
		})

		// Tally & Summary
		r.Get("/tally/{id}", tallyH.GetTally)
		r.Post("/tally/{id}", tallyH.CheckTally)
		r.Get("/summary", tallyH.Summary)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("FinTrack API server starting on :%s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

func getMigrationsDir() string {
	// Get directory relative to this source file
	_, filename, _, ok := runtime.Caller(0)
	if ok {
		return filepath.Join(filepath.Dir(filename), "..", "..", "internal", "db", "migrations")
	}
	return "internal/db/migrations"
}

.DEFAULT_GOAL := help

COMPOSE := docker compose -p neststay

.PHONY: help up down migrate seed mrs

help: ## List available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-10s\033[0m %s\n", $$1, $$2}'

up: ## Start docker containers, then run the application
	$(COMPOSE) up -d --wait
	npm run start:dev

down: ## Stop the application, then the docker containers
	$(COMPOSE) down

migrate: ## Run database migrations
	npm run prisma:migrate

seed: ## Seed the database
	npm run prisma:seed

mrs: ## Drop, migrate and seed the database
	npx prisma migrate reset --force

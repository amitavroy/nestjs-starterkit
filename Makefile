.DEFAULT_GOAL := help

COMPOSE := docker compose -p nestjs-sk

.PHONY: help init up down migrate seed mrs

help: ## List available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-10s\033[0m %s\n", $$1, $$2}'

init: ## Rename the starter kit for a new project (usage: make init NAME=timer)
	@if [ -z "$(NAME)" ]; then echo "Usage: make init NAME=<project-name>"; exit 1; fi
	@bash scripts/init-project.sh $(NAME)

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

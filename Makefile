.PHONY: help install test test-unit test-coverage lint format run-api clean test-samples

help:
	@echo "Bhrigu-Nadi Astrology System - Makefile Commands"
	@echo ""
	@echo "  make install       - Install dependencies"
	@echo "  make test          - Run all tests"
	@echo "  make test-unit     - Run unit tests only"
	@echo "  make test-coverage - Run tests with coverage report"
	@echo "  make test-samples  - Run sample CLI commands and verify outputs"
	@echo "  make lint          - Run linters (flake8)"
	@echo "  make format        - Format code with black"
	@echo "  make run-api       - Start FastAPI server"
	@echo "  make clean         - Clean generated files"
	@echo ""

install:
	@echo "Installing dependencies..."
	pip install -r requirements.txt
	@echo "Dependencies installed successfully"

test:
	@echo "Running all tests..."
	pytest tests/ -v

test-unit:
	@echo "Running unit tests..."
	pytest tests/unit/ -v

test-coverage:
	@echo "Running tests with coverage..."
	pytest tests/ -v --cov=app --cov-report=html --cov-report=term

test-samples:
	@echo "Running sample CLI commands..."
	@mkdir -p tests/golden/generated
	@echo "1. Generating chart for person1..."
	python -m app.cli chart --input tests/fixtures/person1.json --output tests/golden/generated/chart_person1.json
	@echo "2. Generating horoscope for person1..."
	python -m app.cli horoscope --input tests/fixtures/person1.json --output tests/golden/generated/horoscope_person1.json
	@echo "3. Generating matchmaking for person1 and person2..."
	python -m app.cli matchmaking --partner-a tests/fixtures/person1.json --partner-b tests/fixtures/person2.json --output tests/golden/generated/matchmaking_p1_p2.json
	@echo "4. Generating daily insights for person1..."
	python -m app.cli daily-insights --input tests/fixtures/person1.json --output tests/golden/generated/daily_person1.json
	@echo "5. Generating chart for person3..."
	python -m app.cli chart --input tests/fixtures/person3.json --output tests/golden/generated/chart_person3.json
	@echo ""
	@echo "All samples generated successfully in tests/golden/generated/"

lint:
	@echo "Running linters..."
	flake8 app/ --max-line-length=120 --exclude=__pycache__,*.pyc

format:
	@echo "Formatting code with black..."
	black app/ tests/ --line-length=120

run-api:
	@echo "Starting FastAPI server..."
	uvicorn app.api.main:app --reload --host 0.0.0.0 --port 8000

clean:
	@echo "Cleaning generated files..."
	rm -rf __pycache__
	rm -rf .pytest_cache
	rm -rf .coverage
	rm -rf htmlcov
	rm -rf tests/golden/generated/*
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	@echo "Cleanup complete"

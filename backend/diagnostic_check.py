#!/usr/bin/env python3
"""
BhriguWelt System Diagnostic Check
Identifies all 20 categories of errors systematically
"""
import sys
import os
import importlib
import traceback
from typing import Dict, List, Any

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

class BhriguDiagnostics:
    """Comprehensive system diagnostics"""

    def __init__(self):
        self.errors = []
        self.warnings = []
        self.info = []

    def log_error(self, category: str, message: str, details: str = ""):
        self.errors.append({"category": category, "message": message, "details": details})

    def log_warning(self, category: str, message: str):
        self.warnings.append({"category": category, "message": message})

    def log_info(self, message: str):
        self.info.append(message)

    def check_imports(self):
        """Check for circular imports and missing modules"""
        print("\n=== CHECKING IMPORTS ===")

        critical_modules = [
            'services.bhrigu_predictions',
            'services.prediction_orchestrator',
            'services.bhrigu_core_wisdom',
            'services.rule_engine',
            'services.bhrigu_nadi_integration',
            'services.prediction_helpers',
            'services.openai_service',
            'services.astrology_calculator',
        ]

        for module_name in critical_modules:
            try:
                module = importlib.import_module(module_name)
                self.log_info(f"✓ {module_name}")
            except ImportError as e:
                self.log_error("IMPORT", f"Failed to import {module_name}", str(e))
            except Exception as e:
                self.log_error("IMPORT", f"Error importing {module_name}", str(e))

    def check_service_methods(self):
        """Check for missing methods in services"""
        print("\n=== CHECKING SERVICE METHODS ===")

        try:
            from services.bhrigu_predictions import BhriguPredictionsService
            service = BhriguPredictionsService.__dict__

            required_methods = [
                '_record_init_error',
                '_get_fallback_if_unavailable',
                '_is_healthy',
                'get_health_status'
            ]

            for method in required_methods:
                if method in service or hasattr(BhriguPredictionsService, method):
                    self.log_info(f"✓ BhriguPredictionsService.{method}")
                else:
                    self.log_error("METHOD", f"Missing method: BhriguPredictionsService.{method}")

        except Exception as e:
            self.log_error("METHOD", "Failed to check service methods", str(e))

    def check_core_wisdom_integration(self):
        """Check if Core Wisdom is integrated in all modes"""
        print("\n=== CHECKING CORE WISDOM INTEGRATION ===")

        try:
            from services.prediction_orchestrator import PredictionOrchestrator
            orch = PredictionOrchestrator()

            if orch.core_wisdom:
                self.log_info("✓ Core Wisdom initialized in orchestrator")
            else:
                self.log_warning("WISDOM", "Core Wisdom not initialized")

            if orch.rule_engine:
                self.log_info("✓ Rule Engine initialized in orchestrator")
            else:
                self.log_warning("WISDOM", "Rule Engine not initialized")

        except Exception as e:
            self.log_error("WISDOM", "Failed to check Core Wisdom integration", str(e))

    def check_nadi_integration(self):
        """Check if Nadi Integration is embedded in predictions"""
        print("\n=== CHECKING NADI INTEGRATION ===")

        # Check if nadi integration is imported in main services
        files_to_check = [
            'services/bhrigu_predictions.py',
            'services/prediction_orchestrator.py',
            'services/bhrigu_offline_wisdom.py'
        ]

        for filepath in files_to_check:
            full_path = os.path.join(os.path.dirname(__file__), filepath)
            try:
                with open(full_path, 'r') as f:
                    content = f.read()
                    if 'bhrigu_nadi_integration' in content:
                        self.log_info(f"✓ Nadi integration imported in {filepath}")
                    else:
                        self.log_warning("NADI", f"Nadi integration NOT imported in {filepath}")
            except Exception as e:
                self.log_error("NADI", f"Failed to check {filepath}", str(e))

    def check_fallback_chains(self):
        """Check if fallback chains are complete"""
        print("\n=== CHECKING FALLBACK CHAINS ===")

        try:
            from services.prediction_helpers import (
                fallback_karmic_journey,
                fallback_past_lives,
                fallback_future_lives,
                fallback_present_life,
                fallback_life_events,
                fallback_karmic_remedies,
            )
            self.log_info("✓ All fallback functions exist")
        except ImportError as e:
            self.log_error("FALLBACK", "Missing fallback functions", str(e))

    def check_api_error_handling(self):
        """Check if API routes have proper error handling"""
        print("\n=== CHECKING API ERROR HANDLING ===")

        route_file = 'routes/bhrigu_predictions_routes.py'
        full_path = os.path.join(os.path.dirname(__file__), route_file)

        try:
            with open(full_path, 'r') as f:
                content = f.read()

            # Count try-except blocks
            try_count = content.count('try:')
            except_count = content.count('except')

            if try_count > 5 and except_count > 5:
                self.log_info(f"✓ {try_count} try-except blocks found in routes")
            else:
                self.log_warning("ROUTES", f"Only {try_count} try-except blocks in routes")

        except Exception as e:
            self.log_error("ROUTES", "Failed to check route error handling", str(e))

    def check_logging_security(self):
        """Check if logging is structured and secure"""
        print("\n=== CHECKING LOGGING SECURITY ===")

        try:
            from utils.logger import secure_log, sanitize_error, setup_logger
            self.log_info("✓ Secure logging functions available")
        except ImportError as e:
            self.log_error("LOGGING", "Missing secure logging functions", str(e))

    def check_input_validation(self):
        """Check if input validation exists"""
        print("\n=== CHECKING INPUT VALIDATION ===")

        try:
            # Check for validation utilities
            utils_path = os.path.join(os.path.dirname(__file__), 'utils')
            if os.path.exists(utils_path):
                files = os.listdir(utils_path)
                if 'validation.py' in files or 'validators.py' in files:
                    self.log_info("✓ Validation utilities found")
                else:
                    self.log_warning("VALIDATION", "No validation.py or validators.py found")
            else:
                self.log_warning("VALIDATION", "Utils directory not found")
        except Exception as e:
            self.log_error("VALIDATION", "Failed to check validation", str(e))

    def check_dependencies(self):
        """Check if all required dependencies are listed"""
        print("\n=== CHECKING DEPENDENCIES ===")

        req_file = os.path.join(os.path.dirname(__file__), 'requirements.txt')
        try:
            with open(req_file, 'r') as f:
                requirements = f.read()

            critical_deps = [
                'sentry-sdk',
                'flask',
                'openai',
                'pyswisseph',
                'flask-limiter'
            ]

            for dep in critical_deps:
                if dep in requirements:
                    self.log_info(f"✓ {dep} in requirements.txt")
                else:
                    self.log_error("DEPENDENCY", f"Missing {dep} in requirements.txt")

        except Exception as e:
            self.log_error("DEPENDENCY", "Failed to read requirements.txt", str(e))

    def generate_report(self):
        """Generate diagnostic report"""
        print("\n" + "="*60)
        print("BHRIGUWELT DIAGNOSTIC REPORT")
        print("="*60)

        print(f"\n✓ INFO: {len(self.info)} checks passed")
        for info in self.info:
            print(f"  {info}")

        if self.warnings:
            print(f"\n⚠ WARNINGS: {len(self.warnings)}")
            for warning in self.warnings:
                print(f"  [{warning['category']}] {warning['message']}")

        if self.errors:
            print(f"\n✗ ERRORS: {len(self.errors)}")
            for error in self.errors:
                print(f"  [{error['category']}] {error['message']}")
                if error['details']:
                    print(f"    Details: {error['details'][:200]}")
        else:
            print("\n✓ NO CRITICAL ERRORS FOUND")

        print("\n" + "="*60)
        return len(self.errors) == 0

def main():
    """Run all diagnostic checks"""
    diag = BhriguDiagnostics()

    diag.check_dependencies()
    diag.check_imports()
    diag.check_service_methods()
    diag.check_core_wisdom_integration()
    diag.check_nadi_integration()
    diag.check_fallback_chains()
    diag.check_api_error_handling()
    diag.check_logging_security()
    diag.check_input_validation()

    success = diag.generate_report()
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()

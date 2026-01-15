#!/usr/bin/env python3
"""
Test import script for quality_validator component.

Run this script to verify the component was deployed correctly:
    python tools/validation/test_import.py
"""

import sys


def test_imports():
    """Test that all exports can be imported successfully."""
    print("Testing quality_validator imports...")

    try:
        from quality_validator import (
            QualityValidator,
            QualityClaim,
            QualityValidationResult,
            ValidationResult,
            Violation,
            AnalysisResult,
            EvidenceQuality,
            RiskLevel,
            Severity,
        )
        print("  [OK] All classes imported successfully")
    except ImportError as e:
        print(f"  [FAIL] Import error: {e}")
        return False

    # Test basic instantiation
    try:
        validator = QualityValidator()
        print("  [OK] QualityValidator instantiated")
    except Exception as e:
        print(f"  [FAIL] Instantiation error: {e}")
        return False

    # Test adding a violation
    try:
        violation = validator.add_violation(
            rule_id="TEST-001",
            message="Test violation",
            file="test.py",
            line=10,
            severity="medium",
        )
        print("  [OK] Violation added successfully")
    except Exception as e:
        print(f"  [FAIL] add_violation error: {e}")
        return False

    # Test analysis
    try:
        result = validator.analyze()
        assert result.overall_score == 98.0  # 100 - 2 (medium penalty)
        assert len(result.violations) == 1
        print("  [OK] Analysis completed successfully")
    except Exception as e:
        print(f"  [FAIL] analyze error: {e}")
        return False

    # Test quality gate
    try:
        passed = validator.check_gate(fail_on="high")
        assert passed is True  # Should pass with only 1 medium violation
        print("  [OK] Quality gate check passed")
    except Exception as e:
        print(f"  [FAIL] check_gate error: {e}")
        return False

    # Test enum values
    try:
        assert EvidenceQuality.EXCELLENT.value == "excellent"
        assert RiskLevel.HIGH.value == "high"
        assert Severity.CRITICAL.value == "critical"
        print("  [OK] Enum values verified")
    except Exception as e:
        print(f"  [FAIL] Enum error: {e}")
        return False

    print("\nAll tests passed! quality_validator is ready to use.")
    return True


if __name__ == "__main__":
    success = test_imports()
    sys.exit(0 if success else 1)

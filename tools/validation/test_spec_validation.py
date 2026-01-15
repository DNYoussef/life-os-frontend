#!/usr/bin/env python3
"""
Test import script for spec_validation component.

Run this script to verify the component was deployed correctly:
    python tools/validation/test_spec_validation.py
"""

import sys
import tempfile
import json
from pathlib import Path


def test_imports():
    """Test that all exports can be imported successfully."""
    print("Testing spec_validation imports...")

    try:
        from spec_validation import (
            SpecValidator,
            SpecValidationResult,
            ValidationSchema,
            BaseValidator,
            PrereqsValidator,
            JSONFileValidator,
            ContextValidator,
            MarkdownDocumentValidator,
            SpecDocumentValidator,
            ImplementationPlanValidator,
            validate_spec_directory,
            create_validator_from_config,
            DEFAULT_CONTEXT_SCHEMA,
            DEFAULT_IMPLEMENTATION_PLAN_SCHEMA,
            DEFAULT_SPEC_REQUIRED_SECTIONS,
            DEFAULT_SPEC_RECOMMENDED_SECTIONS,
        )
        print("  [OK] All classes imported successfully")
    except ImportError as e:
        print(f"  [FAIL] Import error: {e}")
        return False

    # Test SpecValidationResult instantiation
    try:
        result = SpecValidationResult(
            valid=True,
            checkpoint="test",
            errors=[],
            warnings=["Test warning"],
        )
        assert result.valid is True
        assert result.checkpoint == "test"
        assert len(result.warnings) == 1
        print("  [OK] SpecValidationResult instantiated")
    except Exception as e:
        print(f"  [FAIL] SpecValidationResult error: {e}")
        return False

    # Test ValidationSchema validation
    try:
        schema = ValidationSchema(
            required_fields=["name", "version"],
            optional_fields=["description"],
            allowed_values={"status": ["active", "inactive"]},
        )

        # Valid data
        errors, warnings = schema.validate_data({"name": "test", "version": "1.0"})
        assert len(errors) == 0

        # Missing required field
        errors, warnings = schema.validate_data({"name": "test"})
        assert len(errors) == 1
        assert "version" in errors[0]

        print("  [OK] ValidationSchema validation works")
    except Exception as e:
        print(f"  [FAIL] ValidationSchema error: {e}")
        return False

    # Test SpecValidator with temp directory
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            tmppath = Path(tmpdir)

            # Create minimal context.json
            context_file = tmppath / "context.json"
            context_file.write_text(json.dumps({
                "task_description": "Test task"
            }))

            # Create minimal spec.md with required sections
            spec_file = tmppath / "spec.md"
            spec_file.write_text("""# Test Spec

## Overview
This is a test spec.

## Workflow Type
Feature development.

## Task Scope
Testing the spec validator.

## Success Criteria
All tests pass.

## Files to Modify
- test.py

## Requirements
- Must work correctly.
""")

            # Create minimal implementation_plan.json
            plan_file = tmppath / "implementation_plan.json"
            plan_file.write_text(json.dumps({
                "feature": "Test Feature",
                "workflow_type": "feature",
                "phases": [
                    {
                        "id": "phase-1",
                        "name": "Setup",
                        "subtasks": [
                            {
                                "id": "task-1",
                                "description": "Test task",
                                "status": "pending"
                            }
                        ]
                    }
                ]
            }))

            validator = SpecValidator(tmppath)

            # Test individual validations
            prereqs_result = validator.validate_prereqs()
            assert prereqs_result.valid is True
            print("  [OK] Prerequisites validation passed")

            context_result = validator.validate_context()
            assert context_result.valid is True
            print("  [OK] Context validation passed")

            spec_result = validator.validate_spec_document()
            assert spec_result.valid is True
            print("  [OK] Spec document validation passed")

            plan_result = validator.validate_implementation_plan()
            assert plan_result.valid is True
            print("  [OK] Implementation plan validation passed")

            # Test validate_all
            all_results = validator.validate_all()
            assert all(r.valid for r in all_results)
            print("  [OK] validate_all passed")

            # Test is_valid
            assert validator.is_valid() is True
            print("  [OK] is_valid check passed")

            # Test get_summary
            summary = validator.get_summary()
            assert summary["all_valid"] is True
            assert summary["total_errors"] == 0
            print("  [OK] get_summary works")

    except Exception as e:
        print(f"  [FAIL] SpecValidator error: {e}")
        import traceback
        traceback.print_exc()
        return False

    # Test default schemas exist
    try:
        assert len(DEFAULT_SPEC_REQUIRED_SECTIONS) > 0
        assert len(DEFAULT_SPEC_RECOMMENDED_SECTIONS) > 0
        assert DEFAULT_CONTEXT_SCHEMA is not None
        assert DEFAULT_IMPLEMENTATION_PLAN_SCHEMA is not None
        print("  [OK] Default schemas verified")
    except Exception as e:
        print(f"  [FAIL] Default schema error: {e}")
        return False

    # Test validate_spec_directory convenience function
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            tmppath = Path(tmpdir)

            # Create minimal files
            (tmppath / "context.json").write_text(json.dumps({"task_description": "Test"}))
            (tmppath / "spec.md").write_text("# Spec\n## Overview\nTest\n## Workflow Type\nTest\n## Task Scope\nTest\n## Success Criteria\nTest" + "\n" * 100)
            (tmppath / "implementation_plan.json").write_text(json.dumps({
                "feature": "Test",
                "workflow_type": "feature",
                "phases": [{"id": "1", "name": "Test", "subtasks": [{"id": "1", "description": "Test", "status": "pending"}]}]
            }))

            summary = validate_spec_directory(tmppath)
            assert "all_valid" in summary
            print("  [OK] validate_spec_directory function works")
    except Exception as e:
        print(f"  [FAIL] validate_spec_directory error: {e}")
        return False

    print("\nAll tests passed! spec_validation is ready to use.")
    return True


if __name__ == "__main__":
    success = test_imports()
    sys.exit(0 if success else 1)

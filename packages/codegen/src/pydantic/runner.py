"""
Sandboxed Pydantic → JSON Schema converter.

Receives Pydantic code on stdin, executes it in a restricted environment,
finds all BaseModel subclasses, calls model_json_schema() on the last one,
and returns JSON Schema on stdout.

Usage:
  echo "class Foo(BaseModel): name: str" | python runner.py
"""

import sys
import json

# Allowlisted modules for the restricted environment
ALLOWED_MODULES = frozenset([
    "pydantic",
    "typing",
    "typing_extensions",
    "datetime",
    "enum",
    "decimal",
    "uuid",
    "annotated_types",
    "collections.abc",
])

def safe_import(name, *args, **kwargs):
    """Only allow importing from the allowlist."""
    top_level = name.split(".")[0]
    if top_level not in ALLOWED_MODULES and name not in ALLOWED_MODULES:
        raise ImportError(f"Import of '{name}' is not allowed. Only pydantic, typing, and standard lib types are permitted.")
    return original_import(name, *args, **kwargs)

original_import = __builtins__.__import__
__builtins__.__import__ = safe_import

def main():
    code = sys.stdin.read()
    if not code.strip():
        print(json.dumps({"error": "No input provided"}))
        sys.exit(1)

    # Set up restricted globals
    restricted_globals = {"__builtins__": __builtins__}

    # Pre-import common modules into the namespace
    try:
        import pydantic
        from pydantic import BaseModel, Field
        restricted_globals["pydantic"] = pydantic
        restricted_globals["BaseModel"] = BaseModel
        restricted_globals["Field"] = Field

        import typing
        restricted_globals["typing"] = typing
        # Common typing imports
        for name in ["Optional", "List", "Dict", "Set", "Tuple", "Union",
                      "Literal", "Annotated", "Any", "ClassVar", "Type"]:
            if hasattr(typing, name):
                restricted_globals[name] = getattr(typing, name)

        from enum import Enum as PyEnum
        restricted_globals["Enum"] = PyEnum

        from datetime import datetime, date, time, timedelta
        restricted_globals["datetime"] = datetime
        restricted_globals["date"] = date
        restricted_globals["time"] = time
        restricted_globals["timedelta"] = timedelta

        from decimal import Decimal
        restricted_globals["Decimal"] = Decimal

        from uuid import UUID
        restricted_globals["UUID"] = UUID

    except ImportError as e:
        print(json.dumps({"error": f"Failed to import pydantic: {e}. Ensure pydantic>=2 is installed."}))
        sys.exit(1)

    # Execute the user's code
    try:
        exec(code, restricted_globals)
    except Exception as e:
        print(json.dumps({"error": f"Failed to execute Pydantic code: {e}"}))
        sys.exit(1)

    # Find all BaseModel subclasses defined in the code
    models = []
    for name, obj in restricted_globals.items():
        if name.startswith("_"):
            continue
        if isinstance(obj, type) and issubclass(obj, BaseModel) and obj is not BaseModel:
            models.append((name, obj))

    if not models:
        print(json.dumps({"error": "No BaseModel subclass found in the provided code."}))
        sys.exit(1)

    # Use the last defined model (most likely the "main" one)
    model_name, model_cls = models[-1]

    try:
        schema = model_cls.model_json_schema()
    except Exception as e:
        print(json.dumps({"error": f"Failed to generate JSON Schema from {model_name}: {e}"}))
        sys.exit(1)

    result = {
        "schema": schema,
        "modelName": model_name,
        "allModels": [name for name, _ in models],
    }

    print(json.dumps(result))

if __name__ == "__main__":
    main()

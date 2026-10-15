"""NEBULA Backend Application Package."""

import sys
from pathlib import Path

# Ensure both project root and backend directory are in sys.path
_current_dir = Path(__file__).resolve().parent  # app
_backend_dir = _current_dir.parent  # backend
_project_root = _backend_dir.parent  # NEBULA

for _p in (str(_project_root), str(_backend_dir)):
    if _p not in sys.path:
        sys.path.insert(0, _p)

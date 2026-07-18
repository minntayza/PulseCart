"""Keep tests deterministic and independent of backend/.env."""

import os

os.environ["USE_MOCK_DATA"] = "true"

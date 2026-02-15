import { execFileSync } from "node:child_process";

export interface PythonCheck {
  available: boolean;
  pythonPath: string | undefined;
  version: string | undefined;
  hasPydantic: boolean;
  error: string | undefined;
}

const PYTHON_CANDIDATES = ["python3", "python"];

export function checkPython(): PythonCheck {
  let bestFailure: PythonCheck | undefined;

  for (const cmd of PYTHON_CANDIDATES) {
    try {
      const version = execFileSync(cmd, ["--version"], {
        encoding: "utf-8",
        timeout: 5000,
      }).trim();

      // Check version >= 3.10
      const match = version.match(/Python (\d+)\.(\d+)/);
      if (!match) continue;
      const major = Number(match[1]);
      const minor = Number(match[2]);
      if (major < 3 || (major === 3 && minor < 10)) {
        bestFailure ??= {
          available: false,
          pythonPath: cmd,
          version,
          hasPydantic: false,
          error: `Python 3.10+ required, found ${version}`,
        };
        continue;
      }

      // Check pydantic is installed
      try {
        execFileSync(cmd, ["-c", "import pydantic; print(pydantic.__version__)"], {
          encoding: "utf-8",
          timeout: 10000,
        });
        return {
          available: true,
          pythonPath: cmd,
          version,
          hasPydantic: true,
          error: undefined,
        };
      } catch {
        bestFailure ??= {
          available: false,
          pythonPath: cmd,
          version,
          hasPydantic: false,
          error: "pydantic>=2 is not installed. Run: pip install pydantic",
        };
        continue;
      }
    } catch {
      continue;
    }
  }

  return bestFailure ?? {
    available: false,
    pythonPath: undefined,
    version: undefined,
    hasPydantic: false,
    error: "Python 3.10+ not found. Install Python and pydantic>=2.",
  };
}

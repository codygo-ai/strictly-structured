# Manual Tests for Phase 1 Verify (#50)

Run these commands to manually test the verification system. **Run all commands from the repository root** (so path arguments and report output paths resolve correctly).

## 1. Verify one file (no LLM)

```bash
pnpm --filter @ssv/verify run verify packages/schemas/data/validationSamples/gpt-4-o1/minimal-object.json --no-llm
```

**Expected:** Shows validation results for that one file against all ruleSets (gpt-4-o1, claude-4-5, gemini-2-5).

---

## 2. Verify all samples (no LLM, no fix)

```bash
pnpm --filter @ssv/verify run verify packages/schemas/data/validationSamples --no-llm --no-fix
```

**Expected:** Processes all 175 samples, shows summary with ~241 passed, ~284 failed validation. All LLM tests skipped.

---

## 3. Verify with report file

```bash
pnpm --filter @ssv/verify run verify packages/schemas/data/validationSamples --no-llm -o verify-report.json
```

**Expected:** Creates `verify-report.json` file (in the directory you ran from) with detailed JSON results.

---

## 4. Verify with LLM (optional)

Set environment variables:
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY` (optional)
- `GOOGLE_GENERATIVE_AI_API_KEY` (optional)

Then run:
```bash
pnpm --filter @ssv/verify run verify packages/schemas/data/validationSamples/gpt-4-o1/minimal-object.json
```

**Expected:** Shows LLM validation results (not all "llm=SKIP"). If fix is enabled (no `--no-fix`), schemas failing both validation and LLM will be auto-fixed and re-tested.

---

## Notes

- All commands should be run from the repository root.
- The `--no-llm` flag skips API calls (faster, no API keys needed).
- The `--no-fix` flag skips auto-fix attempts.
- Use `-r <ruleSetId>` to test only specific ruleSets (e.g., `-r gpt-4-o1`).

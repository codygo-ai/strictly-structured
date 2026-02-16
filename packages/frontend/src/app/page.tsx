'use client';

import ruleSetsDataJson from '@ssv/schemas/data/schemaRuleSets.json';
import type { FixResult } from '@ssv/schemas/ruleSetFixer';
import type { SchemaRuleSetsData, RuleSetId } from '@ssv/schemas/types';
import { useSearchParams } from 'next/navigation';
import { useReducer, useCallback, useMemo, useRef, Suspense } from 'react';

import { CompatibilityDashboard } from '~/components/CompatibilityDashboard';
import { EditorBottomBar } from '~/components/EditorBottomBar';
import { EditorInputHint } from '~/components/EditorInputHint';
import { SchemaEditor, type SchemaEditorApi } from '~/components/SchemaEditor';
import { useAllRuleSetsValidation } from '~/hooks/useAllRuleSetsValidation';
import { useAudit, hashSchema } from '~/lib/audit';
import { RULESET_TO_CHEAPEST_MODEL_ID } from '~/lib/modelIds';
import type { ValidationResult, ServerValidationState } from '~/lib/providers/types';
import { useAuth } from '~/lib/useAuth';

const ruleSetsData = ruleSetsDataJson as unknown as SchemaRuleSetsData;
const RULE_SETS = ruleSetsData.ruleSets;

const ONBOARDING_KEY = 'ssv-onboarding-dismissed';

// Default schema that demonstrates cross-provider incompatibilities
const DEFAULT_SCHEMA = `{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "category": {
      "oneOf": [
        { "type": "string" },
        { "type": "integer" }
      ]
    },
    "tags": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["name", "category"]
}
`;

/* ─── Validator state & reducer ─────────────────────────────────────── */

const INITIAL_SERVER_VALIDATION: ServerValidationState = {
  loading: false,
};

interface ValidatorState {
  schema: string;
  selectedRuleSetId: RuleSetId;
  fixResult?: FixResult;
  preFixSchema?: string;
  lastFixedForRuleSetId?: RuleSetId;
  hasMonacoErrors: boolean;
  serverValidation: ServerValidationState;
}

type ValidatorAction =
  | { type: 'SCHEMA_CHANGED'; schema: string }
  | { type: 'RULESET_CHANGED'; ruleSetId: RuleSetId }
  | { type: 'FIX_APPLIED'; fixedSchema: string; fixResult: FixResult }
  | { type: 'FIX_UNDONE' }
  | { type: 'MONACO_ERRORS_CHANGED'; hasErrors: boolean }
  | { type: 'SERVER_VALIDATION_STARTED' }
  | { type: 'SERVER_VALIDATION_COMPLETED'; results: ValidationResult[] }
  | { type: 'SERVER_VALIDATION_FAILED'; error: string };

function validatorReducer(state: ValidatorState, action: ValidatorAction): ValidatorState {
  switch (action.type) {
    case 'SCHEMA_CHANGED':
      return {
        ...state,
        schema: action.schema,
        fixResult: undefined,
        preFixSchema: undefined,
        lastFixedForRuleSetId: undefined,
        serverValidation: INITIAL_SERVER_VALIDATION,
      };
    case 'RULESET_CHANGED':
      return {
        ...state,
        selectedRuleSetId: action.ruleSetId,
        fixResult: undefined,
        serverValidation: INITIAL_SERVER_VALIDATION,
      };
    case 'FIX_APPLIED':
      return {
        ...state,
        preFixSchema: state.schema,
        schema: action.fixedSchema,
        fixResult: action.fixResult,
        lastFixedForRuleSetId: state.selectedRuleSetId,
      };
    case 'FIX_UNDONE':
      return {
        ...state,
        schema: state.preFixSchema ?? state.schema,
        fixResult: undefined,
        preFixSchema: undefined,
        lastFixedForRuleSetId: undefined,
      };
    case 'MONACO_ERRORS_CHANGED':
      if (state.hasMonacoErrors === action.hasErrors) return state;
      return { ...state, hasMonacoErrors: action.hasErrors };
    case 'SERVER_VALIDATION_STARTED':
      return {
        ...state,
        serverValidation: { loading: true },
      };
    case 'SERVER_VALIDATION_COMPLETED':
      return {
        ...state,
        serverValidation: { loading: false, results: action.results },
      };
    case 'SERVER_VALIDATION_FAILED':
      return {
        ...state,
        serverValidation: { loading: false, error: action.error },
      };
  }
}

/* ─── Onboarding hint ───────────────────────────────────────────────── */

function useOnboardingHint() {
  const [visible, setVisible] = useReducer(
    () => false,
    undefined,
    () => {
      if (typeof window === 'undefined') return false;
      return localStorage.getItem(ONBOARDING_KEY) === null;
    },
  );

  const dismiss = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    setVisible();
  }, []);

  return { visible, dismiss };
}

/* ─── Main page ─────────────────────────────────────────────────────── */

function HomeContent() {
  const searchParams = useSearchParams();
  const { emit } = useAudit();

  const [state, dispatch] = useReducer(validatorReducer, searchParams, (params): ValidatorState => {
    const fromUrl = params.get('ruleSet');
    const ruleSetId =
      RULE_SETS.find((r) => r.ruleSetId === fromUrl)?.ruleSetId ?? RULE_SETS[0]!.ruleSetId;
    return {
      schema: DEFAULT_SCHEMA,
      selectedRuleSetId: ruleSetId,
      hasMonacoErrors: false,
      serverValidation: INITIAL_SERVER_VALIDATION,
    };
  });

  const { ensureAuth } = useAuth();
  const editorApiRef = useRef<SchemaEditorApi | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onboarding = useOnboardingHint();

  const validationResults = useAllRuleSetsValidation(
    state.schema,
    RULE_SETS,
    !state.hasMonacoErrors,
  );

  const selectedRuleSet = useMemo(
    () => RULE_SETS.find((r) => r.ruleSetId === state.selectedRuleSetId),
    [state.selectedRuleSetId],
  );

  const selectedMarkers = useMemo(
    () => validationResults.get(state.selectedRuleSetId)?.markers ?? [],
    [validationResults, state.selectedRuleSetId],
  );

  /* ── Callbacks ── */

  const handleSchemaChange = useCallback((newSchema: string) => {
    dispatch({ type: 'SCHEMA_CHANGED', schema: newSchema });
  }, []);

  const handleRuleSetChange = useCallback(
    (ruleSetId: RuleSetId) => {
      dispatch({ type: 'RULESET_CHANGED', ruleSetId });
      const ruleSet = RULE_SETS.find((r) => r.ruleSetId === ruleSetId);
      if (ruleSet) {
        emit('ruleSet.selected', { ruleSetId });
      }
    },
    [emit],
  );

  const handleFixAll = useCallback((fixedSchema: string, result: FixResult) => {
    editorApiRef.current?.applyText(fixedSchema);
    dispatch({ type: 'FIX_APPLIED', fixedSchema, fixResult: result });
  }, []);

  const handleMonacoErrors = useCallback((hasErrors: boolean) => {
    dispatch({ type: 'MONACO_ERRORS_CHANGED', hasErrors });
  }, []);

  const handleScrollToLine = useCallback((line: number) => {
    editorApiRef.current?.scrollToLine(line);
  }, []);

  const handleEditorReady = useCallback((api: SchemaEditorApi) => {
    editorApiRef.current = api;
  }, []);

  const handleUndo = useCallback(() => {
    const pre = state.preFixSchema;
    if (pre) editorApiRef.current?.applyText(pre);
    dispatch({ type: 'FIX_UNDONE' });
  }, [state.preFixSchema]);

  const handleServerValidate = useCallback(async () => {
    dispatch({ type: 'SERVER_VALIDATION_STARTED' });
    try {
      const modelId = RULESET_TO_CHEAPEST_MODEL_ID[state.selectedRuleSetId];
      if (!modelId) return;

      const hash = await hashSchema(state.schema);
      emit('server.validate.requested', {
        schemaHash: hash,
        schemaSizeBytes: new Blob([state.schema]).size,
        modelIds: [modelId],
      });

      const token = await ensureAuth();
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          schema: state.schema,
          modelIds: [modelId],
        }),
      });
      const data = (await res.json()) as {
        results?: ValidationResult[];
        error?: string;
      };
      if (!res.ok) {
        dispatch({
          type: 'SERVER_VALIDATION_FAILED',
          error: data.error ?? `Request failed (${res.status})`,
        });
        return;
      }
      if (data.results) {
        dispatch({ type: 'SERVER_VALIDATION_COMPLETED', results: data.results });
      }
    } catch (err) {
      dispatch({ type: 'SERVER_VALIDATION_FAILED', error: (err as Error).message });
    }
  }, [state.schema, state.selectedRuleSetId, ensureAuth, emit]);

  const applyLoadedJson = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      try {
        const parsed = JSON.parse(trimmed);
        handleSchemaChange(JSON.stringify(parsed, null, 2));
      } catch {
        handleSchemaChange(trimmed);
      }
    },
    [handleSchemaChange],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result;
        if (typeof text === 'string') {
          emit('schema.loaded', {
            method: 'file_upload',
            schemaSizeBytes: new Blob([text]).size,
          });
          applyLoadedJson(text);
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [applyLoadedJson, emit],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result;
        if (typeof text === 'string') {
          emit('schema.loaded', {
            method: 'drag_drop',
            schemaSizeBytes: new Blob([text]).size,
          });
          applyLoadedJson(text);
        }
      };
      reader.readAsText(file);
    },
    [applyLoadedJson, emit],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  return (
    <div className="validator-page flex flex-col flex-1 min-h-0">
      {/* Onboarding hint */}
      {onboarding.visible && (
        <div className="onboarding-hint">
          <span>
            This example schema has compatibility issues across providers. Edit it or paste your
            own.
          </span>
          <button type="button" onClick={onboarding.dismiss} aria-label="Dismiss">
            &#x2715;
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left pane: editor + toolbar */}
        <section className="editor-section">
          <div className="editor-header">
            <span className="editor-label">Schema Editor</span>
            <EditorInputHint
              schema={state.schema}
              fileInputRef={fileInputRef}
              onSchemaChange={handleSchemaChange}
            />
          </div>
          <div className="editor-container" onDrop={handleDrop} onDragOver={handleDragOver}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileChange}
            />
            <SchemaEditor
              value={state.schema}
              onChange={handleSchemaChange}
              markers={selectedMarkers}
              markerLabel={selectedRuleSet?.displayName}
              fillHeight
              onEditorReady={handleEditorReady}
              onSchemaValidation={handleMonacoErrors}
            />
            <EditorBottomBar fileInputRef={fileInputRef} onSchemaChange={handleSchemaChange} />
          </div>
        </section>

        {/* Right pane: compatibility dashboard */}
        <CompatibilityDashboard
          ruleSets={RULE_SETS}
          validationResults={validationResults}
          selectedRuleSetId={state.selectedRuleSetId}
          onSelectRuleSet={handleRuleSetChange}
          schema={state.schema}
          onFixAll={handleFixAll}
          onScrollToLine={handleScrollToLine}
          fixResult={state.fixResult}
          onUndo={handleUndo}
          lastFixedForRuleSetId={state.lastFixedForRuleSetId}
          serverValidation={state.serverValidation}
          onServerValidate={handleServerValidate}
        />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}

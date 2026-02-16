'use client';

import ruleSetsDataJson from '@ssv/schemas/data/schemaRuleSets.json';
import type { FixResult } from '@ssv/schemas/ruleSetFixer';
import type { SchemaRuleSetsData, RuleSetId } from '@ssv/schemas/types';
import { useSearchParams } from 'next/navigation';
import { useReducer, useState, useCallback, useMemo, useRef, useEffect, Suspense } from 'react';

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

/* ─── Session history utilities ────────────────────────────────────── */

function fnv1aHash(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

function canonicalSchemaHash(rawJson: string): string {
  return fnv1aHash(JSON.stringify(JSON.parse(rawJson)));
}

type SessionKey = `${string}:${string}`;

function makeSessionKey(schemaHash: string, ruleSetId: RuleSetId): SessionKey {
  return `${schemaHash}:${ruleSetId}`;
}

const MAX_CACHE_SIZE = 50;

function sessionCacheSet<V extends { cachedAt: number }>(
  map: Map<SessionKey, V>,
  key: SessionKey,
  value: V,
): void {
  map.set(key, value);
  if (map.size > MAX_CACHE_SIZE) {
    let oldestKey: SessionKey | undefined;
    let oldestTime = Infinity;
    for (const [k, v] of map) {
      if (v.cachedAt < oldestTime) {
        oldestTime = v.cachedAt;
        oldestKey = k;
      }
    }
    if (oldestKey) map.delete(oldestKey);
  }
}

interface CachedServerValidation {
  results: ValidationResult[];
  cachedAt: number;
}

interface CachedFixLineage {
  sourceSchema: string;
  sourceSchemaHash: string;
  ruleSetId: RuleSetId;
  fixResult: FixResult;
  cachedAt: number;
}

interface SessionHistoryStore {
  serverValidation: Map<SessionKey, CachedServerValidation>;
  fixLineage: Map<SessionKey, CachedFixLineage>;
}

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
  | {
      type: 'RULESET_CHANGED';
      ruleSetId: RuleSetId;
      cachedServerValidation?: CachedServerValidation;
      cachedFixLineage?: CachedFixLineage;
    }
  | { type: 'FIX_APPLIED'; fixedSchema: string; fixResult: FixResult; preFixSchema: string }
  | { type: 'FIX_UNDONE' }
  | { type: 'MONACO_ERRORS_CHANGED'; hasErrors: boolean }
  | { type: 'SERVER_VALIDATION_STARTED' }
  | { type: 'SERVER_VALIDATION_COMPLETED'; results: ValidationResult[] }
  | { type: 'SERVER_VALIDATION_FAILED'; error: string }
  | {
      type: 'RESTORE_FROM_CACHE';
      cachedServerValidation?: CachedServerValidation;
      cachedFixLineage?: CachedFixLineage;
    };

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
    case 'RULESET_CHANGED': {
      const fixLineage = action.cachedFixLineage;
      const serverCache = action.cachedServerValidation;
      return {
        ...state,
        selectedRuleSetId: action.ruleSetId,
        fixResult: fixLineage?.fixResult,
        preFixSchema: fixLineage?.sourceSchema,
        lastFixedForRuleSetId: fixLineage?.ruleSetId,
        serverValidation: serverCache
          ? { loading: false, results: serverCache.results }
          : INITIAL_SERVER_VALIDATION,
      };
    }
    case 'FIX_APPLIED':
      return {
        ...state,
        preFixSchema: action.preFixSchema,
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
    case 'RESTORE_FROM_CACHE': {
      const sv = action.cachedServerValidation
        ? { loading: false as const, results: action.cachedServerValidation.results }
        : state.serverValidation;
      const fl = action.cachedFixLineage;
      return {
        ...state,
        fixResult: fl?.fixResult ?? state.fixResult,
        preFixSchema: fl?.sourceSchema ?? state.preFixSchema,
        lastFixedForRuleSetId: fl?.ruleSetId ?? state.lastFixedForRuleSetId,
        serverValidation: sv,
      };
    }
  }
}

/* ─── Onboarding hint ───────────────────────────────────────────────── */

function useOnboardingHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem(ONBOARDING_KEY) !== null;
    setVisible(!isDismissed);
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    setVisible(false);
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
  const sessionRef = useRef<SessionHistoryStore>({
    serverValidation: new Map(),
    fixLineage: new Map(),
  });

  const validationResults = useAllRuleSetsValidation(
    state.schema,
    RULE_SETS,
    !state.hasMonacoErrors,
  );

  const schemaHash = useMemo(() => {
    const anySummary = validationResults.values().next().value;
    if (!anySummary?.isValidJson || !anySummary?.isValidJsonSchema) return undefined;
    return canonicalSchemaHash(state.schema);
  }, [state.schema, validationResults]);

  // Restore cached state when schema becomes (or remains) a valid JSON schema
  useEffect(() => {
    if (!schemaHash) return;
    const store = sessionRef.current;
    const key = makeSessionKey(schemaHash, state.selectedRuleSetId);
    const cachedSV = store.serverValidation.get(key);
    const cachedFix = store.fixLineage.get(key);
    if (cachedSV || cachedFix) {
      dispatch({
        type: 'RESTORE_FROM_CACHE',
        cachedServerValidation: cachedSV,
        cachedFixLineage: cachedFix,
      });
    }
  }, [schemaHash, state.selectedRuleSetId]);

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
      const store = sessionRef.current;
      const key = schemaHash ? makeSessionKey(schemaHash, ruleSetId) : undefined;
      dispatch({
        type: 'RULESET_CHANGED',
        ruleSetId,
        cachedServerValidation: key ? store.serverValidation.get(key) : undefined,
        cachedFixLineage: key ? store.fixLineage.get(key) : undefined,
      });
      const ruleSet = RULE_SETS.find((r) => r.ruleSetId === ruleSetId);
      if (ruleSet) {
        emit('ruleSet.selected', { ruleSetId });
      }
    },
    [schemaHash, emit],
  );

  const handleFixAll = useCallback(
    (fixedSchema: string, result: FixResult) => {
      const fixedHash = canonicalSchemaHash(fixedSchema);
      const key = makeSessionKey(fixedHash, state.selectedRuleSetId);
      sessionCacheSet(sessionRef.current.fixLineage, key, {
        sourceSchema: state.schema,
        sourceSchemaHash: schemaHash ?? '',
        ruleSetId: state.selectedRuleSetId,
        fixResult: result,
        cachedAt: Date.now(),
      });
      editorApiRef.current?.applyText(fixedSchema);
      dispatch({
        type: 'FIX_APPLIED',
        fixedSchema,
        fixResult: result,
        preFixSchema: state.schema,
      });
    },
    [state.schema, state.selectedRuleSetId, schemaHash],
  );

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
        if (schemaHash) {
          const key = makeSessionKey(schemaHash, state.selectedRuleSetId);
          sessionCacheSet(sessionRef.current.serverValidation, key, {
            results: data.results,
            cachedAt: Date.now(),
          });
        }
        dispatch({ type: 'SERVER_VALIDATION_COMPLETED', results: data.results });
      }
    } catch (err) {
      dispatch({ type: 'SERVER_VALIDATION_FAILED', error: (err as Error).message });
    }
  }, [state.schema, state.selectedRuleSetId, schemaHash, ensureAuth, emit]);

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

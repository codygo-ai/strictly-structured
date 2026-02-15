"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { SiteHeader } from "~/components/SiteHeader";
import { SchemaEditor, type SchemaEditorApi } from "~/components/SchemaEditor";
import { CompatibilityDashboard } from "~/components/CompatibilityDashboard";
import { HelpPopover } from "~/components/HelpPopover";
import { EditorInputHint } from "~/components/EditorInputHint";
import type { SchemaRuleSet, SchemaRuleSetsData } from "~/types/schemaRuleSets";
import ruleSetsDataJson from "~/data/schema_rule_sets.generated.json";
import { useAudit } from "~/lib/audit";
import { useAllRuleSetsValidation } from "~/hooks/useAllRuleSetsValidation";
import type { FixResult } from "~/lib/schemaFixer";

const ruleSetsData = ruleSetsDataJson as unknown as SchemaRuleSetsData;
const RULE_SETS = ruleSetsData.ruleSets as SchemaRuleSet[];

const ONBOARDING_KEY = "ssv-onboarding-dismissed";

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

function useOnboardingHint() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(ONBOARDING_KEY) === null;
  });

  const dismiss = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setVisible(false);
  }, []);

  return { visible, dismiss };
}

export default function Home() {
  const { emit } = useAudit();
  const [schema, setSchema] = useState(DEFAULT_SCHEMA);
  const [selectedRuleSetId, setSelectedRuleSetId] = useState<string>(
    () => RULE_SETS[0]?.ruleSetId ?? "",
  );
  const [fixResult, setFixResult] = useState<FixResult | null>(null);
  const editorApiRef = useRef<SchemaEditorApi | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onboarding = useOnboardingHint();

  const validationResults = useAllRuleSetsValidation(schema, RULE_SETS);

  const selectedRuleSet = useMemo(
    () => RULE_SETS.find((r) => r.ruleSetId === selectedRuleSetId) ?? null,
    [selectedRuleSetId],
  );

  const selectedMarkers = useMemo(
    () => validationResults.get(selectedRuleSetId)?.markers ?? [],
    [validationResults, selectedRuleSetId],
  );

  const handleRuleSetChange = useCallback(
    (ruleSetId: string) => {
      setSelectedRuleSetId(ruleSetId);
      setFixResult(null);
      const ruleSet = RULE_SETS.find((r) => r.ruleSetId === ruleSetId);
      if (ruleSet) {
        emit("ruleSet.selected", { ruleSetId, providerId: ruleSet.providerId });
      }
    },
    [emit],
  );

  const handleSchemaChange = useCallback((newSchema: string) => {
    setSchema(newSchema);
    setFixResult(null);
  }, []);

  const handleFixAll = useCallback(
    (fixedSchema: string, result: FixResult) => {
      editorApiRef.current?.applyText(fixedSchema);
      setSchema(fixedSchema);
      setFixResult(result);
    },
    [],
  );

  const handleScrollToLine = useCallback((line: number) => {
    editorApiRef.current?.scrollToLine(line);
  }, []);

  const handleEditorReady = useCallback((api: SchemaEditorApi) => {
    editorApiRef.current = api;
  }, []);

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
        if (typeof text === "string") {
          emit("schema.loaded", {
            method: "file_upload",
            schemaSizeBytes: new Blob([text]).size,
          });
          applyLoadedJson(text);
        }
      };
      reader.readAsText(file);
      e.target.value = "";
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
        if (typeof text === "string") {
          emit("schema.loaded", {
            method: "drag_drop",
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
    e.dataTransfer.dropEffect = "copy";
  }, []);

  return (
    <div className="validator-page flex flex-col h-screen min-h-0">
      <SiteHeader subtitle current="validator" />

      {/* Onboarding hint */}
      {onboarding.visible && (
        <div className="onboarding-hint">
          <span>
            This example schema has compatibility issues across providers. Edit it or paste your own.
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
            <div className="flex items-center gap-1.5">
              <span className="editor-label">Schema Editor</span>
              <HelpPopover />
            </div>
            <EditorInputHint
              schema={schema}
              onSchemaChange={handleSchemaChange}
              fileInputRef={fileInputRef}
            />
          </div>
          <div
            className="editor-container"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileChange}
            />
            <SchemaEditor
              value={schema}
              onChange={handleSchemaChange}
              markers={selectedMarkers}
              markerLabel={selectedRuleSet?.displayName}
              fillHeight
              onEditorReady={handleEditorReady}
            />
          </div>
        </section>

        {/* Right pane: compatibility dashboard */}
        <CompatibilityDashboard
          ruleSets={RULE_SETS}
          validationResults={validationResults}
          selectedRuleSetId={selectedRuleSetId}
          onSelectRuleSet={handleRuleSetChange}
          schema={schema}
          onFixAll={handleFixAll}
          onScrollToLine={handleScrollToLine}
          fixResult={fixResult}
        />
      </div>

    </div>
  );
}

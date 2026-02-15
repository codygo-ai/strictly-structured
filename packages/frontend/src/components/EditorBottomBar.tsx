"use client";

import { useState, useRef, useCallback } from "react";
import { EXAMPLE_SCHEMAS } from "~/data/exampleSchemas";
import { ProviderIcon } from "~/components/ui";

interface EditorBottomBarProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onSchemaChange: (schema: string) => void;
}

function useHoverIntent() {
  const [open, setOpen] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout>>(null);

  const enter = useCallback(() => {
    if (timeout.current) clearTimeout(timeout.current);
    setOpen(true);
  }, []);

  const leave = useCallback(() => {
    timeout.current = setTimeout(() => setOpen(false), 150);
  }, []);

  return { open, enter, leave } as const;
}

export function EditorBottomBar({
  fileInputRef,
  onSchemaChange,
}: EditorBottomBarProps) {
  const sample = useHoverIntent();

  const handleUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, [fileInputRef]);

  const handleSample = useCallback(
    (schema: string) => {
      onSchemaChange(schema);
    },
    [onSchemaChange],
  );

  return (
    <div className="editor-bottom-bar">
      <span className="text-muted">Drop, paste,</span>{" "}
      <span className="editor-bottom-trigger" onClick={handleUpload}>upload</span>{" "}
      <span className="text-muted">or load</span>{" "}
      <span
        className="relative"
        onMouseEnter={sample.enter}
        onMouseLeave={sample.leave}
      >
        <span className="editor-bottom-trigger">a sample</span>
        {sample.open && (
          <div
            className="examples-dropdown-header editor-bottom-popover"
            onMouseEnter={sample.enter}
            onMouseLeave={sample.leave}
          >
            <div className="examples-samples-scroll">
              {EXAMPLE_SCHEMAS.map((ex) => (
                <button
                  key={ex.name}
                  type="button"
                  onClick={() => handleSample(ex.schema)}
                >
                  <span className="examples-sample-row">
                    <span>{ex.name}</span>
                    <span className="examples-providers">
                      {ex.compatibleWith.length === 0
                        ? <span className="examples-provider-tag none">none</span>
                        : ex.compatibleWith.map((p) => (
                          <span key={p} className={`examples-provider-tag ${p}`}>
                            <ProviderIcon provider={p} size={13} className="" />
                          </span>
                        ))}
                    </span>
                  </span>
                  <span className="examples-desc">{ex.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </span>{" "}
      <span className="text-muted">structured output schema</span>
    </div>
  );
}

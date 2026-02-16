'use client';

import type { SchemaRuleSet } from '@ssv/schemas/types';

import { SeverityIcon } from '~/components/SeverityIcon';
import { Pill, Collapsible } from '~/components/ui';
import { camelCaseToLabel, limitsToRows } from '~/lib/format';

function formatBehaviorValue(val: string | boolean): 'ok' | 'no' | 'unknown' {
  if (val === true) return 'ok';
  if (val === false) return 'no';
  return 'unknown';
}

export function ReferenceTab({ ruleSet }: { ruleSet: SchemaRuleSet }) {
  const modelsStr = ruleSet.models.join(', ');
  const limitsRows = limitsToRows(ruleSet.sizeLimits);
  const unknownKw =
    typeof ruleSet.behaviors.unknownKeywordsBehavior === 'string'
      ? ruleSet.behaviors.unknownKeywordsBehavior
      : '\u2014';
  const unsupportedKeywords = Object.fromEntries(
    ruleSet.supportedTypes
      .filter((st) => st.unsupportedKeywords && st.unsupportedKeywords.length > 0)
      .map((st) => [st.type, st.unsupportedKeywords!]),
  );

  return (
    <div className="text-[13px] text-primary leading-relaxed">
      <div className="mb-3">
        <div className="text-xs text-muted mb-1.5 leading-snug">{ruleSet.description}</div>
        <div className="text-[11px] text-muted font-mono leading-snug">{modelsStr}</div>
      </div>

      <Collapsible title="Requirements" defaultOpen>
        <div className="flex flex-col gap-2">
          {ruleSet.requirements.map((c, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="mt-0.5 shrink-0">
                <SeverityIcon severity={c.severity} />
              </div>
              <div>
                <div className="font-semibold text-xs text-primary">{c.rule}</div>
                <div className="text-[11px] text-muted mt-0.5">{c.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </Collapsible>

      <Collapsible title="Supported Keywords" defaultOpen>
        {ruleSet.supportedTypes.map((st) => (
          <div key={st.type} className="mb-2">
            <div className="text-xs font-semibold text-secondary mb-1 font-mono">{st.type}</div>
            <div className="flex flex-wrap gap-0">
              {st.supportedKeywords.map((kw) => (
                <Pill key={kw} variant="supported">
                  {kw}
                </Pill>
              ))}
            </div>
            {ruleSet.stringFormats && ruleSet.stringFormats.length > 0 && st.type === 'string' && (
              <div className="text-[11px] text-muted mt-1 ml-0.5">
                Formats: {ruleSet.stringFormats.join(', ')}
              </div>
            )}
            {st.notes && (
              <div className="text-[11px] text-warning mt-0.5 ml-0.5 flex items-center gap-1">
                <span className="text-[10px]">&#x26A0;</span> {st.notes}
              </div>
            )}
          </div>
        ))}
      </Collapsible>

      <Collapsible title="Unsupported Keywords" defaultOpen>
        {Object.entries(unsupportedKeywords).map(([type, kws]) => (
          <div key={type} className="mb-2">
            <div className="text-xs font-semibold text-secondary mb-1 font-mono">{type}</div>
            <div className="flex flex-wrap gap-0">
              {kws.map((kw) => (
                <Pill key={kw} variant="unsupported">
                  {kw}
                </Pill>
              ))}
            </div>
          </div>
        ))}
      </Collapsible>

      <Collapsible title="Quantitative Limits" defaultOpen>
        <div className="grid gap-1.5 gap-x-4 grid-cols-[1fr_auto]">
          {limitsRows.map((l, i) => (
            <div key={i} className="contents">
              <div className="text-xs text-secondary">{l.label}</div>
              <div className="text-xs font-semibold text-primary text-right font-mono">
                {l.value}
              </div>
            </div>
          ))}
        </div>
      </Collapsible>

      <Collapsible title="Behaviors" defaultOpen>
        <div className="flex flex-col gap-1">
          {Object.entries(ruleSet.behaviors)
            .filter(([k]) => k !== 'unknownKeywordsBehavior')
            .map(([label, val]) => {
              const status = formatBehaviorValue(val);
              return (
                <div key={label} className="flex items-center gap-2 text-xs">
                  {status === 'ok' && <span className="text-success">&#x2713;</span>}
                  {status === 'no' && <span className="text-error">&#x2717;</span>}
                  {status === 'unknown' && <span className="text-muted">?</span>}
                  <span className={status === 'ok' ? 'text-primary' : 'text-muted'}>
                    {camelCaseToLabel(label)}
                  </span>
                  {status === 'unknown' && (
                    <span className="text-[11px] text-muted">(undocumented)</span>
                  )}
                </div>
              );
            })}
          <div className="text-[11px] text-muted mt-1">
            Unknown keywords &#x2192; <span className="font-mono text-[11px]">{unknownKw}</span>
          </div>
        </div>
      </Collapsible>

      <Collapsible title="Tips" defaultOpen>
        <div className="flex flex-col gap-1.5">
          {ruleSet.tips.map((p, i) => (
            <div key={i} className="text-xs text-secondary flex gap-2 items-start">
              <span className="text-accent shrink-0 mt-0.5 text-[8px]">&#x25CF;</span>
              <span>{p}</span>
            </div>
          ))}
        </div>
      </Collapsible>
    </div>
  );
}

declare module 'json-source-map' {
  interface ParseLocation {
    line: number;
    column: number;
    pos: number;
  }

  interface PointerLocation {
    key?: ParseLocation;
    keyEnd?: ParseLocation;
    value: ParseLocation;
    valueEnd: ParseLocation;
  }

  interface ParseResult {
    data: unknown;
    pointers: Record<string, PointerLocation>;
  }

  function parse(json: string, _reviver?: unknown, options?: { bigint?: boolean }): ParseResult;
  function stringify(
    data: unknown,
    _replacer?: unknown,
    space?: string | number | object,
  ): { json: string; pointers: Record<string, PointerLocation> };
}

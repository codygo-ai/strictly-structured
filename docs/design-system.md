# Design system

Single source of truth for the site. Tokens live in `src/styles/tokens.css` (imported via `src/app/globals.css`); use them via Tailwind utilities or `var(--ds-*)` in custom CSS. Dark theme overrides are in the same file under `.dark`.

## Tokens

### Surfaces
| Token | Use |
|-------|-----|
| `--ds-page` | Page background |
| `--ds-surface` | Cards, header, sidebar, modals |
| `--ds-surface-subtle` | Alternate section background |
| `--ds-surface-hover` | Hover state, code/inline bg |
| `--ds-surface-active` | Selected model button |

**Tailwind:** `bg-page`, `bg-surface`, `bg-surface-subtle`, `bg-surface-hover`, `bg-surface-active`

### Text
| Token | Use |
|-------|-----|
| `--ds-primary` | Headings, primary text |
| `--ds-secondary` | Body, descriptions |
| `--ds-muted` | Labels, hints, captions |

**Tailwind:** `text-primary`, `text-secondary`, `text-muted`

### Borders
| Token | Use |
|-------|-----|
| `--ds-border` | Default borders |
| `--ds-border-focus` | Selected/focus ring |

**Tailwind:** `border-border`, `border-border-focus`

### Brand
| Token | Use |
|-------|-----|
| `--ds-codygo` | Codygo brand color (logo, wordmark) |

**Tailwind:** `text-codygo`, `bg-codygo`

### Accent (links, actions, code)
| Token | Use |
|-------|-----|
| `--ds-accent` | Links, primary button, code text |
| `--ds-accent-hover` | Primary button hover |
| `--ds-accent-muted` | Border for selected state |
| `--ds-accent-bg` | Hover bg for links/actions |

**Tailwind:** `text-accent`, `bg-accent`, `bg-accent-hover`, `bg-accent-bg`, etc.

### Semantic
| Token | Use |
|-------|-----|
| `--ds-success` | Success state, OK |
| `--ds-warning` | Warning state |
| `--ds-error` | Error state, invalid |
| `--ds-disabled` | Disabled controls |

**Tailwind:** `text-success`, `bg-error`, `bg-success/20`, etc.

### Shadows
| Token | Use |
|-------|-----|
| `--ds-shadow-button` | Default button shadow |
| `--ds-shadow-button-hover` | Button hover shadow |
| `--ds-shadow-button-disabled` | Disabled button shadow |

### Pills / Badges
| Token | Use |
|-------|-----|
| `--ds-pill-supported-bg` | Supported pill background |
| `--ds-pill-supported-text` | Supported pill text |
| `--ds-pill-unsupported-bg` | Unsupported pill background |
| `--ds-pill-unsupported-text` | Unsupported pill text |
| `--ds-heading-supported` | Supported section heading color |
| `--ds-heading-unsupported` | Unsupported section heading color |

### Provider Brand
| Token | Use |
|-------|-----|
| `--ds-provider-anthropic` | Anthropic brand color |
| `--ds-provider-gemini` | Google Gemini brand color |

### Table Cells
| Token | Use |
|-------|-----|
| `--ds-cell-ok-bg` | OK cell background |
| `--ds-cell-ok-text` | OK cell text |
| `--ds-cell-fail-bg` | Fail cell background |
| `--ds-cell-fail-text` | Fail cell text |
| `--ds-cell-warn-bg` | Warning cell background |
| `--ds-cell-warn-text` | Warning cell text |
| `--ds-row-alt` | Alternating row background |

### Layout & Shape
| Token | Use |
|-------|-----|
| `--ds-code-bg` | Inline code background |
| `--ds-radius-sm` | 4px radius |
| `--ds-radius-md` | 6px radius |
| `--ds-content-x` | Horizontal content padding (1.25rem) |
| `--ds-content-y` | Vertical content padding (0.75rem) |
| `--ds-sidebar-width` | 420px |
| `--ds-page-max-width` | Max width for site pages (84rem). Validator page is full-width. |
| `--ds-duration` | Transition duration (0.2s) |

**Tailwind:** `bg-code-bg`, `rounded-sm` -> `radius-sm`, `rounded-md` -> `radius-md`, `max-w-page`

## Usage

- Prefer Tailwind classes: `text-primary`, `bg-surface`, `border-border`, `text-accent`.
- For one-off values (e.g. in CSS), use `var(--ds-primary)`.
- Keep hex/rgb out of components; add new tokens when you need a new semantic value.
- Dark theme tokens override automatically under the `.dark` class.
- Validator, Why, and Model support pages use the `.validator-page` wrapper so globals.css rules already use tokens.

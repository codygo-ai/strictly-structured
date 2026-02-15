# Design system

Single source of truth for the site (light theme). Tokens live in `src/app/globals.css`; use them via Tailwind utilities or `var(--ds-*)` in custom CSS.

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

### Other
| Token | Use |
|-------|-----|
| `--ds-code-bg` | Inline code background |
| `--ds-radius-sm` | 4px radius |
| `--ds-radius-md` | 6px radius |
| `--ds-content-x` | Horizontal content padding (2.5rem) |
| `--ds-content-y` | Vertical content padding (1.5rem) |
| `--ds-sidebar-width` | 380px |
| `--ds-duration` | Transition duration (0.2s) |

**Tailwind:** `bg-code-bg`, `rounded-sm` → `radius-sm`, `rounded-md` → `radius-md`

## Usage

- Prefer Tailwind classes: `text-primary`, `bg-surface`, `border-border`, `text-accent`.
- For one-off values (e.g. in CSS), use `var(--ds-primary)`.
- Keep hex/rgb out of components; add new tokens when you need a new semantic value.
- Validator, Why, and Model support pages use the `.validator-page` wrapper so globals.css rules already use tokens.

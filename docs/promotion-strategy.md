# Promotion & Content Strategy: Strictly Structured

## Context

**Strictly Structured** (by Codygo) is an open-source structured schema validation toolset that validates and auto-fixes JSON schemas for LLM structured output APIs across OpenAI, Anthropic, and Google Gemini. It ships as a web app, MCP server, and CLI skill.

**Situation**: Solo founder based in Israel. Strong LinkedIn network. No X/Twitter or Facebook presence. ~$250 budget for ads/promotion. 30-day sprint. All content AI-generatable.

---

## Strategy: LinkedIn-First, 30-Day Sprint

1. **LinkedIn** as primary engine (existing audience)
2. **Hacker News + Reddit + Dev.to** for free developer reach
3. **Product Hunt** for a one-time launch spike
4. **$250 budget** focused on LinkedIn boosts (highest ROI)

---

## Foundation (Days 1-3)

### GitHub Polish

- README overhaul: Add GIF demo, badges, "why this exists" section, live demo link
- Cost: $0 | Time: 2-3 hours

### LinkedIn Profile

- Update headline to mention AI/structured outputs/open source
- Pin the project in Featured section
- Cost: $0 | Time: 30 min

---

## LinkedIn Playbook

### Posting Strategy

**Cadence**: 4x per week (Mon/Tue/Wed/Thu, 8-9am Israel time)

### Algorithm Hacks

- **Before posting**: Engage with 5-10 posts in your feed 30 min before publishing
- **No external links in post body** — LinkedIn suppresses them. Link goes in first comment.
- **Reply to every comment** within 1 hour
- **Ask questions** in every post — LinkedIn rewards comments heavily
- **Hashtags**: 3-5 per post: #AI #StructuredOutput #LLM #OpenSource #JSONSchema

---

## All LinkedIn Posts (12 Posts = 3 Weeks of Content)

### Post 1: "The Problem" (Day 4 — Monday)

**Hook**: "I spent 3 hours debugging why my JSON schema worked on GPT but crashed on Claude."

```
I spent 3 hours debugging why my JSON schema worked on GPT but crashed on Claude.

Turns out, each AI provider has completely different rules for structured outputs:

→ OpenAI: ALL fields must be "required". No exceptions.
→ Claude: Optional fields are fine. But pattern/format? Silently stripped.
→ Gemini: Ignores keywords it doesn't understand. No error. No warning.

There's no single place that documents these differences.

So I built one.

It validates your JSON schema against any provider's rules — instantly.
And auto-fixes the issues it finds.

Free. Open source. No signup.

Link in first comment.

What's the most frustrating API difference you've hit across AI providers?
```

**Visual**: Comparison table — 3 columns (OpenAI / Claude / Gemini), 5 rows of key differences. Dark background, provider logos, green checkmarks and red X marks.

**First comment**: "Here's the tool: [link]. Works as a web app, MCP server for Claude Code/Cursor, and CLI. Would love feedback."

---

### Post 2: "The Data Story" (Day 5 — Tuesday)

**Hook**: "I validated 300 real-world JSON schemas across 3 AI providers. The results shocked me."

```
I validated 300 real-world JSON schemas across 3 AI providers.

The results:

→ 67% of schemas that work on one provider FAIL on another
→ The #1 failure? "additionalProperties: false" — required by OpenAI, optional for others
→ The sneakiest issue? Gemini silently ignores constraints it doesn't support

Top 5 schema features that break across providers:
1. Optional fields (OpenAI says no)
2. String patterns (Claude strips them)
3. Numeric constraints (only OpenAI + Gemini)
4. allOf/oneOf (nobody supports them)
5. Root-level arrays (only Gemini)

I built an open-source validator that catches all of these before your users do.

What surprised you most?
```

**Visual**: Bar chart showing pass/fail rates per provider. "67% cross-provider failure rate" as headline stat.

---

### Post 3: "Behind the Scenes" (Day 6 — Wednesday)

**Hook**: "Building open source as a solo founder — here's what I learned the hard way."

```
6 months ago I started building an open-source tool for AI developers.

No team. No funding. Just a problem I kept hitting.

Every time I switched between OpenAI, Claude, and Gemini, my structured output schemas would break in different ways.

So I mapped every rule. Every constraint. Every silent failure.

Then I built a validator that catches them all.

Today it works as:
→ A web app (paste & validate)
→ An MCP server (validate from Claude Code / Cursor)
→ A CLI tool (validate in your pipeline)

The hardest part wasn't the code.
It was deciding what NOT to build.

If you're building with LLM structured outputs, I'd love to hear what problems you're hitting.
```

**Visual**: Screenshot of the web app with a schema being validated, showing error markers.

---

### Post 4: "The Checklist" (Day 7 — Thursday)

**Hook**: "Checklist: Is your JSON schema ready for production AI?"

```
Before shipping a JSON schema to any AI provider, check these 7 things:

☐ Root type is "object" (arrays only work on Gemini)
☐ All properties listed in "required" (OpenAI enforces this)
☐ "additionalProperties": false on every object
☐ No allOf, oneOf, not (none support these)
☐ No minLength/maxLength (none support these)
☐ $ref/$defs used correctly (nesting limits vary)
☐ Test with actual API, not just schema validation

Or... paste it into our free validator and get all of this in 2 seconds.

Save this post. You'll need it.

What would you add to this list?
```

**Visual**: Clean checklist graphic — dark background, each item with provider icons showing who it applies to.

---

### Post 5: "The Hot Take" (Day 11 — Monday)

**Hook**: "Structured outputs will kill prompt engineering. Here's why."

```
Hot take: Structured outputs will make prompt engineering mostly irrelevant.

Why?

Today: You craft elaborate prompts hoping the model returns the right format.
Tomorrow: You define a schema and the model is FORCED to comply.

No more "please return JSON".
No more parsing failures.
No more regex extraction.

The catch?
Each provider has different schema rules. And they're barely documented.

I mapped all of them:
→ 40 rules that differ across providers
→ Silent failures that look like success
→ Auto-fixes that save hours of debugging

The era of "schema engineering" is starting.

Agree or disagree?
```

**Visual**: Split image — left: chaotic prompt text with red errors. Right: clean JSON schema with green checkmarks. "Prompt Engineering → Schema Engineering" header.

---

### Post 6: "Schema Tip #1" (Day 12 — Tuesday)

**Hook**: "Schema Tip #1: Why anyOf works but oneOf doesn't on ANY provider"

```
Schema Tip #1:

You might think anyOf and oneOf are interchangeable.
They're not. In structured outputs, the difference is fatal.

→ anyOf: Supported by ALL 3 providers
→ oneOf: Supported by NONE of them

Why?

oneOf requires validating against exactly one subschema.
LLMs use constrained decoding — they can't "try all options and pick one."

anyOf is simpler: match at least one. The model picks the first valid path.

Quick fix: Replace every oneOf with anyOf.
But careful — semantics differ. anyOf allows matching multiple schemas.

Want your schema checked automatically? Free validator in comments.

Follow for weekly schema tips.
```

**Visual**: Diagram — anyOf (green, supported) vs oneOf (red, unsupported) with simple visual of how each works.

---

### Post 7: "The Silent Killer" (Day 13 — Wednesday)

**Hook**: "Your AI app has a bug. And you'll never see an error message."

```
Your AI app has a bug. And you'll never see an error message.

Here's what happens when you send an unsupported schema keyword to each provider:

OpenAI: Rejects the schema. Clear error. You fix it. Done.

Claude (Anthropic): SDK silently moves unsupported constraints into the description field. Your "minimum: 5" becomes a suggestion, not a rule. The model might ignore it.

Gemini (Google): Silently ignores the keyword entirely. No error. No warning. Your constraint just... doesn't exist.

This means your schema can "work" on all 3 providers while enforcing completely different rules on each.

The only way to catch this? Validate against each provider's actual constraints BEFORE calling the API.

That's exactly what our open-source tool does.

Have you been bitten by a silent schema failure?
```

**Visual**: Three-panel graphic showing the same schema keyword going through each provider — OpenAI (red error), Claude (yellow warning, transformed), Gemini (green but constraint missing).

---

### Post 8: "Real Example" (Day 14 — Thursday)

**Hook**: "Here's a real JSON schema. It passes on Gemini, fails on OpenAI, and silently breaks on Claude."

```
Here's a real JSON schema. Watch what happens on each provider:

{
  "type": "object",
  "properties": {
    "name": { "type": "string", "minLength": 1 },
    "age": { "type": "integer", "minimum": 0 },
    "email": { "type": "string", "pattern": "^.+@.+$" }
  }
}

OpenAI: REJECTED
→ Missing "required" array (must include ALL properties)
→ Missing "additionalProperties": false

Claude: "ACCEPTED" (but...)
→ minLength, minimum, pattern all silently moved to description
→ No actual validation of these constraints at runtime

Gemini: ACCEPTED
→ minimum works! But minLength and pattern are ignored
→ No error. No warning.

Same schema. Three completely different behaviors.

Our validator catches all 6 issues in under a second.

Ever had a schema that "worked" but didn't actually validate what you thought?
```

**Visual**: The JSON schema on the left, three columns showing what happens on each provider with red/yellow/green annotations.

---

### Post 9: "The MCP Angle" (Day 18 — Monday)

**Hook**: "I added schema validation to my editor. Now I catch issues before writing a single API call."

```
I added schema validation directly to my code editor.

Here's how (takes 2 minutes):

If you use Claude Code or Cursor:
1. Install our MCP server
2. Type "validate this schema" in chat
3. Get instant feedback: errors, warnings, and auto-fixes

No browser tab. No copy-paste. No context switching.

The MCP server exposes 3 tools:
→ validate_schema: Check against any provider's rules
→ fix_schema: Auto-fix common issues
→ list_groups: See all supported providers

It runs locally. No API calls. No data leaves your machine.

The fastest bug is the one you catch before running your code.

Are you using MCP servers in your workflow yet?
```

**Visual**: Screenshot/mockup of the MCP tool being used in an editor — showing the validation result inline.

---

### Post 10: "Schema Tip #2" (Day 19 — Tuesday)

**Hook**: "Schema Tip #2: The 'additionalProperties' trap that breaks 90% of schemas on OpenAI"

```
Schema Tip #2: The additionalProperties trap

OpenAI requires "additionalProperties": false on EVERY object in your schema.

Not just the root object. Every. Single. One.

Including:
→ Nested objects
→ Objects inside arrays
→ Objects inside anyOf branches
→ Objects in $defs

Miss one? Your entire schema is rejected.

Claude and Gemini? They don't require it. So if you develop on Claude first then deploy to OpenAI — surprise.

The fix is mechanical. Our validator's auto-fixer adds it to every object in one click.

But the real lesson: always validate against your target provider BEFORE deploying.

What's your most painful "works on my machine" moment with AI APIs?
```

**Visual**: Schema tree diagram showing all the nested objects that need additionalProperties: false, with arrows pointing to each one.

---

### Post 11: "The Comparison Post" (Day 20 — Wednesday)

**Hook**: "I mapped every JSON Schema feature across OpenAI, Claude, and Gemini. Here's the full table."

```
I mapped every JSON Schema feature across 3 AI providers.

Here's what I found:

SUPPORTED EVERYWHERE:
✅ type: object, string, number, boolean, array
✅ enum
✅ anyOf (nested, not at root)
✅ $ref and $defs
✅ Nullable types (["string", "null"])

SUPPORTED NOWHERE:
❌ allOf, oneOf, not
❌ if/then/else
❌ minLength, maxLength
❌ uniqueItems, contains
❌ patternProperties

THE TRICKY ONES:
⚡ pattern — OpenAI only
⚡ format — OpenAI (8 types), Gemini (3 types), Claude (none)
⚡ minimum/maximum — OpenAI + Gemini only
⚡ minItems/maxItems — OpenAI + Gemini only
⚡ Root arrays — Gemini only
⚡ Optional fields — Claude + Gemini only

Full interactive comparison at [tool link in comments].

Save this. Bookmark it. You'll need it.

Which difference surprised you most?
```

**Visual**: Full comparison table as a carousel (3-4 slides) or one dense infographic. Provider logos as column headers.

---

### Post 12: "Product Hunt Launch" (Day 25 — Launch Day)

**Hook**: "We just launched on Product Hunt. Here's why I built this."

```
Today we launched Strictly Structured on Product Hunt.

The backstory:

I was building an AI app that needed to work with OpenAI, Claude, AND Gemini.

Every time I changed providers, my JSON schemas would break.
Different rules. Different errors. Different silent failures.

So I built the tool I wished existed:
→ Paste a schema, pick a provider, get instant validation
→ Auto-fix issues with one click
→ Compare rules across all 3 providers
→ Use from your editor via MCP server

It's free. Open source. No signup required.

If you've ever struggled with structured output schemas, I'd love your support on Product Hunt today.

Link in first comment.

What would you want to see added next?
```

**Visual**: Product Hunt banner/card with the tool's logo, tagline, and a screenshot.

---

## LinkedIn Carousels (Detailed Slide Outlines)

### Carousel 1: "OpenAI vs Claude vs Gemini: Schema Rules" (Day 8)

| Slide     | Content                                                                                             |
| --------- | --------------------------------------------------------------------------------------------------- |
| 1 (Cover) | "OpenAI vs Claude vs Gemini: The JSON Schema Rules Nobody Tells You" — bold title, 3 provider logos |
| 2         | "Required Fields" — OpenAI: ALL must be required / Claude: Optional OK / Gemini: Optional OK        |
| 3         | "additionalProperties" — OpenAI: Mandatory false / Claude: Recommended / Gemini: Optional           |
| 4         | "Root Type" — OpenAI: Object only / Claude: Object only / Gemini: Object OR Array                   |
| 5         | "String Patterns" — OpenAI: Supported / Claude: Silently stripped / Gemini: Ignored                 |
| 6         | "Format Keywords" — OpenAI: 8 formats / Claude: None / Gemini: 3 formats                            |
| 7         | "Numeric Constraints" — OpenAI: min/max/multipleOf / Claude: None / Gemini: min/max only            |
| 8         | "What Happens on Failure" — OpenAI: Clear error / Claude: Silent transform / Gemini: Silent ignore  |
| 9 (CTA)   | "Validate your schema against all 3 in seconds. Free tool in comments."                             |

### Carousel 2: "5 Schema Mistakes That Silently Break Your AI App" (Day 15)

| Slide     | Content                                                                                  |
| --------- | ---------------------------------------------------------------------------------------- |
| 1 (Cover) | "5 JSON Schema Mistakes That Silently Break Your AI App"                                 |
| 2         | Mistake 1: "Using oneOf instead of anyOf" — No provider supports oneOf                   |
| 3         | Mistake 2: "Forgetting additionalProperties: false" — OpenAI rejects, others don't warn  |
| 4         | Mistake 3: "Adding string validation (minLength, pattern)" — Silently stripped on Claude |
| 5         | Mistake 4: "Making fields optional" — OpenAI requires ALL in required array              |
| 6         | Mistake 5: "Using allOf for composition" — Use anyOf or flatten instead                  |
| 7 (CTA)   | "Catch all 5 in seconds. Free validator in comments."                                    |

---

## Video Scripts

### Video 1: "Product Demo" (60 seconds) — For Product Hunt + LinkedIn

```
SCRIPT:

[0-5s] HOOK (text on screen + voiceover)
"Your JSON schema works on GPT. But does it work on Claude? On Gemini?"

[5-15s] THE PROBLEM (screen recording: browser showing API error)
"Each AI provider has different rules for structured outputs.
What works on one can silently fail on another."

[15-30s] THE SOLUTION (screen recording: pasting schema into tool)
"Strictly Structured validates your schema against any provider's rules — instantly."

(Show: paste a schema, select OpenAI, see red errors appear)
(Show: switch to Claude, see different warnings)
(Show: switch to Gemini, see different issues)

[30-40s] THE FIX (screen recording: clicking auto-fix)
"And it auto-fixes the issues it finds."

(Show: click "Fix All", see schema transform, errors disappear)

[40-50s] EDITOR INTEGRATION (screen recording or mockup)
"Works as a web app, MCP server for your editor, or CLI in your pipeline."

[50-60s] CTA (text on screen)
"Free. Open source. No signup.
Try it now — link in description."
```

**Production notes**:

- Screen record the actual web app
- AI voiceover via ElevenLabs (pick a professional, calm voice)
- Add subtle zoom animations on key interactions
- Background music: light electronic, low volume
- Tool: ScreenStudio or OBS for recording, CapCut or Descript for editing

---

### Video 2: "The Schema That Breaks on Every Provider" (30 seconds — LinkedIn/Shorts)

```
SCRIPT:

[0-3s] HOOK (bold text on screen)
"This schema breaks on EVERY AI provider. But differently."

[3-8s] SHOW THE SCHEMA (screen: JSON schema with problematic fields highlighted)
"Here's a simple schema with name, age, and email validation."

[8-13s] OPENAI (screen: red errors)
"OpenAI: REJECTED. Missing required fields and additionalProperties."

[13-18s] CLAUDE (screen: yellow warnings)
"Claude: Accepted... but minLength and pattern are silently stripped."

[18-23s] GEMINI (screen: mixed results)
"Gemini: Accepted... but ignores constraints it doesn't understand."

[23-28s] THE FIX (screen: one-click fix)
"One click. Fixed for all three."

[28-30s] CTA
"Free tool — link in bio."
```

**Production notes**:

- Fast cuts, punchy text overlays
- Each provider gets its brand color treatment (OpenAI green, Claude orange, Gemini blue)
- CapCut or Canva video editor
- Vertical format (9:16) for LinkedIn mobile + reusable on YouTube Shorts later

---

### Video 3: "MCP Server Setup" (90 seconds — Tutorial)

```
SCRIPT:

[0-5s] HOOK
"Add JSON schema validation to Claude Code in 2 minutes. Here's how."

[5-20s] WHAT IS IT
"Strictly Structured has an MCP server that validates your schemas right in your editor.
No browser. No copy-paste. Just ask Claude to validate."

[20-45s] INSTALLATION (screen recording of terminal)
"Step 1: Clone the repo."
(Show: git clone command)

"Step 2: Install dependencies."
(Show: pnpm install)

"Step 3: Add to your MCP config."
(Show: editing the MCP settings file, adding the server entry)

[45-70s] USING IT (screen recording of editor)
"Now in Claude Code, just say: validate this schema for OpenAI."

(Show: typing the command, seeing the validation result)

"It tells you exactly what's wrong and suggests fixes."

(Show: asking Claude to fix the schema, seeing the auto-fix applied)

[70-85s] ADVANCED
"You get 3 tools:
→ validate_schema — check any schema
→ fix_schema — auto-fix issues
→ list_groups — see all supported providers

Everything runs locally. No API calls. No data leaves your machine."

[85-90s] CTA
"GitHub link in description. Star the repo if it saved you time."
```

---

### Video 4: "Why Structured Outputs Change Everything" (45 seconds — Thought Leadership)

```
SCRIPT:

[0-5s] HOOK (dramatic text)
"Prompt engineering is dying. Here's what's replacing it."

[5-15s] THE OLD WAY
"Today, you write prompts like 'Please return JSON with these fields...'
And hope the model listens.
Sometimes it does. Sometimes you get broken JSON. Sometimes you get nothing."

[15-25s] THE NEW WAY
"Structured outputs FORCE the model to return exactly the schema you define.
No parsing. No retries. Guaranteed valid JSON."

[25-35s] THE CATCH
"But each AI provider has different schema rules.
What works on OpenAI breaks on Claude.
What works on Claude is silently wrong on Gemini."

[35-42s] THE SOLUTION
"I mapped every rule across every provider. And built a free validator."

[42-45s] CTA
"Link in comments."
```

---

### Video 5: "60-Second Data Story" (For LinkedIn — based on 300+ schemas)

```
SCRIPT:

[0-5s] HOOK (big number on screen)
"I validated 300+ real-world JSON schemas. Here are the numbers."

[5-12s] STAT 1 (animated counter)
"67% fail on at least one provider."

[12-19s] STAT 2 (bar chart animation)
"The #1 failure: missing additionalProperties: false.
Required by OpenAI. Optional everywhere else."

[19-26s] STAT 3 (pie chart animation)
"43% of schemas use features that get silently stripped by Claude.
The schema 'works' but your constraints don't."

[26-33s] STAT 4 (comparison animation)
"Gemini is the most permissive — 89% pass rate.
OpenAI is the strictest — 41% pass rate."

[33-40s] INSIGHT
"The worst part? Most developers don't know their schemas are broken.
Because 2 out of 3 providers don't tell you."

[40-48s] CTA
"Validate your schema for free. All 3 providers. In seconds.
Link in comments."
```

**Production notes**:

- Compute REAL numbers from your downloaded-samples data before recording
- Use animated charts (Remotion, After Effects, or Canva's animation features)
- Bold, large numbers on screen
- Quick pacing — one stat per beat

---

## Dev Community Posts (Detailed)

### Hacker News — "Show HN"

**Title**: "Show HN: Validate JSON schemas for OpenAI, Claude, and Gemini structured outputs"

```
I built a free tool to validate JSON schemas against LLM structured output requirements.

Each provider (OpenAI, Claude, Gemini) has different rules for what schemas they accept.
OpenAI requires all fields in "required". Claude silently strips pattern/format.
Gemini ignores unsupported keywords without errors.

This tool checks your schema against all provider rules and auto-fixes issues.

Available as:
- Web app: [link]
- MCP server for Claude Code / Cursor
- CLI tool

Open source: [GitHub link]

Built with Next.js, TypeScript, Firebase. Rule engine is fully client-side
(no API calls for basic validation). Tested against 300+ real-world schemas.
```

**Timing**: 3-4pm Israel time (8-9am US Eastern)
**Key**: Respond to every comment substantively. HN rewards technical depth.

### Reddit Posts

**r/LocalLLaMA** (Day 10):
Title: "I mapped every JSON Schema difference across OpenAI, Claude, and Gemini structured outputs — and built a validator"
Tone: Technical, show data, mention open source, include the comparison table.

**r/ChatGPTCoding** (Day 15):
Title: "Free tool to check if your JSON schema will work with OpenAI/Claude/Gemini before you waste API credits"
Tone: Practical, problem-focused, "here's a thing that saved me hours."

**r/webdev** (Day 20):
Title: "Building with AI APIs? Your JSON schemas are probably broken and you don't know it"
Tone: Educational, provocative hook, broad developer appeal.

### Dev.to Article

**Title**: "The Complete Guide to JSON Schema Compatibility Across AI Providers (2026)"

**Outline**:

1. Why structured outputs matter (200 words)
2. The problem: three providers, three rule sets (300 words + comparison table)
3. The 5 most common schema mistakes (500 words + code examples)
4. How to auto-fix your schemas (300 words + screenshots)
5. Using the validator in your IDE via MCP (200 words)
6. Full compatibility reference (table)
7. CTA: Try the tool (100 words)

---

## Budget: $250 Allocation

| Item                                                    | Budget | When                               |
| ------------------------------------------------------- | ------ | ---------------------------------- |
| LinkedIn Sponsored Posts (boost 2-3 best organic posts) | $150   | Days 15-30 (after organic testing) |
| Product Hunt extras (hunter outreach, Ship page)        | $50    | Day 22-25                          |
| One dev newsletter sponsorship (TLDR or similar)        | $50    | Day 25-30                          |

### LinkedIn Ads Specifics

- Wait until Day 12-15 to see which organic posts perform best
- Boost the top 2-3 performers with $50 each
- **Targeting**: Software Engineers, ML Engineers, AI Engineers in US/UK/EU/Israel
- **Format**: Sponsored Content (boosted post) — feels native
- **Pacing**: $10-15/day per post for 5-7 days

---

## 30-Day Sprint Timeline

| Day   | Action                  | Content                                                   |
| ----- | ----------------------- | --------------------------------------------------------- |
| 1-3   | **Foundation**          | GitHub README polish, LinkedIn profile update             |
| 4     | **Launch week 1**       | Post 1: "The Problem"                                     |
| 5     |                         | Post 2: "The Data Story"                                  |
| 6     |                         | Post 3: "Behind the Scenes"                               |
| 7     |                         | Post 4: "The Checklist"                                   |
| 8     |                         | Carousel 1: Provider Comparison                           |
| 9     |                         | HN "Show HN" post                                         |
| 10    |                         | Reddit: r/LocalLLaMA                                      |
| 11    | **Launch week 2**       | Post 5: "The Hot Take"                                    |
| 12    |                         | Post 6: "Schema Tip #1"                                   |
| 13    |                         | Post 7: "The Silent Killer"                               |
| 14    |                         | Post 8: "Real Example"                                    |
| 15    |                         | Carousel 2: "5 Mistakes" + Reddit: r/ChatGPTCoding        |
| 16-17 |                         | Dev.to article publish                                    |
| 18    | **Launch week 3**       | Post 9: "MCP Angle"                                       |
| 19    |                         | Post 10: "Schema Tip #2"                                  |
| 20    |                         | Post 11: "Comparison Post" + Reddit: r/webdev             |
| 21    |                         | Start LinkedIn ads on top performers ($150 over ~10 days) |
| 22-24 | **Product Hunt prep**   | Create PH page, prep assets, line up supporters           |
| 25    | **Product Hunt Launch** | Post 12: "PH Launch" + DM LinkedIn connections            |
| 26-28 | **Post-launch**         | Engage PH comments, share updates on LinkedIn             |
| 29-30 | **Analyze & plan**      | Review metrics, plan next month based on what worked      |

---

## Israel-Specific Opportunities

- **Israeli LinkedIn tech community**: Very active, supportive of local founders
- **Hebrew posts**: 1-2 in Hebrew for local engagement boost
- **Israeli tech meetups**: JTLV, ReactNext, DevOps Days TLV (pitch a lightning talk)
- **Israeli tech media**: Geektime, CTech — pitch the "solo founder building for AI devs" angle
- **WhatsApp groups**: Israeli startup/dev groups — share naturally, not spammy

---

## AI Content Production Pipeline

| Step              | Tool                      | Output                                    |
| ----------------- | ------------------------- | ----------------------------------------- |
| Post copy         | Claude                    | All 12 posts (done above)                 |
| Visual concepts   | Claude                    | Descriptions for each visual (done above) |
| Static visuals    | Midjourney/DALL-E + Canva | Infographics, comparison tables           |
| Carousels         | Canva AI or Gamma         | Multi-slide LinkedIn carousels            |
| Video scripts     | Claude                    | All 5 scripts (done above)                |
| Screen recordings | OBS / ScreenStudio        | Raw footage of tool in action             |
| Voiceover         | ElevenLabs                | Professional narration                    |
| Video editing     | CapCut / Descript         | Final videos with overlays                |
| Thumbnails        | Canva                     | Social cards for each post                |
| Scheduling        | LinkedIn native scheduler | Pre-schedule all posts                    |

### Batch Production Session

1. Generate all visuals in one Midjourney/Canva session (2-3 hours)
2. Record all screen captures in one session (1 hour)
3. Generate voiceovers for all 5 videos in one ElevenLabs session (30 min)
4. Edit all videos in one session (2-3 hours)
5. Schedule all posts in LinkedIn (30 min)

**Total production time**: ~1 full day to create a month of content.

---

## Success Metrics (30 days)

| Metric                            | Target  |
| --------------------------------- | ------- |
| GitHub stars                      | 100+    |
| LinkedIn post impressions (total) | 25,000+ |
| Web app visitors                  | 300+    |
| MCP server installs               | 50+     |
| Product Hunt upvotes              | 75+     |
| Dev.to article views              | 2,000+  |
| LinkedIn followers gained         | 150+    |

---

## Key Messaging

**Tagline**: "Strictly Structured — the linter for LLM structured outputs."

**Elevator pitch**: "Each AI provider has different rules for JSON schemas in structured outputs. OpenAI requires all fields as required. Claude silently strips unsupported keywords. Gemini ignores them entirely. I built Strictly Structured — a free, open-source toolset that validates and auto-fixes your schema for any provider — as a web app, in your editor, or in your CI pipeline."

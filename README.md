# Thriller Studio

Turn non-fiction topics into cinematic YouTube thriller screenplays.

A multi-phase production tool that combines AI-powered dramatic analysis with craft principles from 18+ storytelling masterclasses and books (Dan Brown, David Baldacci, Margaret Atwood, and more) to produce broadcast-ready screenplays with JSON visual production guides.

## How It Works

1. **Upload** -- Provide a topic and optional research materials
2. **Research** -- AI ingests and extracts dramatic elements
3. **Analysis** -- Receive 2-3 angle proposals with confidence ratings
4. **Questions** -- Answer targeted creative questions (protagonist, tone, hook style)
5. **Blueprint** -- Review and approve the story blueprint
6. **Generate** -- Full screenplay + JSON visual production guide

## Output

- **Screenplay** (Markdown) -- 20-30 min narration script with 5-act thriller structure
- **Production JSON** -- Scene-by-scene visual architecture for AI agents to assemble (stock footage cues, AI image prompts, motion graphic specs, transitions, sound design)

## Stack

- Next.js + TypeScript + Tailwind CSS
- Anthropic Claude API (Sonnet)
- Vercel-deployable

## Setup

```bash
npm install
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local
npm run dev
```

## Storytelling Principles

The AI engine is grounded in principles extracted from:
- Dan Brown MasterClass (Writing Thrillers)
- David Baldacci MasterClass (Mystery & Thriller Writing)
- Margaret Atwood MasterClass (Creative Writing)
- Writing & Selling Thriller Screenplays (Lucy V. Hay)
- Writing a Killer Thriller (Jodie Renner)
- Story Stakes, Story Climax, Trough of Hell, Inciting Incident
- Writing Active Hooks (Mary Buckham)
- The Art of Plotting, Writing the Character-Centered Screenplay
- Writing With Emotion, Tension & Conflict
- Plotting and Writing Suspense Fiction
- And more

## Channel References

Optimized for the style of: Magnates Media, ColdFusion, Business Casual, Fern, Company Man, Modern MBA, Kurzgesagt.

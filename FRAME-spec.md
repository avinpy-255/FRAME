# FRAME — A Writer’s Studio

## Product Specification v1.0

> Local-first creative writing software for screenwriters, indie filmmakers, and storytellers.
> Story to Screen. Locally.

-----

## TABLE OF CONTENTS

1. [Vision & Philosophy](#1-vision--philosophy)
1. [Tech Stack](#2-tech-stack)
1. [App Architecture](#3-app-architecture)
1. [File System & Storage Schema](#4-file-system--storage-schema)
1. [Data Models](#5-data-models)
1. [Screens & User Flows](#6-screens--user-flows)
1. [Feature Specs](#7-feature-specs)
- 7.1 Project Dashboard
- 7.2 Story Editor
- 7.3 Scene Board (3D Corkboard)
- 7.4 Flipbook Preview Mode
- 7.5 Screenplay Editor
- 7.6 Sketch Panel
- 7.7 Research Board
- 7.8 AI Assistant (Ollama)
- 7.9 Export Studio
1. [Design System](#8-design-system)
1. [3D & Animation Spec](#9-3d--animation-spec)
1. [Local API Spec](#10-local-api-spec)
1. [AI Integration Spec](#11-ai-integration-spec)
1. [Export System Spec](#12-export-system-spec)
1. [Keyboard Shortcuts](#13-keyboard-shortcuts)
1. [Development Phases](#14-development-phases)
1. [Project File Structure](#15-project-file-structure)

-----

## 1. VISION & PHILOSOPHY

### What FRAME Is

FRAME is a local-first creative writing environment built for writers who think visually. It follows the natural creative process: you think of an idea, you develop a story, you break it into scenes, you write the screenplay, and you attach visual references. Then when you’re ready — you ship a beautiful HTML presentation of your work to the world.

### Core Principles

- **Local-first, always.** Your stories live in your file system as readable files. No accounts, no cloud, no lock-in.
- **Process-driven.** The app enforces a creative workflow: Idea → Story → Scenes → Screenplay → Export. You move forward, not sideways.
- **Minimal surface, deep capability.** The UI surfaces only what you need at each stage. Every extra control is one interaction away, not always visible.
- **Own your data.** Projects are plain JSON + Markdown in a folder you can zip, copy, or version control.
- **The export is the product.** The HTML export is a beautifully designed pitch document / lookbook — something a director, producer, or collaborator can open in any browser.

### Who This Is For

- Indie screenwriters writing their first or tenth script
- Short film and YouTube series creators
- Storytellers who sketch, mood-board, and write simultaneously
- Solo creators who want a focused writing environment with no subscription

-----

## 2. TECH STACK

### Frontend

|Layer            |Technology                           |Reason                                                   |
|-----------------|-------------------------------------|---------------------------------------------------------|
|Framework        |React 18 + Vite                      |Fast HMR, modern JSX, great DX                           |
|Styling          |Tailwind CSS v3 + custom CSS         |Utility-first + custom 3D/animation CSS                  |
|3D Rendering     |React Three Fiber + @react-three/drei|Declarative Three.js for the scene board                 |
|Animations       |Framer Motion + GSAP                 |Framer for layout/transitions, GSAP for complex sequences|
|Screenplay Editor|ProseMirror (custom schema)          |Full control over screenplay element types               |
|Drawing Canvas   |Fabric.js                            |Stable, feature-rich canvas manipulation                 |
|Drag & Drop      |@dnd-kit/core + @dnd-kit/sortable    |Accessible, performant DnD                               |
|State Management |Zustand                              |Lightweight, no boilerplate                              |
|Routing          |React Router v6                      |SPA routing                                              |
|Icons            |Lucide React                         |Clean, consistent icon set                               |
|Fonts            |Playfair Display + DM Mono + DM Sans |Loaded via Google Fonts                                  |

### Backend (Local Server)

|Layer          |Technology                 |Reason                                          |
|---------------|---------------------------|------------------------------------------------|
|Runtime        |Node.js v20+               |Required for file system access                 |
|Server         |Express.js                 |Minimal, fast local API server                  |
|File I/O       |Node `fs/promises`         |Native, no dependencies                         |
|PDF Export     |Puppeteer (headless Chrome)|High-fidelity PDF rendering                     |
|File Watcher   |Chokidar                   |Watch project folder for external changes       |
|Process Manager|Concurrently               |Run frontend + backend together with one command|

### AI Integration

|Layer            |Technology                                                  |
|-----------------|------------------------------------------------------------|
|Local LLM        |Ollama REST API (`http://localhost:11434`)                  |
|Default Model    |`llama3.2` (configurable in settings)                       |
|Abstraction Layer|Custom `AIProvider` interface (swap Ollama for any provider)|

### Storage

|Type        |Technology                                      |
|------------|------------------------------------------------|
|Project data|Plain JSON files per project                    |
|Story text  |Markdown `.md` files                            |
|Assets      |Local filesystem (`/assets/` folder per project)|
|App settings|`~/.frame/config.json`                          |
|No database |Intentional — keeps it portable and inspectable |

-----

## 3. APP ARCHITECTURE

```
┌─────────────────────────────────────────────────────────┐
│                     FRAME APP                           │
│                                                         │
│  ┌──────────────────┐      ┌───────────────────────┐    │
│  │  React Frontend  │◄────►│  Express Local Server │    │
│  │  (Vite, port 5173│      │  (Node.js, port 3001) │    │
│  │                  │      │                       │    │
│  │  - Project UI    │      │  - File system R/W    │    │
│  │  - Story editor  │      │  - Asset serving      │    │
│  │  - Scene board   │      │  - Export generation  │    │
│  │  - Screenplay    │      │  - Project management │    │
│  │  - 3D canvas     │      │  - Ollama proxy       │    │
│  └──────────────────┘      └───────────────────────┘    │
│           │                          │                  │
│           ▼                          ▼                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Local File System                   │   │
│  │  ~/frame-projects/                               │   │
│  │  ├── my-film/                                    │   │
│  │  │   ├── meta.json                               │   │
│  │  │   ├── story.md                                │   │
│  │  │   ├── scenes.json                             │   │
│  │  │   ├── screenplay.json                         │   │
│  │  │   ├── research.json                           │   │
│  │  │   └── assets/                                 │   │
│  │  └── another-project/                            │   │
│  └──────────────────────────────────────────────────┘   │
│                          │                              │
│                          ▼                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Ollama (external, localhost:11434)        │   │
│  │         User must have Ollama installed           │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Startup Flow

```
npm start
  → concurrently starts:
      1. Express server on :3001
      2. Vite dev server on :5173
  → Browser opens automatically at http://localhost:5173
  → Express checks ~/frame-projects/ exists, creates if not
  → App loads project list from filesystem
```

### Production Build

```
npm run build
  → Vite builds frontend to /dist
  → Express serves /dist as static files on :3001
  → Single command: node server.js
  → App available at http://localhost:3001
```

-----

## 4. FILE SYSTEM & STORAGE SCHEMA

### Projects Root

Default: `~/frame-projects/` (configurable in settings)

### Project Folder Structure

```
~/frame-projects/
└── [project-slug]/                    ← kebab-case of project title
    ├── meta.json                      ← project metadata, settings
    ├── story.md                       ← full story document (markdown)
    ├── scenes.json                    ← all scene cards + order
    ├── screenplay.json                ← screenplay elements array
    ├── research.json                  ← research board items
    ├── characters.json                ← character profiles
    ├── snapshots/                     ← version snapshots
    │   ├── 2025-06-01T14:22:00.json  ← full project snapshot
    │   └── ...
    ├── assets/                        ← all media files
    │   ├── cover.jpg                  ← project cover
    │   ├── scene-[id]-sketch.png     ← sketches per scene
    │   ├── scene-[id]-ref.[ext]      ← uploaded reference per scene
    │   └── research-[id].[ext]       ← research board images
    └── exports/                       ← generated exports
        ├── [slug].html               ← hosted HTML export
        ├── [slug].pdf                ← screenplay PDF
        └── [slug].fountain           ← fountain format
```

### App Config

```
~/.frame/
└── config.json                        ← global app settings
```

-----

## 5. DATA MODELS

### config.json

```json
{
  "projectsRoot": "~/frame-projects",
  "theme": "dark",
  "ollamaUrl": "http://localhost:11434",
  "ollamaModel": "llama3.2",
  "aiEnabled": true,
  "autosaveInterval": 5000,
  "defaultActStructure": "three-act",
  "fontScale": 1.0,
  "recentProjects": ["slug1", "slug2"]
}
```

### meta.json

```json
{
  "id": "uuid-v4",
  "slug": "my-short-film",
  "title": "My Short Film",
  "logline": "A one-sentence pitch.",
  "synopsis": "A short paragraph.",
  "genre": ["drama", "thriller"],
  "format": "short-film",
  "status": "development | writing | revision | complete",
  "actStructure": "three-act | five-act | hero-journey | save-the-cat | custom",
  "color": "#C24B2A",
  "coverImage": "assets/cover.jpg",
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601",
  "wordCount": 0,
  "sceneCount": 0,
  "estimatedRuntime": 0,
  "tags": ["string"]
}
```

### scenes.json

```json
{
  "version": "1.0",
  "acts": [
    {
      "id": "uuid",
      "label": "Act 1",
      "color": "#hex",
      "order": 1
    }
  ],
  "scenes": [
    {
      "id": "uuid-v4",
      "title": "The Opening",
      "synopsis": "Brief description of what happens.",
      "location": "INT | EXT | INT/EXT",
      "locationName": "DETECTIVE'S OFFICE",
      "timeOfDay": "DAY | NIGHT | DAWN | DUSK | CONTINUOUS | LATER",
      "characters": ["DETECTIVE MARS", "UNKNOWN CALLER"],
      "tone": "tension | comedy | drama | action | quiet | transition | mystery",
      "act": "uuid-of-act",
      "order": 0,
      "color": "#hex",
      "sketchPath": "assets/scene-uuid-sketch.png",
      "referencePath": "assets/scene-uuid-ref.jpg",
      "notes": "Director notes, ideas...",
      "screenplayRef": "uuid-of-screenplay-scene-heading",
      "beatTag": "inciting-incident | midpoint | climax | resolution | custom",
      "conflictLevel": 0,
      "createdAt": "ISO-8601",
      "updatedAt": "ISO-8601"
    }
  ]
}
```

### screenplay.json

```json
{
  "version": "1.0",
  "title": "My Short Film",
  "author": "Writer Name",
  "contact": "email@example.com",
  "draftNumber": 1,
  "elements": [
    {
      "id": "uuid-v4",
      "sceneId": "uuid | null",
      "type": "scene-heading | action | character | dialogue | parenthetical | transition | shot | titlepage | note",
      "content": "INT. DETECTIVE'S OFFICE - DAY",
      "order": 0,
      "locked": false,
      "revisionMark": "none | added | changed | deleted",
      "notes": "Writer's note on this element"
    }
  ],
  "revisionHistory": [
    {
      "draftNumber": 1,
      "date": "ISO-8601",
      "changes": 0
    }
  ]
}
```

### characters.json

```json
{
  "characters": [
    {
      "id": "uuid",
      "name": "DETECTIVE MARS",
      "displayName": "Detective Mars",
      "age": "35-40",
      "role": "protagonist | antagonist | supporting | minor",
      "bio": "Rich text biography",
      "arc": "Character transformation description",
      "color": "#hex",
      "imagePath": "assets/char-uuid.jpg",
      "firstScene": "scene-uuid",
      "traits": ["string"],
      "notes": "string"
    }
  ]
}
```

### research.json

```json
{
  "items": [
    {
      "id": "uuid",
      "type": "image | link | note | color-swatch",
      "title": "string",
      "content": "URL or note text",
      "filePath": "assets/research-uuid.jpg | null",
      "tags": ["mood", "location", "costume"],
      "linkedScenes": ["scene-uuid"],
      "createdAt": "ISO-8601"
    }
  ],
  "boards": [
    {
      "id": "uuid",
      "name": "Mood Board",
      "color": "#hex",
      "itemIds": ["uuid"]
    }
  ]
}
```

-----

## 6. SCREENS & USER FLOWS

### Screen Map

```
FRAME
├── / ─────────────────── Project Dashboard (home)
├── /new ─────────────── New Project Wizard
└── /project/:slug
    ├── /story ─────────── Story Editor
    ├── /scenes ────────── Scene Board
    │   └── ?mode=flipbook ← Flipbook Preview
    ├── /screenplay ───── Screenplay Editor + Sketch Panel
    ├── /characters ───── Character Profiles
    ├── /research ──────── Research Board
    ├── /export ────────── Export Studio
    └── /settings ──────── Project Settings
```

### Primary User Flow

```
New Project Wizard
  ↓
Story Editor (write the full story / treatment)
  ↓
Scene Board (break into cards, sequence them)
  ↓  ← can preview in Flipbook mode at any time
Screenplay Editor (write with side-by-side sketches)
  ↓
Export Studio (generate HTML, PDF, Fountain)
  ↓
Share / Host HTML file
```

### Navigation Architecture

- **Global Sidebar** (icon-only, 48px wide): appears on all project screens
  - Logo / Home
  - Story
  - Scenes
  - Screenplay
  - Characters
  - Research
  - Export
  - AI Assistant (slide-out panel)
  - Settings
- **Top Bar** (per screen): breadcrumb, project title, autosave indicator, undo/redo
- **Sidebar expands** on hover to show labels (200px), collapses to icons at rest

-----

## 7. FEATURE SPECS

-----

### 7.1 PROJECT DASHBOARD

**Route:** `/`
**Purpose:** Entry point, project management

#### Layout

- Full-screen dark canvas
- Grid of project cards (3-4 per row, responsive)
- Floating “New Project” button (bottom-right)
- Minimal header: FRAME logo + global search

#### Project Card

- Shows: cover image (or generated gradient), title, format badge, status, last edited date, word count
- Hover state: slight 3D tilt (CSS perspective transform), reveal quick-action buttons
- Click: navigate to project’s last active screen
- Right-click / long-press: context menu (Rename, Duplicate, Delete, Open in Finder)

#### New Project Wizard

Multi-step modal:

1. **Title + Format** — Title input, format selector (Short Film / Series Episode / Feature / Documentary)
1. **Story Setup** — Logline, genre tags, act structure selector
1. **Visual Identity** — Pick project accent color or cover image
1. Creates folder structure, initializes all JSON files, navigates to Story Editor

#### Search

- Search across all projects by title, logline, character names, scene synopses
- Reads from `meta.json` of each project (fast)
- Keyboard: `Cmd/Ctrl + K` opens search from anywhere in the app

-----

### 7.2 STORY EDITOR

**Route:** `/project/:slug/story`
**Purpose:** Write the full story treatment / story document before breaking it into scenes

#### Layout

```
┌─────────────────────────────────────────────────────┐
│ [sidebar] │  [story editor — full width prose]       │
│           │                                          │
│           │  ┌──────────────────────────────────┐   │
│           │  │  TITLE                           │   │
│           │  │  ────────────────────────        │   │
│           │  │                                  │   │
│           │  │  [Typewriter-style text area]    │   │
│           │  │                                  │   │
│           │  └──────────────────────────────────┘   │
│           │                [word count]  [save]      │
└─────────────────────────────────────────────────────┘
```

#### Story Editor Features

- Rich text editor built on ProseMirror with a custom minimal schema
- Supported elements: H1 (Act/Section headers), H2 (Scene markers), Paragraph, Blockquote (notes/asides), Bold, Italic, Highlight
- **Focus Mode:** `F11` or button — removes sidebar, shows only text, subtle film-grain background overlay, text width constrained to 680px, centered
- **Typewriter Mode:** Activates in Focus Mode — keeps current line vertically centered as you type
- **Section Navigator:** Floating panel (toggle) showing all H1/H2 headers as a clickable table of contents
- **Word Count Bar:** Bottom of screen — total words, estimated read time, estimated screen time (1 page ≈ 1 min)
- **Autosave:** Every 5 seconds to `story.md`, debounced
- **“Break Into Scenes” Button:** Analyzes the story document, finds section/paragraph breaks, pre-populates scene cards as a starting point. User reviews and confirms.

#### Story DNA Sidebar (toggle, right side)

When open, shows a 260px panel with:

- Character list (quick-add + link to Characters screen)
- Location list (auto-extracted from text)
- Theme tags (user-added)
- Story spine / beat sheet overlay (toggle)

-----

### 7.3 SCENE BOARD — 3D CORKBOARD MODE

**Route:** `/project/:slug/scenes`
**Default view:** Board (3D corkboard)

#### Overview

The scene board is the visual brain of the project. Each scene is a physical card on a dark, slightly textured 3D surface. Cards can be dragged to reorder within acts, moved between acts, and flipped to reveal details.

#### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [sidebar] │  [toolbar: Add Card | View: Board/Flip | Filter] │
│           │─────────────────────────────────────────────────│
│           │                                                  │
│           │   ACT 1          ACT 2           ACT 3          │
│           │  ┌──────────┐   ┌──────────┐   ┌──────────┐    │
│           │  │ [card]   │   │ [card]   │   │ [card]   │    │
│           │  │ [card]   │   │ [card]   │   │ [card]   │    │
│           │  │ [card]   │   │ [card]   │   │ [card]   │    │
│           │  │ [+ add]  │   │ [+ add]  │   │ [+ add]  │    │
│           │  └──────────┘   └──────────┘   └──────────┘    │
│           │                                                  │
│           │  [Emotional Arc Visualizer — bottom bar]         │
└─────────────────────────────────────────────────────────────┘
```

#### 3D Scene Board Canvas (React Three Fiber)

- **Background:** Dark space (#070708) with subtle floating dust particles (Three.js Points geometry)
- **Cork surface:** Three.js Plane with cork texture or dark linen texture, slight 3D perspective angle (rotateX -15deg)
- **Act columns:** Vertical dividers rendered as thin glowing lines in 3D space
- **Scene cards:** Three.js Mesh (PlaneGeometry) with canvas texture rendering card content
- **Card shadows:** Soft drop shadow via Three.js sprite-based shadow
- **Ambient lighting:** dim, directional light from top-left casting card shadows
- **Camera:** OrthographicCamera for precise 2D positioning, slight perspective tilt
- **Interaction:** Raycasting for hover/click detection on cards

#### Scene Card — Front Face

```
┌────────────────────────────┐
│ [tone color bar — 4px top] │
│                            │
│ SCENE 04                   │
│ ─────────────────          │
│ The Confrontation          │
│                            │
│ INT. ROOFTOP — NIGHT       │
│                            │
│ MARS · CHEN                │
│                            │
│ [thumbnail / sketch]       │
│                            │
│ ○ ○ ○ [beat tag]           │
└────────────────────────────┘
```

#### Scene Card — Back Face (on flip)

- Full synopsis text
- Notes field (editable inline)
- Linked screenplay scenes (jump button)
- Characters list
- Conflict level indicator (1-5 dots)
- “Open in Screenplay” button
- Delete / Duplicate actions

#### Card Flip Interaction

- Click card: 3D Y-axis flip animation (CSS `transform: rotateY(180deg)` OR Three.js rotation tween via GSAP)
- 600ms ease-in-out curve
- Front shows summary; back shows detail + edit form

#### Drag to Reorder

- Built with @dnd-kit for accessibility + smooth DnD within and between act columns
- While dragging: card rises (z-index + shadow increase), other cards shift to show drop position
- Drop: smooth reorder animation using Framer Motion layout animations
- Auto-saves order on drop

#### Toolbar

- **+ Add Scene** — creates new card at end of current act, opens back-face editor
- **View Toggle** — Board / Flipbook (switches to Flipbook mode)
- **Filter** — by tone, by character, by act, by beat tag
- **Beat Sheet Overlay** — toggles beat sheet labels (Save the Cat / 3-Act / Hero’s Journey) over act columns
- **Emotional Arc Visualizer** — bottom bar chart showing tone per scene as a curve

#### Emotional Arc Visualizer

- Recharts LineChart at bottom of board
- X-axis: scene order; Y-axis: tone value (quantified: tension=5, action=4, drama=3, comedy=2, quiet=1, transition=0)
- Line colored by act
- Click a point to highlight that scene card

#### Beat Sheet Overlay

- Toggle button in toolbar
- Shows labeled vertical zones over act columns: “Inciting Incident,” “Plot Point 1,” “Midpoint,” etc.
- Renders as semi-transparent labels in 3D space
- Configurable: choose beat sheet model in project settings

-----

### 7.4 FLIPBOOK PREVIEW MODE

**Route:** `/project/:slug/scenes?mode=flipbook`
**Purpose:** Experience your scenes as a sequential story — like flipping through index cards

#### Layout

```
┌─────────────────────────────────────────────────────┐
│ [sidebar] │  [← PREV]   SCENE 4 / 12   [NEXT →]    │
│           │─────────────────────────────────────────│
│           │                                          │
│           │         ┌──────────────────────┐        │
│           │         │                      │        │
│           │         │     [CARD FRONT]     │        │
│           │         │                      │        │
│           │         └──────────────────────┘        │
│           │                                          │
│           │    [progress dots: ● ● ○ ○ ○ ○ ○]       │
│           │                                          │
│           │    [Autoplay]  [Speed: —○—]  [Loop]      │
└─────────────────────────────────────────────────────┘
```

#### Flipbook Animation

- Card is a large 3D card in the center of screen (perspective 1000px)
- **NEXT:** card flips right-to-left (rotateY 0 → -180deg), new card enters from right
- **PREV:** card flips left-to-right
- Animation: GSAP timeline, 500ms, ease: `power3.inOut`
- Physical feel: slight page curl shadow at the flip edge (CSS + box-shadow trick)
- Card shows: large scene title, full synopsis, location/time, characters, sketch image if exists
- Keyboard: arrow keys navigate; Space toggles autoplay

#### Autoplay Mode

- Speed control: 1x / 2x / 3x (seconds per card)
- Loop option
- Full-screen button (removes sidebar for presentation mode)
- Useful for pitching a story: walk a collaborator through scenes like a slideshow

-----

### 7.5 SCREENPLAY EDITOR

**Route:** `/project/:slug/screenplay`
**Purpose:** Write the formatted screenplay with visual references side-by-side

#### Layout (Split Panel)

```
┌─────────────────────────────────────────────────────────────┐
│ [sidebar] │  [toolbar]                                       │
│           │──────────────────────────────────────────────── │
│           │                         │                        │
│           │  SCREENPLAY EDITOR      │  SKETCH PANEL          │
│           │  (60% width)            │  (40% width)           │
│           │                         │                        │
│           │  INT. COFFEE SHOP - DAY │  [Canvas/Image area]   │
│           │                         │                        │
│           │  MARS walks in, tired.  │  [Scene sketch here]   │
│           │  The place is empty.    │                        │
│           │                         │  [Upload] [Draw]       │
│           │       MARS              │                        │
│           │  You're late, Chen.     │                        │
│           │                         │                        │
│           │                         │                        │
└─────────────────────────────────────────────────────────────┘
```

- Panel divider is draggable (resize split)
- Option: collapse sketch panel to full-screen screenplay mode
- Scene headings auto-scroll the sketch panel to that scene’s associated sketch

#### Screenplay Editor (ProseMirror)

ProseMirror with a custom screenplay schema. Elements:

|Element      |Formatting                        |Keyboard Shortcut              |
|-------------|----------------------------------|-------------------------------|
|Scene Heading|ALL CAPS, bold, left-aligned      |`Cmd+1` or `Tab` at start      |
|Action       |Normal text, full width           |`Cmd+2`                        |
|Character    |ALL CAPS, centered, 3.5” from left|`Cmd+3` or `Enter` after action|
|Dialogue     |Centered block, 2.5” margins      |auto after Character           |
|Parenthetical|Centered, (italic), narrow        |`Cmd+4`                        |
|Transition   |ALL CAPS, right-aligned           |`Cmd+5`                        |
|Shot         |ALL CAPS, left-aligned            |`Cmd+6`                        |
|Note         |Highlighted, non-printing         |`Cmd+7`                        |

#### Smart Formatting Behavior

- Type `INT.` or `EXT.` → auto-formats as Scene Heading
- Press `Enter` after Character name → auto-formats next line as Dialogue
- Press `Enter` twice from Dialogue → returns to Action
- `Tab` cycles through element types: Action → Character → Dialogue → Parenthetical → Action
- Scene headings auto-populate a left-side navigator (scene list panel)
- Character names auto-complete from `characters.json`
- Location names auto-complete from previously used sluglines

#### Screenplay Navigator (left panel, collapsible)

- Scene list extracted from all Scene Headings
- Click to jump to scene
- Shows character list (auto-detected from CHARACTER elements)
- Shows location list (auto-detected from INT./EXT. lines)
- Word count, page count estimate (1 page ≈ 1 min)

#### Revision Mode

- Toggle revision tracking ON/OFF
- Changed lines marked with `*` in margin (standard WGA format)
- Color-coded revision rounds (standard: Blue, Pink, Yellow, Green, Goldenrod)
- Show/hide revisions toggle
- “New Draft” button: increments draft number, archives current to snapshots, clears revision marks

#### Character Color Highlighting

- Each character’s dialogue highlighted in their assigned color (from `characters.json` color field)
- Toggle on/off from toolbar
- Helps quickly spot dialogue imbalance

-----

### 7.6 SKETCH PANEL

**Purpose:** Visual reference / storyboard panel alongside the screenplay

#### Panel States

1. **Empty state** — shows “Upload image or Draw” prompt
1. **Image loaded** — shows uploaded/sketched image with replace/clear buttons
1. **Drawing mode** — Fabric.js canvas with drawing tools

#### Sketch Navigation

- **Scene-locked:** Each Scene Heading in the screenplay has its own sketch slot
- When you scroll to a Scene Heading, the sketch panel auto-displays that scene’s sketch
- Indicator: scene number + title shown above sketch area
- Thumbnail strip at bottom of sketch panel: all scenes’ sketches in order (click to jump)

#### Drawing Tools (Fabric.js)

|Tool        |Icon|Behavior                                |
|------------|----|----------------------------------------|
|Pen         |✏️   |Freehand draw, configurable size + color|
|Marker      |🖊️   |Thicker stroke, slight opacity          |
|Eraser      |◻️   |Erase by stroke                         |
|Rectangle   |▭   |Draw rectangle shape                    |
|Ellipse     |○   |Draw circle/ellipse                     |
|Line        |/   |Straight line                           |
|Text        |T   |Add text label                          |
|Move        |✋   |Select and move objects                 |
|Color Picker|🎨   |Foreground color                        |
|Line Width  |≡   |Stroke size slider                      |
|Undo / Redo |↩   |Per-sketch history                      |
|Clear       |🗑️   |Clear entire canvas                     |
|Export      |↗   |Save as PNG to scene assets             |

#### Upload Mode

- Click “Upload Image” → native file picker (PNG, JPG, WEBP, GIF)
- Drag-and-drop image onto sketch panel
- Image stored in `assets/scene-[id]-ref.[ext]`
- Can switch between “view sketch” and “view reference” for same scene

#### Sketch Auto-Save

- Fabric.js canvas state serialized to JSON on every change, debounced 1s
- On save: render canvas to PNG, save to `assets/scene-[id]-sketch.png`
- PNG version used in scene cards and HTML export

-----

### 7.7 RESEARCH BOARD

**Route:** `/project/:slug/research`
**Purpose:** Visual mood board, reference collection, notes

#### Layout

- Pinterest-style masonry grid of research items
- Left panel: Board selector (create multiple boards: “Mood”, “Locations”, “Costumes”, etc.)
- Toolbar: Add Image / Add Link / Add Note / Add Color Swatch / Filter by tag

#### Research Item Card

- Image items: full image, hover to reveal title + tags + linked scenes
- Link items: URL preview card with favicon, title, description
- Note items: text card with background color
- Color swatch: large color block with hex value

#### Adding Items

- **Image:** Upload file or paste URL → fetches and stores locally
- **Link:** Paste URL → backend fetches Open Graph metadata (title, image, description)
- **Note:** Rich text input (no formatting, just text + background color)
- **Color Swatch:** Color picker

#### Linking Items to Scenes

- Each research item can be linked to one or more scene cards
- In the Scene Board, cards with linked research show a small 🔗 indicator
- Click indicator on scene card: opens mini research panel showing linked items

-----

### 7.8 AI ASSISTANT (OLLAMA)

**Route:** Slide-out panel, accessible from sidebar icon anywhere
**Trigger:** Sidebar AI icon, or text selection → right-click → “AI Action”

#### Setup Check

On first AI action: check if Ollama is running (`GET http://localhost:11434/api/tags`)

- If running: show available models, let user select
- If not running: show instructions to install Ollama, link to ollama.com

#### AI Panel Layout

```
┌────────────────────────────┐
│  🤖 AI ASSISTANT           │
│  Model: llama3.2     [▼]   │
│─────────────────────────── │
│  [Context: Current scene]  │
│                            │
│  [Chat history area]       │
│                            │
│                            │
│─────────────────────────── │
│  [Type a message...]  [→]  │
└────────────────────────────┘
```

#### Context Awareness

The AI panel automatically includes relevant context based on current screen:

- **Story Editor:** injects current story text (truncated to ~2000 tokens)
- **Scene Board:** injects scene list summary
- **Screenplay Editor:** injects current scene’s text + surrounding 2 scenes
- Context displayed as a badge (“Context: Act 2, Scene 4”) — user can clear it

#### Suggested Prompts (context-aware chips)

Shown as clickable chips above the input:

- On Story Editor: “Suggest a plot twist”, “Strengthen the theme”, “Write an alternate ending”
- On Scene Board: “Find missing scenes”, “Check my act structure”, “Suggest a new scene”
- On Screenplay: “Polish this dialogue”, “Shorten this action line”, “Suggest a visual for this scene”

#### Text Selection Actions

Select text in the Story or Screenplay editor:
Right-click menu shows:

- “Rewrite this” → AI rewrites selected text, shows diff, user approves
- “Make more visual” → AI rewrites with more visual/cinematic language
- “Tighten this” → AI shortens without losing meaning
- “Continue from here” → AI writes the next beat

#### AI Provider Interface (for future extensibility)

```javascript
// AIProvider interface — swap Ollama for any backend
interface AIProvider {
  chat(messages: Message[], options: Options): Promise<string>
  stream(messages: Message[], options: Options): AsyncGenerator<string>
  isAvailable(): Promise<boolean>
  listModels(): Promise<string[]>
}

// Implementations:
class OllamaProvider implements AIProvider { ... }
class AnthropicProvider implements AIProvider { ... }  // future
class OpenAIProvider implements AIProvider { ... }      // future
```

-----

### 7.9 EXPORT STUDIO

**Route:** `/project/:slug/export`
**Purpose:** Generate publishable outputs from your project

#### Export Options

##### HTML Lookbook Export (Primary Export)

A single self-contained `.html` file (no external dependencies) that renders a beautiful, cinematic presentation of the project.

Sections included in HTML export:

1. **Title Page** — Project title, logline, format, author
1. **Story** — Full story text (from `story.md`) rendered as styled prose
1. **Scene Flipbook** — Interactive flipbook in HTML/CSS/JS (no React dependency) — reader can click through scenes
1. **Screenplay** — Full screenplay in proper formatted style (optional: include or exclude)
1. **Sketches Gallery** — Scene-by-scene sketch/reference images

HTML export visual design:

- Dark cinematic theme (matches app aesthetic)
- Google Fonts CDN link OR font embedded as base64 (offline mode option)
- Responsive design
- Print-friendly CSS (`@media print`)
- No server required — open the `.html` file in any browser

##### PDF Export

- Screenplay-only PDF in proper Hollywood format (letter size, correct margins, Courier Prime 12pt)
- Generated via Puppeteer (headless Chrome renders a screenplay-formatted HTML, then prints to PDF)
- Includes title page, page numbers, revision marks if present

##### Fountain Export

- Industry-standard plain text screenplay format (`.fountain`)
- Compatible with Highland 2, Final Draft, Fade In, WriterDuet
- Converts screenplay JSON elements to Fountain markup

##### JSON/Markdown Export

- Full project data export (for backup or migration)
- Exports entire project folder as a `.zip`

#### Export Studio UI

```
┌──────────────────────────────────────────────────────┐
│  EXPORT STUDIO                                       │
│                                                      │
│  ┌──────────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  🌐 HTML     │  │ 📄 PDF   │  │ 📝 Fountain   │  │
│  │  Lookbook    │  │ Screenplay│  │ (.fountain)   │  │
│  │             │  │          │  │               │  │
│  │  [Configure] │  │ [Export] │  │ [Export]      │  │
│  │  [Preview]  │  │          │  │               │  │
│  │  [Export]   │  │          │  │               │  │
│  └──────────────┘  └──────────┘  └───────────────┘  │
│                                                      │
│  Recent Exports:                                     │
│  my-film.html     — 2025-06-01  [Open] [Copy Path]  │
│  my-film.pdf      — 2025-05-28  [Open] [Copy Path]  │
└──────────────────────────────────────────────────────┘
```

#### HTML Export Configuration

- Toggle: include story text (Y/N)
- Toggle: include scene flipbook (Y/N)
- Toggle: include screenplay (Y/N)
- Toggle: include sketch images (Y/N)
- Theme selector: Dark / Light / Sepia
- Font preference: Serif / Mono / Sans
- Cover image: use project cover or custom upload
- Author / contact info for title page

-----

## 8. DESIGN SYSTEM

### Concept

**Cinematic Noir** — Dark, atmospheric, tactile. Inspired by the physical objects of filmmaking: film canisters, corkboards, index cards, moleskin notebooks, light leaks. The UI should feel like a director’s workspace at 2am.

### Color Palette

|Token                     |Hex      |Usage                                 |
|--------------------------|---------|--------------------------------------|
|`--color-void`            |`#070708`|App background, deepest dark          |
|`--color-surface`         |`#0F0F11`|Card backgrounds, panels              |
|`--color-surface-raised`  |`#161618`|Elevated surfaces, modals             |
|`--color-border`          |`#242428`|Dividers, card outlines               |
|`--color-border-subtle`   |`#1A1A1C`|Very subtle separators                |
|`--color-text`            |`#F2F0EB`|Primary text (warm off-white)         |
|`--color-text-muted`      |`#8A8880`|Secondary text                        |
|`--color-text-faint`      |`#4A4845`|Placeholder, disabled                 |
|`--color-gold`            |`#E8C547`|Primary accent (film leader gold)     |
|`--color-gold-dim`        |`#A88A2A`|Accent hover/active                   |
|`--color-red`             |`#C24B2A`|Danger, tension tone, secondary accent|
|`--color-scene-tension`   |`#C24B2A`|Tone: tension                         |
|`--color-scene-action`    |`#D4742A`|Tone: action                          |
|`--color-scene-drama`     |`#6B7FD4`|Tone: drama                           |
|`--color-scene-comedy`    |`#4BA86B`|Tone: comedy                          |
|`--color-scene-quiet`     |`#6B8A9E`|Tone: quiet                           |
|`--color-scene-transition`|`#7A6B8A`|Tone: transition                      |

### Typography

|Role                    |Font              |Weight  |Size        |
|------------------------|------------------|--------|------------|
|Display / Project titles|`Playfair Display`|700     |32–64px     |
|Screenplay text         |`DM Mono`         |400     |12px (fixed)|
|UI body                 |`DM Sans`         |400, 500|14–16px     |
|Scene card title        |`Playfair Display`|600     |14px        |
|Monospace utility       |`DM Mono`         |400     |12–13px     |
|Numbers / stats         |`DM Mono`         |300     |varies      |

```css
/* Load via Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Mono:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@300;400;500&display=swap');
```

### Spacing Scale

Using 4px base unit: `4, 8, 12, 16, 24, 32, 48, 64, 96px`

### Border Radius

|Token        |Value |Usage              |
|-------------|------|-------------------|
|`--radius-sm`|`4px` |Badges, small chips|
|`--radius-md`|`8px` |Buttons, inputs    |
|`--radius-lg`|`12px`|Cards, panels      |
|`--radius-xl`|`16px`|Modals             |

### Shadows

```css
--shadow-card: 0 4px 24px rgba(0,0,0,0.6);
--shadow-card-hover: 0 8px 40px rgba(0,0,0,0.8);
--shadow-modal: 0 24px 80px rgba(0,0,0,0.9);
--shadow-glow-gold: 0 0 20px rgba(232,197,71,0.15);
```

### Film Grain Texture

Applied as a CSS pseudo-element overlay on dark surfaces:

```css
.film-grain::after {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url('/textures/grain.png'); /* Tileable noise PNG */
  opacity: 0.04;
  pointer-events: none;
  z-index: 9999;
}
```

### Component Library

#### Button

```
Primary:   bg-gold, text-void, font-medium — "Export"
Secondary: bg-transparent, border-border, text-text — "Cancel"
Ghost:     bg-transparent, no border, text-muted — hover shows bg-surface-raised
Danger:    bg-red/20, text-red — "Delete"
```

#### Input / Textarea

```
bg-surface, border-border, text-text
focus: border-gold, box-shadow: 0 0 0 3px rgba(gold, 0.1)
placeholder: text-faint
```

#### Scene Card (CSS version for flipbook HTML export)

```css
.scene-card {
  width: 220px;
  min-height: 300px;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  border-top: 4px solid [tone-color];
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
```

-----

## 9. 3D & ANIMATION SPEC

### Scene Board — Three.js Setup

```javascript
// React Three Fiber scene setup
const SceneBoard = () => (
  <Canvas
    camera={{ position: [0, 8, 14], fov: 45 }}
    shadows
    dpr={[1, 2]}
  >
    <ambientLight intensity={0.3} />
    <directionalLight
      position={[-5, 10, 5]}
      intensity={0.8}
      castShadow
    />
    <CorkBoard />        {/* Textured plane */}
    <ActDividers />      {/* Glowing vertical lines */}
    <SceneCards />       {/* All draggable cards */}
    <DustParticles />    {/* Ambient floating particles */}
    <OrbitControls
      enableRotate={false}  /* No orbit — just pan/zoom */
      enablePan={true}
      enableZoom={true}
      minZoom={0.5}
      maxZoom={2}
    />
  </Canvas>
)
```

### Card Flip Animation (GSAP)

```javascript
const flipCard = (cardRef, direction = 'forward') => {
  const tl = gsap.timeline()
  tl.to(cardRef.rotation, {
    y: direction === 'forward' ? Math.PI : 0,
    duration: 0.6,
    ease: 'power3.inOut'
  })
}
```

### Page Transitions (Framer Motion)

```javascript
// Route transition wrapper
const pageVariants = {
  initial: { opacity: 0, y: 8, filter: 'blur(4px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: 'blur(4px)',
    transition: { duration: 0.3 }
  }
}
```

### Flipbook Page Turn (CSS + GSAP)

```javascript
const turnPage = (direction) => {
  const tl = gsap.timeline()
  // Outgoing card
  tl.to('.current-card', {
    rotateY: direction === 'next' ? -180 : 180,
    duration: 0.5,
    ease: 'power3.in',
    transformOrigin: direction === 'next' ? 'left center' : 'right center'
  })
  // Incoming card (starts from opposite side)
  tl.fromTo('.next-card',
    { rotateY: direction === 'next' ? 180 : -180 },
    { rotateY: 0, duration: 0.5, ease: 'power3.out' },
    '-=0.2'  // slight overlap
  )
}
```

### Project Dashboard Card Hover (CSS)

```css
.project-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  transform-style: preserve-3d;
}
.project-card:hover {
  transform: perspective(800px) rotateX(-4deg) rotateY(4deg) translateY(-4px);
  box-shadow: 12px 20px 48px rgba(0,0,0,0.7);
}
```

### Dust Particles (Three.js)

```javascript
// 200 tiny white particles floating slowly in the 3D board space
const particles = new THREE.Points(
  new THREE.BufferGeometry().setFromPoints(
    Array.from({ length: 200 }, () =>
      new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 10
      )
    )
  ),
  new THREE.PointsMaterial({ color: 0xffffff, size: 0.02, opacity: 0.3, transparent: true })
)
// Animate: very slow drift upward + slight sway
```

-----

## 10. LOCAL API SPEC

Base URL: `http://localhost:3001/api`

### Projects

|Method  |Endpoint                   |Description                                |
|--------|---------------------------|-------------------------------------------|
|`GET`   |`/projects`                |List all projects from filesystem          |
|`POST`  |`/projects`                |Create new project (creates folder + files)|
|`GET`   |`/projects/:slug`          |Get project meta.json                      |
|`PUT`   |`/projects/:slug`          |Update project meta.json                   |
|`DELETE`|`/projects/:slug`          |Delete project folder                      |
|`POST`  |`/projects/:slug/snapshot` |Create a snapshot (backup)                 |
|`GET`   |`/projects/:slug/snapshots`|List all snapshots                         |

### Story

|Method|Endpoint               |Description             |
|------|-----------------------|------------------------|
|`GET` |`/projects/:slug/story`|Read story.md           |
|`PUT` |`/projects/:slug/story`|Write/overwrite story.md|

### Scenes

|Method|Endpoint                      |Description                          |
|------|------------------------------|-------------------------------------|
|`GET` |`/projects/:slug/scenes`      |Read scenes.json                     |
|`PUT` |`/projects/:slug/scenes`      |Write scenes.json (full replace)     |
|`POST`|`/projects/:slug/scenes/parse`|Parse story.md into scene suggestions|

### Screenplay

|Method|Endpoint                    |Description          |
|------|----------------------------|---------------------|
|`GET` |`/projects/:slug/screenplay`|Read screenplay.json |
|`PUT` |`/projects/:slug/screenplay`|Write screenplay.json|

### Assets

|Method  |Endpoint                          |Description                  |
|--------|----------------------------------|-----------------------------|
|`POST`  |`/projects/:slug/assets`          |Upload file to assets/ folder|
|`GET`   |`/projects/:slug/assets/:filename`|Serve asset file             |
|`DELETE`|`/projects/:slug/assets/:filename`|Delete asset                 |

### Export

|Method|Endpoint                         |Description               |
|------|---------------------------------|--------------------------|
|`POST`|`/projects/:slug/export/html`    |Generate HTML lookbook    |
|`POST`|`/projects/:slug/export/pdf`     |Generate PDF via Puppeteer|
|`POST`|`/projects/:slug/export/fountain`|Generate .fountain file   |
|`GET` |`/projects/:slug/exports`        |List generated exports    |

### AI (Ollama Proxy)

|Method|Endpoint    |Description                 |
|------|------------|----------------------------|
|`GET` |`/ai/status`|Check if Ollama is running  |
|`GET` |`/ai/models`|List available Ollama models|
|`POST`|`/ai/chat`  |Proxy chat request to Ollama|
|`POST`|`/ai/stream`|Streaming chat (SSE)        |

### Settings

|Method|Endpoint   |Description              |
|------|-----------|-------------------------|
|`GET` |`/settings`|Read ~/.frame/config.json|
|`PUT` |`/settings`|Update config.json       |

-----

## 11. AI INTEGRATION SPEC

### Ollama Setup

```javascript
// Check Ollama availability
const checkOllama = async (url = 'http://localhost:11434') => {
  try {
    const res = await fetch(`${url}/api/tags`)
    const data = await res.json()
    return { available: true, models: data.models.map(m => m.name) }
  } catch {
    return { available: false, models: [] }
  }
}

// Chat request
const ollamaChat = async (messages, model = 'llama3.2') => {
  const res = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: { temperature: 0.8, top_p: 0.9 }
    })
  })
  const data = await res.json()
  return data.message.content
}
```

### System Prompts Per Context

**Story Editor context:**

```
You are a story development consultant helping a screenwriter develop their story.
The writer is working on: [title] — [logline]
Genre: [genre]
Current story text (partial): [story-text]
Help with story development, plot structure, character motivations, and thematic depth.
Keep responses concise and practical. Ask clarifying questions when needed.
```

**Screenplay context:**

```
You are a professional script editor with expertise in screenplay formatting and craft.
The writer is working on: [title]
Current scene: [scene-heading]
Scene text: [scene-text]
Help with dialogue, action lines, pacing, and visual storytelling.
Preserve the writer's voice. Suggest alternatives, don't just rewrite.
```

### Streaming Support

- Use Ollama streaming API for real-time token-by-token output
- Display in chat panel with a blinking cursor while streaming
- User can interrupt stream with “Stop” button

-----

## 12. EXPORT SYSTEM SPEC

### HTML Export Architecture

The HTML export is a **single self-contained file** built by the Express server using a template system.

```
/server/export-templates/
├── html-export.template.html   ← master template
├── styles.embed.css            ← all CSS inlined
├── flipbook.embed.js           ← vanilla JS flipbook
└── screenplay.embed.js         ← screenplay renderer
```

Template engine: simple string interpolation (no external template library)

**HTML Export Sections:**

```html
<!DOCTYPE html>
<html>
<head>
  <style>/* All CSS embedded */</style>
  <style>/* Google Fonts CDN or base64 */</style>
</head>
<body class="frame-export dark">

  <!-- 1. Title Page -->
  <section class="title-page">
    <h1>{{TITLE}}</h1>
    <p class="logline">{{LOGLINE}}</p>
    <p class="author">{{AUTHOR}}</p>
  </section>

  <!-- 2. Story (optional) -->
  <section class="story">{{STORY_HTML}}</section>

  <!-- 3. Scene Flipbook (optional) -->
  <section class="flipbook" id="flipbook">
    {{SCENE_CARDS_HTML}}
  </section>

  <!-- 4. Screenplay (optional) -->
  <section class="screenplay">{{SCREENPLAY_HTML}}</section>

  <!-- 5. Sketch Gallery (optional) -->
  <section class="gallery">{{GALLERY_HTML}}</section>

  <script>/* Embedded vanilla JS for flipbook interactivity */</script>
</body>
</html>
```

Images in HTML export: converted to base64 data URIs so the file is truly self-contained.

### PDF Export (Puppeteer)

```javascript
const exportPDF = async (projectSlug) => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  // Load the screenplay in PDF-optimized HTML
  await page.goto(`http://localhost:3001/print/${projectSlug}/screenplay`)
  await page.pdf({
    path: `${projectPath}/exports/${projectSlug}.pdf`,
    format: 'Letter',
    margin: { top: '1in', right: '1in', bottom: '1in', left: '1.5in' },
    printBackground: false
  })
  await browser.close()
}
```

### Fountain Export

```javascript
const toFountain = (screenplayElements) => {
  return screenplayElements.map(el => {
    switch(el.type) {
      case 'scene-heading': return el.content.toUpperCase()
      case 'action': return el.content
      case 'character': return `\n${el.content.toUpperCase()}`
      case 'dialogue': return el.content
      case 'parenthetical': return `(${el.content})`
      case 'transition': return `${el.content.toUpperCase()}:`
      case 'note': return `/* ${el.content} */`
    }
  }).join('\n')
}
```

-----

## 13. KEYBOARD SHORTCUTS

|Shortcut              |Action                                        |
|----------------------|----------------------------------------------|
|`Cmd/Ctrl + K`        |Global search                                 |
|`Cmd/Ctrl + S`        |Force save (autosave is always on)            |
|`Cmd/Ctrl + Z`        |Undo                                          |
|`Cmd/Ctrl + Shift + Z`|Redo                                          |
|`Cmd/Ctrl + N`        |New scene card (on Scene Board)               |
|`F11`                 |Toggle focus mode (Story / Screenplay editors)|
|`Cmd/Ctrl + 1-6`      |Screenplay element types                      |
|`←` / `→`             |Navigate scenes (Flipbook mode)               |
|`Space`               |Toggle autoplay (Flipbook mode)               |
|`Cmd/Ctrl + E`        |Open Export Studio                            |
|`Cmd/Ctrl + /`        |Toggle AI Assistant panel                     |
|`Escape`              |Close modal / panel                           |
|`Cmd/Ctrl + Shift + F`|Toggle Flipbook / Board view                  |

-----

## 14. DEVELOPMENT PHASES

### Phase 1 — Core Foundation (Weeks 1–3)

**Goal:** Working local app with story editing and project management

- [ ] Project setup: Vite + React + Express + Tailwind
- [ ] File system layer: all CRUD operations for projects
- [ ] Design system implementation: colors, typography, components
- [ ] Project Dashboard: list, create, delete projects
- [ ] New Project Wizard
- [ ] Story Editor: ProseMirror setup, basic formatting, autosave
- [ ] Sidebar navigation
- [ ] App config (`~/.frame/config.json`)

**Deliverable:** Can create a project, write a story, it saves to disk.

-----

### Phase 2 — Scene Board (Weeks 4–6)

**Goal:** Full 3D scene board with drag-and-drop

- [ ] Scene Board: React Three Fiber setup
- [ ] CorkBoard 3D background + lighting
- [ ] Scene cards: render as Three.js planes OR as HTML positioned absolutely over canvas
- [ ] Drag-and-drop reorder with @dnd-kit
- [ ] Card flip animation (front/back)
- [ ] Card editor (back-face form)
- [ ] Act columns + add/remove acts
- [ ] Beat sheet overlay
- [ ] Emotional arc visualizer (Recharts)
- [ ] Dust particle effect
- [ ] Flipbook mode: card flip animations

**Deliverable:** Full visual scene board, drag to reorder, flipbook preview.

-----

### Phase 3 — Screenplay + Sketch (Weeks 7–9)

**Goal:** Full screenplay writing experience with visual references

- [ ] Screenplay editor: ProseMirror custom schema
- [ ] All 8 element types with proper formatting
- [ ] Smart Tab cycling through element types
- [ ] Character autocomplete
- [ ] Scene navigator panel
- [ ] Split panel layout (screenplay + sketch)
- [ ] Sketch panel: Fabric.js canvas with all drawing tools
- [ ] Image upload to sketch panel
- [ ] Scene-locked sketch nav (scroll syncs sketch panel)
- [ ] Revision mode

**Deliverable:** Full screenplay writing with side-by-side sketching.

-----

### Phase 4 — Research + Characters (Weeks 10–11)

**Goal:** Supporting tools for world-building

- [ ] Research board: masonry layout
- [ ] Add image / link / note items
- [ ] Multiple boards
- [ ] Link research items to scenes
- [ ] Character profiles: list + detail view
- [ ] Character arc timeline
- [ ] Character color highlighting in screenplay

**Deliverable:** Full world-building toolkit.

-----

### Phase 5 — AI + Export (Weeks 12–14)

**Goal:** Ollama integration and all export formats

- [ ] AI panel: Ollama connection check, model selector
- [ ] Chat interface with context injection
- [ ] Text selection → AI action menu
- [ ] Suggested prompts (context-aware)
- [ ] Streaming responses
- [ ] HTML export: full template + all sections
- [ ] PDF export via Puppeteer
- [ ] Fountain export
- [ ] Export Studio UI
- [ ] Version snapshots

**Deliverable:** Complete app. AI-assisted writing. All export formats.

-----

### Phase 6 — Polish & Performance (Weeks 15–16)

**Goal:** Ship-ready quality

- [ ] Performance audit (Three.js optimization, bundle size)
- [ ] Keyboard navigation audit
- [ ] Error states and empty states for all screens
- [ ] Onboarding: first-launch guide / sample project
- [ ] Settings screen: all preferences
- [ ] README + install instructions
- [ ] `npm run build` → single production server

**Deliverable:** Production-ready, installable local app.

-----

## 15. PROJECT FILE STRUCTURE

```
frame/
├── package.json                    ← root package (uses concurrently)
├── README.md
├── .env.example
│
├── client/                         ← React frontend (Vite)
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css               ← CSS variables, global styles, film grain
│       │
│       ├── assets/
│       │   ├── textures/
│       │   │   └── grain.png
│       │   └── fonts/              ← fallback local fonts
│       │
│       ├── components/             ← Shared UI components
│       │   ├── ui/
│       │   │   ├── Button.jsx
│       │   │   ├── Input.jsx
│       │   │   ├── Modal.jsx
│       │   │   ├── Tooltip.jsx
│       │   │   ├── Badge.jsx
│       │   │   └── Spinner.jsx
│       │   ├── layout/
│       │   │   ├── Sidebar.jsx
│       │   │   ├── TopBar.jsx
│       │   │   └── SplitPanel.jsx
│       │   └── shared/
│       │       ├── ToneColorDot.jsx
│       │       ├── CharacterChip.jsx
│       │       └── SaveIndicator.jsx
│       │
│       ├── screens/                ← Full page screens
│       │   ├── Dashboard/
│       │   │   ├── Dashboard.jsx
│       │   │   ├── ProjectCard.jsx
│       │   │   └── NewProjectWizard.jsx
│       │   ├── Story/
│       │   │   ├── StoryEditor.jsx
│       │   │   ├── StoryDNASidebar.jsx
│       │   │   └── extensions/     ← ProseMirror extensions
│       │   ├── SceneBoard/
│       │   │   ├── SceneBoard.jsx
│       │   │   ├── BoardCanvas.jsx  ← R3F canvas
│       │   │   ├── SceneCard.jsx
│       │   │   ├── ActColumn.jsx
│       │   │   ├── BeatOverlay.jsx
│       │   │   ├── EmotionArc.jsx
│       │   │   └── DustParticles.jsx
│       │   ├── Flipbook/
│       │   │   ├── Flipbook.jsx
│       │   │   └── FlipCard.jsx
│       │   ├── Screenplay/
│       │   │   ├── ScreenplayEditor.jsx
│       │   │   ├── ScreenplaySchema.js ← ProseMirror schema
│       │   │   ├── SketchPanel.jsx
│       │   │   ├── DrawingCanvas.jsx   ← Fabric.js wrapper
│       │   │   └── SceneNavigator.jsx
│       │   ├── Characters/
│       │   │   ├── Characters.jsx
│       │   │   └── CharacterDetail.jsx
│       │   ├── Research/
│       │   │   ├── Research.jsx
│       │   │   └── ResearchItem.jsx
│       │   ├── Export/
│       │   │   └── ExportStudio.jsx
│       │   └── Settings/
│       │       └── Settings.jsx
│       │
│       ├── store/                  ← Zustand stores
│       │   ├── projectStore.js
│       │   ├── sceneStore.js
│       │   ├── screenplayStore.js
│       │   └── uiStore.js
│       │
│       ├── hooks/                  ← Custom React hooks
│       │   ├── useAutosave.js
│       │   ├── useProject.js
│       │   ├── useAI.js
│       │   └── useKeyboard.js
│       │
│       └── lib/                    ← Utilities
│           ├── api.js              ← API client (fetch wrapper)
│           ├── fountain.js         ← Fountain format utilities
│           └── screenplayUtils.js
│
├── server/                         ← Express backend
│   ├── server.js                   ← Entry point
│   ├── package.json
│   ├── routes/
│   │   ├── projects.js
│   │   ├── story.js
│   │   ├── scenes.js
│   │   ├── screenplay.js
│   │   ├── assets.js
│   │   ├── export.js
│   │   ├── ai.js
│   │   └── settings.js
│   ├── services/
│   │   ├── fileService.js          ← All file I/O
│   │   ├── exportService.js        ← HTML/PDF/Fountain generation
│   │   ├── aiService.js            ← Ollama proxy + provider interface
│   │   └── snapshotService.js      ← Version snapshots
│   └── export-templates/
│       ├── html-export.template.html
│       ├── styles.embed.css
│       └── flipbook.embed.js
│
└── scripts/
    ├── setup.js                    ← Post-install setup (create ~/frame-projects)
    └── build.js                    ← Production build script
```

-----

## APPENDIX A: GETTING STARTED COMMANDS

```bash
# Install
git clone https://github.com/[user]/frame
cd frame
npm install          # installs root, client, and server deps

# Development
npm start            # starts both client (5173) and server (3001)

# Production build
npm run build        # builds React to /dist, served by Express
npm run serve        # start production server on :3001

# Install Ollama (for AI features)
# macOS/Linux: curl -fsSL https://ollama.com/install.sh | sh
# Then: ollama pull llama3.2
```

-----

## APPENDIX B: FUTURE FEATURE IDEAS

These are out of Phase 1–6 scope but worth building later:

- **Collaboration mode** — share a project folder via any cloud sync (Dropbox, iCloud, git), CRDT conflict resolution
- **Timeline view** — story timeline across scenes with character arcs as swim lanes
- **Shot list generator** — parse screenplay sluglines into a full shot list spreadsheet
- **Audio notes** — record voice memos attached to scenes (stored in assets/)
- **Script table read** — text-to-speech for each character voice, play through the screenplay
- **Beat sheet templates** — community-created beat sheet models beyond Save the Cat / 3-Act
- **Pitch mode** — full-screen, presenter-mode view of the HTML export
- **Print directly** — `Cmd+P` in Screenplay view triggers browser print with proper formatting
- **iOS/Android** — PWA manifest so it installs as an app on mobile devices
- **Dark/Light mode toggle** — currently dark-only; Light mode for daytime writing
- **Custom themes** — user-defined color palettes for the editor

-----

*FRAME Spec v1.0 — Built for storytellers who think in images.*
*Last updated: June 2025*
# 🎬 FRAME — A Writer's Studio

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](#)
[![Local-First](https://img.shields.io/badge/local--first-yes-success)](https://github.com/avinpy-255/FRAME)
[![Ollama](https://img.shields.io/badge/AI-Ollama%20(Local)-orange)](https://ollama.com)

> **Story to Screen. Locally.**  
> A local-first creative writing studio for screenwriters, indie filmmakers, and visual storytellers.

FRAME is a local-first creative writing environment built for writers who think visually. It follows the natural creative process: you think of an idea, develop a story, break it into scenes, write the screenplay, and attach visual references. When you're ready, you can export a beautiful HTML pitch document/lookbook or a standard PDF that a director, producer, or collaborator can open in any browser.

---

## ✨ Key Features

- 📓 **Story Editor**: Develop your outline, themes, characters, and structural beats in a clean environment.
- 📌 **Scene Board**: A visual layout (3D corkboard feel) to break down your story, move scenes around, and plan your emotional arc.
- 📖 **Flipbook Preview**: A visual card-based layout to review your project assets and scenes at a glance.
- ✍️ **Screenplay Editor**: A screenplay-focused editor built with a custom schema for proper formatting (Action, Character, Parenthetical, Dialogue, Transition, etc.).
- 🎨 **Sketch Panel**: Visual drawing canvas to sketch storyboard frames, character notes, or layouts.
- 🔬 **Research Board**: A dedicated board to store references, links, notes, and mood-board inspiration.
- 🤖 **Local AI Assistant**: Integrates with [Ollama](https://ollama.com) (defaulting to `llama3.2`) to assist with brainstorming, scene analysis, and character profiling—all running privately on your own machine.
- 📤 **Export Studio**: Pitch your work with high-fidelity HTML templates (like lookbooks) or standard screenplays.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS v3 + custom CSS
- **Animations**: Framer Motion + GSAP
- **Screenplay Editor**: Custom ProseMirror editor
- **Drawing Canvas**: Fabric.js
- **State Management**: Zustand

### Backend (Local Server)
- **Runtime**: Node.js (v20+)
- **Server**: Express.js
- **Local API & I/O**: Custom Node file service mapping to plain JSON + Markdown in your file system.
- **Process Manager**: Concurrently (runs client & server together)

### AI Integration
- **Local LLM**: Ollama API (`http://localhost:11434`) using `llama3.2`

---

## 🚀 Quick Start Guide

Follow these steps to run FRAME locally on your machine.

### Prerequisites

1. **Node.js**: Make sure you have Node.js (v20 or higher) installed. [Download Node.js](https://nodejs.org/).
2. **Ollama** *(Optional, for local AI)*: Install Ollama and pull the `llama3.2` model if you'd like to use the writing assistant.
   - [Download Ollama](https://ollama.com)
   - Run the model in your terminal:
     ```bash
     ollama run llama3.2
     ```

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/avinpy-255/FRAME.git
   cd FRAME
   ```

2. **Install Dependencies**
   Run the root installer script which installs all required dependencies for the root process manager, backend server, and frontend client:
   ```bash
   npm run install-all
   ```

3. **Run Setup**
   Initialize your local configuration directory (`~/.frame`) and default projects directory (`~/frame-projects`):
   ```bash
   npm run setup
   ```

### Running the Application

Start both the backend server and frontend development server with a single command:
```bash
npm start
```

- **Frontend client** will open at `http://localhost:5173` (or the next available port).
- **Backend API server** will run on `http://localhost:3001`.

---

## 📁 Project Structure

```text
FRAME/
├── client/          # React + Vite Frontend
│   ├── src/
│   │   ├── components/  # Layout, UI components, AI panel
│   │   ├── screens/     # Screenplay, Scene Board, Dashboard, etc.
│   │   └── store/       # Zustand state stores
│   └── package.json
├── server/          # Express Local API Backend
│   ├── routes/      # AI, projects, characters, screenplay, scenes routes
│   ├── services/    # local I/O file services
│   └── package.json
├── scripts/         # Post-install & build scripts
├── FRAME-spec.md    # Product Specifications
├── package.json     # Root workspace configuration
└── README.md        # This guide
```

---

## 🔒 Local-First Data Privacy

All of your projects are saved in JSON and Markdown formats inside `~/frame-projects` (e.g., `C:\Users\<YourUsername>\frame-projects` on Windows or `/Users/<YourUsername>/frame-projects` on macOS/Linux). 

Your configuration is stored in `~/.frame/config.json`. None of your writing is sent to external cloud servers; even the AI runs locally on your computer via Ollama.

---

## 📄 License

This project is licensed under the MIT License.

# DreamScape — A Little Universe of Memories

DreamScape is a dreamy, interactive photo gallery for revisiting favorite moments and saving small memories in one cozy corner of the web.

## Overview

DreamScape presents memories as a personal, visual collection. The experience combines a welcoming hero, sample memory cards, and a gentle note to create a place to pause, remember, and add a meaningful moment. Memories added through the form are held in the page's React state for the current session.

## Features

- Dark, atmospheric interface with purple and pink accents.
- Animated hero copy and floating Polaroid-style photos.
- Gallery with three built-in sample memories and image, date, title, description, and tag details.
- Interactive like and unlike buttons for memory cards.
- Add Memory form for a title and optional description. New entries appear in the gallery with a default image and current date.
- Note popup with close controls.
- Navigation links to the home, memories, and closing sections.
- Responsive gallery and layout adjustments for smaller screens.
- Framer Motion entrance and scroll animations, plus CSS hover effects and floating-photo and twinkle animations.

New memories and likes are stored only in in-memory page state. They reset when the page is reloaded; the app does not currently provide accounts, a backend, database persistence, or photo uploads.

## Tech Stack

- React 19
- Vite 6
- JavaScript with JSX
- CSS
- Framer Motion for animations
- Lucide React for icons

## Project Structure

```text
dreamscape-app/
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── eslint.config.js
├── public/
│   └── vite.svg
└── src/
    ├── App.jsx
    ├── App.css
    ├── index.css
    ├── main.jsx
    ├── assets/
    │   └── react.svg
    ├── components/
    │   ├── ClosingSection.jsx
    │   ├── Footer.jsx
    │   ├── Hero.jsx
    │   ├── MemoryCard.jsx
    │   ├── MemoryForm.jsx
    │   ├── MemoryGallery.jsx
    │   ├── Navbar.jsx
    │   └── NoteModal.jsx
    └── data/
        └── memories.js
```

## Getting Started

### Prerequisites

- Node.js
- npm
- Git (to clone the repository)

### Install and run

Replace the placeholder repository address with the URL of your GitHub repository:

```bash
git clone https://github.com/<your-username>/<your-repository>.git
cd <your-repository>
npm install
npm run dev
```

Vite prints the local development URL in the terminal when the server starts.

### Other available commands

```bash
npm run build    # Create a production build in dist/
npm run preview  # Preview the production build locally
npm run lint     # Run ESLint
```

## Using the Gallery

- Use the navigation links or the hero button to jump to the memories section.
- Select **A little note for you** to open the note popup.
- Select **Add memory**, **New memory**, or **Save a little moment** to open the form.
- Enter a title and, optionally, a description to add a memory to the top of the gallery.
- Select a heart on a memory card to like or unlike it.

Memory images in the gallery are provided as external Unsplash URLs, and the page imports its fonts from Google Fonts. Those assets require network access to load.

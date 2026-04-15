# Contributing to Big O Circus

Thank you for your interest in contributing! This guide will help you get started.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/Big-O-Circus.git
   cd Big-O-Circus
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```

## Branch Naming

- `feat/description` - New features or implementations
- `fix/description` - Bug fixes
- `enhance/description` - Improvements to existing features
- `refactor/description` - Code restructuring

## Adding a New Visualization

### Data Structure or Algorithm

1. Create a component in `src/components/data-structures/` or `src/components/algorithms/`
2. Follow the existing pattern:
   ```tsx
   import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
   import * as THREE from 'three';

   // Use useRef for canvas + viewer
   // Use useEffect with disposeCircus() cleanup
   // Use MeshStandardMaterial for solid objects
   // Use MeshBasicMaterial for transparent text labels
   // Use disposeSceneChildren() to clear scene before re-render
   ```
3. Add a lazy import and route in `src/routes/index.tsx`
4. Add an entry in `src/helpers/contsant.ts` with `color: 'green'`

### Problem Visualization

1. Create a component in `src/components/problems/`
2. Add the route in `src/routes/index.tsx`
3. Add an entry in the `problemsLinkList` array in `src/helpers/contsant.ts`

## Commit Messages

Follow conventional commits:

- `feat: add new feature`
- `fix: fix a bug`
- `enhance: improve existing feature`
- `refactor: restructure code`
- `docs: update documentation`
- `ci: update CI/CD`

## Pull Requests

1. Create a branch from `main`
2. Make your changes
3. Ensure `npm run build` passes
4. Push and open a PR targeting `main`
5. Fill in the PR description with what you changed and why

## Code Style

- TypeScript for type safety
- TailwindCSS for styling
- Functional React components with hooks
- Keep components focused on a single visualization
- Include a UI control panel with operation buttons
- Show complexity info (Big-O notation)

## Reporting Issues

- Use the GitHub issue tracker
- Include steps to reproduce for bugs
- For feature requests, describe the visualization you'd like to see

## Questions?

Open a GitHub Discussion or reach out on [LinkedIn](https://www.linkedin.com/in/imkuldeepahlawat/).

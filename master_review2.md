# Master Review 2 — High‑Level Summary (since last commit)

This document summarizes all changes in the working tree compared to the last commit: newly created files, updated files, and the intent behind each change.

## Overview

- Added a Morning “Fact + Quiz in 3 days” feature with persistent scheduling and grading; correct answers award a Mine.
- Integrated Morning overlay into the end‑of‑round flow. After each day, the Morning overlay appears; upon closing, the next round prepares/spawns.
- Added Mines to the inventory and HUD; press `M` during the farm round to deploy a mine and clear emus.
- Enhanced Farm Planter growth/harvest: click to harvest when fully grown; planters advance growth each day and reward crops.
- Introduced basic pause menu (Save & Main Menu, Back to Game).
- Added test tooling (Vitest + happy‑dom) and unit tests.
- Rebranded UI text to “Farm Defense”.

## Files Created

- src/controllers/QuizController.ts
  - New persistent quiz system: stores daily facts, schedules quizzes for Day+3, retrieves due quizzes, and records completion.

- src/assets.d.ts
  - Type declaration to allow importing `*.png` assets in TypeScript.

- vitest.config.ts
  - Test runner configuration using `happy-dom` environment with a shared setup file.

- tests/setup.ts
  - Global test setup: stubs `Audio` and clears `localStorage` before each test.

- tests/FarmPlanterController.spec.ts
  - Verifies harvest callback fires only when the crop is fully grown and resets stage post‑harvest.

- tests/FarmScreenController.spec.ts
  - Covers end‑of‑round Morning overlay flow, pause menu behaviors, and spawn retargeting after closing Morning.

- tests/GameStatusController.spec.ts
  - Validates money add/spend constraints and inventory management.

- tests/MorningEventsScreenController.spec.ts
  - Checks buying/selling logic and overlay continue callback behavior.

- assets/fully_grown.png
- assets/half_grown.png
- assets/not_grown.png
  - Crop stage images used by planters.

- assets/ChatGPT Image Nov 6, 2025, 06_32_33 PM.png
  - Development artifact (not referenced by code).

Note: MorningEvents imports `assets/morningevents_background.png`. Ensure this asset exists in `assets/` and is tracked; it is currently not present in the working tree.

## Files Updated

- .gitignore
  - Added `us.plan.md` to ignored files.

- index.html
  - Changed page title to “Farm Defense - CSE 110 Lab 3”.

- package.json / package-lock.json
  - Added test scripts (`test`, `test:ui`) and devDependencies (`vitest`, `happy-dom`). Lockfile updated accordingly.

- src/main.ts
  - Wired `FarmScreenController` to use `MorningEventsScreenController` for the overlay at day end.

- src/controllers/GameStatusController.ts
  - Added `saveState()` convenience method (persists current state).

- src/components/FarmPlanterComponent/FarmPlanterModel.ts
  - Reworked to stage‑based growth: 0→1→2 across days; harvest only at stage 2, then reset to 0.

- src/components/FarmPlanterComponent/FarmPlanterView.ts
  - Visual update: planter styling and crop image per stage (uses new PNG assets). Added click support and `setStage` API.

- src/components/FarmPlanterComponent/FarmPlanterController.ts
  - Hooked up click‑to‑harvest, daily `advanceDay`, stage syncing, and `setOnHarvest` callback for rewarding crops.

- src/screens/FarmScreen/FarmScreenModel.ts
  - Comment update reflecting harvest‑driven scoring intent.

- src/screens/FarmScreen/FarmScreenView.ts
  - HUD additions: Crops and Mines counters; Pause menu overlay UI; retains timer/round UI; planters spawned as before.
  - New methods: `updateCropCount`, `updateMineCount`, and pause overlay wiring.

- src/screens/FarmScreen/FarmScreenController.ts
  - End‑of‑round flow: stops timer, clears emus, increments round, advances day in status, opens Morning overlay, then prepares next round (planter growth, spawn/retarget emus).
  - Timer: centralized `timeRemaining`, proper start/stop, and resume handling.
  - Inventory integration: on planter harvest, add `crop` and play SFX; HUD updates.
  - Mines: added `M` key to deploy a mine, which clears emus and decrements `mine` inventory; HUD updates.
  - Pause menu: menu overlay with Save & Main Menu (persists state and returns), and Back to Game (resumes timer).

- src/screens/MorningEventsScreen/MorningEventsScreenView.ts
  - New animated background image (requires `assets/morningevents_background.png`).
  - Added info text area for daily fact and quiz results.
  - Added quiz rendering (question + multiple choice buttons) and clearing helpers.

- src/screens/MorningEventsScreen/MorningEventsScreenController.ts
  - Integrated `QuizController`: ensures a fact is shown daily and schedules a quiz for Day+3.
  - Renders due quizzes; correct answers award 1 `mine` (inventory) and show guidance to press `M` in the farm.
  - Added overlay show/hide support; `Continue` closes overlay if shown, otherwise returns to farm screen.

- src/screens/GameOverScreen/GameOverScreenController.ts
  - Updated leaderboard storage key to `farmDefenseLeaderboard` (rebrand).

- src/screens/MainMenuScreen/MainMenuScreenView.ts
  - Rebranded title to “FARM DEFENSE” with updated colors.

## Behavior Summary

- Morning Market
  - Shows a daily fact; schedules a related quiz for three in‑game days later.
  - If a quiz is due, presents multiple choice options; correct answers award 1 Mine.

- Farm Round
  - Press `M` to deploy a Mine and clear emus; Mines appear in the HUD.
  - Planters advance growth each day; click a fully grown crop to harvest and gain inventory.
  - Pause menu allows saving and returning to the main menu, or resuming the game.

## Follow‑Ups / Notes

- Missing asset: `assets/morningevents_background.png` is referenced by the MorningEvents view but is not present. Add this file (or update the import) to avoid build/runtime issues.
- New tests require `npm i` to install `vitest`/`happy-dom` and can be run via `npm run test`.


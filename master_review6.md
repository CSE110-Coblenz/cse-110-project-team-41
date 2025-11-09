# Master Review 6 — Recent Feature Work

## Highlights
- Morning market now unlocks facts/quizzes from Day 3 onward, and quizzes are launched only when the player clicks the new **Daily Quiz** button. Quiz overlays reuse the animated background shared with the menu.
- Main menu redesigned with the same animated background, and now presents four options: New Game, Load Game, Start Game, and the existing Start Game 2 (kept for partner testing).
- New Save/Load plumbing hooks into `GameStatusController`, enabling clean resets for new games and safe fallbacks when no save exists.
- Emus render with the provided PNG sprite instead of rectangles, while mine collision logic was updated so sprite-based emus still explode properly.

## File Changes

| File | Type | Summary |
| --- | --- | --- |
| `src/controllers/GameStatusController.ts` | Updated | Added `reset()` to wipe state, `hasSavedState()` guard, and reused persistence logic so menu actions can differentiate new vs. load flows. |
| `src/screens/MainMenuScreen/MainMenuScreenController.ts` | Updated | Receives the shared `GameStatusController`, wires New/Load handlers, keeps existing Farm and Game2 buttons, and surfaces alerts when a load isn’t available. |
| `src/screens/MainMenuScreen/MainMenuScreenView.ts` | Recreated | New view with the animated `background.png`, title styling, and four vertically stacked buttons with hover-friendly styles and shared Konva animation. |
| `src/main.ts` | Updated | Passes `GameStatusController` into the main menu controller so UI actions can manipulate saves. |
| `src/screens/MorningEventsScreen/MorningEventsScreenController.ts` | Updated | Gates facts/quizzes until Day 3, shows the new Daily Quiz button only when a quiz is due, tracks pending quizzes, and opens the popup on demand; also reuses the animated background. |
| `src/screens/MorningEventsScreen/MorningEventsScreenView.ts` | Recreated | Matches the menu’s animated background, adds a Daily Quiz button, and draws the quiz popup only when invoked, with improved layout for question/answers. |
| `src/components/EmuComponent/EmuView.ts` | Updated | Replaced Konva `Rect` with Konva `Image` that loads `assets/Emu.png`, including async loading fallback. |
| `src/components/EmuComponent/EmuController.ts` | Updated | Returns the image sprite from `getView()` so other systems (mines) can access exact bounds. |
| `src/screens/FarmScreen/FarmScreenController.ts` | Updated | Mine-collision helpers now accept `Konva.Image` targets; ensures sprite-based emus still trigger explosions and vanish. |
| `src/screens/FarmScreen/FarmScreenView.ts` | Updated previously | Supports mine placement/removal (unchanged in this pass but included for completeness). |
| `assets/background.png`, `assets/Emu.png` | Added earlier | Used by the animated backgrounds and emu sprites respectively. |

## Created Earlier (Context)
- `src/controllers/QuizController.ts`, `MorningEventsScreen` quiz UI, and `master_review*.md` files document the evolving quiz/mine system.
- Test harness (`vitest.config.ts`, `tests/…`) and planter assets (`fully_grown.png`, etc.) remain from prior tasks.

## Next Steps
- Consider wiring a real save/load UI confirmation dialog instead of `window.alert`.
- Hook the Load Game button into a proper menu overlay if more metadata (day, money) should be shown before confirming.
- Run `npm run test` once the local PowerShell execution policy allows it to verify nothing regressed. 

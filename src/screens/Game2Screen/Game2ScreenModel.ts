// src/screens/Game1Screen/Game2ScreenModel.ts
export class Game2ScreenModel {
  private defeat = 0;

  reset(): void {
    this.defeat = 0;
  }

  incrementDefeat(): void {
    this.defeat++;
  }

  getDefeat(): number {
    return this.defeat;
  }
}

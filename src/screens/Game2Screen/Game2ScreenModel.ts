// src/screens/Game1Screen/Game2ScreenModel.ts
export class Game2ScreenModel {
  private defeat = 0;
  private timeRemaining = 60; // 1 minute in seconds
  private startTime: number = 0;
  private ammo = 100; // Starting ammo count

  reset(): void {
    this.defeat = 0;
    this.timeRemaining = 60;
    this.startTime = 0;
    this.ammo = 100;
  }

  incrementDefeat(): void {
    this.defeat++;
  }

  getDefeat(): number {
    return this.defeat;
  }

  getAmmo(): number {
    return this.ammo;
  }

  canShoot(): boolean {
    return this.ammo > 0;
  }

  consumeAmmo(): boolean {
    if (this.ammo > 0) {
      this.ammo--;
      return true;
    }
    return false;
  }

  addAmmo(amount: number): void {
    this.ammo += amount;
  }

  startTimer(): void {
    this.startTime = Date.now();
  }

  updateTimer(): number {
    if (this.startTime === 0) return this.timeRemaining;
    
    const elapsed = (Date.now() - this.startTime) / 1000; // elapsed time in seconds
    this.timeRemaining = Math.max(0, 60 - elapsed);
    return this.timeRemaining;
  }

  getTimeRemaining(): number {
    return this.timeRemaining;
  }

  isTimeUp(): boolean {
    return this.timeRemaining <= 0;
  }
}

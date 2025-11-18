export class GameIntroModel {
  private pages: string[] = [
    "Welcome to the Great Emu War!\n\nIn 1932, Australia faced an unexpected foe: the emus. These large, flightless birds were destroying crops and threatening farmers' livelihoods.",
    "The government deployed soldiers armed with machine guns to combat the emus. However, the emus proved to be elusive and resilient.",
    "Despite their best efforts, the soldiers were unable to defeat the emus. The birds outmaneuvered the military, and the event became known as the 'Great Emu War.'",
    "In this game, you will defend your farm from the emus. Use your skills to protect your crops and survive the night!",
    "Controls:\n- Move: WASD\n- Shoot: Spacebar\n- Objective: Defeat all emus before they destroy your farm.\n\nPress the button below to start the game!"
  ];

  getPage(index: number): string {
    return this.pages[index];
  }

  getPageCount(): number {
    return this.pages.length;
  }
}
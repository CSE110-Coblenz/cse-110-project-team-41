
export class GameIntroModel {
  private pages: string[] = [
    "THE GREAT EMU WAR\n\n\nIn 1932, Australia faced an unusual conflict.\n\nFollowing World War I, many Australian veterans had been given farmland in Western Australia to settle and grow wheat.",
    "THE GREAT DEPRESSION\n\n\nWhen the Great Depression hit, wheat prices plummeted.\n\nFarmers struggled to make ends meet, but then disaster struck, an invasion of 20,000 emus!",
    "THE EMU INVASION\n\n\nAfter breeding season, emus migrated inland in massive numbers, searching for water.\n\nThey trampled crops, broke through fences, and destroyed the farmers' livelihoods.",
    "MILITARY INTERVENTION\n\n\nDesperate farmers asked the government for help.\n\nIn October 1932, the Australian military deployed soldiers with machine guns to combat the emus.",
    "THE EMUS FIGHT BACK\n\n\nThe emus proved to be surprisingly effective opponents!\n\nThey could run at 30 mph, scattered when shot at, and worked in groups. The soldiers found them nearly impossible to hit.",
    "AN EMBARRASSING DEFEAT\n\n\nAfter weeks of failed attempts, the military withdrew.\n\nThe emus had won! This became known as 'The Great Emu War', one of the few wars Australia officially lost.",
    "YOUR MISSION\n\n\nNow it's your turn to defend your farm!\n\nGrow crops, protect them from emu raids, and survive where the military failed.\n\nCan you succeed where history did not?",
    "CONTROLS & HOW TO PLAY\n\n\nMove around your farm using WASD keys.\n\nPlant crops, harvest them, and manage your resources.\n\nProtect your farm from emu raids and grow your wheat empire!\n\n\nPress SPACEBAR to continue..."
  ];

  getPage(index: number): string {
    return this.pages[index];
  }

  getPageCount(): number {
    return this.pages.length;
  }
}

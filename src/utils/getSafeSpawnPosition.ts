// utils/getSafeSpawnPosition.ts
import { ObstacleModel } from "../components/Obstacle/ObstacleModel";
import { STAGE_WIDTH, STAGE_HEIGHT } from "../constants";

export function getSafeSpawnPosition(
  obstacles: ObstacleModel[],
  entityWidth: number,
  entityHeight: number,
  gameAreaY: number = 0,
  gameAreaHeight: number = STAGE_HEIGHT,
  margin = 50
): { x: number; y: number } {
  let x = STAGE_WIDTH / 2;
  let y = gameAreaY + gameAreaHeight / 2;
  let valid = false;

  while (!valid) {
    x = margin + Math.random() * (STAGE_WIDTH - 2 * margin);
    y = gameAreaY + margin + Math.random() * (gameAreaHeight - 2 * margin);

    const box = { x, y, w: entityWidth, h: entityHeight };
    valid = !obstacles.some((o) => o.collides(box));
  }

  return { x, y };
}

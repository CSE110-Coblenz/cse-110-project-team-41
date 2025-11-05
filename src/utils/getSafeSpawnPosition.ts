// utils/getSafeSpawnPosition.ts
import { ObstacleModel } from "../components/Obstacle/ObstacleModel";
import { STAGE_WIDTH, STAGE_HEIGHT } from "../constants";

export function getSafeSpawnPosition(
  obstacles: ObstacleModel[],
  entityWidth: number,
  entityHeight: number,
  margin = 50
): { x: number; y: number } {
  let x = STAGE_WIDTH / 2;
  let y = STAGE_HEIGHT / 2;
  let valid = false;

  while (!valid) {
    x = margin + Math.random() * (STAGE_WIDTH - 2 * margin);
    y = margin + Math.random() * (STAGE_HEIGHT - 2 * margin);

    const box = { x, y, w: entityWidth, h: entityHeight };
    valid = !obstacles.some((o) => o.collides(box));
  }

  return { x, y };
}

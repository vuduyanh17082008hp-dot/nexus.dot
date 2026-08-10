export function getWaveConfig(elapsedSec: number): {
  wave: number;
  spawnInterval: number;
  enemyHp: number;
  enemySpeed: number;
  spawnCount: number;
} {
  const wave = Math.floor(elapsedSec / 30) + 1;
  const spawnInterval = Math.max(400, 1400 - wave * 80);
  const enemyHp = 1 + Math.floor(wave / 2);
  const enemySpeed = 80 + wave * 8;
  const spawnCount = Math.min(4, 1 + Math.floor(wave / 3));
  return { wave, spawnInterval, enemyHp, enemySpeed, spawnCount };
}

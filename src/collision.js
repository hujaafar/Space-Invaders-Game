/** Axis-aligned overlap and continuous projectile contact in logical world coordinates. */
export const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export function impactTime(moving, delta, target) {
  let entry = -Infinity, exit = Infinity;
  for (const [axis, size] of [['x', 'w'], ['y', 'h']]) {
    const velocity = delta[axis];
    if (velocity === 0) {
      if (moving[axis] + moving[size] <= target[axis] || moving[axis] >= target[axis] + target[size]) return null;
      continue;
    }
    const near = (target[axis] - moving[axis] - moving[size]) / velocity;
    const far = (target[axis] + target[size] - moving[axis]) / velocity;
    entry = Math.max(entry, Math.min(near, far));
    exit = Math.min(exit, Math.max(near, far));
  }
  return entry <= exit && exit >= 0 && entry <= 1 ? Math.max(0, entry) : null;
}

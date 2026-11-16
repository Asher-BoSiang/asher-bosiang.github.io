import gsap from 'gsap';
import type { Phase } from '../../data/types';
export const ROW_ANGLE = Math.PI / 2;
export const CASE_ANGLE = 0;
export const CASE_SPACING = 2.66;
export interface ArchiveInput { x:number; y:number; drag:number; energy:number; invalidate:()=>void }
export interface ArchiveMotion { time:number; enteredAt:number; pulseAt:number; pulseX:number; releasedX:number; x:number; y:number; drag:number; energy:number; enabled:boolean; reduced:boolean }
// In shelf coordinates x runs along a cover and z follows its normal.
export function decorativeColumns(projectCount: number): Array<[number, number]> {
  const cases: Array<[number, number]> = [];
  for (let column = -7; column < projectCount + 7; column++) {
    for (let depth = -60; depth <= 60; depth++) {
      if (depth === 0 && column >= 0 && column < projectCount) continue;
      cases.push([column * CASE_SPACING, depth * .38]);
    }
  }
  return cases;
}

export const SELECTED_HEIGHT = .82;
const LIFT_DURATION = .52;
export function selectionHeight(start: number, age: number, idle: number) {
  const progress = Math.min(1, Math.max(0, age / LIFT_DURATION));
  const remaining = (1 - progress) ** 3;
  const idleMix = Math.min(1, Math.max(0, (age - LIFT_DURATION) / .65));
  return start * remaining + SELECTED_HEIGHT * (1 - remaining) + idle * idleMix;
}

export function idleWave(x: number, z: number, time: number) {
  return .068 * Math.sin(time * 1.18 - x * .64 - z * .48)
    + .031 * Math.sin(time * .76 + x * .32 - z * .77);
}

export function entranceWave(x: number, z: number, m: ArchiveMotion) {
  if(!m.enabled||m.reduced)return 0;
  const delay = .32 + .22 * Math.sin(x * .28 + z * .18) + .1 * Math.sin(z * .65);
  const progress = Math.min(1,Math.max(0,(m.time-m.enteredAt-delay)/1.15));
  return 12 * (1-progress)**3;
}

function rowPulse(depth: number, age: number) {
  const distance = Math.abs(depth);
  const progress = (age - distance * .19) / .8;
  if (progress <= 0 || progress >= 1) return 0;
  return .30 * Math.exp(-distance * .36) * Math.sin(Math.PI * progress) ** 2;
}

export function waveOffset(x:number,z:number,m:ArchiveMotion,column = x) {
  if(!m.enabled||m.reduced)return 0;
  const distance=(x-m.x*8)**2/8+(z-m.y*5)**2/24;
  const age = m.time - m.pulseAt;
  let strength = 0;
  if (column === m.pulseX) strength = 1;
  else if (column === m.releasedX) strength = -1;
  else if (Number.isFinite(m.releasedX)) strength = -.8;
  return idleWave(x,z,m.time) + strength * rowPulse(z,age) + Math.exp(-distance)*m.energy*.16;
}
export const initialPose = () => ({ x: 0, y: .22, z: 0, ry: CASE_ANGLE + ROW_ANGLE, rx: 0, scale: 1, lid: 0, discOut: 0, discTravel: 0, shelfY: 0, caseExit: 0, framing: 0, playerY: 12, tray: 0 });
export type Pose = ReturnType<typeof initialPose>;
export function createOpeningTimeline(p: Pose, phase: (p: Phase) => void, complete: () => void) {
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'sine.inOut' }, onComplete: complete });
  // Lift straight up inside the slot. Rotation begins only after the shelf clears.
  tl.call(() => phase('Extracting'), [], 0)
    .to(p, { framing: 1, duration: .55, ease: 'power2.out' }, 0)
    .to(p, { y: 3.45, duration: .55, ease: 'power2.out' }, 0)
    .to(p, { shelfY: -7, duration: .55 }, 0)
    .to(p, { x: 1.5, y: 2.25, z: 2.2, ry: .5, rx: -.25, scale: 1.2, duration: .68 }, .55)
    .call(() => phase('Opening'), [], .55)
    .to(p, { lid: -2.45, duration: .58 }, .55)
    .call(() => phase('DiscFloating'), [], .9)
    .to(p, { discOut: 1.8, duration: .55 }, .9)
    .call(() => phase('PlayerEntering'), [], 1.03)
    .to(p, { playerY: 2.5, duration: .7 }, 1.03)
    .call(() => phase('TrayExtending'), [], 1.35)
    .to(p, { tray: 2.5, duration: .45 }, 1.35)
    .call(() => phase('DiscLoading'), [], 1.75)
    .to(p, { discTravel: 1, duration: .75 }, 1.75)
    .to(p, { caseExit: 1, duration: 1.05 }, 1.46)
    .call(() => phase('TrayRetracting'), [], 2.5)
    .to(p, { framing: 0, duration: .85 }, 2.15)
    .to(p, { tray: 0, duration: .5 }, 2.5);
  return tl;
}

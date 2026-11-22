// Story missions for Sunburst City. Three kinds now:
//   drive  — reach the marker, any way you like.
//   timed  — reach the marker before the countdown hits zero.
//   escape — reach the marker while the heat is still on you (wanted > 0).
// Two of the six are new in this rebuild: the timed courier run and the
// finale escape, which only counts if the cops are actually chasing you.
export const MISSIONS = [
  {
    id: 1,
    title: 'MISSION 1: SUNBURST INTRO',
    desc: 'Steal any car, then drive to the downtown club at (100, 100).',
    type: 'drive',
    targetPos: { x: 100, z: 100 },
    reward: 500,
  },
  {
    id: 2,
    title: 'MISSION 2: NEON TAXI',
    desc: 'A fare is waiting at (-80, 60). Get there within 75 seconds for a fat tip.',
    type: 'timed',
    targetPos: { x: -80, z: 60 },
    reward: 800,
    timeLimit: 75,
  },
  {
    id: 3,
    title: 'MISSION 3: HEAT ON THE AVENUE',
    desc: 'Drive to the neon boulevard at (-150, 150). The cops will not like it.',
    type: 'drive',
    targetPos: { x: -150, z: 150 },
    reward: 1000,
  },
  {
    id: 4,
    title: 'MISSION 4: THE HEIST',
    desc: 'Hit the financial district bank at (200, -150) and grab the safe.',
    type: 'drive',
    targetPos: { x: 200, z: -150 },
    reward: 2000,
  },
  {
    id: 5,
    title: 'MISSION 5: MIDNIGHT COURIER',
    desc: 'Timed delivery: a package must reach the docks at (-50, -180) in 60 seconds.',
    type: 'timed',
    targetPos: { x: -50, z: -180 },
    reward: 2500,
    timeLimit: 60,
  },
  {
    id: 6,
    title: 'MISSION 6: VICE HORIZON FINALE',
    desc: 'Escape to the coastal highway at (-200, -200) — with the heat still on your tail.',
    type: 'escape',
    targetPos: { x: -200, z: -200 },
    reward: 5000,
  },
];

export function missionById(id) {
  return MISSIONS.find((m) => m.id === id) || null;
}

export function missionNeedsHeat(mission) {
  return mission !== null && mission.type === 'escape';
}

export function missionIsTimed(mission) {
  return mission !== null && mission.type === 'timed';
}

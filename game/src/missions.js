// Story missions with objectives and rewards
export const MISSIONS = [
  {
    id: 1,
    title: "MISSION 1: SUNBURST INTRO",
    desc: "Explore Sunburst City, steal a car, and drive to the downtown club at (100, 100).",
    targetType: "drive_to",
    targetPos: { x: 100, z: 100 },
    reward: 500,
  },
  {
    id: 2,
    title: "MISSION 2: HEAT ON THE AVENUE",
    desc: "Drive to the neon boulevard at (-150, 150) and evade the heat.",
    targetType: "drive_to",
    targetPos: { x: -150, z: 150 },
    reward: 1000,
  },
  {
    id: 3,
    title: "MISSION 3: THE HEIST",
    desc: "Head to the financial district bank at (200, -150) and secure the safe.",
    targetType: "drive_to",
    targetPos: { x: 200, z: -150 },
    reward: 2000,
  },
  {
    id: 4,
    title: "MISSION 4: VICE HORIZON FINALE",
    desc: "Escape to the coastal highway at (-200, -200) at top speed!",
    targetType: "drive_to",
    targetPos: { x: -200, z: -200 },
    reward: 5000,
  }
];

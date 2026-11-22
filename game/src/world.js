// World state and entities management
import { MAX_HEALTH } from './config.js';
import { MISSIONS } from './missions.js';

export function createWorldState() {
  return {
    health: MAX_HEALTH,
    money: 500,
    wanted: 0,
    isDriving: false,
    drivingCar: null,
    hasGun: true,
    playerPos: { x: 0, y: 0, z: 0 },
    carSpeed: 0,
    currentMissionIndex: 0,
    currentMission: MISSIONS[0],
    pedestrians: [],
    bullets: [],
  };
}

// Screenshot staging (?shot=...): presets that put the game into a
// photogenic state before the first frame. `drive` auto-enters the nearest
// car so the cover can be a real driving shot; `chase` drops the player
// into an active two-star pursuit with low health.
import { SCREENS } from './config.js';

export function stageShot(name, world, vehicles) {
  if (name === 'play') {
    world.money = 2500;
    world.wanted = 1;
    world.heat = 0.2;
    world.health = 85;
    return { screen: SCREENS.play };
  }
  if (name === 'drive') {
    world.money = 2500;
    world.wanted = 1;
    world.heat = 0.2;
    world.health = 90;
    world.autoDrive = true;
    return { screen: SCREENS.play };
  }
  if (name === 'chase') {
    world.money = 1800;
    world.wanted = 2;
    world.heat = 0.4;
    world.health = 42;
    return { screen: SCREENS.play };
  }
  if (name === 'end') {
    world.wanted = 4;
    world.heat = 0.8;
    world.health = 10;
    return { screen: SCREENS.over };
  }
  return { screen: SCREENS.title };
}

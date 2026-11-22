// Screenshot staging for automated capture (?shot=start|play|end)
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER } from './config.js';

export function stageShot(name, world) {
  if (name === 'play') {
    world.money = 2500;
    world.wanted = 2;
    world.health = 85;
    return { screen: SCREEN_PLAY };
  } else if (name === 'end') {
    world.wanted = 4;
    world.health = 10;
    return { screen: SCREEN_OVER };
  }
  return { screen: SCREEN_TITLE };
}

// Sunburst City tuning table: every number the game balances on lives here,
// grouped by system so a balance pass touches one place, not ten files.
export const GAME_TITLE = 'Sunburst City: Vice Horizon';
export const SAVE_KEY = 'sunburst_city_save_v2';
export const SAVE_VERSION = 2;

export const WORLD = {
  size: 600, // playable ground plane, in world units
  block: 50, // city block edge
  road: 14, // road width between blocks
  gridRadius: 5, // blocks from -5..5 on each axis
};

export const PLAYER = {
  walk: 12, // units per second on foot
  sprint: 22, // units per second while sprinting
  jumpSpeed: 9, // initial vertical velocity of a jump
  gravity: 24, // downward acceleration
  staminaMax: 100,
  staminaDrain: 22, // per second of sprinting
  staminaRegen: 16, // per second while not sprinting
  healthMax: 100,
  regenDelay: 5, // seconds after last damage before health regens
  regenRate: 4, // health per second while regenerating
};

export const WANTED = {
  max: 5,
  heatPerShot: 0.34, // firing a gun fills the heat meter by this much
  heatPerSteal: 0.5, // stealing a car fills it by this much
  hideSeconds: 6, // seconds hidden before one wanted star drops
  hideRadius: 55, // no police cruiser within this range counts as hidden
};

export const POLICE = {
  maxCruisers: 6,
  spawnRadius: 70, // cruisers appear this far from the player
  ramDamage: 8, // health per second while a cruiser touches the player
  ramRange: 3.5, // touch distance for ramming
  roadblockAt: 3, // wanted level that triggers roadblocks
};

export const SCREENS = {
  title: 'title',
  play: 'play',
  paused: 'paused',
  over: 'over',
  victory: 'victory',
};

// Legacy flat names, kept so modules can import whichever shape they like.
export const SCREEN_TITLE = SCREENS.title;
export const SCREEN_PLAY = SCREENS.play;
export const SCREEN_PAUSED = SCREENS.paused;
export const SCREEN_OVER = SCREENS.over;
export const SCREEN_VICTORY = SCREENS.victory;
export const WORLD_SIZE = WORLD.size;
export const CITY_BLOCK_SIZE = WORLD.block;
export const ROAD_WIDTH = WORLD.road;
export const MAX_HEALTH = PLAYER.healthMax;
export const MAX_WANTED = WANTED.max;

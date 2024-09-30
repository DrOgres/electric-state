export const eState = {};

eState.attributes = ["strength", "agility", "wits", "empathy"];

eState.attributesAbv = {
  strength: "STR",
  agility: "AGI",
  wits: "WIT",
  empathy: "EMP",
};

eState.attributeSelectOptions = {
  strength: "estate.ATTRIBUTE.STR",
  agility: "estate.ATTRIBUTE.AGI",
  wits: "estate.ATTRIBUTE.WIT",
  empathy: "estate.ATTRIBUTE.EMP",
};

eState.modifierTarget = {
  none: "estate.UI.NONE",
  agility: "estate.ATTRIBUTE.AGI",
  strength: "estate.ATTRIBUTE.STR",
  wits: "estate.ATTRIBUTE.WIT",
  empathy: "estate.ATTRIBUTE.EMP",
  damage: "estate.UI.DAMAGE",
  weapon: "estate.UI.WEAPON",
  hope: "estate.ATTRIBUTE.HOPE",
  health: "estate.ATTRIBUTE.HEALTH",
  tension: "estate.UI.TENSION",
  neurocaster: "estate.UI.NEUROCASTER",
  drone: "estate.UI.DRONE",
  general: "estate.UI.GENERAL",
  death: "estate.UI.DEATH",
};

eState.injuryTarget = {
  none: "estate.UI.NONE",
  agility: "estate.ATTRIBUTE.AGI",
  strength: "estate.ATTRIBUTE.STR",
  wits: "estate.ATTRIBUTE.WIT",
  empathy: "estate.ATTRIBUTE.EMP",
  general: "estate.UI.GENERAL",
  movement: "estate.UI.MOVEMENT",
};

eState.traumaTarget = {
  none: "estate.UI.NONE",
  wits: "estate.ATTRIBUTE.WIT",
  empathy: "estate.ATTRIBUTE.EMP",
  general: "estate.UI.GENERAL",
};

eState.traitTarget = {
  none: "estate.UI.NONE",
  general: "estate.UI.GENERAL",
  speed: "estate.UI.SPEED",
  maneuver: "estate.UI.MANEUVER",
  armor: "estate.UI.ARMOR",
  hull: "estate.UI.HULL",
  passengers: "estate.UI.PASSENGERS",
  repairs: "estate.UI.REPAIRS",
};

eState.weaponType = {
  melee: "estate.UI.MELEE",
  ranged: "estate.UI.RANGED",
  neuroscape: "estate.UI.NEUROSCAPE",
};


eState.useTypeOptions ={
  none: "estate.UI.NONE",
  food: "estate.UI.FOOD",
  stabalize: "estate.UI.STABALIZE",
  healthUp: "estate.UI.HEALTHUP",
  hopeUp: "estate.UI.HOPEUP",
  empathy: "estate.ATTRIBUTE.EMP",
}

eState.usePenaltyOptions ={
  none: "estate.UI.NONE",
  healthDown: "estate.UI.HEALTHDOWN",
  addictive: "estate.UI.ADDICTIVE"
}

eState.ranges = {
  engaged: "estate.UI.ENGAGED",
  short: "estate.UI.SHORT",
  medium: "estate.UI.MEDIUM",
  long: "estate.UI.LONG",
  extreme: "estate.UI.EXTREME",
};

eState.castType = {
    info: "estate.UI.INFO",
    hack: "estate.UI.HACK",
    coms: "estate.UI.COMS",
    block: "estate.UI.BLOCK",
    combat: "estate.UI.COMBAT"
};

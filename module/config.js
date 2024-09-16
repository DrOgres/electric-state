export const eState = {};

eState.attributes = ["strength", "agility", "wits", "empathy"];

eState.attributesAbv = ["STR", "AGI", "WIT", "EMP"];

eState.modifierTarget ={
    "none": "estate.UI.NONE",
    "agility": "estate.ATTRIBUTE.AGI",
    "strength": "estate.ATTRIBUTE.STR",
    "wits": "estate.ATTRIBUTE.WIT",
    "empathy": "estate.ATTRIBUTE.EMP",
    "damage": "estate.UI.DAMAGE",
    "weapon": "estate.UI.WEAPON",
    "hope": "estate.ATTRIBUTE.HOPE",
    "health": "estate.ATTRIBUTE.HEALTH",
    "tension": "estate.UI.TENSION",
    "neurocaster": "estate.UI.NEUROCASTER",
    "drone": "estate.UI.DRONE",
    "general": "estate.UI.GENERAL",
    "death": "estate.UI.DEATH",
}

eState.injuryTarget = {
    "none": "estate.UI.NONE",
    "agility": "estate.ATTRIBUTE.AGI",
    "strength": "estate.ATTRIBUTE.STR",
    "wits": "estate.ATTRIBUTE.WIT",
    "empathy": "estate.ATTRIBUTE.EMP",
    "general": "estate.UI.GENERAL",
    "movement": "estate.UI.MOVEMENT"
}

eState.traumaTarget = {
    "none": "estate.UI.NONE",
    "wits": "estate.ATTRIBUTE.WIT",
    "empathy": "estate.ATTRIBUTE.EMP",
    "general": "estate.UI.GENERAL"
}

eState.traitTarget = {
    "none": "estate.UI.NONE",
    "general": "estate.UI.GENERAL",
    "speed": "estate.UI.SPEED",
    "maneuver": "estate.UI.MANEUVER",
    "armor": "estate.UI.ARMOR",
    "hull": "estate.UI.HULL",
    "passengers": "estate.UI.PASSENGERS",
    "repairs": "estate.UI.REPAIRS",
}

eState.ranges ={

    "engaged": "estate.UI.ENGAGED",
    "short": "estate.UI.SHORT",
    "medium": "estate.UI.MEDIUM",
    "long": "estate.UI.LONG",
    "extreme": "estate.UI.EXTREME"
}
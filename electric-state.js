import { eState } from "./module/config.js";
import { YearZeroRollManager } from "./module/lib/yzur.js";
import { preloadHandlebarsTemplates } from "./module/templates.js";
import { registerSystemSettings } from "./module/settings.js";
import electricStateActorSheet from "./module/actor/sheet.js";
import electricStateActor from "./module/actor/entity.js";
import electricStateItemSheet from "./module/item/sheet.js";
import electricStateItem from "./module/item/entity.js";



Hooks.once("init", function () {
  console.log("E-STATE | Initializing Electric State");

  game.electricState = {
    applications: {
      electricStateActor,
      electricStateActorSheet,
      electricStateItem,
      electricStateItemSheet,
    },
    config: eState,
    entities: {
      electricStateActor,
      electricStateItem,
    },
  };

  CONFIG.eState = eState;
  console.log(CONFIG.eState);
  CONFIG.Actor.documentClass = electricStateActor;
  // CONFIG.Item.documentClass = tftloopItem;

  // Register System Settings
  registerSystemSettings();

  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("electric-state", electricStateActorSheet, {
    makeDefault: true,
  });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("electric-state", electricStateItemSheet, {
    smakeDefault: true,
  });

  

  preloadHandlebarsTemplates();

  Handlebars.registerHelper("times", function (n, content) {
    let result = "";
    for (let i = 0; i < n; ++i) {
      content.data.index = i + 1;
      result = result + content.fn(i);
    }

    return result;
  });

  Handlebars.registerHelper("calculate", function (a, b, operator) {    
    switch (operator) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "*":
        return a * b;
      case "/":
        if ( b === 0) {
          return 0;
        }
        return a / b;
      case "%":
        if ( b === 0) {
          return 0 + "%";
        }
        return Math.round((a / b)*100) + "%";
    }
  });

  Handlebars.registerHelper("actorName", function (actorId) {
    const actor = game.actors.get(actorId);
    return actor ? actor.name : "";
  });

  Handlebars.registerHelper("ifIn", function (elem, list, options) {
    if (list && list.indexOf(elem) > -1) {
      return options.fn(this);
    }
    return options.inverse(this);
  });

  Handlebars.registerHelper("dataLocalization", function (data, group) {
    let string = "";
    switch (group) {
      case "attribute":
        const atrributeString = eState.attributesAbv[data];
        string = game.i18n.localize(`estate.ATTRIBUTE.${atrributeString}`);
        break;
      case "w_type":
        const weaponType = eState.weaponType[data];
        console.log("E-STATE | Weapon Type", weaponType);
        string = game.i18n.localize(`${weaponType}`);
        break;
      case "range":
        const range = eState.ranges[data];
        string = game.i18n.localize(`${range}`);
        break;
      case "useType":
        const useType = eState.useTypeOptions[data];
        string = game.i18n.localize(`${useType}`);
        break;
      case "trait":
        const trait = eState.traitTarget[data];
        string = game.i18n.localize(`${trait}`);
        break;
      case "talent":
       
        const talent = eState.modifierTarget[data];
        string = game.i18n.localize(`${talent}`);
        break;
      case "injury":
        const injury = eState.injuryTarget[data];
        string = game.i18n.localize(`${injury}`);
        break;
      case "trauma":
        console.log("E-STATE | Trauma", data);
        if (data.length === 0) {
          string = game.i18n.localize("estate.UI.NONE");
        } else {
          for (const t of data) {
            const trauma = eState.traumaTarget[t];
            string += game.i18n.localize(`${trauma}`) + ", ";
          }
          string = string.slice(0, -2);
        }
        break;
    }


    return string;
  });

  YearZeroRollManager.register("es", {
    "ROLL.baseTemplate": "systems/electric-state/templates/dice/broll.hbs",
    "ROLL.chatTemplate": "systems/electric-state/templates/dice/roll.hbs",
    "ROLL.tooltipTemplate": "systems/electric-state/templates/dice/tooltip.hbs",
    "ROLL.infosTemplate": "systems/electric-state/templates/dice/infos.hbs",
  });

  setLogo();
});

Hooks.once("diceSoNiceReady", (dice3d) => {
  dice3d.addSystem(
    { id: "electric-state", name: "Electric State RPG - Base" },
    "preferred"
  );
  dice3d.addColorset(
    {
      name: "ElectricStateBlack",
      description: "ElectricStateBlack",
      category: "Colors",
      foreground: ["#ffffff"],
      background: ["#000000"],
      outline: "black",
      texture: "none",
    },
    "preferred"
  );
  dice3d.addColorset({
    name: "ElectricStateRed",
    description: "ElectricStateRed",
    category: "Colors",
    foreground: ["#bc475c"],
    background: ["#bc475c"],
    outline: "black",
    texture: "none",
  });
  dice3d.addDicePreset({
    type: "db",
    labels: [
      "systems/electric-state/assets/dice/db-1.png",
      "systems/electric-state/assets/dice/db-2.png",
      "systems/electric-state/assets/dice/db-3.png",
      "systems/electric-state/assets/dice/db-4.png",
      "systems/electric-state/assets/dice/db-5.png",
      "systems/electric-state/assets/dice/db-6.png",
    ],
    colorset: "ElectricStateRed",
    system: "electric-state",
  });

  dice3d.addDicePreset({
    type: "dg",
    labels: [
      "systems/electric-state/assets/dice/dg-1.png",
      "systems/electric-state/assets/dice/dg-2.png",
      "systems/electric-state/assets/dice/dg-3.png",
      "systems/electric-state/assets/dice/dg-4.png",
      "systems/electric-state/assets/dice/dg-5.png",
      "systems/electric-state/assets/dice/dg-6.png",
    ],
    colorset: "ElectricStateBlack",
    system: "electric-state",
  });
});

Hooks.once("ready", async function () {
  console.log("E-STATE | Ready");
  Hooks.on("hotbarDrop", (bar, data, slot) => createElectricStateMacro(data, slot));
});

Hooks.on("dropActorSheetData", async (actor, actorSheet, data) => {
  if (actor.type !== "vehicle" || data.type !== "Actor") {
    console.log("E-STATE | Not a Vehicle nor dropping an Actor");
    return;
  }

  if (actor.type === "vehicle") {
    const passenger = await fromUuid(data.uuid);
    if (data.type === "Actor") await actorSheet.dropPassenger(passenger.id);
  }
});

function setLogo() {
  // if the game version is 13 or higher do not set the logo
  const version = game.version;
  console.log("E-STATE | Game Version", version);
  if (version >= 13) return;
  $("#logo")[0].src = "systems/electric-state/assets/logo.webp";
}

async function createElectricStateMacro(data, slot) {
  console.log("E-STATE | Macro Drop", data);

  const actor = game.actors.get(data.actorId);

  console.log("E-STATE | User Owner Level ", actor.getUserLevel(game.user));
  // if the user is not a GM or doesn't have owner permissions on the actor return
  if (!game.user.isGM && !actor.getUserLevel(game.user) >= 3) {
    return;
  }

  let command = '';
  if (data.type === "attribute"){
    console.log("E-STATE | Attribute Macro Drop", data);
    command =  `
      const thisActor = game.actors.get("${data.actorId}");
      if (thisActor === null || thisActor.type !== "player") return;
      thisActor.sheet.rollAttribute("${data.attribute}");
    `
  } else if (data.type === "armor") {
    console.log("E-STATE | Armor Macro Drop", data);

    command = `
      const thisActor = game.actors.get("${data.actorId}");
      if (thisActor === null || thisActor.type !== "player") return;
      thisActor.sheet.rollArmor("${data.armorId}");
    `
  } else if (data.type === "weapon") {
    console.log("E-STATE | Weapon Macro Drop", data);
    command = `
      const thisActor = game.actors.get("${data.actorId}");
      if (thisActor === null || thisActor.type !== "player") return;
      thisActor.sheet.rollWeapon("${data.weaponId}");
    `
  } else if (data.type === "gear") {
    console.log("E-STATE | Gear Macro Drop", data);
    command = `
      const thisActor = game.actors.get("${data.actorId}");
      if (thisActor === null || thisActor.type !== "player") return;
      thisActor.sheet.rollGear("${data.gear}");
    `
  }

  if (command === '') {
    return;
  }

  let macro = game.macros.find((m) => m.name === data.text);
  console.log("E-STATE | Macro", macro);
  if (!macro) {
    macro = await Macro.create({
      name: data.text,
      type: "script",
      img: data.img,
      command: command,
    });
  }

  game.user.assignHotbarMacro(macro, slot);
  return false;
}

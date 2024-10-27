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

  Handlebars.registerHelper("minus", function (a, b) {
    return a - b;
  });

  Handlebars.registerHelper("plus", function (a, b) {
    return a + b;
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
    console.log("E-STATE | Localize Data", data, group);
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
        const trauma = eState.traumaTarget[data];
        string = game.i18n.localize(`${trauma}`);
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

Hooks.on("dropActorSheetData", async (actor, actorSheet, data) => {
  console.log("E-STATE | On Drop Actor Sheet Data", actor, actorSheet, data);
  console.log("E-STATE | Actor Type", actor.type);
  console.log("E-STATE | Data Type", data.type);
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
  $("#logo")[0].src = "systems/electric-state/assets/logo.webp";
}

function recalcDialog() {
  console.log("E-STATE | Recalc Dialog");
}

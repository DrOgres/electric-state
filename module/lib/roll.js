import { YearZeroRoll } from "./yzur.js";

export function prepareRollDialog(options) {
  console.log("Roll Dialog", options);

  const user = game.user;
  console.log("roll dialog user:", user.targets);

  if (user.targets.size > 0) {
    console.log("Targeted");
    let target = Array.from(user.targets)[0];
    console.log(target.document.actorId);
  }

  //[0].value.document.actorId

  const actor = options.sheet.object;
  console.log(actor);
  let talents = actor.items.filter((i) => i.type === "talent");
  let gear = actor.items.filter((i) => i.type === "gear");
  let armors = actor.items.filter((i) => i.type === "armor");
  let weapons = actor.items.filter((i) => i.type === "weapon");
  let neurocasters = actor.items.filter((i) => i.type === "neurocaster");
  let drones = actor.items.filter((i) => i.type === "drone");
  let traits = actor.items.filter((i) => i.type === "trait");
  let explosives = actor.items.filter((i) => i.type === "explosive");
  let traumas = actor.items.filter((i) => i.type === "trauma");
  let injuries = actor.items.filter((i) => i.type === "injury");
  let tensions = actor.items.filter((i) => i.type === "tension");

  console.log("building dialog");

  options.penalty = 0;
  options.bonusDefault = 0;

  let dialogHTML = "";

  switch (options.type) {
    case "attribute":
      console.log("Attribute Roll", options);
      options.dicePool = actor.system[options.attribute];
      for (let drone of drones) {
        /** set dice pool equal to drone str or agi depending on the attribute we passed in */
        if (drone.flags.isEquipped) {
          if (
            options.attribute === "strength" ||
            options.attribute === "agility"
          ) {
            options.dicePool = drone.system.attributes[options.attribute];
          }

          let foundCaster = false;
          for (let neurocaster of neurocasters) {
            if (neurocaster.flags.isEquipped) {
              options.dicePool += neurocaster.system.network.value;
              console.log("dicepool after neurocaster", options.dicePool);
              foundCaster = true;
            }
          }
          if (!foundCaster) {
            ui.notifications.warn(
              "You need to equip a neurocaster to use a drone"
            );
            return;
          }
        }
      }

      //TODO for agility rolls check to see if the actor has armor equipped and if so apply the armor penalty and show this in the dialog
      for (let armor of armors) {
        if (armor.flags.isEquipped) {
          if (options.attribute === "agility") {
            options.armorPenalty = armor.system.agiltyModifier;
          }
        }
      }

      console.log("dicepool after drone check", options.dicePool);

      dialogHTML += buildHTMLDialog(
        options.testName,
        options.dicePool,
        options.attribute
      );

      // if there is an injury or trauma that affects the attribute add it to options.penalty
      for (let injury of injuries) {
        if (injury.system.type.includes(options.attribute)) {
          options.penalty += injury.system.modifier.value;
        }
      }
      for (let trauma of traumas) {
        if (trauma.system.type.includes(options.attribute)) {
          options.penalty += trauma.system.modifier.value;
        }
      }
      console.log("penalty after injury and trauma check", options.penalty);

      console.log(options.penalty);
      dialogHTML += buildSubtotalDialog(options);
      dialogHTML += buildTalentSelectDialog(options, talents, drones);
      dialogHTML += buildGearSelectDialog(options, gear);

      //TODO if the actor has an equipped neurocaster add a check box to apply the real world penalty to the roll

      //TODO if there is a target for the user and the target actorId matches the actorID of any of the tensions use add a check box to allow the user to add the tension to the roll

      break;
    case "weapon":
      //TODO allow a range selection for the weapon and adjust the dice pool based on the range selected if applicable
      console.log("Weapon Roll", options);
      const weapon = weapons.find((i) => i.id === options.weaponId);
      console.log("Weapon", weapon);
      options.dicePool = weapon.system.modifier.value;
      options.damage = weapon.system.damage;
      if (weapon.system.type === "melee") {
        options.attribute = "strength";
        options.dicePool += actor.system.strength;
      } else if (weapon.system.type === "ranged") {
        options.attribute = "agility";
        options.dicePool += actor.system.agility;
      } else if (weapon.system.type === "neuroscape") {
        console.log("Neuroscape Weapon", actor);
        let foundCaster = false;
        for (let neurocaster of neurocasters) {
          if (neurocaster.flags.isEquipped) {
            options.dicePool += neurocaster.system.graphics.value;
            foundCaster = true;
          }
        }
        if (!foundCaster && actor.type === "player") {
          //allow non-player actors to roll neuroscape weapons without a neurocaster for robots and the like
          ui.notifications.warn(
            "You need to equip a neurocaster to use a neuroscape weapon"
          );
          return;
        }
        options.attribute = "wits";
        options.dicePool += actor.system.wits;
      }
      dialogHTML += buildHTMLDialog(
        options.testName,
        options.dicePool,
        options.attribute
      );

      dialogHTML += buildSubtotalDialog(options);
      dialogHTML += buildTalentSelectDialog(options, talents);

      break;
    case "armor":
      console.log("Armor Roll", options);
      const armor = armors.find((i) => i.id === options.armorId);
      console.log("Armor", armor);
      dialogHTML += buildHTMLDialog(
        options.testName,
        options.dicePool,
        game.i18n.localize("estate.UI.ARMOR")
      );
      dialogHTML += buildSubtotalDialog(options);
      break;
    case "death":
      console.log("Death Roll", options);
      break;
    case "drone":
      console.log("Drone Roll", options);
      const neurocaster = neurocasters.find((i) => i.flags.isEquipped);
      console.log("Neurocaster", neurocaster);
      if (neurocaster !== undefined) {
        options.dicePool += neurocaster.system.network.value;
      } else {
        ui.notifications.warn("You need to equip a neurocaster to use a drone");
        return;
      }

      dialogHTML += buildHTMLDialog(
        options.testName,
        options.dicePool,
        options.attribute
      );
      dialogHTML += buildSubtotalDialog(options);
      dialogHTML += buildTalentSelectDialog(options, talents, drones);

      break;
    case "explosive":
      console.log("Explosive Roll", options);
      break;
    case "neurocaster":
      options.gearDice = 0;
      console.log("Neurocaster Roll", options);
      if (options.cast === "info") {
        console.log("Info Cast");
        //TODO add the wits attribute to the dice pool
        //TODO add the processor attribute of the neurocaster to the gear dice pool
        //TODO check for any talents that affect the neurocaster and add them to the dice pool
        options.attribute = "wits";
        options.dicePool = actor.system.wits;
        let neurocaster = neurocasters.find((i) => i.flags.isEquipped);
        if (neurocaster !== undefined) {
          console.log("Neurocaster", neurocaster.system.processor.value);
          options.gearName = neurocaster.name + " " + game.i18n.localize("estate.UI.PROCESSOR"); 
          options.gearDice += neurocaster.system.processor.value;
        } else {
          ui.notifications.warn("You need to equip a neurocaster to cast");
          return;
        }

        dialogHTML += buildHTMLDialog(
          game.i18n.localize("estate.ATTRIBUTE.WIT"),
          options.dicePool,
          options.attribute
        );
      }

      if (options.cast === "hack") {
        console.log("Hack Cast");
        options.attribute = "wits";
        let neurocaster = neurocasters.find((i) => i.flags.isEquipped);
        if (neurocaster !== undefined) {
          console.log("Neurocaster", neurocaster.system.network.value);
          options.gearName = neurocaster.name + " " + game.i18n.localize("estate.UI.NETWORK");
          options.gearDice += neurocaster.system.network.value;
        } else {
          ui.notifications.warn("You need to equip a neurocaster to cast");
          return;
        }
        dialogHTML += buildHTMLDialog(
          game.i18n.localize("estate.ATTRIBUTE.WIT"),
          options.dicePool,
          options.attribute
        );
      }

      if (options.cast === "coms") {
        console.log("Comms Cast");
        options.attribute = "empathy";
        let neurocaster = neurocasters.find((i) => i.flags.isEquipped);
        if (neurocaster !== undefined) {
          console.log("Neurocaster", neurocaster.system.graphics.value);
          options.gearName = neurocaster.name + " " + game.i18n.localize("estate.UI.GRAPHICS");
          options.gearDice += neurocaster.system.graphics.value;
        } else {
          ui.notifications.warn("You need to equip a neurocaster to cast");
          return;
        }

        dialogHTML += buildHTMLDialog(
          game.i18n.localize("estate.ATTRIBUTE.EMP"),
          options.dicePool,
          options.attribute
        );
      }

      if(options.cast === "block"){
        console.log("Block Cast");
        options.attribute = "wits";
        let neurocaster = neurocasters.find((i) => i.flags.isEquipped);
        if (neurocaster !== undefined) {
          console.log("Neurocaster", neurocaster.system.network.value);
          options.gearName = neurocaster.name + " " + game.i18n.localize("estate.UI.NETWORK");
          options.gearDice += neurocaster.system.network.value;
        } else {
          ui.notifications.warn("You need to equip a neurocaster to cast");
          return;
        }
        dialogHTML += buildHTMLDialog(
          game.i18n.localize("estate.ATTRIBUTE.WIT"),
          options.dicePool,
          options.attribute
        );
      }

      if(options.cast === "combat"){
        console.log("Combat Cast");
        options.attribute = "wits";
        let neurocaster = neurocasters.find((i) => i.flags.isEquipped);
        if (neurocaster !== undefined) {
          console.log("Neurocaster", neurocaster.system.graphics.value);
          options.gearName = neurocaster.name + " " + game.i18n.localize("estate.UI.GRAPHICS");
          options.gearDice += neurocaster.system.graphics.value;
        } else {
          ui.notifications.warn("You need to equip a neurocaster to cast");
          return;
        }
        dialogHTML += buildHTMLDialog(
          game.i18n.localize("estate.ATTRIBUTE.WIT"),
          options.dicePool,
          options.attribute
        );
      }
      
      dialogHTML += buildSubtotalDialog(options);
      dialogHTML += buildTalentSelectDialog(options, talents);
      break;
  }

  let bonusHtml = buildInputDialog(
    game.i18n.localize("estate.ROLL.MODIFIER"),
    options.bonusDefault,
    "bonus"
  );

  console.log(dialogHTML);

  let dialog = new Dialog(
    {
      title: game.i18n.localize("estate.UI.ROLL") + " : " + options.testName,
      content: buildDivHtmlDialog(
        `
            <div class="roll-fields pi-8 mb-1">
            <h2>` +
          game.i18n.localize("estate.ROLL.TEST") +
          ": " +
          ` ${options.testName}</h2>
            ${dialogHTML}
            </hr>
            ${bonusHtml}
            </div>
            `
      ),
      buttons: {
        roll: {
          icon: '<i class="fas fa-dice-d6"></i>',
          label: game.i18n.localize("estate.UI.ROLL"),
          callback: (html) => {
            console.log("Rolling", options);
            let baseDice = options.dicePool - options.penalty;
            if (options.armorPenalty > 0) {
              baseDice -= options.armorPenalty;
            }

            //TODO if there is no gear that matches the attribute this will be an error so we need to check for that

            let selectedGearItemId;

            if (html.find("#gear")[0] !== undefined) {
              selectedGearItemId = html.find("#gear")[0].value;
            }
            const item = gear.find((i) => i.id === selectedGearItemId);

            console.log("Item", item);
            //TODO if the gear selected is consumable we need to reduce the uses value by 1
            let gearDice = options.gearDice || 0;
            if (item !== undefined) {
              options.gearUsed = selectedGearItemId;
              gearDice = item.system.modifier.value;
            }
            console.log("Gear Dice", gearDice);

            let talentDice = 0;
            if (html.find("#talent")[0] !== undefined) {
              const selectedTalentItemId = html.find("#talent")[0].value;
              const talent = talents.find((i) => i.id === selectedTalentItemId);

              if (talent !== undefined) {
                options.talentUsed = selectedTalentItemId;
                talentDice = talent.system.modifier.value;
              }
              console.log("Talent", talent);
            }
            console.log("Talent Dice", talentDice);

            let bonus = parseInt(html.find("#bonus")[0].value);

            options.baseDice = baseDice + talentDice + bonus;
            options.gearDice = gearDice;
            // Always roll at least one die
            if (options.baseDice <= 0) {
              options.baseDice = 1;
            }
            console.log("Bonus", bonus);
            console.log("Options", options);
            roll(options);
          },
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize("estate.UI.CANCEL"),
        },
      },
      default: "roll",
      close: () => {},
    },
    {
      width: 400,
    }
  );
  dialog.render(true);
}

function buildGearSelectDialog(options, gear) {
  console.log("Building Gear Select Dialog", gear);
  let html = "";
  let selectOptions = "";
  let count = 0;

  if (gear.length === 0) {
    return "";
  }

  //test gear to see if isConsumable if so check item.system.uses if it is 0 remove it from the list
  for (let item of gear) {
    if (item.system.isConsumable) {
      console.log("Consumable Gear", item);
      if (item.system.uses === 0) {
        console.log("Removing Consumable Gear", item);
        gear = gear.filter((i) => i.id !== item.id);
        continue;
      }
    }
    //Also if the item is Broken remove it from the list
    if (item.system.isBroken) {
      gear = gear.filter((i) => i.id !== item.id);
      continue;
    }
  }

  for (let item of gear) {
    console.log(item);
    // check the array talent.system.attribute to see if it contains a match for options.attribute

    if (item.system.attribute === options.attribute) {
      count++;
      selectOptions += `<option value="${item.id}">${item.name}  ${item.system.modifier.value}</option>`;
    }
  }
  if (count === 0) {
    return "";
  }
  html +=
    `<div class="flexrow">
    <h4 class="subheader middle">` +
    game.i18n.localize("estate.UI.GEAR") +
    ` : &nbsp;</h4>
    <select id="gear" style="flex-grow: 1; margin-right: 10px;">
    <option value="0">` +
    game.i18n.localize("estate.UI.NONE") +
    `</option>
    ` +
    selectOptions +
    `
    </select>
    </div>`;
  return html;
}

function buildTalentSelectDialog(options, talents, actor, drones) {
  console.log("Building Talent Select Dialog", talents, options);

  if (talents.length === 0) {
    return "";
  }

  let count = 0;

  let html = "";
  let selectOptions = "";
  console.log("Talents", talents);
  console.log("Options", options);
  console.log("Drones", drones);

  let drone = undefined;
  if (drones !== undefined) {
    drone = drones.find((i) => i.flags.isEquipped);
    console.log("Drone", drone);
  }

  let neurocaster = false;
  if (options.type === "neurocaster") {
    neurocaster = true;
    console.log("Neurocaster", neurocaster);
  }

  for (let talent of talents) {
    console.log(talent);
    // check the array talent.system.attribute to see if it contains a match for options.attribute 
    if (drone !== undefined) {
      if (options.type === "drone" || drone.flags.isEquipped) {
        if (talent.system.type.includes("drone")) {
          count++;
          selectOptions += `<option value="${talent.id}">${talent.name} &plus; ${talent.system.modifier.value}</option>`;
        }
      }
      
    }

    if (neurocaster) {
      if (options.type === "neurocaster" || neurocaster.flags.isEquipped) {
        if (talent.system.type.includes("neurocaster")) {
          count++;
          selectOptions += `<option value="${talent.id}">${talent.name} &plus; ${talent.system.modifier.value}</option>`;
        }
      }
    }

    if (
      talent.system.type.includes(options.attribute) ||
      talent.system.type.includes("all")
    ) {
      count++;
      selectOptions += `<option value="${talent.id}">${talent.name} &plus; ${talent.system.modifier.value}</option>`;
    }


  }

  if (count === 0) {
    return "";
  }

  html +=
    `<div class="flexrow">
    <h4 class="subheader middle">` +
    game.i18n.localize("estate.UI.TALENT") +
    ` : &nbsp;</h4>
    <select id="talent" style="flex-grow: 1; margin-right: 10px;">
    <option value="0">` +
    game.i18n.localize("estate.UI.NONE") +
    `</option>
    ` +
    selectOptions +
    `
    </select>
    </div>`;

  return html;
}

//TODO break out subtotal items in options
function buildSubtotalDialog(options) {
  console.log("Building subtotal Dialog", options);
  let subtotal = options.dicePool - options.penalty;
  if (options.armorPenalty > 0) {
    subtotal -= options.armorPenalty;
  }

  let html = "";

  if(options.gearDice > 0){
    subtotal += options.gearDice;
    html += `<div class="flexcol">
    <div class="flexrow">
        <h4 class="subheader middle">` +
    options.gearName +
    ` : &nbsp;</h4>
    <p id="gear" style="text-align: right" class="grow pi-2 border-bottom"> &plus;` +
    options.gearDice +
    `</p></div>`;
  }

  if (options.penalty > 0) {
    html +=
      `<div class="flexcol">
                 <div class="flexrow">
                     <h4 class="subheader middle">` +
      game.i18n.localize("estate.UI.PENALTY") +
      ` : &nbsp;</h4>
                    <p id="penalty" style="text-align: right" class="grow pi-2 border-bottom"> &minus;` +
      options.penalty +
      `</p></div>`;
  }
  if (options.armorPenalty > 0) {
    html +=
      `
        <div class="flexrow">
            <h4 class="subheader middle">` +
      game.i18n.localize("estate.UI.ARMOR_PENALTY") +
      ` : &nbsp;</h4>
        <p id="armorPenalty" style="text-align: right" class="grow pi-2 border-bottom"> &minus;` +
      options.armorPenalty +
      `</p></div>`;
  }

  html +=
    ` <hr />
        <div class="flexrow">
          <h4 class="subheader middle">` +
    game.i18n.localize("estate.UI.SUBTOTAL") +
    ` : &nbsp;</h4>
                    <p id="subtotal" style="text-align: right" class="grow pi-2 border-bottom">` +
    subtotal +
    `</p>
                </div>
            </div>`;

  return html;
}

function buildHTMLDialog(diceName, diceValue, type) {
  console.log("Building HTML Dialog", diceName, diceValue, type);
  return (
    `
      <div class="flexrow " style="flex-basis: 35%; justify-content: space-between;">
      <h4 class="subheader middle">` +
    diceName +
    ` : &nbsp;</h4>
        <p id="` +
    type +
    `" style="text-align: right" class="grow pi-2 border-bottom">` +
    diceValue +
    `</p></div>`
  );
}

function buildInputDialog(name, value, type) {
  return (
    `
          <div class="flexrow pi-1" style="flex-basis: 35%; justify-content: space-between;">
          <p style="text-transform: capitalize; white-space:nowrap;">` +
    name +
    `: </p>
     
          <input id="` +
    type +
    `" style="text-align: center" type="number" value="` +
    value +
    `"/></div>`
  );
}

function buildDivHtmlDialog(divContent) {
  return (
    "<div class='estate roll-dialog sidebar-dark'>" + divContent + "</div>"
  );
}

Hooks.on("renderChatLog", (app, html, data) => {
  html.on("click", ".dice-button.push", _onPush);
});

async function _onPush(event) {
  event.preventDefault();

  // Get the message.
  let chatCard = event.currentTarget.closest(".chat-message");
  let messageId = chatCard.dataset.messageId;
  let message = game.messages.get(messageId);
  let actor = game.actors.get(message.speaker.actor);

  // Copy the roll.
  let roll = message.rolls[0].duplicate();

  // Delete the previous message.
  await message.delete();

  // Push the roll and send it.
  await roll.push({ async: true });
  //TODO if we used gear and the gear dice roll a 1 we should reduce the gear modifier by 1 for each 1 rolled
  //TODO check rules for neurocasters to see where a push damages them
  //TODO if the push results in any 1s we should reuduce hope on the actor by 1 for each 1 rolled

  await roll.toMessage();
}

export async function roll(options) {
  console.log("Rolling", options);

  const sheet = options.sheet;
  sheet.roll = new YearZeroRoll();
  sheet.lastTestName = options.testName;
  sheet.lastDamage = options.damage;

  let actor = game.actors.get(sheet.object._id);
  let token = actor.prototypeToken.texture.src;

  let formula = options.baseDice + "db" + " + " + options.gearDice + "dg";

  let dice = {
    term: "b",
    number: options.baseDice,
  };

  let data = {
    owner: actor.id,
    name: sheet.lastTestName,
    damage: sheet.lastDamage,
  };

  let rollOptions = {
    name: sheet.lastTestName,
    damage: sheet.lastDamage,
    token: token,
    owner: actor.id,
    actorType: actor.type,
    formula: formula,
    maxPush: actor.type === "player" ? 1 : 0,
  };

  let r;

  if (options.gearDice > 0) {
    r = new YearZeroRoll(formula, data, rollOptions);
  } else {
    r = YearZeroRoll.forge(dice, data, rollOptions);
  }

  await r.toMessage({
    speaker: ChatMessage.getSpeaker({ actor: actor, token: actor.img }),
  });
  sheet.roll = r.duplicate();
}

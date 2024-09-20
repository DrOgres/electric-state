import { YearZeroRoll } from "./yzur.js";

export function prepareRollDialog(options) {
  console.log("Roll Dialog", options);

  const actor = options.sheet.object;
  console.log(actor);
  let talents = actor.items.filter((i) => i.type === "talent");
  let gear = actor.items.filter((i) => i.type === "gear");
  let armor = actor.items.filter((i) => i.type === "armor");
  let weapons = actor.items.filter((i) => i.type === "weapon");
  let neurocasters = actor.items.filter((i) => i.type === "neurocaster");
  let drones = actor.items.filter((i) => i.type === "drone");
  let traits = actor.items.filter((i) => i.type === "trait");
  let explosives = actor.items.filter((i) => i.type === "explosive");
  let trauma = actor.items.filter((i) => i.type === "trauma");
  let injuries = actor.items.filter((i) => i.type === "injury");

  console.log("building dialog");

  let dialogHTML = "";

  switch (options.type) {
    case "attribute":
      console.log("Attribute Roll", options);
      // check to see if they are using a drone if so use the drone attribute for strength or agility, and add the network attribute of their eqipped neurocaster

      for (let drone of drones) {
        /** set dice pool equal to drone str or agi depending on the attribute we passed in */
        if ((drone.flags.isEquipped = true)) {
          if (
            options.attribute === "strength" ||
            options.attribute === "agility"
          ) {
            options.dicePool = drone.system[options.attribute];
          }

          for (let neurocaster of neurocasters) {
            if ((neurocaster.flags.isEquipped = true)) {
              options.dicePool += neurocaster.system.network.value;
            }
          }
        }
      }

      console.log("dicepool after drone check", options.dicePool);

      dialogHTML += buildHTMLDialog(
        options.testName,
        options.dicePool,
        options.attribute
      );

      console.log(options.penalty);
      dialogHTML += buildSubtotalDialog(options);
      dialogHTML += buildTalentSelectDialog(options, talents);
      dialogHTML += buildGearSelectDialog(options, gear);
      break;
    case "weapon":
      console.log("Weapon Roll", options);
      break;
    case "armor":
      console.log("Armor Roll", options);
      break;
    case "death":
      console.log("Death Roll", options);
      break;
  }

  console.log(dialogHTML);
}

function buildGearSelectDialog(options, gear) {
  console.log("Building Gear Select Dialog", gear);
  let html = "";
  let selectOptions = "";
  let count = 0;

  if (gear.length === 0) {
    return "";
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

function buildTalentSelectDialog(options, talents) {
  console.log("Building Talent Select Dialog", talents, options);
  let html = "";
  let selectOptions = "";

  if (talents.length === 0) {
    return;
  }

  for (let talent of talents) {
    console.log(talent);
    // check the array talent.system.attribute to see if it contains a match for options.attribute

    if (
      talent.system.type.includes(options.attribute) ||
      talent.system.type.includes("all")
    ) {
      selectOptions += `<option value="${talent.id}">${talent.name} &plus; ${talent.system.modifier.value}</option>`;
    }
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

function buildSubtotalDialog(options) {
  console.log("Building subtotal Dialog", options);
  const subtotal = options.dicePool;
  return (
    `
      <div class="flexrow">
      <h4 class="subheader middle">` +
    game.i18n.localize("estate.UI.SUBTOTAL") +
    ` : &nbsp;</h4>
        <p id="subtotal" style="text-align: right" class="grow pi-2 border-bottom">` +
    subtotal +
    `</p></div>`
  );
}

function buildHTMLDialog(diceName, diceValue, type) {
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

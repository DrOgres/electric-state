import { YearZeroRoll } from "./yzur.js";

export function prepareDeathRollDialog(options) {
  console.log("Death Roll Dialog", options);

  const actor = options.actor;

  let dialogHTML = "";
  // console.log("Death Roll", actor.getFlag("world", "deathSucessCount"));
  // if (actor.getFlag("world", "deathSucessCount") === undefined) {
  //   actor.setFlag("world", "deathSucessCount", 0);
  // }
  // if (actor.flags.world.deathFailureCount === undefined) {
  //   actor.setFlag("world", "deathFailureCount", 0);
  // }
  let sucessCount = actor.getFlag("world", "deathSucessCount") || 0;
  let failureCount = actor.getFlag("world", "deathFailureCount") || 0;

  let dicePool = 4;
  let bonus = 0;

  console.log("talents", options.talents);
  for (let talent of options.talents) {
    if (talent.system.type.includes("death")) {
      console.log("Death Talent", talent);
      bonus += talent.system.modifier.value;
    }
  }
  options.type = "death";
  options.dicePool = dicePool;
  options.testName = game.i18n.localize("estate.UI.DEATHROLL");
  options.bonusDefault = bonus;
  options.sucessCount = sucessCount;
  options.failureCount = failureCount;
  options.gearUsed = [null];

  console.log("building dialog", options);

  let failureHTML = "";
  for (let i = 0; i < 3; i++) {
    if (i < failureCount) {
      failureHTML += `<div><i class="fa-solid fa-skull padding-medium"></i></div>`;
    } else {
      failureHTML += `<div><i class="fa-regular fa-skull padding-medium"></i></div>`;
    }
  }

  let successHTML = "";
  for (let i = 3; i > 0; i--) {
    if (i <= sucessCount) {
      successHTML += `<div><i class="fa-solid fa-heart padding-medium"></i></div>`;
    } else {
      successHTML += `<div><i class="fa-regular fa-heart padding-medium"></i></div>`;
    }
  }

  dialogHTML +=
    `
  <div class="grid three-col center middle margin-small padding-small">
      <div class="failures grid three-col gap-med center middle">` +
    failureHTML +
    `
      </div>
      <div class="dice all-caps fw-800 fs-300 margin-small padding-small">` +
    game.i18n.localize("estate.ROLL.ROLLING") +
    `: ` +
    (options.dicePool + options.bonusDefault) +
    ` ` +
    game.i18n.localize("estate.UI.DICE") +
    `</div>
      <div class="successes grid three-col gap-med center middle"> ` +
    successHTML +
    `
      
      </div>
  </div>
  `;
  let dialog = new Dialog(
    {
      title: game.i18n.localize("estate.UI.DEATHROLL"),
      content: buildDivHtmlDialog(
        ` 
            <div class="roll-fields pi-8 mb-1">
            <h2>` +
          game.i18n.localize("estate.UI.DEATHROLL") +
          `</h2>
            ${dialogHTML}
            </hr>
            </div>
            `
      ),
      buttons: {
        roll: {
          icon: '<i class="fas fa-dice-d6"></i>',
          label: game.i18n.localize("estate.ROLL.ROLL"),
          callback: async () => {
            console.log("Rolling", options);
            let baseDice = options.dicePool + options.bonusDefault;
            options.baseDice = baseDice;
            // Always roll at least four dice on a death roll
            if (options.baseDice <= 0) {
              options.baseDice = 4;
            }
            console.log("Bonus", bonus);
            console.log("Options", options);
            let result = await roll(options);
            console.log("Death Roll", result);
            if (result.successCount > 0) {
              sucessCount += result.successCount;
              // send chat message that the actor has gained successes equal to the result.successCount
              let stabalized = "";
              if (sucessCount >= 3) {
                stabalized = ", and has stabilized";
              }
              let chatData = {
                user: game.user._id,
                speaker: ChatMessage.getSpeaker(),
                content:
                  `${actor.name} has gained ${result.successCount} successes on their death roll` +
                  stabalized,
              };
              ChatMessage.create(chatData);
              // if the actor has 3 successes they are no longer in danger of dying and the death roll is over
            } else {
              failureCount++;
              // send chat message that the actor has gained a failure
              let died = "";
              if (failureCount >= 3) {
                died = ", and has died";
              }
              let chatData = {
                user: game.user._id,
                speaker: ChatMessage.getSpeaker(),
                content:
                  `${actor.name} has gained a failure on their death roll` +
                  died,
              };
              ChatMessage.create(chatData);

              // if the actor has 3 failures they are dead and the death roll is over
            }

            if (sucessCount >= 3 || failureCount >= 3) {
              actor.setFlag("world", "deathSucessCount", 0);
              actor.setFlag("world", "deathFailureCount", 0);
              console.log("Death Roll", actor);
              return;
            }

            actor.setFlag("world", "deathSucessCount", sucessCount);
            actor.setFlag("world", "deathFailureCount", failureCount);
            console.log("Death Roll", actor);
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

export async function prepareRollDialog(options) {
  console.log("Roll Dialog", options);

  const user = game.user;
  console.log("roll dialog user:", user.targets);

  if (user.targets.size > 0) {
    console.log("Targeted");
    let target = Array.from(user.targets)[0];
    console.log(target.document.actorId);
  }

  //rolling bliss recovery if the result is 1 increase the premanent bliss of the actor by 1 in any case reduce the current bliss by 1
  if (options.type === "bliss") {
    console.log("Bliss Roll", options);
    const formula = "1db";
    const sheet = options.sheet;
    sheet.roll = new YearZeroRoll();

    sheet.lastTestName = options.testName;
    sheet.lastDamage = options.damage;

    let actor = game.actors.get(sheet.object._id);
    let token = actor.prototypeToken.texture.src;

    let data = {
      owner: actor.id,
      name: sheet.lastTestName,
      damage: sheet.lastDamage,
    };

    let rollOptions = {
      name: sheet.lastTestName,
      token: token,
      owner: actor.id,
      actorType: actor.type,
      formula: formula,
      type: options.type,
      maxPush: 0
    };

    let r;

    r = new YearZeroRoll(formula, data, rollOptions);

    await r.evaluate();
    console.log("Roll", r);


    console.log("Bliss Roll Result", r.result);

    if (Number(r.result) === 1) {
      let bliss = actor.system.bliss;
      let permanent = actor.system.permanent;
      bliss--;
      permanent++;
      if (bliss < permanent) { bliss = permanent; }
      await actor.update({ "system.bliss": bliss, "system.permanent": permanent } );
    } else {
      let bliss = actor.system.bliss;
      let permanent = actor.system.permanent;
      bliss--;
      if (bliss < permanent) { bliss = permanent; }
      await actor.update({ "system.bliss": bliss } );
    }
    await r.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: actor, token: actor.img }),
    });
    sheet.roll = r.duplicate();

    return;
  }



  const actor = options.sheet.object;
  console.log(actor);

  // take the talents from the option or default to the current actor talents
  let talents =
    options.talents ?? actor.items.filter((i) => i.type === "talent");
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

          options.testName = "[" + drone.name + "] " + options.testName;

          let foundCaster = false;
          for (let neurocaster of neurocasters) {
            if (neurocaster.flags.isEquipped) {
              // options.dicePool += neurocaster.system.network.value;
              // console.log("dicepool after neurocaster", options.dicePool);
              options.cast = "realworld";
              options.gearDice = neurocaster.system.network.value;
              options.gearName = game.i18n.localize("estate.UI.NETWORK");
              if (options.gearUsed === undefined) {
                options.gearUsed = [];
              }
              options.gearUsed.push(neurocaster._id);
              options.castAttribute = "network";
              foundCaster = true;
            }
          }
          if (!foundCaster) {
            ui.notifications.warn(game.i18n.localize("estate.MSG.NUEROCASTER"));
            return;
          }
        }
      }

      for (let armor of armors) {
        if (armor.flags.isEquipped) {
          if (options.attribute === "agility") {
            options.armorPenalty = Math.abs(armor.system.agiltyModifier);
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

      dialogHTML += await buildSubtotalDialog(options);
      for (let neurocaster of neurocasters) {
        if (neurocaster.flags.isEquipped) {
          dialogHTML += buildDialogCheckBox(
            "estate.UI.RW_PENALTY",
            Math.abs(neurocaster.system.realWorldPenalty),
            "penalty"
          );
          options.rwPenalty = neurocaster.system.realWorldPenalty;
        }
      }

      
      dialogHTML += buildTensionSelectDialog(options, tensions);      
      dialogHTML += buildTalentSelectDialog(options, talents, drones);
      dialogHTML += buildGearSelectDialog(options, gear);

     

      break;
    case "weapon":
      //TODO allow a range selection for the weapon and adjust the dice pool based on the range selected if applicable
      console.log("Weapon Roll", options);
      const weapon = weapons.find((i) => i.id === options.weaponId);
      console.log("Weapon", weapon);

      options.damage = weapon.system.damage;
      let attributeNameKey = "estate.ATTRIBUTE.STR";
      if (weapon.system.type === "melee") {
        options.attribute = "strength";
        options.dicePool += actor.system.strength;
        attributeNameKey = "estate.ATTRIBUTE.STR";
      } else if (weapon.system.type === "ranged") {
        options.attribute = "agility";
        options.dicePool += actor.system.agility;
        attributeNameKey = "estate.ATTRIBUTE.AGI";
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
            game.i18n.localize("estate.MSG.NUEROCASTWEAPON")
          );
          return;
        }
        options.attribute = "wits";
        options.dicePool += actor.system.wits;
        attributeNameKey = "estate.ATTRIBUTE.WIT";
      }
      dialogHTML += buildHTMLDialog(
        game.i18n.localize(attributeNameKey),
        options.dicePool,
        options.attribute
      );

      dialogHTML += await buildSubtotalDialog(options);
      dialogHTML += buildTensionSelectDialog(options, tensions);
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
      dialogHTML += await buildSubtotalDialog(options);
      break;
    case "vehicle-armor":
      console.log("Vehicle Armor Roll", options);
      //get the flag from actor.flags.electric-state.armor and use it to modify the dice pool
      let vehicleArmor = actor.getFlag("electric-state", "armor");
      console.log("Vehicle Armor", vehicleArmor);
      if (vehicleArmor !== undefined) {
        options.traitMod = vehicleArmor;
      }

      options.type = "vehicle-armor";

      dialogHTML += buildHTMLDialog(
        options.testName,
        options.dicePool,
        options.type
      );
      dialogHTML += await buildSubtotalDialog(options);
      break;
    case "vehicle-maneuverability":
      console.log("Vehicle Maneuverability Roll", options);
      //get the flag from actor.flags.electric-state.maneuver and use it to modify the dice pool
      options.traitMod = actor.getFlag("electric-state", "maneuver");

      options.traitModSign = "";
      if (options.traitMod > 0) {
        options.traitModSign = "+";
      } else {
        options.traitModSign = "-";
      }

      dialogHTML += buildHTMLDialog(
        game.i18n.localize("estate.ATTRIBUTE.AGI"),
        options.dicePool
      );
      dialogHTML += await buildSubtotalDialog(options);
      dialogHTML += buildTalentSelectDialog(options, options.talents);
      break;
    case "robot-armor":
      console.log("Robot Armor Roll", options);
      dialogHTML += buildHTMLDialog(options.testName, options.dicePool);
      dialogHTML += await buildSubtotalDialog(options);
      break;
    case "drone":
      console.log("Drone Roll", options);
      const neurocaster = neurocasters.find((i) => i.flags.isEquipped);
      console.log("Neurocaster", neurocaster);
      if (neurocaster !== undefined) {
        options.dicePool += neurocaster.system.network.value;
      } else {
        ui.notifications.warn(game.i18n.localize("estate.MSG.NUEROCASTER"));
        return;
      }

      dialogHTML += buildHTMLDialog(
        options.testName,
        options.dicePool,
        options.attribute
      );
      dialogHTML += buildTensionSelectDialog(options, tensions);
      dialogHTML += await buildSubtotalDialog(options);
      dialogHTML += buildTalentSelectDialog(options, talents, drones);

      break;
    case "explosive":
      console.log("Explosive Roll", options);

      // ADD the agility of the actor to the dice pool
      console.log("Explosive Roll", options);
      console.log("Actor", actor.system.agility);
      options.dicePool += actor.system.agility;
      options.type = "explosive";

      // add the modifier value of the explosive to the gear dice pool
      const explosive = explosives.find((i) => i.id === options.explosiveId);
      if (explosive !== undefined) {
        options.gearDice = explosive.system.modifier.value;
        options.gearName = explosive.name;
      } else {
        ui.notifications.warn(game.i18n.localize("estate.MSG.EXPLOSIVEWARN"));
        return;
      }

      console.log("Explosive", explosive);
      const damageDice = explosive.system.blast;
      options.damage = 0;
      for (let i = 0; i < damageDice; i++) {
        let roll = Math.floor(Math.random() * 6) + 1;
        console.log("Roll", roll);
        if (roll === 6) {
          options.damage++;
        }
        console.log("Damage", options.damage);
      }

      dialogHTML += buildHTMLDialog(
        game.i18n.localize("estate.ATTRIBUTE.AGI"),
        options.dicePool,
        options.attribute
      );
      dialogHTML += await buildSubtotalDialog(options);
      dialogHTML += buildTensionSelectDialog(options, tensions);
      dialogHTML += buildTalentSelectDialog(options, talents);

      break;
    case "neurocaster":
      console.log("Neurocaster Roll", options);
      options.gearDice = 0;
      console.log("Neurocaster Roll", options);
      if (options.cast === "info") {
        console.log("Info Cast");
        options.attribute = "wits";
        options.dicePool = actor.system.wits;
        options.castAttribute = "processor";
        let neurocaster = neurocasters.find((i) => i.flags.isEquipped);
        if (neurocaster !== undefined) {
          console.log("Neurocaster", neurocaster.system.processor.value);
          options.gearName =
            neurocaster.name + " " + game.i18n.localize("estate.UI.PROCESSOR");
          options.gearDice += neurocaster.system.processor.value;
        } else {
          ui.notifications.warn(game.i18n.localize("estate.MSG.NUEROCASTER"));
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
        options.dicePool = actor.system.wits;
        options.castAttribute = "network";
        let neurocaster = neurocasters.find((i) => i.flags.isEquipped);
        if (neurocaster !== undefined) {
          console.log("Neurocaster", neurocaster.system.network.value);
          options.gearName =
            neurocaster.name + " " + game.i18n.localize("estate.UI.NETWORK");
          options.gearDice += neurocaster.system.network.value;
        } else {
          ui.notifications.warn(game.i18n.localize("estate.MSG.NUEROCASTER"));
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
        options.dicePool = actor.system.empathy;
        options.castAttribute = "graphics";
        let neurocaster = neurocasters.find((i) => i.flags.isEquipped);
        if (neurocaster !== undefined) {
          console.log("Neurocaster", neurocaster.system.graphics.value);
          options.gearName =
            neurocaster.name + " " + game.i18n.localize("estate.UI.GRAPHICS");
          options.gearDice += neurocaster.system.graphics.value;
        } else {
          ui.notifications.warn(game.i18n.localize("estate.MSG.NUEROCASTER"));
          return;
        }

        dialogHTML += buildHTMLDialog(
          game.i18n.localize("estate.ATTRIBUTE.EMP"),
          options.dicePool,
          options.attribute
        );
      }

      if (options.cast === "block") {
        console.log("Block Cast");
        options.attribute = "wits";
        options.dicePool = actor.system.wits;
        options.castAttribute = "network";
        let neurocaster = neurocasters.find((i) => i.flags.isEquipped);
        if (neurocaster !== undefined) {
          console.log("Neurocaster", neurocaster.system.network.value);
          options.gearName =
            neurocaster.name + " " + game.i18n.localize("estate.UI.NETWORK");
          options.gearDice += neurocaster.system.network.value;
        } else {
          ui.notifications.warn(game.i18n.localize("estate.MSG.NUEROCASTER"));
          return;
        }
        dialogHTML += buildHTMLDialog(
          game.i18n.localize("estate.ATTRIBUTE.WIT"),
          options.dicePool,
          options.attribute
        );
      }

      if (options.cast === "combat") {
        console.log("Combat Cast");
        options.attribute = "wits";
        options.dicePool = actor.system.wits;
        options.castAttribute = "graphics";
        let neurocaster = neurocasters.find((i) => i.flags.isEquipped);
        if (neurocaster !== undefined) {
          console.log("Neurocaster", neurocaster.system.graphics.value);
          options.gearName =
            neurocaster.name + " " + game.i18n.localize("estate.UI.GRAPHICS");
          options.gearDice += neurocaster.system.graphics.value;
        } else {
          ui.notifications.warn(game.i18n.localize("estate.MSG.NUEROCASTER"));
          return;
        }
        dialogHTML += buildHTMLDialog(
          game.i18n.localize("estate.ATTRIBUTE.WIT"),
          options.dicePool,
          options.attribute
        );
      }

      dialogHTML += await buildSubtotalDialog(options);
      dialogHTML += buildTensionSelectDialog(options, tensions);
      dialogHTML += buildTalentSelectDialog(options, talents);
      break;
  }



  let bonusHtml = buildInputDialog(
    game.i18n.localize("estate.ROLL.MODIFIER"),
    options.bonusDefault,
    "bonus"
  );

  let dialog = new Dialog(
    {
      title: game.i18n.localize("estate.ROLL.ROLL") + " : " + options.testName,
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
          label: game.i18n.localize("estate.ROLL.ROLL"),
          callback: (html) => {
            console.log("Rolling", options);
            let baseDice = options.dicePool - options.penalty;
            if (options.traitMod !== 0 && options.traitMod !== undefined) {
              baseDice += options.traitMod;
            }

            console.log("Base Dice", baseDice);

            //TODO ensure that the traitMod has not reduced the dice pool to less than 0 for armor or less than 1 for other rolls
            if (options.type === "vehicle-armor" && baseDice < 0) {
              baseDice = 0;
              ui.notifications.warn(
                game.i18n.localize("estate.MSG.BUSTEDARMOR")
              );
              return;
            } else if (baseDice < 1) {
              baseDice = 1;
            }

            if (options.armorPenalty > 0) {
              baseDice -= options.armorPenalty;
            }

            let neurocasterPenalty = 0;
            let checkbox = html.find("#conditional-modifier-penalty")[0];
            console.log("Checkbox", checkbox);
            if (checkbox !== undefined && checkbox.checked) {
              console.log("Checkbox", checkbox.checked);
              neurocasterPenalty = parseInt(checkbox.value);
            }
            console.log("Neurocaster Penalty", neurocasterPenalty);
            if (neurocasterPenalty > 0) {
              baseDice -= neurocasterPenalty;
            }


            let tensionDice = 0;
            
            let selectedTensionItemId;
            if (html.find("#tension")[0] !== undefined) {
              selectedTensionItemId = html.find("#tension")[0].value;
            }
            const tension = tensions.find((i) => i.id === selectedTensionItemId);
            if (tension !== undefined) {
              options.tensionUsed = selectedTensionItemId;
              tensionDice = tension.system.score;
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
            console.log("Gear Dice", gearDice);
            if (item !== undefined) {
              options.gearUsed.push(selectedGearItemId);
              gearDice += item.system.modifier.value;
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

            options.baseDice = baseDice + talentDice + tensionDice + bonus;
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



function buildDialogCheckBox(label, value, type) {
  let sign = "";
  if (type === "penalty") {
    sign = "&minus;";
  } else {
    sign = "&plus;";
  }
  return (
    `
    <ul class="leaders">
    <li>
    <span class="subheader">` +
    game.i18n.localize("estate.UI.APPLY") +
    " " +
    game.i18n.localize(label) +
    `</span> 
    <span id="checkboxDisplay">
    <input type="checkbox"  class="css-checkbox" id="conditional-modifier-` +
    type +
    `" value="` +
    value +
    `" checked=true  />
    <label for="conditional-modifier-` +
    type +
    `"> ` +
    sign +
    `&nbsp;` +
    value +
    ` <i class="fa-solid fa-dice-d6 red"></i></label>
    
    </span>
    </li>
    </ul>`
  );
}

function buildTensionSelectDialog(options, tensions) {
  console.log("Building Tension Select Dialog", options.target);
  // if we have a target that has a tension just return without building the dialog

  //TODO get the tokens that are targeted and check if they have a tension with the actor if so select that tension as the default

  console.log("Building Tension Select Dialog", tensions, options);
  let html = "";
  let selectOptions = "";
  let count = 0;
  const targets = Array.from(game.user.targets);
  console.log("Targets", targets);


  if (tensions.length === 0) {
    return "";
  }

  for (let tension of tensions) {
    console.log(tension);
    console.log("Tension", tension.system.actorId);
    let isDefault = false;
    if(targets.length > 0) {
      targets.forEach((target) => {
        console.log("Target", target);
        if (tension.system.actorId === target.document.actorId) {
          options.tensionUsed = tension.id;
          console.log("Tension Used", options.tensionUsed);
          isDefault = true;
        }
      }
      );
    }
    count++;
    const actor = game.actors.get(tension.system.actorId);
    selectOptions += `<option value="${tension.id}" ${isDefault ? "selected" : ""}>${actor.name} &plus; ${tension.system.score}</option>`;
    // selectOptions += `<option value="${tension.id}" >${actor.name} &plus; ${tension.system.score}</option>`;
  }

  if (count === 0) {
    return "";
  }

  html +=
    `<ul class="leaders">
    <li>
    <span>` +
    game.i18n.localize("estate.UI.TENSION") +
    ` : &nbsp;</span>
    <span id="tension-select">
    <select id="tension" style="flex-grow: 1; margin-right: 10px;">
    <option value="0">` +
    game.i18n.localize("estate.UI.NONE") +
    `</option>
    ` +
    selectOptions +
    `</select>
    </span>
    </li>
    </ul>`;
  return html;
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
    console.log("gear select:", item);
    if (item.system.isConsumable) {
      console.log("Consumable Gear", item);
      if (item.system.uses === 0) {
        console.log("Removing Consumable Gear", item);
        gear = gear.filter((i) => i.id !== item.id);
        continue;
      }
    }
    //Also if the item is Broken remove it from the list
    if (item.system.modifier.value === 0) {
      gear = gear.filter((i) => i.id !== item.id);
      continue;
    }
  }

  for (let item of gear) {
    console.log(item);
    // check the array talent.system.attribute to see if it contains a match for options.attribute

    if (item.system.attribute === options.attribute) {
      count++;
      selectOptions += `<option value="${item.id}">${item.name} &plus;${item.system.modifier.value}  </option>`;
    }
  }
  if (count === 0) {
    return "";
  }
  html +=
    `<ul class="leaders">
    <li>
    <span class="subheader">` +
    game.i18n.localize("estate.UI.GEAR") +
    ` : &nbsp;</span>
    <span id="gear-select">
    <select id="gear">
    <option value="0">` +
    game.i18n.localize("estate.UI.NONE") +
    `</option>
    ` +
    selectOptions +
    `
    </select>
    </span>
    </li>
    </ul>`;
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

    if (options.type === "weapon") {
      if (talent.system.type.includes("weapon")) {
        count++;
        selectOptions += `<option value="${talent.id}">${talent.name} &plus; ${talent.system.modifier.value}</option>`;
      }
    }
  }

  if (count === 0) {
    return "";
  }

  html +=
    `<ul class="leaders">
    <li>
    <span>` +
    game.i18n.localize("estate.UI.TALENT") +
    ` : &nbsp;</span>
    <span id="talent-select">
    <select id="talent" style="flex-grow: 1; margin-right: 10px;">
    <option value="0">` +
    game.i18n.localize("estate.UI.NONE") +
    `</option>
    ` +
    selectOptions +
    `
    </select>
    </span>
    </li>
    </ul>`;

  return html;
}

async function buildSubtotalDialog(options) {
  console.log("Building subtotal Dialog", options);
  let subtotal = options.dicePool - options.penalty;
  if (options.armorPenalty > 0) {
    subtotal -= options.armorPenalty;
  }

  if (options.actorType === "vehicle") {
    subtotal += options.traitMod;
  }

  let html = "";

  if (options.traitMod !== 0 && options.traitMod !== undefined) {
    html +=
      `<ul class="leaders">
      <li>
        <span class="subheader">` +
      game.i18n.localize("estate.UI.FROM_TRAITS") +
      ` : &nbsp;
        </span>
        <span id="trait"> <i class="fa-solid fa-dice-d6"></i> ` +
      options.traitModSign +
      ` ` +
      options.traitMod +
      `
        </span>
      </li>
    </ul>`;
  }

  if (options.gearDice > 0) {
    subtotal += options.gearDice;
    html +=
      `<ul class="leaders">
        <li>
          <span class="subheader">` +
      options.gearName +
      ` : &nbsp;
          </span>
          <span id="standard-gear"><i class="fa-solid fa-dice-d6"></i> &plus; ` +
      options.gearDice +
      `
          </span>
        </li>
      </ul>`;
  }

  if (options.penalty > 0) {
    html +=
      `<ul class="leaders">
          <li>
              <span class="subheader">` +
      game.i18n.localize("estate.UI.PENALTY") +
      ` : &nbsp;
              </span>
              <span id="penalty"><i class="fa-solid fa-dice-d6 red"></i> &minus;` +
      options.penalty +
      `
              </span>
          </li>
        </ul>`;
  }
  if (options.armorPenalty > 0) {
    html +=
      `<ul class="leaders">
          <li>
            <span class="subheader">` +
      game.i18n.localize("estate.UI.ARMOR_PENALTY") +
      ` : &nbsp;
            </span>
            <span id="armorPenalty"> <i class="fa-solid fa-dice-d6 red"></i> &minus;` +
      options.armorPenalty +
      `
            </span>
          </li>
        </ul>`;
  }

  const subtotals = await calcSubtotal(options);
  //TODO localize the strings
  html +=
    ` <ul class="leaders border-bottom-thick">
        <li>
          <span class="subheader middle">` +
    game.i18n.localize("estate.UI.SUBTOTAL") +
    ` : &nbsp;
          </span>
          <span id="subtotal"> Base Dice: <i class="fa-solid fa-dice-d6 red"></i> ` +
    subtotals.baseDice +
    `&nbsp; &nbsp; Gear Dice: <i class="fa-solid fa-dice-d6"></i> ` +
    subtotals.gearDice +
    ` 
          </span>
        </li>
      </ul>`;

  return html;
}

async function calcSubtotal(options) {
  console.log("Calculating Subtotal", options);

  let subtotal = { baseDice: 0, gearDice: 0 };

  subtotal.baseDice = options.dicePool - options.penalty;
  if (options.armorPenalty > 0) {
    subtotal.baseDice -= options.armorPenalty;
  }

  if (options.traitMod !== 0 && options.traitMod !== undefined) {
    subtotal.gearDice += options.traitMod;
  }

  if (options.gearDice > 0) {
    subtotal.gearDice += options.gearDice;
  }

  if (subtotal.baseDice <= 0) {
    subtotal.baseDice = 1;
  }

  return subtotal;
}

function buildHTMLDialog(diceName, diceValue, type) {
  console.log("Building HTML Dialog", diceName, diceValue, type);
  return (
    `
      <ul class="leaders " style="flex-basis: 35%; justify-content: space-between;">
      <li>
      <span class="subheader">` +
    diceName +
    ` : &nbsp;</span>
        <span id="` +
    type +
    `"> <i class="fa-solid fa-dice-d6 red"></i> &plus; ` +
    diceValue +
    `</span>
    </li>
    </ul>`
  );
}

function buildInputDialog(name, value, type) {
  return (
    `
          <ul class="leaders">
          <li>
          <span style="subheader">
              ` +
    name +
    ` : 
          </span>
          <span>
              <input id="` +
    type +
    `" style="text-align: center" type="number" value="` +
    value +
    `"/>
          </span>
          </li>
    </ul>`
  );
}

function buildDivHtmlDialog(divContent) {
  return (
    "<div class='estate roll-dialog sidebar-dark'>" + divContent + "</div>"
  );
}

Hooks.on("renderChatLog", (app, html, data) => {
  html.on("click", ".dice-button.push", _onPush);
  html.on("click", ".dice-button.apply-damage", _onApplyDamage);
});


async function _onApplyDamage(event) {
  console.log("Applying Damage");
  event.preventDefault();
  let chatCard = event.currentTarget.closest(".chat-message");
  let messageId = chatCard.dataset.messageId;
  let message = game.messages.get(messageId);
  let actor = game.actors.get(message.speaker.actor);
  let sheet = actor.sheet;

  let roll = message.rolls[0].duplicate();

  console.log("Roll", roll);
  //get the user that clicked the button, if they are the owner of the actor or tHE GM, find any targeted tokens.
  let user = game.user;
  let targets = Array.from(game.user.targets);
  console.log("User", user);
  console.log("Targets", targets);

  // if the targets is more than one check to see if the damage source is an explosion if so apply to all targets
  // if not do nothing and warn the user that they can only apply damage to one target at a time

  if (targets.length > 1) {
    if (roll.options.type === "explosive") {
      console.log("Explosive Damage", roll);
    } else {
      ui.notifications.warn(
        game.i18n.localize("estate.MSG.DAMAGEONE")
      );
      return;
    }
  }
  
}

async function _onPush(event) {
  event.preventDefault();

  // Get the message.
  let chatCard = event.currentTarget.closest(".chat-message");
  let messageId = chatCard.dataset.messageId;
  let message = game.messages.get(messageId);
  let actor = game.actors.get(message.speaker.actor);
  let sheet = actor.sheet;

  // Copy the roll.
  let roll = message.rolls[0].duplicate();

  // Delete the previous message.
  await message.delete();

  // Push the roll and send it.
  await roll.push();

  console.log("Pushing", roll);
  const gearDamage = roll.gearDamage;
  console.log("Gear Damage", gearDamage);
  const hopeDamage = roll.attributeTrauma;
  console.log("Hope Damage", hopeDamage);

  console.log("ROll", roll);
  console.log("actor", actor);
  let gearArray = [];
  console.log("GearId", roll.options.gearId);
  if (roll.options.gearId === undefined) {
    console.log("No Gear");
    return;
  } else {
    console.log("GearId", roll.options.gearId);
    for (let gear of roll.options.gearId) {
      console.log("Gear", gear);
      gearArray.push(actor.items.find((i) => i.id === gear));
    }
  }
  console.log("GearArray", gearArray);
  if (gearDamage > 0) {
    if (gearArray !== undefined) {
      console.log("Gear", gearArray);
      for (let gear of gearArray) {
        if (gear.type !== "neurocaster") {
          gear.system.modifier.value -= gearDamage;
          const update = [
            {
              _id: gear.id,
              "system.modifier.value": gear.system.modifier.value,
            },
          ];
          await Item.updateDocuments(update, { parent: actor });
          console.log("Gear", gear);
          console.log("actor", actor);
        } else {
          console.log("Neurocaster Damage", roll);
          const str = "system." + roll.options.castAttribute + ".value";
          // console.log("STR", str);

          const update = [
            {
              _id: gear.id,
              [str]: gear.system[roll.options.castAttribute].value - gearDamage,
            },
          ];
          console.log("Update", update);
          await Item.updateDocuments(update, { parent: actor });

          if (gear.system[roll.options.castAttribute].value <= 0) {
            console.log("neurocaster broken", gear);
            await actor.update({ "system.hope.value": 0 });

            const update = [
              {
                _id: gear.id,
                "system.isBroken": true,
              },
            ];
            await Item.updateDocuments(update, { parent: actor });
            console.log("actor", actor);
            ui.notifications.info(
              game.i18n.localize("estate.MSG.NEUROCASTERBROKEN")
            );
          }
        }
      }
    }

    if (actor.type === "vehicle") {
      console.log("Vehicle Damage", gearDamage);
      // the vehicle takes damage to the maneuverability trait
      let maneuverability = actor.system.maneuverability.value;
      maneuverability -= gearDamage;
      await actor.update({ "system.maneuverability.value": maneuverability });
      console.log("Vehicle", actor);
    }
  }

  if (hopeDamage > 0 && actor.type === "player") {
    console.log("damage to hope", hopeDamage);
    let hope = actor.system.hope.value;
    hope -= hopeDamage;
    if (hope < 0) {
      hope = 0;
    }
    console.log("Hope", hope);
    await actor.update({ "system.hope.value": hope });
  } else if (hopeDamage > 0 && actor.type === "vehicle") {
    // get the actor that is the driver of the vehicle and apply the hope damage to them
    console.log("Vehicle Hope Damage", actor);
    let driverId = actor.system.passengers.driverId;
    console.log("DriverId", driverId);
    let driver = game.actors.get(driverId);
    console.log("Driver", driver);
    let hope = driver.system.hope.value;
    hope -= hopeDamage;
    console.log("Hope", hope);
    await driver.update({ "system.hope.value": hope });
  }

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
    type: options.type,
    gearId: options.gearUsed,
  };

  if (options.type === "neurocaster" || options.type === "attribute") {
    if (options.cast !== undefined) {
      rollOptions.cast = options.cast;
      rollOptions.castAttribute = options.castAttribute;
    }
    // rollOptions.cast = options.cast;
    // rollOptions.castAttribute = options.castAttribute;
  }
  console.log("Roll Options", rollOptions);

  rollOptions.maxPush = isRollPushable(actor, options) ? 1 : 0;

  let r;

  if (options.gearDice > 0) {
    r = new YearZeroRoll(formula, data, rollOptions);
  } else {
    r = YearZeroRoll.forge(dice, data, rollOptions);
  }

  await r.evaluate();
  console.log("Roll", r);

  if (r.options.type === "neurocaster" && actor.type === "player") {
    if (r.successCount === 0) {
      // add a point of bliss to te actor who made the roll
      console.log("No Success", actor);
      let bliss = actor.system.bliss;
      console.log("Bliss", bliss);
      bliss += 1;
      await actor.update({ "system.bliss": bliss });
    }
  }

  console.log("Roll", r);

  await r.toMessage({
    speaker: ChatMessage.getSpeaker({ actor: actor, token: actor.img }),
  });
  sheet.roll = r.duplicate();
  return r;
}

function isRollPushable(actor, optioms) {
  if (actor.type === "player" && optioms.type !== "death") return true;
  if (optioms.type === "vehicle-maneuverability") return true;
  return false;
}

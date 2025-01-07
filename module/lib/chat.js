

const estateChat = {
  template: {
    explosive: "systems/electric-state/templates/chat/explosive-card.hbs",
    armor: "systems/electric-state/templates/chat/armor-card.hbs",
    drone: "systems/electric-state/templates/chat/drone-card.hbs",
    gear: "systems/electric-state/templates/chat/gear-card.hbs",
    neurocaster: "systems/electric-state/templates/chat/neurocaster-card.hbs",
    weapon: "systems/electric-state/templates/chat/weapon-card.hbs",
    injury: "systems/electric-state/templates/chat/injury-card.hbs",
    trauma: "systems/electric-state/templates/chat/trauma-card.hbs",
    talent: "systems/electric-state/templates/chat/talent-card.hbs",
    trait: "systems/electric-state/templates/chat/trait-card.hbs",
  },
};

export class ChatMessageES extends ChatMessage {
    prepareData() {
      super.prepareData();
    }


    static activateListeners(html) {
      console.log("Activating listeners", html);
      html.find(".dice-button.push").click((ev) => {
        console.log("Button clicked", ev); 
        _onPush(ev);
        });
      html.find(".dice-button.apply-damage").click((ev) => {
        console.log("Button clicked", ev);
        _onApplyDamage(ev);
      });

    }


}


async function _onApplyDamage(event) {
  console.log("Applying Damage");
  event.preventDefault();
  let chatCard = event.currentTarget.closest(".chat-message");
  console.log("Chat Card", chatCard);
  let messageId = chatCard.dataset.messageId;
  let message = game.messages.get(messageId);
  let actor = game.actors.get(message.speaker.actor);
  console.log("Actor", actor);
  if (actor === null || actor === undefined) {
    ui.notifications.warn(game.i18n.localize("estate.MSG.NOACTOR"));
    return;
  }
  let roll = message.rolls[0].duplicate();
  console.log("Roll", roll);
  let user = game.user;
  if (!actor.isOwner || !user.isGM) {
    console.log("NOT Owner or GM");
    return;
  }

  let targets = Array.from(game.user.targets);
  console.log("Targets", targets);
  if (targets.length === 0) {
    ui.notifications.warn(game.i18n.localize("estate.MSG.DAMAGENONE"));
    return;
  }

  if (targets.length > 1) {
    if (roll.options.type === "explosive") {
      console.log("Explosive Damage", roll);
    } else {
      ui.notifications.warn(game.i18n.localize("estate.MSG.DAMAGEONE"));
      return;
    }
  }

  let damage = roll.options.damage;
  const successCount = roll.successCount;
  damage += successCount-1;
  for (let target of targets) {
    const token = canvas.tokens.get(target.id);
    const actor = token.actor;
    switch (actor.type) {
      case "player":
      case "npc":
        let health = actor.system.health.value;
        health -= damage;
        if (health < 0) {
          health = 0;
        }
        await actor.update({ "system.health.value": health });
        break;
      case "vehicle":
      case "robot":
        let hull = actor.system.hull.value;
        hull -= damage;
        if (hull < 0) {
          hull = 0;
        }
        await actor.update({ "system.hull.value": hull });
        break;
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


async function renderChatMessage(chatOptions, dataSource) {
  const data = dataSource;
  return await Promise.resolve(renderTemplate(chatOptions.template, data));
}

export const buildChatCard = function (type, item, chatOptions = {}) {
  console.log("E-STATE | Building Chat Card", type, item);

  let token = "";
  const actor = game.actors.get(ChatMessage.getSpeaker().actor);
  if (actor) {
    token = actor.img;
  } else {
    token = "systems/electric-state/assets/logo.webp";
  }

  const data = {
    item: item,
    token: token,
    name: item.name,
    img: item.img,
    system: item.system,
  };

  switch (type) {
    case "explosive":
      chatOptions = foundry.utils.mergeObject(
        {
          user: game.user.id,
          flavor: data.name,
          template: estateChat.template.explosive,
          blind: false,
        },
        chatOptions
      );

      break;
    case "armor":
      chatOptions = foundry.utils.mergeObject(
        {
          user: game.user.id,
          flavor: data.name,
          template: estateChat.template.armor,
          blind: false,
        },
        chatOptions
      );

      break;
    case "drone":
      chatOptions = foundry.utils.mergeObject(
        {
          user: game.user.id,
          flavor: data.name,
          template: estateChat.template.drone,
          blind: false,
        },
        chatOptions
      );

      break;
    case "gear":
      chatOptions = foundry.utils.mergeObject(
        {
          user: game.user.id,
          flavor: data.name,
          template: estateChat.template.gear,
          blind: false,
        },
        chatOptions
      );

      break;
    case "neurocaster":
      chatOptions = foundry.utils.mergeObject(
        {
          user: game.user.id,
          flavor: data.name,
          template: estateChat.template.neurocaster,
          blind: false,
        },
        chatOptions
      );

      break;
    case "weapon":
      chatOptions = foundry.utils.mergeObject(
        {
          user: game.user.id,
          flavor: data.name,
          template: estateChat.template.weapon,
          blind: false,
        },
        chatOptions
      );

      break;
    case "injury":
      chatOptions = foundry.utils.mergeObject(
        {
          user: game.user.id,
          flavor: data.name,
          template: estateChat.template.injury,
          blind: false,
        },
        chatOptions
      );

      break;
    case "trauma":
      chatOptions = foundry.utils.mergeObject(
        {
          user: game.user.id,
          flavor: data.name,
          template: estateChat.template.trauma,
          blind: false,
        },
        chatOptions
      );
      break;
    case "talent":
      chatOptions = foundry.utils.mergeObject(
        {
          user: game.user.id,
          flavor: data.name,
          template: estateChat.template.talent,
          blind: false,
        },
        chatOptions
      );
      break;
    case "trait":
      chatOptions = foundry.utils.mergeObject(
        {
          user: game.user.id,
          flavor: data.name,
          template: estateChat.template.trait,
          blind: false,
        },
        chatOptions
      );
      break;
  }
  const isPrivate = chatOptions.isPrivate;
  renderChatMessage(chatOptions, data).then((html) => {
    let chatData = {
      speaker: ChatMessage.getSpeaker(),
      user: game.user.id,
      rollMode: game.settings.get("core", "rollMode"),
      content: html,
    };
    if (isPrivate) {
      chatData.whisper = ChatMessage.getWhisperRecipients("GM");
    }
    ChatMessage.create(chatData);
  });
};

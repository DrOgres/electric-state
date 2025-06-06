import { eState } from "../config.js";
import { prepareRollDialog, prepareDeathRollDialog } from "../lib/roll.js";
import { buildChatCard } from "../lib/chat.js";

export default class esActorSheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["es", "sheet", "actor"],
      width: 650,
      height: 750,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "main",
        },
      ],
    });
  }

  //TODO link actor data for player actors and vehicle actors

  get template() {
    if (
      this.actor.getUserLevel(game.user) !==
        CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER &&
      this._isPlayer()
    ) {
      // console.log("E-STATE | User is not the owner of the actor");
      return `systems/electric-state/templates/actors/${this.actor.type}-limited.hbs`;
    }
    return `systems/electric-state/templates/actors/${this.actor.type}.hbs`;
  }

  _getHeaderButtons() {
    let buttons = super._getHeaderButtons();
    // console.log("E-STATE | Header Buttons", buttons);
    if (this.actor.isOwner && this._isPlayer()) {
      buttons = [
        {
          label: game.i18n.localize("estate.UI.DEATHROLL"),
          class: "death-roll",
          icon: "fas fa-skull",
          onclick: (ev) => this._deathRoll(this),
        },
      ].concat(buttons);
    }
    return buttons;
  }

  async getData() {
    const data = super.getData();
    data.config = eState;
    const actor = this.actor;

    this.computeItems(data);

    if (this._isPlayer()) {
      this.checkBliss(actor);
      this.checkHope(actor);
    }

    if (this._isPlayer() || this._isNpc()) {
      this.computeMaxStats(actor);
      this.checkHealth(actor);
    }

    if (this._isVehicle()) {
      this._preparePassengers(data, actor);
      this._applyVehicleTraits(data, actor);
    }

    data.notesHTML = await TextEditor.enrichHTML(actor.system.notes, {
      secrets: this.actor.isOwner,
      async: true,
      relativeTo: this.actor,
    });

    return data;
  }

  activateListeners(html) {
    // console.log("E-STATE | Activating Actor Sheet Listeners");
    super.activateListeners(html);
    html.find("input").focusin((ev) => this.onFocusIn(ev));
    html.find(".item-create").click(this._onItemCreate.bind(this));
    html.find(".item-edit").click(this._onItemEdit.bind(this));
    html.find(".item-delete").click(this._onItemDelete.bind(this));
    html.find(".item-use").click(this._onItemUse.bind(this));
    html.find(".rollable").click(this._onRoll.bind(this));
    html.find(".toggle-fav").click(this._onToggleFav.bind(this));
    html.find(".toggle-equip").click(this._onToggleEquip.bind(this));
    html.find(".remove-passenger").click(this._onRemovePassenger.bind(this));
    html
      .find(".passenger-position")
      .change(this._onAssignPassengerPosition.bind(this));
    html.find(".sheet-container").on("drop", this._onItemDrop.bind(this));
    html.find(".draggable").on("drag", this._onItemDrag.bind(this));
    html.find(".edit-toggle").click(this._onEditToggle.bind(this));
    // html.find(".input-text").change(this._updateData.bind(this));
    html.find(".input-text").focusout(this._updateData.bind(this));
    html.find(".to-chat").click(this._onItemToChat.bind(this));
    html.find(".show-details").click(this._onShowDetails.bind(this));
    html.find(".toggle-permedit").click(this._onTogglePermEdit.bind(this));
    html.find(".change-tension").click(this._onChangeTension.bind(this));
    html.find(".set-max").click(this._onSetMax.bind(this));
    html.find(".item-field-edit").change(this._updateItemData.bind(this));

    html.find(".attribute").each((i, item) => {
      // console.log("E-STATE | Attribute", item);

      let attributeName = $(item).text();
      attributeName = attributeName.replace(/[\n\r]+|[\s]{2,}/g, " ").trim();
      // console.log("E-STATE | Attribute Name", attributeName);

      item.setAttribute("data-item-id", this.actor.id);
      item.setAttribute("draggable", true);
      item.addEventListener(
        "dragstart",
        (ev) => {
          const attributeKey = ev.currentTarget.dataset.attribute;
          const data = {
            type: "attribute",
            actorId: this.actor.id,
            attribute: attributeKey,
            text: `${game.i18n.localize("estate.ROLL.ROLL")} ${attributeName}`,
          };
          ev.dataTransfer.setData("text/plain", JSON.stringify(data));
        },
        false
      );
    });

    html.find(".armor").each((i, item) => {
      // console.log("E-STATE | Armor", item);

      item.setAttribute("draggable", true);
      item.addEventListener(
        "dragstart",
        (ev) => {
          const armorId = ev.currentTarget.dataset.itemId;
          const armorItem = this.actor.items.get(armorId);
          const armorName = armorItem.name;

          const data = {
            type: "armor",
            actorId: this.actor.id,
            armorId: armorId,
            img: armorItem.img,
            text: `${game.i18n.localize("estate.ROLL.ROLL")} ${armorName}`,
          };
          ev.dataTransfer.setData("text/plain", JSON.stringify(data));
        },
        false
      );
    });

    html.find(".weapon").each((i, item) => {
      // console.log("E-STATE | Weapon", item);
      const div = $(item).parents(".weapon");
      item.setAttribute("draggable", true);
      item.addEventListener(
        "dragstart",
        (ev) => {
          const weaponId = ev.currentTarget.dataset.itemId;
          const weaponItem = this.actor.items.get(weaponId);
          const weaponName = weaponItem.name;

          const data = {
            type: "weapon",
            weaponId: weaponId,
            actorId: this.actor.id,
            img: weaponItem.img,
            text: `${game.i18n.localize("estate.ROLL.ROLL")} ${weaponName}`,
          };
          ev.dataTransfer.setData("text/plain", JSON.stringify(data));
        },
        false
      );
    });

    html.find(".bliss").each((i, item) => {
      // console.log("E-STATE | Bliss", item);
      item.setAttribute("draggable", true);
      item.addEventListener(
        "dragstart",
        (ev) => {
          const data = {
            type: "bliss",
            actorId: this.actor.id,
            text: `${game.i18n.localize("estate.UI.BLISS_RECOVERY")}`,
          };
          ev.dataTransfer.setData("text/plain", JSON.stringify(data));
        },
        false
      );
    });
  }

  async rollBliss() {
    let options = {
      type: "bliss",
      sheet: this,
      actorType: this.actor.type,
      testName: "",
      testModifier: 0,
      dicePool: 0,
      gearUsed: [],
    };

    if (this.actor.system.bliss <= 0) {
      // console.log("E-STATE | No Bliss");
      ui.notifications.info(game.i18n.localize("estate.MSG.NOBLISS"));
      return;
    } else if (this.actor.system.bliss === this.actor.system.permanent) {
      // console.log("E-STATE | Permanent Bliss");
      ui.notifications.info(game.i18n.localize("estate.MSG.PERMANENTBLISS"));
      return;
    }
    options.testName = game.i18n.localize("estate.ATTRIBUTE.BLISS");
    options.dicePool = 1;
    prepareRollDialog(options);
  }

  async rollWeapon(weaponId) {
    // console.log("E-STATE | Rolling Weapon", weaponId);
    const itemId = weaponId;
    const item = this.actor.items.get(itemId);

    let options = {
      type: "weapon",
      sheet: this,
      actorType: this.actor.type,
      testName: "",
      testModifier: 0,
      dicePool: 0,
      gearUsed: [],
    };

    // console.log("E-STATE | Rolling Weapon");

    let ncWeapon = false;
    let ncBonus = 0;
    let ncId = "";
    if (this._isPlayer()) {
      if (item.system.requiresNeurocaster) {
        ncWeapon = true;
        const neurocasters = this.actor.items.filter(
          (item) => item.type === "neurocaster"
        );
        // console.log("E-STATE | Neurocasters", neurocasters);
        if (neurocasters.length === 0) {
          ui.notifications.warn(
            game.i18n.localize("estate.MSG.NEEDNEUROCASTER")
          );
          return;
        } else {
          let status = false;
          for (let neurocaster of neurocasters) {
            if (neurocaster.system.isEquipped) {
              status = true;
              ncId = neurocaster.id;
              if (
                neurocaster.system.processor.value === 0 ||
                neurocaster.system.network.value === 0 ||
                neurocaster.system.graphics.value === 0
              ) {
                ui.notifications.warn(
                  game.i18n.localize("estate.MSG.BUSTEDCASTER")
                );
                const update = [
                  {
                    _id: neurocaster.id,
                    "system.isBroken": true,
                  },
                ];
                await Item.updateDocuments(update, {
                  parent: this.actor,
                });
                return;
              }
              ncBonus += neurocaster.system.network.value;
            }
          }
          if (!status) {
            ui.notifications.warn(game.i18n.localize("estate.MSG.NUEROCASTER"));
            return;
          }
        }
      }
    }

    if (!ncWeapon && item.system.modifier.value <= 0) {
      ui.notifications.warn(game.i18n.localize("estate.MSG.BUSTEDWEAPON"));
      return;
    }

    if (ncWeapon) {
      options.testName =
        item.name + " & " + game.i18n.localize("estate.UI.NEUROCASTER");
      options.gearDice = ncBonus;
      options.gearUsed.push(ncId);
      options.gearName =
        game.i18n.localize("estate.UI.NEUROCASTER") +
        " " +
        game.i18n.localize("estate.UI.NETWORK");
    } else {
      options.gearDice = item.system.modifier.value;
      options.gearUsed.push(itemId);
      options.testName = item.name;
      options.gearName = item.name;
    }
    options.damage = item.system.damage;
    options.attribute = item.system.attribute;
    options.weaponId = itemId;

    prepareRollDialog(options);
  }

  async rollAttribute(attribute) {
    // console.log("E-STATE | Rolling Attribute", attribute);

    let options = {
      type: "attribute",
      sheet: this,
      actorType: this.actor.type,
      testName: "",
      testModifier: 0,
      dicePool: 0,
      gearUsed: [],
    };

    options.attribute = attribute;
    options.testName = game.i18n.localize(
      `estate.ATTRIBUTE.${eState.attributesAbv[attribute]}`
    );
    options.dicePool += this.actor.system[attribute];
    prepareRollDialog(options);
  }

  async rollArmor(armorId) {
    // console.log("E-STATE | Rolling Armor", armorId);

    const itemId = armorId;
    const item = this.actor.items.get(itemId);

    let options = {
      type: "armor",
      sheet: this,
      actorType: this.actor.type,
      testName: "",
      testModifier: 0,
      dicePool: 0,
      gearUsed: [],
      maxPush: 0,
    };

    options.testName = item.name;
    options.dicePool = item.system.modifier.value;
    options.armorId = itemId;

    prepareRollDialog(options);
  }

  async _updateItemData(event) {
    // console.log("E-STATE | Updating Item Data", event);
    event.preventDefault();
  }

  async _onSetMax(event) {
    // console.log("E-STATE | Setting Max", event);
    event.preventDefault();
    const actor = this.actor;
    const type = event.currentTarget.dataset.stat;
    // console.log("E-STATE | Type", type, actor);

    const stat = actor.system[type].value;
    const max = actor.system[type].max;
    if (stat === max) {
      return;
    } else {
      await actor.update({ [`system.${type}.value`]: max });
    }
  }

  onFocusIn(event) {
    $(event.currentTarget).select();
  }

  async _onChangeTension(event) {
    // console.log("E-STATE | Changing Tension", event);
    event.preventDefault();
    const actor = this.actor;
    const tension = actor.items.get(event.currentTarget.dataset.itemId);
    const type = event.currentTarget.dataset.type;

    if (type === "minus") {
      if (tension.system.score > 0) {
        await tension.update({ "system.score": tension.system.score - 1 });
      }
    }
    if (type === "plus") {
      await tension.update({ "system.score": tension.system.score + 1 });
    }
  }

  _onTogglePermEdit(event) {
    // console.log("E-STATE | Toggling Permission Edit", event);
    event.preventDefault();
    const actor = this.actor;
    const editStatus = actor.getFlag("world", "isPermEdit") || false;
    actor.setFlag("world", "isPermEdit", !editStatus);
  }

  //@override
  async close() {
    // console.log("E-STATE | Closing Actor Sheet", this);
    //if the user is not the owner of the actor do not save the data
    if (
      this.actor.getUserLevel(game.user) !==
      CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
    ) {
      super.close();
      return;
    }

    const actor = this.actor;
    const description = document.getElementById(this.actor._id + "-desc-edit");
    const goal = document.getElementById(this.actor._id + "-goal-edit");
    const threat = document.getElementById(this.actor._id + "-threat-edit");
    const dream = document.getElementById(this.actor._id + "-dream-edit");
    const flaw = document.getElementById(this.actor._id + "-flaw-edit");

    // if this is a player actor get the data from the description, goal, threat, dream and flaw divs and update the actor with the current values
    if (this._isPlayer()) {
      if (description) {
        await actor.update({ "system.description": description.innerText });
      }
      if (goal) {
        await actor.update({ "system.journey.goal": goal.innerText });
      }
      if (threat) {
        await actor.update({ "system.journey.threat": threat.innerText });
      }
      if (dream) {
        await actor.update({ "system.dream": dream.innerText });
      }
      if (flaw) {
        await actor.update({ "system.flaw": flaw.innerText });
      }
    } else {
      if (description) {
        await actor.update({ "system.description": description.innerText });
      }
    }

    super.close();
  }

  async _onShowDetails(event) {
    // console.log("E-STATE | Showing Details", event);
    let chevron = event.currentTarget.children[0];
    // console.log("E-STATE | Chevron", chevron);
    const div = $(event.currentTarget).parents(".item");
    // console.log("E-STATE | Div", div);
    const item = this.actor.items.get(div.data("itemId"));
    // console.log("ESTATE | Actor ", this.actor);
    // console.log("E-STATE | Item", item);

    // change the class of chevron from fa-chevron-down to fa-chevron-up or vice versa
    if (chevron.classList.contains("fa-chevron-down")) {
      chevron.classList.remove("fa-chevron-down");
      chevron.classList.add("fa-chevron-up");
    } else {
      chevron.classList.remove("fa-chevron-up");
      chevron.classList.add("fa-chevron-down");
    }

    const type = item.type;
    let chatData = null;

    switch (type) {
      case "weapon":
      case "explosive":
      case "armor":
        chatData =
          "<p class='item-desc subheader'><b>" +
          game.i18n.localize("estate.HEAD.PRICE") +
          ": $</b> " +
          item.system.cost +
          " | <b>" +
          game.i18n.localize("estate.HEAD.DESC") +
          ":</b> " +
          item.system.description +
          "</br></p>";
        break;
      case "gear":
        // console.log("E-STATE | Gear display", item);
        //TODO if the gear is not consumable just show the description, otherwise show the uses, the drawback etc. as well as the description
        if (item.system.modifier.value <= 0) {
          chatData =
            "<p class='item-desc subheader w-100 center red'><b>" +
            game.i18n.localize("estate.UI.BUSTED") +
            "</b></p>";
        } else {
          chatData = "<p class='item-desc subheader'></p>";
        }

        if (item.system.isConsumable) {
          chatData +=
            "<p class='item-desc subheader'><b>" +
            game.i18n.localize("estate.UI.USEDFOR") +
            ": </b> " +
            game.i18n.localize(eState.useTypeOptions[item.system.useType]) +
            " &plus; " +
            item.system.useValue +
            " | <b>" +
            game.i18n.localize("estate.UI.DRAWBACK") +
            ":</b> " +
            game.i18n.localize(
              eState.usePenaltyOptions[item.system.usePenaltyType]
            );
          if (item.system.usePenalty > 0) {
            chatData += " &minus; " + item.system.usePenalty + "</br>";
          }
          chatData +=
            "</p>" +
            "<p class='item-desc subheader'><b>" +
            game.i18n.localize("estate.HEAD.PRICE") +
            ": $</b> " +
            item.system.cost +
            " | <b>" +
            game.i18n.localize("estate.HEAD.DESC") +
            ":</b> " +
            item.system.description +
            "</br></p>";
        } else {
          chatData =
            "<p class='item-desc subheader'><b>" +
            game.i18n.localize("estate.HEAD.PRICE") +
            ": $</b> " +
            item.system.cost +
            " | <b>" +
            game.i18n.localize("estate.HEAD.DESC") +
            ":</b> " +
            item.system.description +
            "</br></p>";
        }
        break;
      case "drone":
        chatData =
          "<p class='item-desc subheader'><b>" +
          game.i18n.localize("estate.UI.ARMOR") +
          ": </b> " +
          item.system.armor +
          " | <b>" +
          game.i18n.localize("estate.ROLL.DAMAGE") +
          ":</b> " +
          item.system.damage +
          "</br></p><p class='item-desc subheader'><b>" +
          game.i18n.localize("estate.UI.RANGE") +
          ":</b>" +
          game.i18n.localize(eState.ranges[item.system.range.min]) +
          " - " +
          game.i18n.localize(eState.ranges[item.system.range.max]) +
          "</p>" +
          "<p class='item-desc subheader'><b>" +
          game.i18n.localize("estate.HEAD.PRICE") +
          ": $</b> " +
          item.system.cost +
          " | <b>" +
          game.i18n.localize("estate.HEAD.DESC") +
          ":</b> " +
          item.system.description +
          "</br></p>";
        break;
      case "neurocaster":
        chatData =
          "<p class='item-desc subheader'><b>" +
          game.i18n.localize("estate.UI.RW_PENALTY") +
          ": </b> " +
          item.system.realWorldPenalty +
          "</p>" +
          "<p class='item-desc subheader'><b>" +
          game.i18n.localize("estate.HEAD.PRICE") +
          ": $</b> " +
          item.system.cost +
          " | <b>" +
          game.i18n.localize("estate.HEAD.DESC") +
          ":</b> " +
          item.system.description +
          "</br></p>";
        break;
      case "tension":
      case "trait":
      case "talent":
      case "trauma":
        chatData =
          "<div class='item-desc subheader flexrow span-all grid col-30-70'><b>" +
          game.i18n.localize("estate.HEAD.DESC") +
          ":</b> <span>" +
          item.system.description +
          "</span></div>";
        break;
      case "injury":
        chatData =
          "<div class='item-desc subheader flexrow span-all grid '><div><b>" +
          game.i18n.localize("estate.UI.TIMETO") +
          " :</b> <span>" +
          item.system.healingTime +
          "</span> <span>" +
          game.i18n.localize("estate.UI.DAYS") +
          "</span> </div><div>" +
          "<b>" +
          game.i18n.localize("estate.HEAD.DESC") +
          ":</b> <span>" +
          item.system.description +
          "</span></div></div>";
        break;
    }

    if (chatData === null) {
      // console.log("E-STATE | No Chat Data", chatData);
      return;
    } else if (div.hasClass("expanded")) {
      // console.log("E-STATE | Expanded", chatData);
      let sum = div.children(".item-summary");
      sum.slideUp(200, () => sum.remove());
    } else {
      // console.log("E-STATE | Not Expanded", chatData);
      let sum = $(
        `<div class="item-summary bg-hatch2 span-all">${chatData}</div>`
      );
      div.append(sum.hide());
      // console.log("E-STATE | Sum", sum);
      // console.log("E-STATE | Div", div);
      sum.slideDown(200);
    }
    div.toggleClass("expanded");
  }

  _onItemToChat(event) {
    event.preventDefault();
    const div = $(event.currentTarget).parents(".item");
    const item = this.actor.items.get(div.data("itemId"));
    // console.log("E-STATE | Item to Chat", item);
    let type = item.type;
    buildChatCard(type, item);
  }

  async _updateData(event) {
    event.preventDefault();
    const field = event.currentTarget.dataset.field;
    // console.log("E-STATE | event", event);
    // console.log("E-STATE | Field", field);
    const value = event.currentTarget.innerText;
    // console.log("E-STATE | Value", value);
    // strip empty tags from value
    const cleanValue = value.replace(/<[^>]*>?/gm, "").trim();
    // console.log("E-STATE | Value", cleanValue);
    await this.actor.update({ [field]: cleanValue });
  }

  _onEditToggle(event) {
    // console.log("E-STATE | Toggling Edit Mode", event);
    event.preventDefault();
    const type = event.currentTarget.dataset.edit;
    const actor = this.actor;
    if (type === "goal") {
      // console.log("E-STATE | Toggling Goal Edit Mode");
      let goal = actor.getFlag("electric-state", "isEditGoal") || false;
      actor.setFlag("electric-state", "isEditGoal", !goal);
      // console.log("E-STATE | Goal Edit Mode", goal, actor);
    }
  }

  async _onItemDrop(event) {
    // console.log("E-STATE | Dropping Item on Actor", event);

    event.preventDefault();
    let actor = this.actor;
    let item = game.data.item;
    // console.log("E-STATE | Item", item);
    if (!item) return;
    let storedItem = game.data.item;
    if (storedItem === null) {
      return;
    }
    let originalActor = storedItem.actor;
    if (originalActor._id === actor._id) {
      // console.log("id match on drop action - returning ");
      game.data.item = null;
      storedItem = null;
      item = null;
      return;
    }

    // console.log("E-STATE | Dropping Item", storedItem, actor, originalActor);
    actor.createEmbeddedDocuments("Item", [item]);
    originalActor.deleteEmbeddedDocuments("Item", [storedItem.id]);

    game.data.item = null;
    storedItem = null;
    item = null;

    return;
  }

  _onDragStart(event) {
    // console.log(
    //   "start drag",
    //   event.srcElement.firstElementChild.dataset.rolled
    // );
    // console.log(
    //   "start drag skill?",
    //   event.currentTarget.classList.contains("skill")
    // );
    // console.log(
    //   "start drag attribute?",
    //   event.currentTarget.classList.contains("attribute")
    // );

    if (event.currentTarget.classList.contains("attribute")) {
      // console.log("a skill or attribute");
      const rollItemDragged = event.srcElement.firstElementChild.dataset.rolled;
      // console.log("rollItemDragged", rollItemDragged);

      return;
    } else {
      // console.log("not a skill or attribute");
      super._onDragStart(event);
      return;
    }
  }

  async _onItemDrag(event) {
    const type = event.currentTarget.dataset.type;

    if (type === "attribute") {
      // console.log("E-STATE | Dragging Attribute", event);
      const attribute = event.currentTarget.dataset.attribute;
      const data = {
        type: "attribute",
        attribute: attribute,
        text: `${game.i18n.localize("estate.ROLL.ROLL")} ${attribute}`,
      };
      // console.log("E-STATE | Attribute Data", data);
      let eventData = event.dataTransfer.getData("text/plain");
      // console.log("E-STATE | Event Data", eventData);
      event.dataTransfer.setData("text/plain", JSON.stringify(data));
      // console.log("E-STATE | Drag Data", event);
    } else if (type === "item") {
      game.data.item = this.actor.getEmbeddedDocument(
        "Item",
        event.currentTarget.closest(".item").dataset.itemId
      );
    }
    // console.log("E-STATE | Game Data Item", game.data.item);
  }

  async _applyVehicleTraits(data, actor) {
    // console.log("E-STATE | Applying Vehicle Traits", data, actor);
    const traits = actor.items.filter((item) => item.type === "trait");
    // console.log("E-STATE | Traits", traits, traits.length);

    if (traits.length === 0) {
      actor.setFlag("electric-state", "speed", 0);
      actor.setFlag("electric-state", "maneuver", 0);
      actor.setFlag("electric-state", "armor", 0);
      actor.setFlag("electric-state", "hull", 0);
      actor.setFlag("electric-state", "passengers", 0);
    }

    let totalSpeedModifier = 0;
    let totalManeuverModifier = 0;
    let totalArmorModifier = 0;
    let totalHullModifier = 0;
    let totalPassengerModifier = 0;

    for (let trait of traits) {
      // console.log("E-STATE | Trait", trait);
      // none: "estate.UI.NONE",
      // general: "estate.UI.GENERAL",
      // speed: "estate.UI.SPEED",
      // maneuver: "estate.UI.MANEUVER",
      // armor: "estate.UI.ARMOR",
      // hull: "estate.UI.HULL",
      // passengers: "estate.UI.PASSENGERS",
      // repairs: "estate.UI.REPAIRS",

      //clear the flags for the vehicle

      switch (trait.system.type) {
        case "none":
        case "general":
        case "repairs":
          // do nothing
          break;
        case "speed":
          const speed = trait.system.modifier.value;
          totalSpeedModifier += speed;
          // console.log("E-STATE | Speed", speed, actor);
          break;
        case "maneuver":
          const maneuver = trait.system.modifier.value;
          totalManeuverModifier += maneuver;
          // console.log("E-STATE | Maneuver", maneuver);
          break;
        case "armor":
          const armor = trait.system.modifier.value;
          totalArmorModifier += armor;
          // console.log("E-STATE | Armor", armor);
          break;
        case "hull":
          const hull = trait.system.modifier.value;
          totalHullModifier += hull;
          // console.log("E-STATE | Hull", hull);
          break;
        case "passengers":
          const passengers = trait.system.modifier.value;
          totalPassengerModifier += passengers;
          // console.log("E-STATE | Passengers", passengers);
          break;
      }
    }

    // console.log(
    //   "E-STATE | Total Modifiers",
    //   totalSpeedModifier,
    //   totalManeuverModifier,
    //   totalArmorModifier,
    //   totalHullModifier,
    //   totalPassengerModifier
    // );

    actor.setFlag("electric-state", "speed", totalSpeedModifier);
    actor.setFlag("electric-state", "maneuver", totalManeuverModifier);
    actor.setFlag("electric-state", "armor", totalArmorModifier);
    actor.setFlag("electric-state", "hull", totalHullModifier);
    actor.setFlag("electric-state", "passengers", totalPassengerModifier);
  }
  async _onItemUse(event) {
    // console.log("E-STATE | Using Item");
    const itemId = event.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);
    // console.log("E-STATE | Item", item);
    if (!item.system.isConsumable || item.system.uses <= 0) {
      ui.notifications.warn(game.i18n.localize("estate.MSG.NO_USES"));
      return;
    }
    const type = item.system.useType;
    const penalty = item.system.usePenaltyType;
    let uses = item.system.uses;

    // console.log("E-STATE | Item Type", type);
    //   none: "estate.UI.NONE",
    // food: "estate.UI.FOOD",
    // stabalize: "estate.UI.STABALIZE",
    // healthUp: "estate.UI.HEALTHUP",
    // hopeUp: "estate.UI.HOPEUP",
    // empathy: "estate.ATTRIBUTE.EMP",
    switch (type) {
      case "none":
      case "food":
      case "stabalize":
        uses -= 1;
        break;
      case "healthUp":
        let health = this.actor.system.health.value;
        let maxHealth = this.actor.system.health.max;
        if (health < maxHealth) {
          health += item.system.useValue;
        } else {
          ui.notifications.info(game.i18n.localize("estate.MSG.HEALTH_MAX"));
          return;
        }
        await this.actor.update({ "system.health.value": health });
        uses -= 1;
        break;
      case "hopeUp":
        let hope = this.actor.system.hope.value;
        let maxHope = this.actor.system.hope.max;
        if (hope < maxHope) {
          hope += item.system.useValue;
        } else {
          ui.notifications.info(game.i18n.localize("estate.MSG.HOPE_MAX"));
          return;
        }
        await this.actor.update({ "system.hope.value": hope });
        uses -= 1;
    }

    // console.log("Penalty", penalty);
    // apply any penaties to the actor
    // none: "estate.UI.NONE",
    // healthDown: "estate.UI.HEALTHDOWN",
    // addictive: "estate.UI.ADDICTIVE"
    switch (penalty) {
      case "none":
      // do nothing
      case "addictive":
        //TODO prompt the user to make a wits test to avoid addiction
        break;
      case "healthDown":
        let health = this.actor.system.health.value;
        health -= item.system.usePenalty;
        await this.actor.update({ "system.health.value": health });
        break;
    }

    await item.update({ "system.uses": uses });
    ui.notifications.info(
      game.i18n.localize("estate.MSG.USED") + " :" + item.name
    );
    //TODO make a chat card to indicate item use and effect
  }

  async _onToggleEquip(event) {
    const parent = $(event.currentTarget).parents(".item");
    console.log("E-STATE | Toggling Equip", parent);
    event.preventDefault();
    const itemId = parent[0].dataset.itemId;
    const item = this.actor.items.get(itemId);
    console.log(item);
    let equipStatus = !item.system.isEquipped;
    
    console.log(equipStatus);

    //TODO unequip all other items of the same type ensuring that only one item of that type is equipped

    // await item.update({ "system.isEquipped": false})

    await item.update({ "system.isEquipped": equipStatus });
    console.log("E-STATE | Item", item);
  }

  async _onToggleFav(event) {
    console.log("E-STATE | Toggling Favorite", event);

    const parent = event.currentTarget.parentElement;
    // console.log("E-STATE | Parent", parent);
    event.preventDefault();
    const itemId = parent.dataset.itemId;
    // console.log("E-STATE | Item Id", itemId);
    const item = this.actor.items.get(itemId);
    // console.log("E-STATE | Item", item);
    let favStatus = !item.system.isFav;
    await item.update({ "system.isFav": favStatus });
  }

  async _onRoll(event) {
    console.log("E-STATE | Rolling", event);
    const rollSource = event.currentTarget.dataset.type;

    if (this._isPlayer()) {
      if (this.actor.system.health.value <= 0) {
        ui.notifications.warn(game.i18n.localize("estate.MSG.DEAD"));
        return;
      }
      if (this.actor.system.hope.value <= 0) {
        ui.notifications.warn(game.i18n.localize("estate.MSG.HOPELESS"));
        return;
      }
    }

    let options = {
      type: rollSource,
      sheet: this,
      actorType: this.actor.type,
      testName: "",
      testModifier: 0,
      dicePool: 0,
      gearUsed: [],
    };

    switch (rollSource) {
      case "bliss":
        {
          this.rollBliss();
        }
        break;
      case "attribute":
        {
          const attribute = event.currentTarget.dataset.attribute;
          this.rollAttribute(attribute);
        }
        break;
      case "weapon":
        {
          // console.log("E-STATE | Rolling Weapon");
          const itemId = event.currentTarget.dataset.itemId;
          this.rollWeapon(itemId);
        }
        break;
      case "armor":
        {
          // console.log("E-STATE | Rolling Armor");
          const itemId = event.currentTarget.dataset.itemId;
          this.rollArmor(itemId);
        }
        break;
      case "vehicle-armor":
        {
          if (this.actor.type !== "vehicle") return;

          // console.log("E-STATE | Rolling Vehicle Armor");
          options.testName = game.i18n.localize(`estate.UI.VEHICLEARMOR`);
          options.dicePool += this.actor.system.armor;
          prepareRollDialog(options);
        }
        break;
      case "vehicle-maneuverability":
        {
          if (this.actor.type !== "vehicle") return;

          if (
            this.actor.system.maneuverability.value <= 0 ||
            this.actor.system.hull.value <= 0
          ) {
            ui.notifications.warn(
              game.i18n.localize("estate.MSG.VEHICLE_WRECKED")
            );
            return;
          }

          // console.log("E-STATE | Rolling Vehicle Maneuverability");
          const driverId = this.actor.system.passengers.driverId;
          const driver = driverId ? game.actors.get(driverId) : null;
          if (!driver) {
            ui.notifications.warn(
              game.i18n.localize("estate.MSG.DRIVERREQUIRED")
            );
            return;
          }

          options.testName = game.i18n.localize(`estate.UI.MANEUVER`);
          options.attribute = "agility";
          options.talents = driver.items.filter(
            (item) => item.type === "talent"
          );
          options.dicePool = driver.system.agility;
          options.gearName = game.i18n.localize(`estate.UI.MANEUVER`);
          options.gearDice = this.actor.system.maneuverability.value;
          prepareRollDialog(options);
        }
        break;
      case "robot-armor":
        {
          if (this.actor.type !== "robot") return;

          // console.log("E-STATE | Rolling Robot Armor");
          options.testName = game.i18n.localize(`estate.UI.ROBOTARMOR`);
          options.dicePool += this.actor.system.armor;
          prepareRollDialog(options);
        }
        break;
      case "drone-attack":
        {
          // console.log("E-STATE | Rolling Drone Attack");
          const itemId = event.currentTarget.dataset.itemId;
          const item = this.actor.items.get(itemId);
          // console.log("E-STATE | Item", item);
          if (item.system.hull.value === 0) {
            ui.notifications.warn(game.i18n.localize("estate.MSG.BUSTEDDRONE"));
            return;
          }

          const neurocasters = this.actor.items.filter(
            (item) => item.type === "neurocaster"
          );
          // console.log("E-STATE | Neurocasters", neurocasters);

          if (!item.system.isEquipped) {
            ui.notifications.warn(
              game.i18n.localize("estate.MSG.DRONENOTEQUIPPED")
            );
            return;
          }
          if (neurocasters.length === 0) {
            ui.notifications.warn(
              game.i18n.localize("estate.MSG.DRONENOTEQUIPPED")
            );
            return;
          } else {
            let status = false;
            for (let neurocaster of neurocasters) {
              if (neurocaster.system.isEquipped) {
                status = true;
                if (
                  neurocaster.system.processor.value === 0 ||
                  neurocaster.system.network.value === 0 ||
                  neurocaster.system.graphics.value === 0
                ) {
                  ui.notifications.warn(
                    game.i18n.localize("estate.MSG.BUSTEDCASTER")
                  );
                  const update = [
                    {
                      _id: neurocaster.id,
                      "system.isBroken": true,
                    },
                  ];
                  await Item.updateDocuments(update, { parent: this.actor });
                  return;
                }
              }
            }
            if (!status) {
              ui.notifications.warn(
                game.i18n.localize("estate.MSG.DRONENOTEQUIPPED")
              );
              return;
            }
          }

          options.testName =
            item.name + " " + game.i18n.localize("estate.UI.WEAPON");
          options.damage = item.system.damage;
          options.type = "drone";
          const maxRange = item.system.range.max;
          const minRange = item.system.range.min;
          // console.log("E-STATE | Max Range", maxRange, "Min Range", minRange);
          if (maxRange === "engaged") {
            options.dicePool = item.system.attributes.strength;
            options.attribute = "strength";
          } else {
            options.dicePool = item.system.attributes.agility;
            options.attribute = "agility";
            options.maxRange = maxRange;
            options.minRange = minRange;
          }

          //TODO set the dice pool based on the max and min ranges of the drone
          prepareRollDialog(options);
        }
        break;
      case "drone-armor":
        {
          // console.log("E-STATE | Rolling Drone Armor");
          const itemId = event.currentTarget.dataset.itemId;
          const item = this.actor.items.get(itemId);

          if (item.system.hull.value === 0) {
            ui.notifications.warn(game.i18n.localize("estate.MSG.BUSTEDDRONE"));
            return;
          }

          const neurocasters = this.actor.items.filter(
            (item) => item.type === "neurocaster"
          );
          // console.log("E-STATE | Neurocasters", neurocasters);

          if (!item.system.isEquipped) {
            ui.notifications.warn(
              game.i18n.localize("estate.MSG.DRONENOTEQUIPPED")
            );
            return;
          }
          if (neurocasters.length === 0) {
            ui.notifications.warn(
              game.i18n.localize("estate.MSG.DRONENOTEQUIPPED")
            );
            return;
          } else {
            let status = false;
            for (let neurocaster of neurocasters) {
              if (neurocaster.system.isEquipped) {
                status = true;
                if (
                  neurocaster.system.processor.value === 0 ||
                  neurocaster.system.network.value === 0 ||
                  neurocaster.system.graphics.value === 0
                ) {
                  ui.notifications.warn(
                    game.i18n.localize("estate.MSG.BUSTEDCASTER")
                  );
                  const update = [
                    {
                      _id: neurocaster.id,
                      "system.isBroken": true,
                    },
                  ];
                  await Item.updateDocuments(update, { parent: this.actor });
                  return;
                }
              }
            }
            if (!status) {
              ui.notifications.warn(
                game.i18n.localize("estate.MSG.DRONENOTEQUIPPED")
              );
              return;
            }
          }

          options.testName =
            item.name + " " + game.i18n.localize("estate.UI.ARMOR");
          options.dicePool = item.system.armor;
          options.type = "drone";
          prepareRollDialog(options);
        }
        break;
      case "neurocaster":
        {
          // console.log("E-STATE | Rolling Neurocaster");
          //TODO check if the neurocaster is broken

          const itemId = event.currentTarget.parentElement.dataset.itemId;
          const item = this.actor.items.get(itemId);

          if (
            item.system.processor.value === 0 ||
            item.system.network.value === 0 ||
            item.system.graphics.value === 0
          ) {
            ui.notifications.warn(
              game.i18n.localize("estate.MSG.BUSTEDCASTER")
            );
            const update = [
              {
                _id: item.id,
                "system.isBroken": true,
              },
            ];
            await Item.updateDocuments(update, { parent: this.actor });
            return;
          }

          const update = [
            {
              _id: item.id,
              "system.isBroken": false,
            },
          ];
          await Item.updateDocuments(update, { parent: this.actor });

          options.cast = event.currentTarget.dataset.cast;
          options.gearUsed.push(itemId);
          options.item = item;
          options.testName =
            game.i18n.localize("estate.UI.NEUROCASTER") +
            " " +
            game.i18n.localize(eState.castType[options.cast]);
          options.dicePool = item.system.modifier.value;
          options.type = "neurocaster";
          prepareRollDialog(options);
        }
        break;
      case "explosive":
        {
          // console.log("E-STATE | Rolling Explosive");
          const itemId = event.currentTarget.dataset.itemId;
          const item = this.actor.items.get(itemId);
          options.testName = item.name;
          options.dicePool = 0;
          options.explosiveId = itemId;
          options.type = "explosive";
          prepareRollDialog(options);
        }
        break;
    }

    // prepareRollDialog(options);
  }

  _deathRoll(actor) {
    // console.log("E-STATE | Death Roll", actor);

    if (actor.object.system.health.value > 0) {
      ui.notifications.info(game.i18n.localize("estate.MSG.NOTDYING"));
      return;
    }

    const talents = this.actor.items.filter((item) => item.type === "talent");

    let options = {
      actor: this.actor,
      talents: talents,
      sheet: this,
    };

    prepareDeathRollDialog(options);
  }

  _onItemEdit(event) {
    const parent = $(event.currentTarget).parents(".button-group");
    event.preventDefault();
    const itemId = parent[0].dataset.itemId;
    const item = this.actor.items.get(itemId);
    item.sheet.render(true);
  }

  _onItemDelete(event) {
    // console.log("E-STATE | Deleting Item");
    const parent = $(event.currentTarget).parents(".button-group");
    event.preventDefault();
    const itemId = parent[0].dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (item.type === "trait" && this._isVehicle()) {
      this.resetVehicleFlags(item);
    }
    this.actor.deleteEmbeddedDocuments("Item", [itemId]);
  }

  resetVehicleFlags(item) {
    // console.log("E-STATE | Resetting Vehicle Flags", item);
    const traitType = item.system.type;
    const actor = this.actor;
    switch (traitType) {
      case "speed":
        actor.setFlag("electric-state", "speed", 0);
        break;
      case "maneuver":
        actor.setFlag("electric-state", "maneuver", 0);
        break;
      case "armor":
        actor.setFlag("electric-state", "armor", 0);
        break;
      case "hull":
        actor.setFlag("electric-state", "hull", 0);
        break;
      case "passengers":
        actor.setFlag("electric-state", "passengers", 0);
        break;
    }
  }

  sendToChat(event) {
    const div = $(event.currentTarget).parents(".item");
    const item = this.actor.items.get(div.data("itemId"));
    const data = item.system;
    let type = item.type;
    let chatData = buildChatCard(type, item);
    ChatMessage.create(chatData, {});
  }

  _onItemCreate(event) {
    event.preventDefault();
    const type = event.currentTarget.dataset.type;
    const itemName = "New " + type;
    const data = {
      name: itemName,
      type: type,
    };

    this.actor.createEmbeddedDocuments("Item", [data]);
  }

  async _onRemovePassenger(event) {
    // console.log("E-STATE | Removing Passenger", event);
    event.preventDefault();
    const parent = $(event.currentTarget).parents(".button-group");
    const passengerId = parent[0].dataset.passengerId;
    this.actor.removeVehiclePassenger(passengerId);
  }

  async _onAssignPassengerPosition(event) {
    // console.log("E-STATE | Assigning Passenger Position", event);
    event.preventDefault();
    const parent = $(event.currentTarget).parents(".passenger");
    const passengerId = parent[0].dataset.passengerId;
    this.actor.assignPassengerPosition(passengerId, event.currentTarget.value);
  }

  async checkHope(actor) {
    // console.log("E-STATE | Checking Hope");
    let hope = 0;
    let maxHope = 0;

    hope = actor.system.hope.value;
    maxHope = actor.system.hope.max;

    if (hope > maxHope) {
      hope = maxHope;
    }

    if (hope < 0) {
      hope = 0;
    }
    await actor.update({ "system.hope.value": hope });
  }

  async checkHealth(actor) {
    // console.log("E-STATE | Checking Health");
    let health = 0;
    let maxHealth = 0;

    health = actor.system.health.value;
    maxHealth = actor.system.health.max;

    if (health > maxHealth) {
      health = maxHealth;
    }

    if (health < 0) {
      health = 0;
    }
    await actor.update({ "system.health.value": health });
  }

  async checkBliss(actor) {
    // console.log("E-STATE | Checking Bliss");
    let bliss = 0;
    let permanentBliss = 0;

    bliss = actor.system.bliss;
    permanentBliss = actor.system.permanent;

    if (bliss < permanentBliss) {
      bliss = permanentBliss;
    }
    await actor.update({ "system.bliss": bliss });
  }

  async computeMaxStats(actor) {
    // console.log("E-STATE | Computing Max Stats");
    let health = 0;
    let hope = 0;

    health = Math.ceil((actor.system.strength + actor.system.agility) / 2);
    hope = Math.ceil((actor.system.wits + actor.system.empathy) / 2);
    const talents = actor.items.filter((item) => item.type === "talent");

    // If there are no talents we can skip the loop
    if (talents.length > 0) {
      // look for taents that modify health or hope
      for (let talent of talents) {
        if (talent.system.type.includes("health")) {
          health += talent.system.modifier.value;
        } else if (talent.system.type.includes("hope")) {
          hope += talent.system.modifier.value;
        }
      }
    }

    //update actor with new values
    if (this._isPlayer()) {
      await actor.update({
        "system.health.max": health,
        "system.hope.max": hope,
      });
    }
    //NPCs do not have hope
    if (this._isNpc()) {
      await actor.update({
        "system.health.max": health,
      });
    }
  }

  async _preparePassengers(data, actor) {
    if (actor.system.passengers.passengerIds === undefined) return;
    data.passengers = actor.system.passengers.passengerIds.reduce((arr, a) => {
      // console.log("E-STATE | Preparing Passengers", a.id);
      const passenger = game.actors.get(a.id);
      if (passenger) {
        passenger.position =
          actor.system.passengers?.driverId === a.id ? "driver" : "passenger";
        arr.push(passenger);
      } else {
        // passenger doesn't exist anymore, remove from vehicle
        this.actor.removeVehiclePassenger(a.id);
      }
      return arr;
    }, []);

    // only include passengers that are not the driver
    data.passengerCountExcludingDriver = data.passengers.filter(
      (p) => p.position === "passenger"
    ).length;
    return data;
  }

  async dropPassenger(actorId) {
    // console.log("E-STATE | Dropping Passenger on Vehicle", actorId);
    const passenger = game.actors.get(actorId);
    const actorData = this.actor;

    if (!passenger) return;

    if (passenger.type !== "player" && passenger.type !== "npc") return;

    return await actorData.addVehiclePassenger(actorId);
  }

  computeItems(data) {
    // console.log("E-STATE | Computing Items", data);
    for (let item of Object.values(data.items)) {
      item.isGear = item.type === "gear";
      item.isWeapon = item.type === "weapon";
      item.isArmor = item.type === "armor";
      item.isExplosive = item.type === "explosive";
      item.isTalent = item.type === "talent";
      item.isTrait = item.type === "trait";
      item.isDrone = item.type === "drone";
      item.isNeurocaster = item.type === "neurocaster";
      item.isTension = item.type === "tension";
      item.isTrauma = item.type === "trauma";
      item.isInjury = item.type === "injury";
    }
  }

  _isPlayer() {
    return this.actor.type === "player";
  }

  _isNpc() {
    return this.actor.type === "npc";
  }

  _isRobot() {
    return this.actor.type === "robot";
  }

  _isVehicle() {
    return this.actor.type === "vehicle";
  }

  /** @override */
  async _onDropItemCreate(itemData) {
    const type = itemData.type;
    // console.log("E-State | drag and drop items", this);
    const alwaysAllowedItems = [];

    const allowedItems = {
      vehicle: [
        "weapon",
        "armor",
        "gear",
        "trait",
        "explosive",
        "drone",
        "neurocaster",
      ],
      player: [
        "weapon",
        "armor",
        "explosive",
        "talent",
        "gear",
        "tension",
        "injury",
        "trauma",
        "drone",
        "neurocaster",
      ],
      npc: [
        "weapon",
        "armor",
        "explosive",
        "talent",
        "gear",
        "tension",
        "drone",
        "neurocaster",
      ],
      robot: ["weapon"],
    };
    let allowed = true;
    if (!alwaysAllowedItems.includes(type)) {
      if (!allowedItems[this.actor.type].includes(type)) {
        allowed = false;
      }
    }

    if (!allowed) {
      const msg = game.i18n.format("estate.MSG.WRONGITEMTYPE", {
        type: type,
        actor: this.actor.type,
      });
      console.warn(`E-State| ${msg}`);
      ui.notifications.warn(msg);
      return false;
    }
    return super._onDropItemCreate(itemData);
  }
}

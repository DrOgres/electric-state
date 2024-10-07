import { eState } from "../config.js";
import { prepareRollDialog, prepareDeathRollDialog } from "../lib/roll.js";

export default class esActorSheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["es", "sheet", "actor"],
      width: 650,
      height: 700,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "main",
        },
      ],
    });
  }

  get template() {
    return `systems/electric-state/templates/actors/${this.actor.type}.hbs`;
  }

  _getHeaderButtons() {
    let buttons = super._getHeaderButtons();
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
      //TODO apply any traits that affect the vehicle
      this._applyVehicleTraits(data, actor);
    }

    data.notesHTML = await TextEditor.enrichHTML(actor.system.notes, {
      async: true,
    });

    return data;
  }

  activateListeners(html) {
    console.log("E-STATE | Activating Actor Sheet Listeners");
    super.activateListeners(html);

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
  }

  async _onItemDrop(event) {
    console.log("E-STATE | Dropping Item on Actor", event);

    event.preventDefault();
    let actor = this.actor;
    let item = game.data.item;
    console.log("E-STATE | Item", item);
    if (!item) return;
    actor.createEmbeddedDocuments("Item", [item]);

    let storedItem = game.data.item;
    if (storedItem === null) {
      return;
    }

    let originalActor = storedItem.actor;
    if (originalActor.id === actor.id) {
      //  console.log("id match on drop action - returning ");
      storedItem = null;
      item = null;
      return;
    }

    originalActor.deleteEmbeddedDocuments("Item", [storedItem.id]);

    game.data.item = null;
    storedItem = null;
    item = null;

    return;
  }

  _onDragStart(event) {
    console.log(
      "start drag",
      event.srcElement.firstElementChild.dataset.rolled
    );
    console.log(
      "start drag skill?",
      event.currentTarget.classList.contains("skill")
    );
    console.log(
      "start drag attribute?",
      event.currentTarget.classList.contains("attribute")
    );

    if (
      event.currentTarget.classList.contains("attribute")
    ) {
      console.log("a skill or attribute");
      const rollItemDragged = event.srcElement.firstElementChild.dataset.rolled;
      console.log("rollItemDragged", rollItemDragged);

      return;
    } else {
      console.log("not a skill or attribute");
      super._onDragStart(event);
      return;
    }
  }


  async _onItemDrag(event) {
    console.log("E-STATE | Dragging Item", event);
    event.preventDefault();
    game.data.item = this.actor.getEmbeddedDocument(
      "Item",
      event.currentTarget.closest(".item").dataset.itemId
    );
    console.log("E-STATE | Game Data Item", game.data.item);
  }

  async _applyVehicleTraits(data, actor) {
    console.log("E-STATE | Applying Vehicle Traits", data, actor);
    const traits = actor.items.filter((item) => item.type === "trait");
    console.log("E-STATE | Traits", traits, traits.length);

    if (traits.length === 0) {
      actor.setFlag("electric-state", "speed", 0);
      actor.setFlag("electric-state", "maneuver", 0);
      actor.setFlag("electric-state", "armor", 0);
      actor.setFlag("electric-state", "hull", 0);
      actor.setFlag("electric-state", "passengers", 0);
    }

    for (let trait of traits) {
      console.log("E-STATE | Trait", trait);
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
          actor.setFlag("electric-state", "speed", speed);
          console.log("E-STATE | Speed", speed, actor);
          break;
        case "maneuver":
          const maneuver = trait.system.modifier.value;
          actor.setFlag("electric-state", "maneuver", maneuver);
          console.log("E-STATE | Maneuver", maneuver);
          break;
        case "armor":
          const armor = trait.system.modifier.value;
          actor.setFlag("electric-state", "armor", armor);
          console.log("E-STATE | Armor", armor);
          break;
        case "hull":
          const hull = trait.system.modifier.value;
          actor.setFlag("electric-state", "hull", hull);
          console.log("E-STATE | Hull", hull);
          break;
        case "passengers":
          const passengers = trait.system.modifier.value;
          actor.setFlag("electric-state", "passengers", passengers);
          console.log("E-STATE | Passengers", passengers);
          break;
      }
    }
  }
  async _onItemUse(event) {
    console.log("E-STATE | Using Item");
    const itemId = event.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);
    console.log("E-STATE | Item", item);
    if (!item.system.isConsumable || item.system.uses <= 0) {
      //TODO localize this message
      ui.notifications.warn("This item is not consumable or out of uses");
      return;
    }
    const type = item.system.useType;
    const penalty = item.system.usePenaltyType;
    let uses = item.system.uses;

    console.log("E-STATE | Item Type", type);
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
          ui.notifications.info("Health is already at max");
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
          ui.notifications.info("Hope is already at max");
          return;
        }
        await this.actor.update({ "system.hope.value": hope });
        uses -= 1;
    }

    console.log("Penalty", penalty);
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
    ui.notifications.info("Used: " + item.name);
    //TODO make a chat card to indicate item use and effect
  }

  async _onToggleEquip(event) {
    const parent = $(event.currentTarget).parents(".item");
    console.log("E-STATE | Toggling Equip", parent);
    event.preventDefault();
    const itemId = parent[0].dataset.itemId;
    const item = this.actor.items.get(itemId);
    let equipStatus = !item.flags.isEquipped;

    //TODO unequip all other items of the same type ensuring that only one item of that type is equipped

    await item.update({ "flags.isEquipped": equipStatus });
    console.log("E-STATE | Item", item);
  }

  async _onToggleFav(event) {
    console.log("E-STATE | Toggling Favorite", event);

    const parent = event.currentTarget.parentElement;
    console.log("E-STATE | Parent", parent);
    event.preventDefault();
    const itemId = parent.dataset.itemId;
    console.log("E-STATE | Item Id", itemId);
    const item = this.actor.items.get(itemId);
    console.log("E-STATE | Item", item);
    let favStatus = !item.flags.isFav;
    await item.update({ "flags.isFav": favStatus });
  }

  _onRoll(event) {
    console.log("E-STATE | Rolling", event);
    const rollSource = event.currentTarget.dataset.type;

    let options = {
      type: rollSource,
      sheet: this,
      actorType: this.actor.type,
      testName: "",
      testModifier: 0,
      dicePool: 0,
    };

    switch (rollSource) {
      case "attribute":
        {
          const attribute = event.currentTarget.dataset.attribute;
          options.attribute = attribute;
          options.testName = game.i18n.localize(
            `estate.ATTRIBUTE.${eState.attributesAbv[attribute]}`
          );
          options.dicePool += this.actor.system[attribute];
        }
        break;
      case "weapon":
        {
          console.log("E-STATE | Rolling Weapon");
          const itemId = event.currentTarget.dataset.itemId;
          const item = this.actor.items.get(itemId);
          options.testName = item.name;
          options.gearName = item.name;
          options.gearDice = item.system.modifier.value;
          options.damage = item.system.damage;
          options.attribute = item.system.attribute;
          options.weaponId = itemId;
        }
        break;
      case "armor":
        {
          console.log("E-STATE | Rolling Armor");
          const itemId = event.currentTarget.dataset.itemId;
          const item = this.actor.items.get(itemId);
          options.testName = item.name;
          options.dicePool = item.system.modifier.value;
          options.armorId = itemId;
        }
        break;
      case "vehicle-armor":
        {
          if (this.actor.type !== "vehicle") return;

          console.log("E-STATE | Rolling Vehicle Armor");
          options.testName = game.i18n.localize(`estate.UI.VEHICLEARMOR`);
          options.dicePool += this.actor.system.armor;
        }
        break;
      case "vehicle-maneuverability":
        {
          if (this.actor.type !== "vehicle") return;

          console.log("E-STATE | Rolling Vehicle Maneuverability");
          const driverId = this.actor.system.passengers.driverId;
          const driver = driverId ? game.actors.get(driverId) : null;
          if (!driver) {
            ui.notifications.warn(
              "You must assign a driver to the vehicle to make a maneuverability test"
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
        }
        break;
      case "robot-armor":
        {
          if (this.actor.type !== "robot") return;

          console.log("E-STATE | Rolling Robot Armor");
          options.testName = game.i18n.localize(`estate.UI.ROBOTARMOR`);
          options.dicePool += this.actor.system.armor;
        }
        break;
      case "drone-attack":
        {
          console.log("E-STATE | Rolling Drone Attack");
          const itemId = event.currentTarget.dataset.itemId;
          const item = this.actor.items.get(itemId);
          console.log("E-STATE | Item", item);
          const neurocasters = this.actor.items.filter(
            (item) => item.type === "neurocaster"
          );
          console.log("E-STATE | Neurocasters", neurocasters);

          if (!item.flags.isEquipped) {
            ui.notifications.warn(
              "Drone and Neurocaster must be equipped to use this action"
            );
            return;
          }
          if (neurocasters.length === 0) {
            ui.notifications.warn(
              "Drone and Neurocaster must be equipped to use this action"
            );
            return;
          } else {
            let status = false;
            for (let neurocaster of neurocasters) {
              if (neurocaster.flags.isEquipped) {
                status = true;
              }
            }
            if (!status) {
              ui.notifications.warn(
                "Drone and Neurocaster must be equipped to use this action"
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
          console.log("E-STATE | Max Range", maxRange, "Min Range", minRange);
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
        }
        break;
      case "drone-armor":
        {
          console.log("E-STATE | Rolling Drone Armor");
          const itemId = event.currentTarget.dataset.itemId;
          const item = this.actor.items.get(itemId);
          options.testName =
            item.name + " " + game.i18n.localize("estate.UI.ARMOR");
          options.dicePool = item.system.armor;
          options.type = "drone";
        }
        break;
      case "neurocaster":
        {
          console.log("E-STATE | Rolling Neurocaster");
          const itemId = event.currentTarget.parentElement.dataset.itemId;
          const item = this.actor.items.get(itemId);
          options.cast = event.currentTarget.dataset.cast;

          options.testName =
            game.i18n.localize("estate.UI.NEUROCASTER") +
            " " +
            game.i18n.localize(eState.castType[options.cast]);
          options.dicePool = item.system.modifier.value;
          options.type = "neurocaster";
        }
        break;
      case "explosive":
        {
          console.log("E-STATE | Rolling Explosive");
          const itemId = event.currentTarget.dataset.itemId;
          const item = this.actor.items.get(itemId);
          options.testName = item.name;
          options.dicePool = 0;
          options.explosiveId = itemId;
          options.type = "explosive";
        }
        break;
    }

    prepareRollDialog(options);
  }

  _deathRoll(actor) {
    console.log("E-STATE | Death Roll", actor);

    if (actor.object.system.health.value > 0) {
      ui.notifications.info(
        "You are not dying yet! You must be at 0 health before you make a death roll!"
      );
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
    console.log("E-STATE | Deleting Item");
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
    console.log("E-STATE | Resetting Vehicle Flags", item);
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
    console.log("E-STATE | Removing Passenger", event);
    event.preventDefault();
    const parent = $(event.currentTarget).parents(".button-group");
    const passengerId = parent[0].dataset.passengerId;
    this.actor.removeVehiclePassenger(passengerId);
  }

  async _onAssignPassengerPosition(event) {
    console.log("E-STATE | Assigning Passenger Position", event);
    event.preventDefault();
    const parent = $(event.currentTarget).parents(".passenger");
    const passengerId = parent[0].dataset.passengerId;
    this.actor.assignPassengerPosition(passengerId, event.currentTarget.value);
  }

  async checkHope(actor) {
    console.log("E-STATE | Checking Hope");
    let hope = 0;
    let maxHope = 0;

    hope = actor.system.hope.value;
    maxHope = actor.system.hope.max;

    if (hope > maxHope) {
      hope = maxHope;
    }
    await actor.update({ "system.hope.value": hope });
  }

  async checkHealth(actor) {
    console.log("E-STATE | Checking Health");
    let health = 0;
    let maxHealth = 0;

    health = actor.system.health.value;
    maxHealth = actor.system.health.max;

    if (health > maxHealth) {
      health = maxHealth;
    }
    await actor.update({ "system.health.value": health });
  }

  async checkBliss(actor) {
    console.log("E-STATE | Checking Bliss");
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
    console.log("E-STATE | Computing Max Stats");
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
      console.log("E-STATE | Preparing Passengers", a.id);
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
    console.log("E-STATE | Dropping Passenger on Vehicle", actorId);
    const passenger = game.actors.get(actorId);
    const actorData = this.actor;

    if (!passenger) return;

    if (passenger.type !== "player" && passenger.type !== "npc") return;

    return await actorData.addVehiclePassenger(actorId);
  }

  computeItems(data) {
    console.log("E-STATE | Computing Items", data);
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
    console.log("E-State | drag and drop items", this);
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
      const msg = game.i18n.format("estate.UI.WRONGITEMTYPE", {
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

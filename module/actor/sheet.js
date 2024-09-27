import { eState } from "../config.js";
import { prepareRollDialog } from "../lib/roll.js";

export default class esActorSheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["es", "sheet", "actor"],
      width: 600,
      height: 600,
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
    if (this.actor.isOwner && this.actor.type === "player") {
      buttons = [
        {
          label: game.i18n.localize("estate.UI.DEATHROLL"),
          class: "push-roll",
          icon: "fas fa-skull",
          onclick: (ev) => this._deathRoll(this),
        },
      ].concat(buttons);
    }
    return buttons;
  }

  async getData() {
    const data = super.getData();
    const actor = this.actor;
    // console.log("E-STATE | Actor", actor);
    // console.log("E-STATE |  Data", data);
    this.computeItems(data);
    this.computeGear(actor);
    this.computeMaxStats(actor);
    this.checkBliss(actor);
    this.checkHealth(actor);
    this.checkHope(actor);

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
    html.find(".rollable").click(this._onRoll.bind(this));
    html.find(".toggle-fav").click(this._onToggleFav.bind(this));
    html.find(".toggle-equip").click(this._onToggleEquip.bind(this));
  }

  async _onToggleEquip(event) {
    const parent = $(event.currentTarget).parents(".item");
    event.preventDefault();
    const itemId = parent[0].dataset.itemId;
    const item = this.actor.items.get(itemId);
    let equipStatus = !item.flags.isEquipped;

    //TODO unequip all other items of the same type ensuring that only one item of that type is equipped

    await item.update({ "flags.isEquipped": equipStatus });
    console.log("E-STATE | Item", item);
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

  _isVehicule() {
    return this.actor.type === "vehicle";
  }

  async _onToggleFav(event) {
    console.log("E-STATE | Toggling Favorite");

    const parent = $(event.currentTarget).parents(".item");
    event.preventDefault();
    const itemId = parent[0].dataset.itemId;
    const item = this.actor.items.get(itemId);
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
          options.dicePool = item.system.modifier.value;
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

          options.testName = item.name + " " + game.i18n.localize("estate.UI.WEAPON");
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
        case "drone-armor": {
          console.log("E-STATE | Rolling Drone Armor");
          const itemId = event.currentTarget.dataset.itemId;
          const item = this.actor.items.get(itemId);
          options.testName = item.name + " " + game.i18n.localize("estate.UI.ARMOR");
          options.dicePool = item.system.armor;
          options.type = "drone";

        } break;
    }

    prepareRollDialog(options);
  }

  _deathRoll(actor) {
    console.log("E-STATE | Death Roll", actor);
  }

  _onItemEdit(event) {
    event.preventDefault();
    const itemID = event.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemID);
    item.sheet.render(true);
  }

  _onItemDelete(event) {
    console.log("E-STATE | Deleting Item");
    event.preventDefault();
    const itemId = event.currentTarget.dataset.itemId;
    this.actor.deleteEmbeddedDocuments("Item", [itemId]);
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

    // look for taents that modify health or hope
    for (let talent of talents) {
      if (talent.system.type.includes("health")) {
        health += talent.system.modifier.value;
      } else if (talent.system.type.includes("hope")) {
        hope += talent.system.modifier.value;
      }
    }
    //update actor with new values
    await actor.update({
      "system.health.max": health,
      "system.hope.max": hope,
    });
  }

  //   "gear",
  //   "weapon",
  //   "armor",
  //   "explosive",
  //   "talent",
  //   "trait",
  //   "drone",
  //   "neurocaster",
  //   "tension",
  //   "trauma",
  //   "injury"

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

  computeGear(actor) {
    actor.hasWeapon = this._isPlayer() || this._isNpc() || this._isRobot();
    actor.hasExplosive = this._isPlayer() || this._isNpc();
    actor.hasGear= this._isPlayer() || this._isNpc();
    actor.hasArmor = this._isPlayer() || this._isNpc() || this._isRobot();
    actor.hasDrone = this._isPlayer() || this._isNpc();
    actor.hasNeurocaster = this._isPlayer() || this._isNpc();
  }
}

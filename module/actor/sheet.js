import { eState } from "../config.js";
import { prepareRollDialog } from "../lib/roll.js";

export default class esActorSheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["es", "sheet", "actor"],
      template: "systems/electric-state/templates/actors/player.hbs",
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
    if (this.actor.isOwner) {
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
    this.computeMaxStats(actor);
    this.checkBliss(actor);
    this.checkHealth(actor);
    this.checkHope(actor);

    (data.notesHTML = await TextEditor.enrichHTML(actor.system.notes, {
      async: true,
    }));

    return data;
  }

  activateListeners(html) {
    console.log("E-STATE | Activating Actor Sheet Listeners");
    super.activateListeners(html);

    html.find(".item-create").click(this._onItemCreate.bind(this));
    html.find(".item-edit").click(this._onItemEdit.bind(this));
    html.find(".item-delete").click(this._onItemDelete.bind(this));
    // html.find(".item-roll").click(this._onItemRoll.bind(this));
    html.find(".rollable").click(this._onRoll.bind(this));
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
    }

    switch (rollSource) {
      case "attribute":{
        const attribute = event.currentTarget.dataset.attribute;
        options.attribute = attribute;
        console.log("E-STATE | Rolling Attribute", attribute);
        options.testName = game.i18n.localize(`estate.ATTRIBUTE.${eState.attributesAbv[attribute]}`);
        options.dicePool = this.actor.system[attribute];

        console.log("E-STATE | Rolling Attribute", options);

        
        break;
      }
    }

    prepareRollDialog(options);

    
  }

  _deathRoll(actor){
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
    await actor.update({"system.hope.value": hope});
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
    await actor.update({"system.health.value": health});
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
    await actor.update({"system.bliss": bliss});
  }

  async computeMaxStats(actor) {
    console.log("E-STATE | Computing Max Stats");
    let health = 0;
    let hope = 0;

    health = Math.ceil((actor.system.strength + actor.system.agility)/2); 
    hope = Math.ceil((actor.system.wits + actor.system.empathy)/2);
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
    await actor.update({"system.health.max": health, "system.hope.max": hope});

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
}

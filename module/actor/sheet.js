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

  getData() {
    const data = super.getData();
    const actor = this.actor;
    console.log("E-STATE | Actor", actor);
    console.log("E-STATE |  Data", data);

    this.computeItems(data);

    return data;
  }

  activateListeners(html) {
    console.log("E-STATE | Activating Actor Sheet Listeners");
    super.activateListeners(html);
    // html.find(".item-create").click(this._onItemCreate.bind(this));
    // html.find(".item-edit").click(this._onItemEdit.bind(this));
    // html.find(".item-delete").click(this._onItemDelete.bind(this));
    // html.find(".item-roll").click(this._onItemRoll.bind(this));
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
      console.log("E-STATE | Item", item);
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

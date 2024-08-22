export default class esActorSheet extends ActorSheet {

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["es", "sheet", "actor"],
            template: "systems/electric-state/templates/actors/player.hbs",
            width: 600,
            height: 600,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
        });
    }

    get template() {
        return `systems/electric-state/templates/actors/${this.actor.type}.hbs`;
      }

      getData() {
        const data = super.getData();
        const actor = this.actor;
//TODO break out item types into separate arrays

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






}
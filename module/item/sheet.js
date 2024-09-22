import { eState } from "../config.js";

export default class esItemSheet extends ItemSheet {
  constructor(...args) {
    super(...args);
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 650,
      height: 350,
      classes: ["es", "sheet", "item"],
      resizable: true,
    });
  }

  get template() {
    return `systems/electric-state/templates/items/${this.item.type}.hbs`;
  }

  getData() {
 
    const data = super.getData();
    data.config = eState;
    const attributesAbv = data.config.attributesAbv;
    console.log("E-STATE | Item", attributesAbv);
    let  localizedAttributes = [];
    
    Object.keys(attributesAbv).forEach(function (key){ 
      console.log("E-STATE | Key", attributesAbv[key]);
      localizedAttributes.push(game.i18n.localize(`estate.ATTRIBUTE.${attributesAbv[key]}`));
    }
    );

    console.log("E-STATE | Localized Attributes", localizedAttributes);
    data.config.attributeSelectOptions = {
      strength: localizedAttributes[0],
      agility: localizedAttributes[1],
      wits: localizedAttributes[2],
      empathy: localizedAttributes[3],
    };

    if(this.item.type === "tension"){
      console.log("E-STATE | Tension", data);
      // get a list of all player actors the user has at least limited access to and add them to the select options
      const actors = game.actors;

      data.config.actorSelectOptions = [];
      for (let actor of actors) {
        if (actor.type === "player") {
          // if the actor has this tension in its documnent collection do not add the actor to the list
          const actorItems = actor.items;
          let hasTension = actor.items.find((item) => item.type === "tension" && item.id === this.item.id);
          let hasPermisions = actor.testUserPermission(game.user, "LIMITED");
          if (hasPermisions && !hasTension) {
            data.config.actorSelectOptions.push({ 
            actor: actor.name,
            id: actor.id,});
        }
      }
    }
  }

    console.log("E-STATE | Data", data);
    data.config.default = "STR";
    this.testBroken(data);


    return data;
  }

  testBroken(data) {
    console.log("E-STATE | Testing Broken", data);

    if(data.item.type === "drone"){
      if (data.item.system.hull.value === 0){
        data.item.system.isBroken = true;
      }
      return;
    }
//       "processor"
//       "network"
//       "graphics"
    if(data.item.type === "neurocaster"){
      console.log("E-STATE | Neurocaster", data.item.system);
      if (data.item.system.processor.value === 0){
        data.item.system.isBroken = true;
      } else if (data.item.system.network.value === 0){
        data.item.system.isBroken = true;
      } else if (data.item.system.graphics.value === 0){
        data.item.system.isBroken = true;
      }
      return;
    }

    const currentModifier = data.item.system.modifier.value;
    if (currentModifier === 0) {
      data.item.system.modifier.value = 0;
      data.item.system.isBroken = true;
    } else {
      data.item.system.isBroken = false;
    }
    
    
  }
}

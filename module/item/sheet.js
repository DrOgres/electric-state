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
    const localizedAttributes = attributesAbv.map((a) =>
      game.i18n.localize(`estate.ATTRIBUTE.${a}`)
    );

    data.config.attributeSelectOptions = {
      STR: localizedAttributes[0],
      AGI: localizedAttributes[1],
      WIT: localizedAttributes[2],
      EMP: localizedAttributes[3],
    };
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

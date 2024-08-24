
import { eState } from "../config.js";

export default class esItemSheet extends ItemSheet {
    constructor(...args) {
        super(...args);
    }


    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            width : 650, 
            height: 350,
            classes: ["es", "sheet", "item"],
            resizable: true, 
        });
    }


    get template() {
        return `systems/electric-state/templates/items/${this.item.type}.hbs`;
    }


    getData() {
        console.log("E-STATE | Item Data", eState);
        const data = super.getData();
        data.config = eState;
        const attributes = data.config.attributes;
        console.log(attributes);
        const attributesAbv = data.config.attributesAbv;
        console.log(attributesAbv);
        const localizedAttributes = attributesAbv.map(a => game.i18n.localize(`estate.ATTRIBUTE.${a}`));
        console.log(localizedAttributes);

        data.config.attributeSelectOptions = {"STR": localizedAttributes[0], "AGI": localizedAttributes[1], "WIT": localizedAttributes[2], "EMP": localizedAttributes[3]};
        console.log(data.config.attributeSelectOptions);
        data.config.default = "STR";
        return data;
    }
}
export default class esItemSheet extends ItemSheet {
    constructor(...args) {
        super(...args);
    }


    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
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
        const data = super.getData();
        data.config = CONFIG.esState;
        
        return data;
    }
}
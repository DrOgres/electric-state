/**
 *  Define a set of template paths to pre-load
 *  Pre-loaded templates are compiled and cached for fast access when rendering
 *  
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function() {
    console.log("E-STATE | Preloading sheet partials");

    // Define template paths to load
    const templatePaths = [
        // Actor Sheet Partials
        "systems/electric-state/templates/actors/parts/stats.hbs",
        "systems/electric-state/templates/actors/parts/talents.hbs",
        "systems/electric-state/templates/actors/parts/gear.hbs",
        "systems/electric-state/templates/actors/parts/weapons.hbs",
        "systems/electric-state/templates/actors/parts/player-main.hbs",
        "systems/electric-state/templates/actors/parts/player-notes.hbs",
        "systems/electric-state/templates/actors/parts/npc-main.hbs",
        "systems/electric-state/templates/actors/parts/npc-notes.hbs",
        "systems/electric-state/templates/actors/parts/robot-main.hbs",
        "systems/electric-state/templates/actors/parts/robot-notes.hbs",
        "systems/electric-state/templates/actors/parts/vehicle-main.hbs",
        "systems/electric-state/templates/actors/parts/vehicle-notes.hbs",
        "systems/electric-state/templates/actors/parts/vehicle-gear.hbs",
    ];
  
    // Load the template parts
    return loadTemplates(templatePaths);
};

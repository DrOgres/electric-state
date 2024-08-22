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
        // "systems/electric-state/templates/actors/parts/conditions.hbs",
        // "systems/electric-state/templates/actors/parts/relationships.hbs",
        // "systems/electric-state/templates/actors/parts/relationships-teen.hbs",
        // "systems/electric-state/templates/actors/parts/item-hideout.hbs",
        // "systems/electric-state/templates/actors/parts/core-info.hbs",
        // "systems/electric-state/templates/actors/parts/core-teen.hbs",
        // "systems/electric-state/templates/actors/parts/conditions-teen.hbs",
        // "systems/electric-state/templates/actors/parts/teen-item-notes.hbs"
    ];
  
    // Load the template parts
    return loadTemplates(templatePaths);
};

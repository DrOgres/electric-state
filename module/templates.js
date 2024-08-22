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
    
         "systems/electric-state/templates/actors/parts/player-main.hbs",
         "systems/electric-state/templates/actors/parts/player-gear.hbs",
         "systems/electric-state/templates/actors/parts/player-notes.hbs",

    ];
  
    // Load the template parts
    return loadTemplates(templatePaths);
};

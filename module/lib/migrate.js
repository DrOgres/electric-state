export function migrate(){
    if (!game.user.isGM)
        return;

    const currentVersion = game.settings.get("estate", "systemMigrationVersion");
    const foundryVersion = game.version;
    
}
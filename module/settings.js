import {eState} from "./config.js";

export const registerSystemSettings = function () {
    console.log("E-STATE | Registering system settings", eState);

    game.settings.register("electric-state", "easierHope", {
        name: "SETTINGS.easierHope",
        hint: "SETTINGS.easierHopeDesc",
        scope: "world",
        config: true,
        restricted: true,
        default: false,
        type: Boolean,
        onChange: () => {
            location.reload();
          },
    });
}
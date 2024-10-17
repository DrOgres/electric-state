export default class esActor extends Actor {
  // Override the prepareData() method to generate derived data when the actor is prepared
  prepareData() {
    super.prepareData();
    // const actorData = this.system;
    // console.log("E-State actor data", actorData);
  }

  async _preCreate(data, options, user) {
    console.log("E-STATE | Pre-Create Actor", data, options, user);
    await super._preCreate(data, options, user);

    let link =
      data.type === "player" ||
      data.type === "npc" ||
      data.type === "vehicle" ||
      !data.type === "robot";
    console.log("E-STATE | Link", data.type, link);

    const isPC = data.type == "player";
    const isNPC = data.type == "npc";
    const isRobot = data.type == "robot";
    const isVehicle = data.type == "vehicle";
    let bar1 = null;
    let bar2 = null;

    if (isPC) {
      bar1 = "health";
      bar2 = "hope";
    }

    if (isNPC) {
      bar1 = "health";
    }

    if (isRobot) {
      bar1 = "hull";
    }

    if (isVehicle) {
      bar1 = "hull";
      bar2 = "maneuverability";
    }

    const displayBars =
      isNPC || isRobot
        ? CONST.TOKEN_DISPLAY_MODES.OWNER
        : CONST.TOKEN_DISPLAY_MODES.CONTROL;

    const displayName =  isNPC || isRobot || isVehicle
      ? CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER
      : CONST.TOKEN_DISPLAY_MODES.CONTROL;

      console.log("E-STATE | Actor Defaults", displayBars, displayName, link, bar1, bar2, data.name);

    let actorDefaults = {
      "prototypeToken.displayName": displayName,
      "prototypeToken.displayBars": displayBars,
      "prototypeToken.actorLink": link,
      "prototypeToken.bar1.attribute": bar1,
      "prototypeToken.bar2.attribute": bar2,
      "prototypeToken.sight.enabled": "true",
      "prototypeToken.sight.range": "30",
      "prototypeToken.disposition": CONST.TOKEN_DISPOSITIONS.NEUTRAL,
      "prototypeToken.name": `${data.name}`,
    };
    this.updateSource(actorDefaults);
  }

  async addVehiclePassenger(actorId) {
    const system = this.system;

    if (this.type !== "vehicle") return;

    if (system.passengers.passengerIds.find((p) => p.id === actorId)) return;

    console.log("E-STATE | Adding passenger to vehicle", actorId);
    const passenger = {
      id: actorId,
    };
    system.passengers.passengerIds.push(passenger);

    await this.update({
      "system.passengers.passengerIds": system.passengers.passengerIds,
      "system.passengers.count": system.passengers.passengerIds.length,
    });

    return passenger;
  }

  async removeVehiclePassenger(actorId) {
    console.log("E-STATE | Removing passenger from vehicle", actorId);

    const passengers = this.system.passengers.passengerIds.filter(
      (p) => p.id !== actorId
    );

    const update = {
      "system.passengers.passengerIds": passengers,
      "system.passengers.count": passengers.length,
    };

    if (this._wasDriver(actorId)) {
      console.log(
        "E-STATE | The removed passenger was the driver, unassign driver",
        actorId
      );
      update["system.passengers.driverId"] = "";
    }

    await this.update(update);

    return passengers;
  }

  async assignPassengerPosition(actorId, position) {
    console.log("E-STATE | Assigning passenger position", actorId, position);

    const passenger = this.system.passengers.passengerIds.find(
      (p) => p.id === actorId
    );

    if (!passenger) return;

    if (position === "driver") {
      this.system.passengers.driverId = actorId;
      await this.update({
        "system.passengers.driverId": actorId,
      });
    } else {
      if (this._wasDriver(actorId)) {
        console.log(
          "E-STATE | The driver is being assigned a passenger position, unassign driver"
        );
        this.system.passengers.driverId = "";
        await this.update({
          "system.passengers.driverId": "",
        });
      }
    }

    console.log(
      "E-STATE | After Assigning passenger position",
      this.system.passengers
    );
  }

  _wasDriver(actorId) {
    return this.system.passengers.driverId === actorId;
  }
}

//TODO on pre-create actor create a weapon item for the actor with the unarmed weapon properties

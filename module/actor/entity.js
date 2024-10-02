export default class esActor extends Actor {
    // Override the prepareData() method to generate derived data when the actor is prepared
    prepareData() {
        super.prepareData();
        // const actorData = this.system;
        // console.log("E-State actor data", actorData);

    }

    async addVehiclePassenger(actorId) {
        const system = this.system;

        if (this.type !== 'vehicle') return;
    
        if (system.passengers.passenger.find((p) => p.id === actorId)) return;

        console.log("E-STATE | Adding passenger to vehicle", actorId);
        const passenger = {
            id: actorId,
        };
        system.passengers.passenger.push(passenger);
        
        await this.update({ 
            'system.passengers.passenger': system.passengers.passenger,
            'system.passengers.count': system.passengers.passenger.length,
        });

        return passenger;
    }

    async removeVehiclePassenger(actorId) {
        console.log("E-STATE | Removing passenger from vehicle", actorId);

        const passengers = this.system.passengers.passenger.filter((p) => p.id !== actorId);

        const update = { 
            'system.passengers.passenger': passengers,
            'system.passengers.count': passengers.length,
        };

        if (this._wasDriver(actorId)) {
            console.log("E-STATE | The removed passenger was the driver, unassign driver", actorId);
            update["system.passengers.driverActorId"] = ""
        }
        
        await this.update(update);

        return passengers;
    }

    async assignPassengerPosition(actorId, position) {
        console.log("E-STATE | Assigning passenger position", actorId, position);

        const passenger = this.system.passengers.passenger.find((p) => p.id === actorId);

        if (!passenger) return;

        if (position === 'driver') {
            this.system.passengers.driverActorId = actorId;
            await this.update({ 
                'system.passengers.driverActorId': actorId,
            });
        } else {
            if (this._wasDriver(actorId)) {
                console.log("E-STATE | The driver is being assigned a passenger position, unassign driver");
                this.system.passengers.driverActorId = "";
                await this.update({ 
                    'system.passengers.driverActorId': "",
                });
            } 
        }

        console.log("E-STATE | After Assigning passenger position", this.system.passengers);
    }

    _wasDriver(actorId) {
        return this.system.passengers.driverActorId === actorId;
    }
}

//TODO on pre-create actor create a weapon item for the actor with the unarmed weapon properties
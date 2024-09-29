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
    
        if(system.passengers.passenger.find((p) => p.id === actorId)) return;

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
        await this.update({ 
            'system.passengers.passenger': passengers,
            'system.passengers.count': passengers.length,
         });

        return passengers;
    }
}

//TODO on pre-create actor create a weapon item for the actor with the unarmed weapon properties
export default class esActor extends Actor {
    // Override the prepareData() method to generate derived data when the actor is prepared
    prepareData() {
        super.prepareData();
        // const actorData = this.system;
        // console.log("E-State actor data", actorData);

    }
}

//TODO on pre-create actor create a weapon item for the actor with the unarmed weapon properties
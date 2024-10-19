# electric-state
## An Electric State RPG system for Foundry VTT

### This game is not affiliated with, sponsored, or endorsed by Fria Ligan AB. The Year Zero Engine System Reference Document is used under Fria Ligan AB’s Free Tabletop License.

This system is now in BETA!  

![Character 1](https://raw.githubusercontent.com/DrOgres/electric-state/refs/heads/main/assets/es-char.webp)  


please put any and all bug reports and feature requests in the issues of this repo.  Here is a list of things I hope to add in the comming days

TODO LIST:

- Player Character Sheets
    - Target token to use Tension on opposed rolls
        - Add tension drop down to roll dialog if no target is selected
    - Target to allow damage to be applied for attacks
    - limited actor sheet 
    - Adjust Roll Dialog for Drones to show Neurocaster 
    - Flag which aspect of a Neurocaster is being used to allow for adjustment for 1's on pushed rolls
- General styling and UI improvement for clarity and use
- Organize localization fields to make sense
- set up macro drag to hot bar for rollable elements
- Gear Damage for Vehicles on Manuver push
- Item detail roll down on gear tab
- Item detail to chat for Injury, Trauma, Trait, and Talent from character sheet

Version History:

v0.10.0
- added save on close function for custom input fields
- set default prototype token properties to link actors and the like
- localization should be complete
- Chat cards for items on gear tab, click the chat icon to put them into the chat.

v0.9.0 *Breaking Change GOAL and THREAT must be reentered on PC sheets*
- changed fields for goal and threat to editable divs to make them cleaner for editing.
- moved fields in journey for data clarity
- adjusted the vehicle sheet to have a better layout on the passenger area

v0.8.0
- Weapons degrade when 1's are rolled while pushing.

v0.7.0
- Hope decreases for each 1 rolled on a pushed roll
- Gear used in a roll looses 1 gear die when 1's a rolled on a push


v0.6.0
- Fix: Dice colors were inverted
- Add: Liscence information and a copy of the YZE FTL added to the repo to allow for Foundry to List it 

v0.5.0
- Fix: Text area on Goal and threat had extra white space [#22](https://github.com/DrOgres/electric-state/issues/22)
- Fix: Threat text area closed incorrectly putting text into incorrect area and breaking data save [#22](https://github.com/DrOgres/electric-state/issues/22)
- Fix: Changed inputs on vehicle to number type to allow arrow keys to increment/decrement them [#23](https://github.com/DrOgres/electric-state/issues/23)


v0.4.0
- Added Dice So Nice Support
- Added Drag and Drop support to move items between Actors 

v0.3.0 
- Fix Notes editor height set too small by foundry to allow editing

v0.2.0
- Fix: dice not rolling correct pool

v0.1.0: 
- Beta 1!

v0.0.1 a
- Pre-Alpha release 
- special thank you to [Felix Trepanier](https://github.com/coderunner) for their contributions!



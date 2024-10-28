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
    - add bliss for failed rolls when using a Neurocaster
    - if a push makes a neurocaster busted set current hope to 0 and indicate need for mental trauma (potentially add item to sheet)
- General styling and UI improvement for clarity and use
- Organize localization fields to make sense
- set up macro drag to hot bar for rollable elements
- Item detail roll down on gear tab


Version History:
v0.18.0
- fix: users cannot close open sheets they do not own [#31](https://github.com/DrOgres/electric-state/issues/31)

v0.17.0
- Added checkbox on roll dialog to allow application of Real World penalty to rolls when the character has a neurocaster equipped.
- Added Network line on roll dialog to show network attribute of Neurocaster when using a drone, this should make the pool building clearer
- Changed dice type on Neurocaster Bonus to Gear dice for drone use, this is correct as RAW
- Added checkbox to apply penalty for real world actions when a neurocaster is equipped, it is checked by default, this includes drone use.
- gear is an array so when pushing a drone roll gear damage is applied to both neurocaster and any geear the drone is using 
- Fixed: Neurocaster was not using correct attribute for rolls
- Updated Roll dialog UI, to clarify die pool 
- Fix: manuverabililty was not set as gear dice when driving


v0.16.0
- Added chat card for Talent Items
- Added chat card for Trait Items
- Fixed: localization for item target on Injury and Trauma cards
- Fixed Death Save not working [#28](https://github.com/DrOgres/electric-state/issues/28)


v0.15.0
- Added chat card for injury items
- Added chat card for Trauma items
- Fix: [#27](https://github.com/DrOgres/electric-state/issues/27) fields overwriting wrong actor when multiple are open

v0.14.0
- Fix item dup on drag and drop to original actor [#26](https://github.com/DrOgres/electric-state/issues/26)


v0.13.0
- Fix: usable gear not clickable on gear page
- Feature: Improved visibility of clickable elements
- Fix: Weapons not showing applicable Talents when building roll dialog

v0.12.0
- Fix: broke overflow on weapons in fav

v0.11.0
- Fix: missing rollable from NPC sheets
- Made a little more room for names in Fav list on PC sheet

v0.10.0
- added save on close function for custom input fields
- set default prototype token properties to link actors and the like
- localization should be complete
- Chat cards for items on gear tab, click the chat icon to put them into the chat.
- Neurocaster applies gear damage on 1's for pushed rolls
- Vehicles apply gear damage to maneuverability for 1's rolled on pushed rolls
- Drivers of vehicles take hope damage for 1's rolled on pushed rolls

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



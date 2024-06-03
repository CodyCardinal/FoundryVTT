// Localization Strings
const shadowStrikeLabel   = "Shadow Strike";
const shadowStrikeTitle   = "Shadow Strike and Weapon Attack";
const shadowStrikeContent = "<p>Roll Shadow Strike and MH Weapon Attack.</p>";
const rollLabel           = "Roll!";
const damageTakenLabel    = "Damage Taken";
const damageDoneLabel     = "Damage Done";
const weaponAccuracyLabel = "Weapon Accuracy";
const weaponMasteryLabel  = "Weapon Mastery";
const weaponDamageLabel   = "Weapon Damage";
const toHitLabel          = "Total to HIT:";
const isHitTitle          = "Check for Hit";
const confirmedHit        = "The attack hit!";
const unconfirmedHit      = "The attack hit cannot be confirmed.";
const isHitContent        = "<p>Did the attack hit?</p>";
const agonyDrained        = "Drain";
const totalDarkDamage     = "Total DMG : ";
const totalDamageLabel    = "Total DMG : ";
const attackMissed        = "The attack missed!<br/>";
let   notFound            = "{item} item not found!";

// [IMPORTANT] Item Names
const AGONY_ITEM         = "Agony";
const SHADOW_STRIKE_ITEM = "Shadow Strike";

function createChatMessage(content, actor) {
  let speakerName = actor ? actor.name : "Default Actor";
  ChatMessage.create({
    content: content,
    speaker: {
      alias: speakerName,
    },
  });
  chatMessage = "";
}

function checkAgony() {
    let agony        = actor.items.find((i) => i.name === AGONY_ITEM);
    let agonyDamage  = 0;
    let agonyMessage = "";
    if (agony) {
        let agonyLevel  = agony.system.level.value;
            agonyDamage = agonyLevel * 2;
            
            actor.system.resources.hp.value = Math.min(actor.system.resources.hp.value + agonyDamage, actor.system.resources.hp.max);
            actor.system.resources.mp.value = Math.min(actor.system.resources.mp.value + agonyDamage, actor.system.resources.mp.max);
            
            agonyMessage = `
            <span style = "color:purple;"><b>${AGONY_ITEM} [SL${agonyLevel}] ${agonyDrained}</span></b><br/>
            @GAIN[${agonyDamage} hp] @GAIN[${agonyDamage} mp]</span><br/>
            <br/>
            `;
    }
    return agonyMessage;
}

function checkIfHit(attackRoll) {
  let hitMessage     = ``;
  let targetedTokens = Array.from(game.user.targets);
  
  try {
    if (targetedTokens.length === 0) {
      ui.notifications.warn("No target selected!");
      throw new Error("No target selected!");
    }

    targetedTokens.forEach((token) => {
      const targetActor = token?.actor;
      
      if (!targetActor) {
        ui.notifications.warn("No actor found for the targeted token!");
        throw new Error("No actor found for the targeted token!");
      }

      const targetDEF = targetActor.system.derived.def.value;
      if (attackRoll >=  targetDEF) { 
        hitMessage += `<span style="color:green;"><b>${token.name} ${confirmedHit}</b></span><br/>`;
      } else {
        hitMessage += `<span style="color:red;"><b>${token.name} ${attackMissed}</b></span><br/>`;
      }
    });
  } catch (error) {
    console.error(error);
    hitMessage = `${unconfirmedHit}`;
  }

  return hitMessage;
}
// ensure players token is selected
if (canvas.tokens.controlled.length === 0) {
  ui.notifications.warn("No token selected!");
  return;
}

// Get the token and actor from the selected token
const token = canvas.tokens.controlled[0];
const actor = token?.actor;
if (!actor) {
  ui.notifications.warn("No actor found for the selected token!");
  return;
}

let mightDie = actor.system.attributes.mig.base;

// Define primaryRoll, secondaryRoll, weapon, and shadowStrikeBonusDamage here
let primaryRoll,
  secondaryRoll,
  weapon,
  shadowStrikeRoll,
  shadowStrikeBonusDamage,
  weaponAccuracy,
  weaponPrimary,
  weaponSecondary,
  primaryDie,
  secondaryDie,
  totalAccuracyBonus,
  weaponTypeCapitalized;
let weaponMasteryAccuracy = 0;
let chatMessage           = "";
// find the equipped mainhand weapon
weapon = actor.items.find(
  (i) => i.system.isEquipped && i.system.isEquipped.value && i.system.isEquipped.slot === "mainHand"
);

if (weapon) {
      // start getting stats from the weapon
  weaponAccuracy  = weapon.system.accuracy.value;
  weaponPrimary   = weapon.system.attributes.primary.value;
  weaponSecondary = weapon.system.attributes.secondary.value;

      // start dice for those stats from the player
  primaryDie   = actor.system.attributes[weaponPrimary].base;
  secondaryDie = actor.system.attributes[weaponSecondary].base;

      // check for weapon mastery accuracy bonus
  let weaponType            = weapon.system.type.value;
      weaponTypeCapitalized = weaponType.charAt(0).toUpperCase() + weaponType.slice(1);
  let weaponMasteryType     = actor.items.find((i) => i.name === weaponTypeCapitalized + " Weapon Mastery");
      weaponMasteryAccuracy = weaponMasteryType ? weaponMasteryType.system.level.value : 0;

      // total accuracy bonus
  totalAccuracyBonus = weaponAccuracy + weaponMasteryAccuracy;
}

// ShadowStrike Automation
let shadowStrike = actor.items.find((i) => i.name === SHADOW_STRIKE_ITEM);

if (!shadowStrike) {
  ui.notifications.error(notFound.replace("{item}", SHADOW_STRIKE_ITEM));
  return;
}

if (shadowStrike) {
  let shadowStrikeLevel = shadowStrike.system.level.value;

  new Dialog(
    {
      title  : shadowStrikeTitle,
      content: shadowStrikeContent,
      buttons: {
        roll: {
          label   : rollLabel,
          callback: async () => {
            shadowStrikeRoll = await new Roll("1d" + mightDie).roll();
            game.dice3d?.showForRoll(shadowStrikeRoll);

            // reduce actors hp by the shadowstrike roll
            actor.system.resources.hp.value = Math.max(actor.system.resources.hp.value - shadowStrikeRoll.total, 0);

            shadowStrikeBonusDamage = shadowStrikeRoll.total + shadowStrikeLevel;

            chatMessage += `
            <b><span style = "color:blue;">${shadowStrikeLabel} [SL${shadowStrikeLevel}]</span></b><br/>
            <br/>
            <span style = "color:purple;">+${shadowStrikeBonusDamage} ${game.i18n.localize("FU.Damage")}</span><br/>
            <span style = "color:red;">-${shadowStrikeRoll.total} ${damageTakenLabel}<br/>
            @LOSS[${shadowStrikeRoll.total} hp]</span><br/>
            <br/>
            `;


            // Roll the greatsword attack
            primaryRoll = await new Roll("1d" + primaryDie).roll();
            game.dice3d?.showForRoll(primaryRoll);
            secondaryRoll = await new Roll("1d" + secondaryDie).roll();
            game.dice3d?.showForRoll(secondaryRoll);
            let attackRoll = primaryRoll.total + secondaryRoll.total + totalAccuracyBonus;
            
            chatMessage += `
            <b>${weapon.name}</b><br/>
            Chance to Hit: <br/>
            +${primaryRoll.total} ${weaponPrimary.toUpperCase()}<br/>
            +${secondaryRoll.total} ${weaponSecondary.toUpperCase()}<br/>
            +${weaponAccuracy} ${weaponAccuracyLabel}<br/>
            +${weaponMasteryAccuracy} ${weaponTypeCapitalized} ${weaponMasteryLabel} [SL${weaponMasteryAccuracy}]<br/>
            <br/>
            <span style = "color:green;"><b>${toHitLabel} ${attackRoll}</b><br/></span>
            `;

            chatMessage += checkIfHit(attackRoll);

            createChatMessage(chatMessage, actor);

            new Dialog({
            title  : isHitTitle,
            content: isHitContent,
            buttons: {
                yes: {
                    label   : "Yes",
                    callback: async () => {
                        let totalDamage  = Math.max(primaryRoll.total, secondaryRoll.total) + weapon.system.damage.value + shadowStrikeBonusDamage;
                            chatMessage += `
                        ${damageDoneLabel}: <br/>
                        +${Math.max(primaryRoll.total, secondaryRoll.total)} HR<br/>
                        +${weapon.system.damage.value} ${weaponDamageLabel}<br/>
                        +${shadowStrikeBonusDamage} ${shadowStrikeLabel}<br/>
                        <br/>
                        <span style = "color:green;"><b>${totalDamageLabel}@DMG[${totalDamage} dark]</b></span><br/>
                        `;
                        createChatMessage(chatMessage, actor);
                    },
                },
                yes_bonded: {
                    label   : "Yes, Bonded",
                    callback: async () => {
                            chatMessage += await checkAgony();
                        let totalDamage  = Math.max(primaryRoll.total, secondaryRoll.total) + weapon.system.damage.value + shadowStrikeBonusDamage;
                            chatMessage += `
                        ${damageDoneLabel}: <br/>
                        +${Math.max(primaryRoll.total, secondaryRoll.total)} HR<br/>
                        +${weapon.system.damage.value} ${weaponDamageLabel}<br/>
                        +${shadowStrikeBonusDamage} ${shadowStrikeLabel}<br/>
                        <br/>
                        <span style = "color:green;"><b>${totalDamageLabel}@DMG[${totalDamage} dark]</b></span><br/>
                        `;
                        createChatMessage(chatMessage, actor);
                    },
                },
                no: {
                    label   : "No",
                    callback: async () => {
                        chatMessage = attackMissed;
                        createChatMessage(chatMessage, actor);
                    },
                },
            },
            }, {
            width: 450,
            }).render(true);
          },
        },
      },
    },
    {
      width: 350,
    }
  ).render(true);
}

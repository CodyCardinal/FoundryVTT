  // Constants
  const NO_TOKEN_SELECTED      = "No token selected!";
  const NO_ACTOR_FOUND         = "No actor found for the selected token!";
  const ROLL_FOR_SHADOW_STRIKE = "Roll for Shadow Strike";
  const CHECK_FOR_HIT          = "Check for Hit";
  const CHECK_FOR_AGONY_BOND   = "Check for Agony Bond";
  const MAIN_HAND              = "mainHand";
  const SHADOW_STRIKE          = "Shadow Strike";
  const AGONY                  = "Agony";
  
    // Helper functions
  const rollDice = async (die) => {
    const roll = await new Roll(`1d${die}`).roll();
    game.dice3d?.showForRoll(roll);
    return roll;
  };
  
  const createChatMessage = (content, actorName) => {
    ChatMessage.create({
      content,
      speaker: {
        alias: actorName
      }
    });
  };
  
    // Main code
  if (canvas.tokens.controlled.length === 0) {
    ui.notifications.warn(NO_TOKEN_SELECTED);
    return;
  }
  
  const token = canvas.tokens.controlled[0];
  const actor = token?.actor;
  if (!actor) {
    ui.notifications.warn(NO_ACTOR_FOUND);
    return;
  }
  
  let mightDie = actor.system.attributes.mig.base;
  let primaryRoll, secondaryRoll, weapon, shadowStrikeRoll, shadowStrikeBonusDamage, weaponAccuracy, weaponPrimary, weaponSecondary, primaryDie, secondaryDie, totalAccuracyBonus, weaponTypeCapitalized;
  let weaponMasteryAccuracy = 0;
  
  weapon = actor.items.find(
    (i) => i.system.isEquipped && i.system.isEquipped.value && i.system.isEquipped.slot === MAIN_HAND
  );
  
  if (weapon) {
    ({ accuracy: { value: weaponAccuracy }, attributes: { primary: { value: weaponPrimary }, secondary: { value: weaponSecondary } } } = weapon.system);
    primaryDie   = actor.system.attributes[weaponPrimary].base;
    secondaryDie = actor.system.attributes[weaponSecondary].base;
  
    let weaponType            = weapon.system.type.value;
        weaponTypeCapitalized = weaponType.charAt(0).toUpperCase() + weaponType.slice(1);
    let weaponMasteryType     = actor.items.find((i) => i.name === weaponTypeCapitalized + " Weapon Mastery");
        weaponMasteryAccuracy = weaponMasteryType.system.level.value;
  
    totalAccuracyBonus = weaponAccuracy + weaponMasteryAccuracy;
  }
  
  let shadowStrike = actor.items.find((i) => i.name === SHADOW_STRIKE);
  
  if (shadowStrike) {
    let shadowStrikeLevel = shadowStrike.system.level.value;
  
    new Dialog(
      {
        title  : ROLL_FOR_SHADOW_STRIKE,
        content: `<p>${ROLL_FOR_SHADOW_STRIKE} bonus damage.</p>`,
        buttons: {
          roll: {
            label   : "Roll!",
            callback: async () => {
              shadowStrikeRoll                = await rollDice(mightDie);
              actor.system.resources.hp.value = Math.max(actor.system.resources.hp.value - shadowStrikeRoll.total, 0);
              shadowStrikeBonusDamage         = shadowStrikeRoll.total + shadowStrikeLevel;
  
              createChatMessage(
                `<span style="color:blue;">${SHADOW_STRIKE} (${shadowStrikeLevel})</span><br/>
                <br />
                <span style = "color:purple;">+${shadowStrikeBonusDamage} damage</span><br/>
                <span style = "color:red;">-${shadowStrikeRoll.total} damage taken</span><br/>`,
                actor.name
              );
  
                  primaryRoll   = await rollDice(primaryDie);
                  secondaryRoll = await rollDice(secondaryDie);
              let attackRoll    = primaryRoll.total + secondaryRoll.total + totalAccuracyBonus;
  
              createChatMessage(
                `${weapon.name}<br/>
                +${primaryRoll.total} ${weaponPrimary.toUpperCase()}<br/>
                +${secondaryRoll.total} ${weaponSecondary.toUpperCase()}<br/>
                +${weaponAccuracy} Weapon Accuracy <br />
                +${weaponMasteryAccuracy} ${weaponTypeCapitalized} Weapon Mastery <br/>
                <br />
                <span style="color:green;"><b>Total to HIT: ${attackRoll}</b><br/></span>`,
                actor.name
              );
  
              new Dialog(
                {
                  title  : CHECK_FOR_HIT,
                  content: `<p>${CHECK_FOR_HIT}?</p>`,
                  buttons: {
                    yes: {
                      label   : "Yes",
                      callback: async () => {
                        let agony       = actor.items.find((i) => i.name === AGONY);
                        let agonyDamage = 0;
                        let bonded      = false;
  
                        if (agony) {
                          let agonyLevel = agony.system.level.value;
                          new Dialog(
                            {
                              title  : CHECK_FOR_AGONY_BOND,
                              content: `<p>Is the target a Bond for ${AGONY}?</p>`,
                              buttons: {
                                yes: {
                                  label   : "Yes",
                                  callback: async () => {
                                    bonded                          = true;
                                    agonyDamage                     = agonyLevel * 2;
                                    actor.system.resources.hp.value = Math.min(actor.system.resources.hp.value + agonyDamage, actor.system.resources.hp.max);
                                    actor.system.resources.mp.value = Math.min(actor.system.resources.mp.value + agonyDamage, actor.system.resources.mp.max);
  
                                    let totalDamage = Math.max(primaryRoll.total, secondaryRoll.total) + weapon.system.damage.value + shadowStrikeBonusDamage;
  
                                    createChatMessage(
                                      `<span style="color:purple;">${AGONY} HP/MP Drained : +${agonyDamage}</span><br/>
                                      <br />
                                      <span style="color:green;"><b>Total Dark DMG : ${totalDamage}</b></span><br/>`,
                                      actor.name
                                    );
                                  },
                                },
                                no: {
                                  label   : "No",
                                  callback: async () => {
                                    bonded = false;
  
                                    let totalDamage = Math.max(primaryRoll.total, secondaryRoll.total) + weapon.system.damage.value + shadowStrikeBonusDamage;
  
                                    createChatMessage(
                                      `[HR ${Math.max(primaryRoll.total, secondaryRoll.total)} + ${weapon.system.damage.value}]<br/>
                                      <span style="color:green;">Total [HR + Weapon + SS] DMG : ${totalDamage}</span><br/>`,
                                      actor.name
                                    );
                                  },
                                },
                              },
                            },
                            {
                              width: 250,
                            }
                          ).render(true);
                        }
                      },
                    },
                    no: {
                      label   : "No",
                      callback: async () => {
                        createChatMessage(`The attack missed!<br/>`, actor.name);
                      },
                    },
                  },
                },
                {
                  width: 250,
                }
              ).render(true);
            },
          },
        },
      },
      {
        width: 350,
      }
    ).render(true);
  }
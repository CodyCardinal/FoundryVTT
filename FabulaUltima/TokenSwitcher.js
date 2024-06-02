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

  // Define the image and token paths
const basePath     = "tokenizer/pc-images/";
const normalAvatar = basePath + "ash.AvatarM0lczLcxRvsJHLIf.webp";
const madAvatar    = basePath + "ash_dragon_.Avatar.webp";
const normalToken  = basePath + "ash.TokenM0lczLcxRvsJHLIf.webp";
const madToken     = basePath + "ashDragon.Token9KKxwUAPqBWhUUXS.webp";

  // Ensure the actor's image and the token's image are the same
if (actor.img !== token.document.img) {
    actor.update({ "img": token.document.img });
}

  // Determine the new image and token paths
let newAvatar, newToken;
if (actor.img === normalAvatar) {
    newAvatar = madAvatar;
    newToken  = madToken;
} else {
    newAvatar = normalAvatar;
    newToken  = normalToken;
}

  // Update the actor's image and the prototype token's image
actor.update({ "img": newAvatar, "token.img": newToken });

  // Update the token's image
token.document.update({ img: newToken });
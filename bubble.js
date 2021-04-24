import {level, player} from "./state.js";
import {MobileGameObject} from "./GameObject.js";
import {vec2} from "./gl-matrix-min.js";

const BUBBLE_VELOCITY = 1;
const PLAYER_BUBBLE_SPAWN_PER_SECOND = 1;
const MAX_BUBBLES = 10;

export function updateBubbles(delta) {
    if (Math.random() < delta * PLAYER_BUBBLE_SPAWN_PER_SECOND) {
        let bubble = new MobileGameObject("./Assets/bubble.png", vec2.clone(player.position), vec2.fromValues(0.5, 0.5), "bubble");
        level.addObject(bubble);
        bubble.velocity[1] = BUBBLE_VELOCITY;
        bubble.velocity[0] = Math.random() * 0.2 - 0.1;
        if (Math.abs(bubble.velocity[0]) < 0.05) {
            bubble.velocity[0] = Math.sign(bubble.velocity[0]) * 0.05;
        }
    }
    if (level.objects["bubble"].length > MAX_BUBBLES) {
        level.objects["bubble"].splice(0, level.objects["bubble"].length - MAX_BUBBLES);
    }
    for (let i = 0; i < level.objects["bubble"].length; i++) {
        if (level.objects["bubble"][i].position[1] > 0) {
            level.objects["bubble"].splice(i, 1);
            i--;
        }
    }
}

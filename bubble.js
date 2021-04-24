import {level, player} from "./state.js";
import {MobileGameObject} from "./GameObject.js";
import {vec2} from "./gl-matrix-min.js";

const BUBBLE_VELOCITY = 1;
const PLAYER_BUBBLE_SPAWN_PER_SECOND = 1;

export function updateBubbles(delta) {
    if (Math.random() < delta * PLAYER_BUBBLE_SPAWN_PER_SECOND) {
        let bubble = new MobileGameObject("./Assets/bubble.png", vec2.clone(player.position), vec2.fromValues(0.5, 0.5), "bubble");
        level.addObject(bubble);
        bubble.velocity[1] = BUBBLE_VELOCITY;
    }
}

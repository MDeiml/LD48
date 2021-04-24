import {level, player} from "./state.js";
import {MobileGameObject, GameObject} from "./GameObject.js";
import {vec2} from "./gl-matrix-min.js";

const BUBBLE_VELOCITY = 1;
const PLAYER_BUBBLE_SPAWN_PER_SECOND = 1;
const MAX_BUBBLES = 20;
const NUM_RANDOM_SHIT = 100;
const RANDOM_SHIT_RADIUS = 10;

export function updateBubbles(delta) {
    if (Math.random() < delta * PLAYER_BUBBLE_SPAWN_PER_SECOND) {
        let size = 0.3 + Math.random() * 0.3
        let bubble = new MobileGameObject("./Assets/bubble.png", vec2.scaleAndAdd(vec2.create(), player.position, player.lookDirection, -0.4), vec2.fromValues(0.1, 0.1), "bubble");
        level.addObject(bubble);
        bubble.velocity[1] = BUBBLE_VELOCITY;
        bubble.velocity[0] = Math.random() * 0.2 - 0.1;
        if (Math.abs(bubble.velocity[0]) < 0.05) {
            bubble.velocity[0] = Math.sign(bubble.velocity[0]) * 0.05;
        }
    }
    for (let i = 0; i < level.objects["bubble"].length; i++) {
        if (level.objects["bubble"][i].position[1] > 0) {
            level.objects["bubble"].splice(i, 1);
            i--;
        }
    }
    if (level.objects["bubble"].length > MAX_BUBBLES) {
        level.objects["bubble"].splice(0, level.objects["bubble"].length - MAX_BUBBLES);
    }

    for (let obj of level.objects["random_shit"]) {
        let factor = 1;
        if (obj.timerPeriod != 0) {
            factor = 4 * Math.max(0, Math.sin(obj.timer / obj.timerPeriod * Math.PI)) + 1;
            obj.timer += delta;
            if (obj.timer > obj.timerPeriod) {
                obj.timer -= obj.timerPeriod;
            }
        }
        obj.setPosition(vec2.scaleAndAdd(obj.position, obj.position, obj.velocity, delta * factor));
    }
    for (let i = 0; i < level.objects["random_shit"].length; i++) {
        let obj = level.objects["random_shit"][i];
        let sqDist = vec2.squaredDistance(obj.position, player.position);
        if (sqDist > RANDOM_SHIT_RADIUS * RANDOM_SHIT_RADIUS) {
            level.objects["random_shit"].splice(i, 1);
            i--;
        }
    }
    while (level.objects["random_shit"].length < NUM_RANDOM_SHIT) {
        let pos = vec2.random(vec2.create(), RANDOM_SHIT_RADIUS);
        vec2.add(pos, pos, player.position);
        let isAnimal = Math.random() < 0.1;
        let size = isAnimal ? (Math.random() * 0.3 + 0.1) : (Math.random() * 0.05 + 0.1);
        let obj = new GameObject("./Assets/bubble-alt.png", pos, vec2.fromValues(size, size), "random_shit");
        obj.velocity = vec2.random(vec2.create(), 0.1);
        obj.timerPeriod = isAnimal ? Math.random() * 0.4 + 1.2 : 0;
        obj.timer = Math.random() * obj.timerPeriod;
        level.addObject(obj);
    }
}

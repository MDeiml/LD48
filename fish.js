import {level, player, COLLIDABLE_GRID_SIZE} from "./state.js";
import {GRID_SIZE} from "./walking_squares.js";
import {MAP_WIDTH} from "./generation.js";
import { vec2 } from "./gl-matrix-min.js"
import {AnimatedGameObject} from "./GameObject.js";

const BIG_FISH_SPEED = 3;
const BIG_FISH_ACCEL = 6;

const DEPTHS = [
    { start: 24 * 4, end: 32 * 4, big_fish: "Assets/fish4/anglerfisch_anim.png"}
];

let big_fish;

export function initFish() {
    big_fish = [];
    for (let d = 0; d < DEPTHS.length; d++) {
        let depth = DEPTHS[d];
        for (let i = 0; i < 1000; i++) {
            let pos = vec2.fromValues((Math.random() - 0.5) * MAP_WIDTH * GRID_SIZE, -Math.random() * (depth.end - depth.start) - depth.start);
            vec2.scale(pos, pos, 1/COLLIDABLE_GRID_SIZE);
            vec2.floor(pos, pos);
            if (!level.collidables[pos] || level.collidables[pos].length == 0) {
                vec2.scale(pos, pos, COLLIDABLE_GRID_SIZE);
                let obj = new AnimatedGameObject(depth.big_fish, pos, vec2.fromValues(3, 2), "big_fish", 4);
                obj.depth = d;
                obj.velocity = vec2.fromValues(0, 0);
                big_fish.push(obj);
                level.addObject(obj);
                break;
            }
            if (i == 999) {
                console.log("FAILED");
                big_fish.push(null);
            }
        }
    }
}

export function updateFish(delta) {
    for (let d = 0; d < DEPTHS.length; d++) {
        let depth = DEPTHS[d];
        if (player.position[1] < -depth.start && player.position[1] > -depth.end) {
            let vel = vec2.sub(vec2.create(), player.position, big_fish[d].position);
            vec2.scaleAndAdd(big_fish[d].velocity, big_fish[d].velocity, vel, delta * BIG_FISH_ACCEL);
            let velLength = vec2.length(big_fish[d].velocity);
            vec2.scale(big_fish[d].velocity, big_fish[d].velocity, BIG_FISH_SPEED / velLength);
            big_fish[d].flip = big_fish[d].velocity[0] > 0;
        } else {
            vec2.set(big_fish[d].velocity, 0, 0);
        }
    }
    let angler = big_fish[0];
    level.updateLight(2, [0.3, 1, 0.5], [angler.position[0] - 1.2, angler.position[1] + 0.4],[0, 1], -1.0, 1);
}

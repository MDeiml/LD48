import {level, player, COLLIDABLE_GRID_SIZE} from "./state.js";
import {GRID_SIZE} from "./walking_squares.js";
import {MAP_WIDTH} from "./generation.js";
import { vec2 } from "./gl-matrix-min.js"
import {AnimatedGameObject, GameObject} from "./GameObject.js";
import {pixelToMap} from "./util.js";

const BIG_FISH_SPEED = 3;
const BIG_FISH_ACCEL = 6;
const NUM_FISH = 30;
const FISH_RADIUS = 10;

const DEPTHS = [
    { start: 0, end: 8, big_fish: "Assets/fish1/pussy_anim.png", big_fish_frames: 4, flip_big_fish: true, small_fish: ["Assets/fish1/koi.png", "Assets/fish1/angelfish.png", "Assets/fish1/salmon.png"], small_fish_angle: [110, 0, 0], flip_small_fish: [false, false, false]},
    { start: 8, end: 16, big_fish: "Assets/fish2/shark_anim.png", big_fish_frames: 4, flip_big_fish: true, small_fish: ["Assets/fish2/guppy.png", "Assets/fish2/wels.png", "Assets/fish2/clownfish.png"], small_fish_angle: [0, -20, 0], flip_small_fish: [true, false, false]},
    { start: 24, end: 32, big_fish: "Assets/fish4/anglerfisch_anim.png", big_fish_frames: 4, small_fish: ["Assets/fish1/koi.png"], small_fish_angle: [180], flip_small_fish: [false]}
];

let big_fish;

function spawnFishAtDistance(distance = FISH_RADIUS) {
    let pos = vec2.random(vec2.create(), distance);
    vec2.add(pos, pos, player.position);
    let depth = DEPTHS[0];
    for (let d of DEPTHS) {
        if (pos[1] < -d.start * GRID_SIZE && pos[1] > -d.end * GRID_SIZE) {
            depth = d;
            break;
        }
    }
    let asset_index = Math.floor(Math.random() * depth.small_fish.length)
    let asset = depth.small_fish[asset_index];
    let size = Math.random() * 0.3 + 0.3;
    let obj = new GameObject(asset, pos, vec2.fromValues(size, size), "fish");
    obj.flip = Math.random() > 0.5;
    obj.velocity = vec2.fromValues(Math.random() * 0.1 + 0.05, 0);
    if (!obj.flip) obj.velocity[0] *= -1;
    obj.orientation = depth.small_fish_angle[asset_index] * (obj.flip ? -1 : 1);
    obj.timerPeriod = Math.random() * 0.4 + 1.2;
    obj.timer = Math.random() * obj.timerPeriod;
    obj.flip ^= depth.flip_small_fish[asset_index];
    level.addObject(obj);
}

export function initFish() {
    big_fish = [];
    for (let d = 0; d < DEPTHS.length; d++) {
        let depth = DEPTHS[d];
        for (let i = 0; i < 1000; i++) {
            let pos = vec2.fromValues(Math.floor(Math.random() * MAP_WIDTH), Math.floor(Math.random() * (depth.end - depth.start) + depth.start))
            let index = pos[0] + pos[1] * MAP_WIDTH;
            if (!level.map_data[0][index]) {
                pos = pixelToMap(pos);
                let obj = new AnimatedGameObject(depth.big_fish, pos, vec2.fromValues(3, 2), "big_fish", depth.big_fish_frames);
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

    while (level.objects["fish"].length < NUM_FISH) {
        spawnFishAtDistance(FISH_RADIUS * Math.random() * 2);
    }

}

export function updateFish(delta) {
    for (let obj of level.objects["fish"]) {
        let factor = 4 * Math.max(0, Math.sin(obj.timer / obj.timerPeriod * Math.PI)) + 1;
        obj.timer += delta;
        if (obj.timer > obj.timerPeriod) {
            obj.timer -= obj.timerPeriod;
        }
        obj.setPosition(vec2.scaleAndAdd(obj.position, obj.position, obj.velocity, delta * factor));
    }
    for (let i = 0; i < level.objects["fish"].length; i++) {
        let obj = level.objects["fish"][i];
        let sqDist = vec2.squaredDistance(obj.position, player.position);
        if (obj.position[1] > 0 || sqDist > FISH_RADIUS * FISH_RADIUS) {
            level.objects["fish"].splice(i, 1);
            i--;
        }
    }
    while (level.objects["fish"].length < NUM_FISH) {
        spawnFishAtDistance();
    }

    // BIG FISH
    for (let d = 0; d < DEPTHS.length; d++) {
        let depth = DEPTHS[d];
        if (player.position[1] < -depth.start && player.position[1] > -depth.end) {
            let vel = vec2.sub(vec2.create(), player.position, big_fish[d].position);
            vec2.scaleAndAdd(big_fish[d].velocity, big_fish[d].velocity, vel, delta * BIG_FISH_ACCEL);
            let velLength = vec2.length(big_fish[d].velocity);
            vec2.scale(big_fish[d].velocity, big_fish[d].velocity, BIG_FISH_SPEED / velLength);
            big_fish[d].flip = big_fish[d].velocity[0] > 0;
            big_fish[d].flip ^= depth.flip_big_fish;
        } else {
            vec2.set(big_fish[d].velocity, 0, 0);
        }
    }
    let angler = big_fish[2];
    level.updateLight(2, [1, 0.4, 0.3], [angler.position[0] - (angler.flip ? -1.2 : 1.2), angler.position[1] + 0.4],[0, 1], -1.0, 0.3);
}

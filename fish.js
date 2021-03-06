import {level, player, COLLIDABLE_GRID_SIZE} from "./state.js";
import {GRID_SIZE} from "./walking_squares.js";
import {MAP_WIDTH, MAP_HEIGHT} from "./generation.js";
import { vec2 } from "./gl-matrix-min.js"
import {AnimatedGameObject, GameObject} from "./GameObject.js";
import {pixelToMap, mapToPixel} from "./util.js";
import {isInMap} from "./util.js"

const NUM_FISH = 30;
const FISH_RADIUS = 10;
const SHARK_COOLDOWN = 10;

let SmallFish = function(name, frames = 1, angle = 0, flip = false) {
    this.frames = frames
    this.name = name
    this.angle = angle
    this.flip = flip
}

const DEPTHS = [
    {
        start: 0,
        end: 20,
        big_fish: "Assets/fish1/pussy_anim.png",
        big_fish_frames: 4,
        big_fish_speed: 3,
        big_fish_accel: 12,
        big_fish_audio: new Audio("Assets/audio/ocotpus.wav"),
        flip_big_fish: true,
        small_fish: [
            new SmallFish("Assets/fish1/koi_anim.png", 4, 110),
            new SmallFish("Assets/fish1/angelfish.png"),
            new SmallFish("Assets/fish1/salmon.png")
        ]
    },
    {
        start: 20,
        end: 40,
        big_fish_speed: 10,
        big_fish_accel: 12,
        big_fish: "Assets/fish2/shark_anim.png",
        big_fish_audio: new Audio("Assets/audio/shark_charge.wav"),
        big_fish_frames: 4,
        flip_big_fish: true,
        small_fish: [
            new SmallFish("Assets/fish2/guppy.png", 1, 0, true),
            new SmallFish("Assets/fish2/wels.png", 1, -20),
            new SmallFish("Assets/fish2/clownfish.png", 1, -20)
        ]
    },
    {
        start: 40,
        end: 70,
        big_fish_speed: 5,
        big_fish_accel: 8,
        big_fish: "Assets/fish4/anglerfisch_anim.png",
        big_fish_frames: 4,
        small_fish: [
            new SmallFish("Assets/fish3/pirania.png"),
            new SmallFish("Assets/fish3/eel_anim.png", 5),
            new SmallFish("Assets/fish3/blobfish.png")
        ]
    }
];

let big_fish;

function spawnFishAtDistance(distance = FISH_RADIUS) {
    let pos = vec2.random(vec2.create(), distance);
    vec2.add(pos, pos, player.position);

    if (!isInMap(pos))
        return false

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
    let obj = null;
    if (asset.frames == 1)
        obj = new GameObject(asset.name, pos, vec2.fromValues(size, size), "fish");
    else
        obj = new AnimatedGameObject(asset.name, pos, vec2.fromValues(size, size), "fish", asset.frames);
    obj.flip = Math.random() > 0.5;
    obj.velocity = vec2.fromValues(Math.random() * 0.1 + 0.05, 0);
    if (!obj.flip) obj.velocity[0] *= -1;
    obj.orientation = asset.angle * (obj.flip ? -1 : 1);
    obj.timerPeriod = Math.random() * 0.4 + 1.2;
    obj.timer = Math.random() * obj.timerPeriod;
    obj.flip ^= asset.flip;
    level.addObject(obj);

    return true
}

export function initFish() {
    big_fish = [];
    DEPTHS[0].big_fish_audio.volume = 0.8;
    for (let d = 0; d < DEPTHS.length; d++) {
        let depth = DEPTHS[d];
        for (let i = 0; i < 1000; i++) {
            let pos = vec2.fromValues(Math.floor(Math.random() * MAP_WIDTH), Math.floor(Math.random() * (depth.end - depth.start) + depth.start))
            let index = pos[0] + pos[1] * MAP_WIDTH;
            if (!level.map_data[0][index]) {
                pos = pixelToMap(pos);
                let obj = new AnimatedGameObject(depth.big_fish, pos, vec2.fromValues(3, 2), "big_fish", depth.big_fish_frames);
                obj.depth = d;
                obj.audioTimer = 0;
                obj.hurtTimer = 0;
                if (d == 1) {
                    obj.cooldown = 0;
                    obj.isLeft = Math.random() * 0.5;
                }
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
        if (!spawnFishAtDistance(FISH_RADIUS * Math.random() * 2))
            break
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
    let clearArr = []
    for (let i = 0; i < level.objects["fish"].length; i++) {
        let obj = level.objects["fish"][i];
        let sqDist = vec2.squaredDistance(obj.position, player.position);
        if (obj.position[1] > 0 || sqDist > FISH_RADIUS * FISH_RADIUS || obj.position[0] < -(MAP_WIDTH + 1)/2 * GRID_SIZE || obj.position[0] > (MAP_WIDTH - 1)/2 * GRID_SIZE) {
            clearArr.push(i)
        }
    }
    for (let pos of clearArr.reverse()) {
        level.objects["fish"].splice(pos, 1);
    }
    while (level.objects["fish"].length < NUM_FISH) {
        if (!spawnFishAtDistance())
            break
    }

    big_fish[1].cooldown = Math.max(0, big_fish[1].cooldown - delta);

    // BIG FISH
    if (player.position[0] > -MAP_WIDTH/2 * GRID_SIZE - 1) {
        for (let d = 0; d < DEPTHS.length; d++) {
            big_fish[d].audioTimer -= delta;
            if (big_fish[d].audioTimer < 0) big_fish[d].audioTimer = 0;
            big_fish[d].hurtTimer -= delta;
            if (big_fish[d].hurtTimer < 0) big_fish[d].hurtTimer = 0;
            let depth = DEPTHS[d];
            let hunting = player.position[1] < -depth.start * GRID_SIZE && player.position[1] > -depth.end * GRID_SIZE;
            hunting &= player.breath > 0;
            if (hunting) {
                // HUNTING
                let preferred_range = 0;
                if (d == 0) {
                    if (player.position[1] > -2 * GRID_SIZE) { // octopus leaves player alone at start
                        preferred_range = 12;
                    } else if (player.position[1] > -5 * GRID_SIZE) { // gets closer later
                        preferred_range = 5;
                    }
                } else if (d == 2) {
                    preferred_range = 8 - 6 * Math.min(1, 1 * -player.position[1] / MAP_HEIGHT * 2 / GRID_SIZE); // angler hunts, never reaches the player but comes closer as he goes deeper
                }
                if (big_fish[d].hurtTimer > 0) {
                    preferred_range = Math.max(preferred_range, 5);
                }
                let accel = vec2.sub(vec2.create(), player.position, big_fish[d].position);
                let accelLength = vec2.length(accel);
                if (accelLength < 1 && big_fish[d].hurtTimer <= 0) {
                    player.hurt();
                    big_fish[d].hurtTimer = 20;
                }
                if (accelLength <= 4 && big_fish[d].audioTimer <= 0) {
                    if (depth.big_fish_audio) depth.big_fish_audio.play();
                    big_fish[d].audioTimer = 5;
                }
                if (accelLength - preferred_range > 25 && d != 1) {
                    // TELEPORT FISH
                    for (let i = 0; i < 100; i++) {
                        let pos = vec2.random(vec2.create(), 20);
                        if ((pos[0] > 0) ^ (player.lookDirection[0] > 0))
                            pos[0] = -pos[0]
                        if ((pos[1] > 0) ^ (player.lookDirection[1] > 0))
                            pos[1] = -pos[1]
                        vec2.add(pos, pos, player.position);
                        if (pos[1] > 0) continue;
                        pos = mapToPixel(pos);
                        vec2.floor(pos, pos);
                        if (pos[0] < 0 || pos[0] >= MAP_WIDTH) continue;
                        let index = pos[0] + pos[1] * MAP_WIDTH;
                        if (!level.map_data[0][index]) {
                            big_fish[d].setPosition(pixelToMap(pos));
                            break
                        }
                    }
                }
                if (d == 0) {
                    if (accelLength != 0) {
                        vec2.scale(accel, accel, Math.max(-1, Math.min(1, accelLength - preferred_range)) / accelLength);
                    }
                    vec2.scaleAndAdd(big_fish[d].velocity, big_fish[d].velocity, accel, delta * depth.big_fish_accel);
                    let velLength = vec2.length(big_fish[d].velocity);
                    vec2.scale(big_fish[d].velocity, big_fish[d].velocity, depth.big_fish_speed / velLength);
                } else if (d == 1) {
                    if (big_fish[d].cooldown <= 0 && big_fish[d].hurtTimer <= 0) {
                        let pos = mapToPixel(player.position);
                        vec2.round(pos, pos);
                        let success = true;
                        for (let x = pos[0] - 2; x <= pos[0] + 2; x++) {
                            success &= !level.map_data[0][x + MAP_WIDTH * pos[1]];
                        }
                        if (success) {
                            pos[0] += big_fish[d].isLeft ? -2 : 2;
                            big_fish[d].setPosition(pixelToMap(pos));
                            vec2.set(big_fish[d].velocity, big_fish[d].isLeft ? depth.big_fish_speed : -depth.big_fish_speed, 0); //scale up and down with position on screen
                            big_fish[d].isLeft = !big_fish[d].isLeft;
                            big_fish[d].cooldown = SHARK_COOLDOWN;
                        } else {
                            big_fish[d].setPosition(vec2.fromValues(0, 100));
                            vec2.set(big_fish[d].velocity, 0, 0);
                        }
                    }
                    if (big_fish[d].cooldown >= 0) {
                        // isLeft is inverted here
                        if (
                            (!big_fish[d].isLeft && big_fish[d].position[0] > player.position[0] - 5 && big_fish[d].position[0] < player.position[0] - 4) ||
                            (big_fish[d].isLeft && big_fish[d].position[0] < player.position[0] + 5 && big_fish[d].position[0] > player.position[0] + 4)) {
                            vec2.set(big_fish[d].velocity, !big_fish[d].isLeft ? depth.big_fish_speed / 4 : -depth.big_fish_speed / 4, 0); //scale up and down with position on screen
                        } else {
                            vec2.set(big_fish[d].velocity, !big_fish[d].isLeft ? depth.big_fish_speed : -depth.big_fish_speed, 0); //scale up and down with position on screen
                        }
                    }
                }
                else if (d == 2) { //needs to be behind the player likely
                    let lastRope = null
                    if (player.rope.points.length > 3)
                        lastRope = player.rope.points[player.rope.points.length - 3]
                    else
                        lastRope = vec2.sub(vec2.create(), player.position, vec2.scale(player.lookDirection, -preferred_range))
                    let accel = vec2.sub(vec2.create(), lastRope, big_fish[d].position);
                    let accelLength = vec2.length(accel);
                    if (accelLength != 0) {
                        vec2.scale(accel, accel, Math.max(0, Math.min(1, accelLength - preferred_range)) / (accelLength * accelLength));
                    }
                    else {
                        accel = vec2.random(accel)
                        accelLength = 1;
                    }
                    vec2.scaleAndAdd(big_fish[d].velocity, big_fish[d].velocity, accel, delta * depth.big_fish_accel);
                    let velLength = vec2.length(big_fish[d].velocity);
                    vec2.scale(big_fish[d].velocity, big_fish[d].velocity, depth.big_fish_speed / velLength);
                }

                big_fish[d].flip = big_fish[d].velocity[0] > 0;
                big_fish[d].flip ^= depth.flip_big_fish;
            } else {
                // WANDER
                big_fish[d].velocity = vec2.random(big_fish[d].velocity)
                //vec2.set(big_fish[d].velocity, 0, 0);
            }
        }
    }
    let angler = big_fish[2];
    level.updateLight(2, [1, 0.4, 0.3], [angler.position[0] - (angler.flip ? -1.2 : 1.2), angler.position[1] + 0.4],[0, 1], -1.0, 0.3);
}

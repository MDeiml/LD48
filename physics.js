import {level, COLLIDABLE_GRID_SIZE} from "./state.js";
import {MobileGameObject, CollidableGameObject} from "./GameObject.js";
import {vec2} from "./gl-matrix-min.js";

export function updatePhysics(delta) {
    for (let obj of level.objects["player"]) {
        handlePhysics(delta, obj);
    }
    for (let obj of level.objects["bubble"]) {
        handlePhysics(delta, obj);
    }
}

function handlePhysics(delta, obj) {
    let pos = vec2.scaleAndAdd(vec2.create(), obj.getPosition(), obj.velocity, delta);
    let pmin = vec2.sub(vec2.create(), obj.position, obj.halfSize);
    vec2.scale(pmin, pmin, 1/COLLIDABLE_GRID_SIZE);
    vec2.round(pmin, pmin);
    let pmax = vec2.add(vec2.create(), obj.position, obj.halfSize);
    vec2.scale(pmax, pmax, 1/COLLIDABLE_GRID_SIZE);
    vec2.round(pmax, pmax);
    obj.setPosition(pos);
    for (let x = pmin[0]; x <= pmax[0]; x++) {
        for (let y = pmin[1]; y <= pmax[1]; y++) {
            if (level.collidables[vec2.fromValues(x, y)] == undefined) continue;
            for (let other of level.collidables[vec2.fromValues(x, y)]) {
                for (let line of other.shape) {
                    let intersection = intersectLineCircle(line[0], line[1], vec2.sub(vec2.create(), pos, other.getPosition()), 0.5)
                    if (intersection) {
                        other.onCollide(intersection, obj);
                    }
                }
            }
        }
    }
}

function intersectLineCircle(a, b, m, r) {
    let dir = vec2.sub(vec2.create(), b, a);
    let squaredLength = vec2.squaredLength(dir);
    let f = vec2.sub(vec2.create(), m, a);
    let t = vec2.dot(dir, f);
    t /= squaredLength;
    // t = 0 => projects onto a, t = 1 => projects onto b
    if (t < 0) {
        // f = m - a
    } else if (t > 1) {
        vec2.sub(f, m, b);
    } else {
        vec2.scaleAndAdd(f, a, dir, t);
        vec2.sub(f, m, f);
    }
    let squaredLengthF = vec2.squaredLength(f);
    if (squaredLengthF < r*r) {
        if (squaredLengthF == 0) {
            return vec2.fromValues(0, r);
        }
        vec2.scale(f, f, r / Math.sqrt(squaredLengthF) - 1);
        return f;
    }
    return false;
}


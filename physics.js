import {level} from "./state.js";
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
    let pos = vec2.clone(obj.velocity);
    vec2.scale(pos, pos, delta);
    vec2.add(pos, pos, obj.position);
    for (let other of level.objects["collidable"]) {
        for (let line of other.shape)
        {
            let intersection = intersectLineCircle(line[0], line[1], vec2.sub(vec2.create(), pos, other.position), 0.5)
            if (intersection) {
                vec2.add(pos, pos, intersection);
            }
        }
    }
    obj.setPosition(pos);
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


import {level} from "./state.js";
import {MobileGameObject} from "./GameObject.js";
import {vec2} from "./gl-matrix-min.js";

export function updatePhysics(delta) {
    for (let obj of level.objects) {
        if (obj instanceof MobileGameObject) {
            let pos = vec2.clone(obj.velocity);
            vec2.scale(pos, pos, delta);
            vec2.add(pos, pos, obj.position);
            obj.setPosition(pos);
        }
    }
}


import {CollidableGameObject, AnimatedGameObject, GameObject, Transformation} from "./GameObject.js"
import {vec2, vec3, mat4, quat} from "./gl-matrix-min.js"



let Bubble = function(parent) {
    CollidableGameObject.call(this, "./Assets/luftblase_koralle.png", vec2.fromValues(0, 0), vec2.fromValues(1, 1), "breath_point");
    this.sprite.parent = parent
}
Bubble.prototype = Object.create(CollidableGameObject.prototype);
Object.defineProperty(Bubble.prototype, 'constructor', {
    value: Bubble,
    enumerable: false, // so that it does not appear in 'for in' loop
    writable: true });
Bubble.prototype.onCollide = function(intersection, other) {
    //TODO collect oxygen
}

        
export let Coral = function(position, size) {
    AnimatedGameObject.call(this,"./Assets/animationen/koralle_anim.png",
        position,
        vec2.fromValues(size, size),
        "plant",
        2,
        50 + Math.floor(Math.random(30))
    )
    this.bubble = new Bubble(this.sprite)
}
Coral.prototype = Object.create(AnimatedGameObject.prototype);
Object.defineProperty(Coral.prototype, 'constructor', {
    value: Coral,
    enumerable: false, // so that it does not appear in 'for in' loop
    writable: true });

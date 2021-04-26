import {CollidableGameObject, AnimatedGameObject, GameObject, Transformation} from "./GameObject.js"
import {vec2} from "./gl-matrix-min.js"
import {level, player, updateRegistry} from "./state.js"
import {PositionalAudio} from "./audio.js"


export let Bubble = function(parent, size) {
    let p1 = vec2.fromValues(-size, -size);
    let p2 = vec2.fromValues(0, -size);
    let p3 = vec2.fromValues(-size, 0);
    let p4 = vec2.fromValues(0, 0);
    CollidableGameObject.call(this, "./Assets/luftblase_koralle.png", vec2.fromValues(0, 0), vec2.fromValues(2, 2), [[p1, p2], [p1, p3], [p2, p4], [p3, p4]], parent);
    this.par = parent
    this.type = "bubbles";
    this.collected = false;
}
Bubble.prototype = Object.create(CollidableGameObject.prototype);
Object.defineProperty(Bubble.prototype, 'constructor', {
    value: Bubble,
    enumerable: false, // so that it does not appear in 'for in' loop
    writable: true });
Bubble.COLLECT_SOUND = new PositionalAudio(vec2.fromValues(0,0), "Assets/audio/zisch_v3.wav", false)
Bubble.prototype.cleanup = function() {
    updateRegistry.unregisterUpdate(this.update_name);
}
Bubble.prototype.collect = function() {
    if (this.collected || player.breath <= 0)
        return
    player.breath += 10 //add function to clamp it to 100
    this.collected = true;
    Bubble.COLLECT_SOUND.moveTo(this.getPosition())
    Bubble.COLLECT_SOUND.play()
    this.update_name = "bubble_deletion_" + Math.random();
    updateRegistry.registerUpdate(this.update_name, this.par.clearBubble.bind(this.par));
}


export let Coral = function(position, size) {
    AnimatedGameObject.call(this, "./Assets/animationen/koralle_anim.png",
        position,
        vec2.fromValues(size, size),
        "plant-coral",
        2,
        50 + Math.floor(Math.random(30))
    );
    this.bubble = new Bubble(this, size);
    level.addObject(this.bubble);
}
Coral.prototype = Object.create(AnimatedGameObject.prototype);
Object.defineProperty(Coral.prototype, 'constructor', {
    value: Coral,
    enumerable: false, // so that it does not appear in 'for in' loop
    writable: true });
Coral.prototype.clearBubble = function() {
    if (!this.bubble)
        return
    this.bubble.cleanup();
    level.removeObject(this.bubble);
    delete this.bubble;
}

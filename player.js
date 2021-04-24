import {MobileGameObject} from "./GameObject.js"
import {Sprite} from "./Sprite.js"
import {mat4, vec2, vec3, quat} from "./gl-matrix-min.js"
import {swimmingLeft, swimmingRight, swimmingUp, swimmingDown} from "./input.js"
import {level, updateRegistry} from "./state.js"
import {PositionalAudio, walk_wood} from "./audio.js"

const PLAYER_SPEED = 2.5;
const JUMP_SPEED = 13; // 6.75
const FRAME_TIME = 1000/60;

export let Player = function() {
    MobileGameObject.call(this, "./Assets/Unterwasser Hintergrund.jpg", vec2.fromValues( 0, 0), vec2.fromValues(1, 3), "player", vec2.fromValues(3.5, 3.5 / 3), vec2.fromValues(0, -0.1));

    // this.sprite.texture.frames = 5;

    updateRegistry.registerUpdate("player_input", this.handleInput.bind(this));
}
Player.prototype = Object.create(MobileGameObject.prototype);
Object.defineProperty(Player.prototype, 'constructor', {
    value: Player,
    enumerable: false, // so that it does not appear in 'for in' loop
    writable: true });

Player.prototype.isPlayer = function(){return true;}
// Player.prototype.setInteraction = function(isactive) {this.canInteract = isactive }
Player.prototype.handleInput = function() {
    let vel = vec2.fromValues(0, 0);

    //handle movement
    if (swimmingLeft()) {
		vel[0] -= PLAYER_SPEED;
    }
    if (swimmingRight()) {
        vel[0] += PLAYER_SPEED;
    }
    if (swimmingUp()) {
		vel[1] += PLAYER_SPEED;
    }
    if (swimmingDown()) {
        vel[1] -= PLAYER_SPEED;
    }
    vec2.copy(this.velocity, vel);
}

Player.prototype.updatePlayerAnimation = function() {
}



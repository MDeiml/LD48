import {MobileGameObject} from "./GameObject.js"
import {Sprite} from "./Sprite.js"
import {mat4, vec2, vec3, quat} from "./gl-matrix-min.js"
import {swimmingLeft, swimmingRight, swimmingUp, swimmingDown, swimmingAccelerate, swimmingDecelerate} from "./input.js"
import {level, updateRegistry} from "./state.js"
import {PositionalAudio, walk_wood} from "./audio.js"

var PLAYER_SPEED = 2.5;
const JUMP_SPEED = 13; // 6.75
const FRAME_TIME = 1000/60;
var FrameCounter = 0;
const MAX_BREATH = 100;

export let Player = function() {
    MobileGameObject.call(this, "./Assets/animationen/taucher-animation.png", vec2.fromValues( 0, 0), vec2.fromValues(1, 1), "player", vec2.fromValues(1, 1), vec2.fromValues(0, 0));

    this.sprite.texture.frames = 4;

    updateRegistry.registerUpdate("player_input", this.handleInput.bind(this));
    updateRegistry.registerUpdate("player_anim", this.updatePlayerAnimation.bind(this));
    updateRegistry.registerUpdate("player_breath", this.updateBreathing.bind(this));
    
    
    
    this.breath = MAX_BREATH
}
Player.prototype = Object.create(MobileGameObject.prototype);
Object.defineProperty(Player.prototype, 'constructor', {
    value: Player,
    enumerable: false, // so that it does not appear in 'for in' loop
    writable: true });

Player.prototype.isPlayer = function(){return true;}
// Player.prototype.setInteraction = function(isactive) {this.canInteract = isactive }
Player.prototype.handleInput = function() {
    if (this.breath == 0) {
        vec2.copy(this.velocity, vec2.fromValues(0, 0));
        return
    }
    
    let vel = vec2.fromValues(0, 0);
	//handle player Speed
	if (swimmingAccelerate()) {
	PLAYER_SPEED =PLAYER_SPEED *1.02;
	}
	if (swimmingDecelerate()) {
	PLAYER_SPEED =2.5;
	}
	
    vec2.copy(this.velocity, vel);
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
    level.updateLight(0, [0.6, 0.3, 0.3], [this.position[0], this.position[1]],[0, 1], 0.7, 1);
}

Player.prototype.updateBreathing = function() {
    
    if (this.breath == 0)
        return
    
    if (this.position[1] > 0) //above water
    {
        this.breath = this.breath + 1
    }
    else {
        this.breath = this.breath - (1/60)
    }
    this.breath = Math.min(Math.max(this.breath, 0), MAX_BREATH);
    if (this.breath == 0)
    {
        //handle death
        console.log("YOU DIED.")
    }
}

Player.prototype.updatePlayerAnimation = function() {
    if (this.breath == 0)
        return
	FrameCounter++;
	if (FrameCounter >=20){
        this.sprite.texture.nextFrame();
        FrameCounter = 0;
	}
}



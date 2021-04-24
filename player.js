import {MobileGameObject, Orientation} from "./GameObject.js"
import {Sprite} from "./Sprite.js"
import {mat4, vec2, vec3, quat} from "./gl-matrix-min.js"
import {walkingLeft, walkingRight, jumping, pickingUp, holdingJump} from "./input.js"
import {level} from "./state.js"
import {PositionalAudio, walk_wood} from "./audio.js"

const PLAYER_SPEED = 2.5;
const JUMP_SPEED = 13; // 6.75
const FRAME_TIME = 1000/60;

export let Player = function() {
    MobileGameObject.call(this, "./assets/walk_circle_halved.png", vec2.fromValues( 0, 0), vec2.fromValues(1, 3), "player", vec2.fromValues(3.5, 3.5 / 3), vec2.fromValues(0, -0.1));

    this.sprite.texture.frames = 5;
	let transMat = mat4.create()
	mat4.fromRotationTranslationScale(transMat, quat.create(), vec3.fromValues(0, 1, 0), vec3.fromValues(3/4, 3/4, 1))
	this.eyeSprite = new Sprite("./assets/eye_halved.png", transMat, this.sprite)
	this.eyeSprite.texture.frames = 5;


    this.frameCntr = 0
    this.framePos = 0
    this.eyeFrameCntr = 0
    this.eyeFramePos = 0
    this.walking = false
	this.canInteract = false

}
Player.prototype = Object.create(MobileGameObject.prototype);
Object.defineProperty(Player.prototype, 'constructor', {
    value: Player,
    enumerable: false, // so that it does not appear in 'for in' loop
    writable: true });

Player.prototype.isPlayer = function(){return true;}
Player.prototype.setInteraction = function(isactive) {this.canInteract = isactive }
Player.prototype.handleInput = function() {
    let velx = 0;

    //handle movement
    if (walkingLeft()) {
		velx -= PLAYER_SPEED;
    }
    if (walkingRight()) {
        velx += PLAYER_SPEED;
    }
    if (level.upsideDown) {
        velx = -velx;
    }
    if (velx > 0) {
		this.orientation = Orientation.DEFAULT;
    } else if (velx < 0) {
		this.orientation = Orientation.MIRRORED;
    }
    if (this.onGround && jumping()) {
        this.velocity[1] = JUMP_SPEED;
    }
    if (!holdingJump()) {
        this.velocity[1] = Math.min(0, this.velocity[1]);
    }
    this.velocity[0] = velx;
}

Player.prototype.updatePlayerAnimation = function() {
	if (this.onGround) {
		this.frameCntr += 1;
        if ((this.frameCntr % 15) === 0) {
            this.frameCntr = 0;
            if (vec2.length(this.velocity) > 0)
            {
                this.framePos += 1;
                if ((this.framePos % 4) === 0)
                    this.framePos = 0;
                this.sprite.texture.setFrame(this.framePos);
            }
            else
                this.sprite.texture.setFrame(4)
        }
    }

	if (this.canInteract) {
		this.eyeFrameCntr += 1;
		if ((this.eyeFrameCntr % 8) === 0 && this.eyeFramePos < 4) {
			this.eyeFrameCntr = 0;
			this.eyeFramePos += 1;
			this.eyeSprite.texture.setFrame(this.eyeFramePos);
		}
	}
	else {
		this.eyeFramePos = 0;
		this.eyeFrameCntr = 0;
	}

    let walking = this.onGround && this.velocity[0] != 0;

    if (walking && walk_wood.paused) {
        walk_wood.play();
    }
    if (!walking && !walk_wood.paused) {
        walk_wood.pause();
    }

}



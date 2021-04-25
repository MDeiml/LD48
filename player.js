import {MobileGameObject, GameObject} from "./GameObject.js"
import {Sprite} from "./Sprite.js"
import {mat4, vec2, vec3, quat} from "./gl-matrix-min.js"
import {swimmingLeft, swimmingRight, swimmingUp, swimmingDown, swimmingAccelerate} from "./input.js"
import {level, updateRegistry} from "./state.js"
import {heartbeat} from "./util.js"
import {Rope, cutRopes} from "./rope.js";
import {updateView, setFlicker} from "./render.js";

const PLAYER_SPEED = 2.5;
const FRAME_TIME = 1000/60;
const BREATH_RATE = 4.33;
var FrameCounter = 0;
export const MAX_BREATH = 30;
export var Death = false;

export let Player = function() {
    MobileGameObject.call(this, "./Assets/animationen/taucher-animation.png", vec2.fromValues( 0, 0), vec2.fromValues(1, 1), "player", null, vec2.fromValues(1, 1), vec2.fromValues(0, 0));

    this.sprite.texture.frames = 4;

    updateRegistry.registerUpdate("player_input", this.handleInput.bind(this));
    updateRegistry.registerUpdate("player_anim", this.updatePlayerAnimation.bind(this));
    updateRegistry.registerUpdate("player_breath", this.updateBreathing.bind(this));



    this.breath = MAX_BREATH;
    this.effect_strength = 0;
    this.rate = 0

    this.rope = new Rope("./Assets/rope.png");
    this.rope.addPoint(vec2.clone(this.position));
    this.rope.addPoint(vec2.clone(this.position));
    this.lookDirection = vec2.fromValues(-1, 0);
    this.flickerTimer = -2;
    this.breathTimer = 0;
	this.breatheOutSounds = [
        new Audio("./Assets/audio/blubbles_breath1.wav"),
        new Audio("./Assets/audio/blubbles_breath2.wav"),
        new Audio("./Assets/audio/blubbles_breath3.wav")
    ];
    for (let sound of this.breatheOutSounds) {
        sound.volume = 0.5;
    }
	this.breatheInSounds = [
        new Audio("./Assets/audio/breath1.wav"),
        new Audio("./Assets/audio/breath2.wav"),
        new Audio("./Assets/audio/breath3.wav")
    ];
}
Player.prototype = Object.create(MobileGameObject.prototype);
Object.defineProperty(Player.prototype, 'constructor', {
    value: Player,
    enumerable: false, // so that it does not appear in 'for in' loop
    writable: true });

Player.prototype.isPlayer = function(){return true;}
// Player.prototype.setInteraction = function(isactive) {this.canInteract = isactive }

Player.prototype.handleInput = function(delta) {
	//TOD???

    let ropeDir = vec2.sub(vec2.create(), this.position, this.rope.points[this.rope.points.length - 2]);
    let ropeDirLength = vec2.length(ropeDir);
    if (ropeDirLength > 1) {
        let nextRopePoint = vec2.scaleAndAdd(ropeDir, this.rope.points[this.rope.points.length - 2], ropeDir, 1 / ropeDirLength);
        this.rope.addPoint(nextRopePoint);
    } else {
        let nextRopePoint = vec2.add(ropeDir, this.rope.points[this.rope.points.length - 2], ropeDir);
        this.rope.points[this.rope.points.length - 1] = nextRopePoint;
        this.rope.updateSegment(this.rope.points.length - 2);
    }

    if (this.breath <= 0) {
        vec2.copy(this.velocity, vec2.fromValues(0, -0.2));
        this.flip = true;
        this.orientation = 135;
        level.updateLight(0, [0.3, 0.8, 0.5], [this.position[0], this.position[1]],[0, 1], -1.0, 0);
        level.updateLight(1, [0.6, 0.3, 0.3], vec2.scaleAndAdd(vec2.create(), this.position, this.lookDirection, -0.4), this.lookDirection, 0.7, 0);
        return
    }

    let vel = vec2.fromValues(0, 0);
    //handle player Speed
    let speed = swimmingAccelerate() ? PLAYER_SPEED * 2 : PLAYER_SPEED;

    //handle movement
    if (swimmingLeft()) {
        vel[0] -= speed;
    }
    if (swimmingRight()) {
        vel[0] += speed;
    }
    if (swimmingUp()) {
        vel[1] += speed;
    }
    if (swimmingDown()) {
        vel[1] -= speed;
    }

    if (level.upsideDown) {
        vel[0] *= -1;
        vel[1] *= -1;
    }

    if (vel[0] == 0 && vel[1] == 0) {
        vec2.scale(this.velocity, this.velocity, Math.pow(0.1, delta));
    }

    vec2.scaleAndAdd(this.velocity, this.velocity, vel, delta * 2);
    this.velocity[1] = Math.min(this.velocity[1], -this.position[1] * 2);
    let velLength = vec2.length(this.velocity);
    if (velLength > speed) {
        vec2.scale(this.velocity, this.velocity, speed / velLength);
        velLength = speed;
    }
    if (velLength > 0.01) {
        this.orientation = 90-Math.atan2(this.velocity[0], this.velocity[1]) / Math.PI * 180;
        if (((this.orientation > 90) && (this.orientation < 270)) ^ level.upsideDown)
        {
            this.orientation = (180 + this.orientation) % 360
            this.flip = true
        }
        else
        {
            this.flip = false
        }
        vec2.scale(this.lookDirection, this.velocity, -1 / velLength);
    }

    if (vec2.squaredDistance(this.position, level.objects["target"][0].position) < 2 * 2 && !level.upsideDown && this.flickerTimer <= -2) {
        this.flickerTimer = 2;
    }

    this.flickerTimer -= delta;
    if (this.flickerTimer < 0 && this.flickerTimer + delta >= 0) {
        this.velocity[0] *= -0.1;
        updateView();
        level.upsideDown = true;
        cutRopes();
    }
    let flicker = 1;
    if (this.flickerTimer <= -2) {
        this.flickerTimer = -2;
    } else {
        flicker = Math.sin(Math.pow(Math.abs(this.flickerTimer), 0.5) * 20)
    }
    setFlicker(flicker);

    //stupid pointlight
    this.rate += delta * 2
    if (this.rate > 4)
        this.rate -= 4
    level.updateLight(0, [0.3, 0.8, 0.5], [this.position[0], this.position[1]],[0, 1], -1.0,  (2  - this.effect_strength * heartbeat(this.rate)) / 3 * flicker);
    level.updateLight(1, [0.6, 0.3, 0.3], vec2.scaleAndAdd(vec2.create(), this.position, this.lookDirection, -0.4), this.lookDirection, 0.7, this.position[1] - this.lookDirection[1] > -1.5 ? 0 : 3 * flicker);

    this.breathTimer += delta;
    if (this.breathTimer >= BREATH_RATE) {
        this.breathTimer -= BREATH_RATE;
        this.breatheOutSounds[Math.floor(Math.random() * this.breatheOutSounds.length)].play();
    }
    if (this.breathTimer >= 2.33 && this.breathTimer - delta < 2.33) {
        this.breatheInSounds[Math.floor(Math.random() * this.breatheInSounds.length)].play();
    }
}

Player.prototype.updateBreathing = function(delta) {

    if (this.breath == 0)
        return

    if (this.position[1] > -0.2) //above water
    {
        this.breath = this.breath + delta * MAX_BREATH;
    }
    else {
        this.breath = this.breath - delta * (swimmingAccelerate() ? 2 : 1);
    }
    this.breath = Math.min(Math.max(this.breath, 0), MAX_BREATH);

    this.effect_strength = 1 - (this.breath / 100);

    if (this.breath == 0)
    {
        Death = true;
        console.log("YOU DIED.");
        new Audio("./Assets/audio/death_short.wav").play();
    }
}

Player.prototype.updatePlayerAnimation = function() {
    if (this.breath == 0)
        return
    if (swimmingDown() || swimmingUp() || swimmingRight() || swimmingLeft()) {
        FrameCounter++;
    } else {
        this.sprite.texture.setFrame(1);
    }
	if (FrameCounter >=20){
        this.sprite.texture.nextFrame();
        FrameCounter = 0;
	}
}



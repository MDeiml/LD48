import {MobileGameObject, AnimatedGameObject, GameObject} from "./GameObject.js"
import {Sprite} from "./Sprite.js"
import {mat4, vec2, vec3, vec4, quat} from "./gl-matrix-min.js"
import {swimmingLeft, swimmingRight, swimmingUp, swimmingDown, swimmingAccelerate} from "./input.js"
import {level, updateRegistry} from "./state.js"
import {heartbeat, showStartImage} from "./util.js"
import {Rope, cutRopes} from "./rope.js";
import {updateView, setFlicker} from "./render.js";
import {stopMusic} from "./audio.js";
import {MAP_WIDTH} from "./generation.js";
import {GRID_SIZE} from "./walking_squares.js";

const PLAYER_SPEED = 2;
const FRAME_TIME = 1000/60;
const BREATH_RATE = 4.33;

const BOOST_FACTOR = 3;
const DASH_TIME = 60;
const DASH_COOLDOWN = 8 * 60;

var FrameCounter = 0;
export const MAX_BREATH = 50;
export var Death = false;

export let Player = function(spawn) {
    MobileGameObject.call(this, "./Assets/animationen/taucher-animation.png", spawn, vec2.fromValues(1, 1), "player", null, vec2.fromValues(1, 1), vec2.fromValues(0, 0));

    this.idleState = new AnimatedGameObject("./Assets/animationen/idle_anim.png", vec2.fromValues( 0, 0), vec2.fromValues(2, 2), "rope", 2, 20, this);
    level.addObject(this.idleState)
    this.idleState.sprite.visible = false;
    this.sprite.texture.frames = 4;
    this.deadguy = new GameObject("./Assets/Leichensack.png", vec2.fromValues( 0, 0), vec2.fromValues(2, 2), "rope", this);
    this.deadguy.sprite.visible = false;
    level.addObject(this.deadguy)

    updateRegistry.registerUpdate("player_input", this.handleInput.bind(this));
    updateRegistry.registerUpdate("player_anim", this.updatePlayerAnimation.bind(this));
    updateRegistry.registerUpdate("player_breath", this.updateBreathing.bind(this));

    this.cooldown = 0;
    this.dashState = 0;

    this.breath = MAX_BREATH;
    this.effect_strength = 0;
    this.rate = 0
    this.collectedDead = false;

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
        sound.volume = 0.1;
    }
	this.breatheInSounds = [
        new Audio("./Assets/audio/breath1.wav"),
        new Audio("./Assets/audio/breath2.wav"),
        new Audio("./Assets/audio/breath3.wav")
    ];
    this.collectCorpseSound = new Audio("./Assets/audio/zipper.wav");
    this.damageSound = new Audio("./Assets/audio/Playerdamage.wav");
    this.deathSound = new Audio("./Assets/audio/death_short1.wav");
    this.typewriterAudio = new Audio("./Assets/audio/typewriter.wav");
    this.returnPromptTimer = 0;
}
Player.prototype = Object.create(MobileGameObject.prototype);
Object.defineProperty(Player.prototype, 'constructor', {
    value: Player,
    enumerable: false, // so that it does not appear in 'for in' loop
    writable: true });

Player.prototype.isPlayer = function(){return true;}
// Player.prototype.setInteraction = function(isactive) {this.canInteract = isactive }
//
Player.prototype.hurt = function(){
    this.breath -= 5;
    this.damageSound.play();
}

Player.prototype.handleInput = function(delta) {
	//TOD???

    if (!this.collectedDead) {
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
    }

    if (this.breath <= 0) {
        vec2.copy(this.velocity, vec2.fromValues(0, -0.2));
        this.flip = true;
        this.orientation = 215;
        level.updateLight(0, [0.3, 0.8, 0.5], [this.position[0], this.position[1]],[0, 1], -1.0, 0);
        level.updateLight(1, [0.6, 0.3, 0.3], vec2.scaleAndAdd(vec2.create(), this.position, this.lookDirection, -0.4), this.lookDirection, 0.7, 0);
        return
    }

    let vel = vec2.fromValues(0, 0);
    //handle player Speed
    let speed = PLAYER_SPEED;

    if (swimmingAccelerate() && this.dashState == 0 && !this.collectedDead) {
        console.log("started boost")
        this.dashState = 1;
        this.cooldown = 0;
    }
    if (this.dashState == 1) {
        if (this.cooldown < DASH_TIME) {
            this.cooldown = this.cooldown + 1;
            speed = PLAYER_SPEED * BOOST_FACTOR
        }
        else {
            console.log("ended boost")
            this.dashState = 2;
            this.cooldown = 0;
        }
    }
    else if (this.dashState == 2) {
        if (this.cooldown < DASH_COOLDOWN) {
            this.cooldown = this.cooldown + 1;
        }
        else {
            console.log("coodown ended")
            this.dashState = 0;
        }

    }

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

    if (level.objects["target"].length > 0 && vec2.squaredDistance(this.position, level.objects["target"][0].position) < 2 * 2 && this.flickerTimer <= -2) {
        this.flickerTimer = 2;
        this.breath = MAX_BREATH;
    }
    this.flickerTimer -= delta;
    if (this.position[0] > - (MAP_WIDTH / 2 + 2)* GRID_SIZE && this.position[0] < -(MAP_WIDTH / 2 + 1) * GRID_SIZE) {
        this.returnPromptTimer = 5;
    }
    this.returnPromptTimer -= delta;
    if (this.flickerTimer < 0 && this.flickerTimer + delta >= 0) {
        this.velocity[0] *= -0.1;
        level.removeObject(level.objects["target"][0]);
        this.collectedDead = true;
        this.deadguy.sprite.visible = true;
        this.collectCorpseSound.play();
        this.breath = MAX_BREATH;
        this.returnPromptTimer = 5;
        cutRopes();
    }
    let flicker = 1;
    if (this.flickerTimer <= -2) {
        this.flickerTimer = -2;
    } else {
        flicker = Math.sin(Math.pow(Math.abs(this.flickerTimer), 0.5) * 20)
    }
    setFlicker(flicker);

    this.rate += delta * 2
    if (this.rate > 4)
        this.rate -= 4
    level.updateLight(0, [0.3, 0.8, 0.5], [this.position[0], this.position[1]],[0, 1], -1.0,  (2  - this.effect_strength * heartbeat(this.rate)) / 3 * flicker);

    level.updateLight(1, [0.6, 0.3, 0.3], this.getHeadPosition(), this.lookDirection, 0.7, this.position[1] - this.lookDirection[1] > -1.5 ? 0 : 3 * flicker);

    this.breathTimer += delta;
    if (this.breathTimer >= BREATH_RATE && this.position[1] < -0.1) {
        this.breathTimer -= BREATH_RATE;
        this.breatheOutSounds[Math.floor(Math.random() * this.breatheOutSounds.length)].play();
    }
    if (this.breathTimer >= 2.33 && this.breathTimer - delta < 2.33 && this.position[1] < -0.1) {
        this.breatheInSounds[Math.floor(Math.random() * this.breatheInSounds.length)].play();
    }
}

Player.prototype.updateBreathing = function(delta) {

    if (this.breath == 0)
        return

    if (this.position[1] > -0.2) //above water
    {
        if (this.collectedDead) {
            Death = true;
            console.log("YOU WON.");
            console.log(this.position);
            stopMusic();
            this.typewriterAudio.play();
            showStartImage("Assets/zeitung-happyend.png"); //implement fail screen
        }
        this.breath = this.breath + delta * MAX_BREATH;
    }
    else {
        this.breath = this.breath - delta;
    }
    this.breath = Math.min(Math.max(this.breath, 0), MAX_BREATH);

    this.effect_strength = 1 - (this.breath / 100);

    if (this.breath == 0)
    {
        Death = true;
        console.log("YOU DIED.");
        console.log(this.position);
        let audio = this.typewriterAudio;
        if (this.collectedDead)
            setTimeout(function() {
                stopMusic();
                audio.play();
                showStartImage("Assets/zeitung-tot.png"); //implement fail screen
            }, 4000); //implement fail screen
        else
            setTimeout(function() {
                stopMusic();
                audio.play();
                showStartImage("Assets/zeitung-tot.png", true); //implement fail screen
            }, 4000); //implement fail screen
        this.deathSound.play();
    }
}

Player.prototype.isIdle = function() {
    return this.idleState.sprite.visible
}

Player.prototype.getHeadPosition = function() {
    let spawn_pos = vec2.scaleAndAdd(vec2.create(), this.position, this.lookDirection, -0.4);
    if (this.isIdle()) {
        spawn_pos = vec2.scaleAndAdd(vec2.create(), this.position, vec2.fromValues(this.lookDirection[1], -this.lookDirection[0]), 0.3 * (this.flip ? -1 : 1))
    }
    return spawn_pos
}

Player.prototype.updatePlayerAnimation = function() {
    if (this.breath == 0)
        return
    if (swimmingDown() || swimmingUp() || swimmingRight() || swimmingLeft()) {
        this.sprite.visible = true
        this.idleState.sprite.visible = false
    } else {
        this.sprite.visible = false
        this.idleState.sprite.visible = true
    }
    FrameCounter++;
	if (FrameCounter >=20){
        this.sprite.texture.nextFrame();
        FrameCounter = 0;
	}
}



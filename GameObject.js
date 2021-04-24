import {Sprite} from "./Sprite.js"
import {mat4, vec2, vec3, quat} from "./gl-matrix-min.js"
import {PositionalAudio, walk_wood} from "./audio.js"
import {updateRegistry, inventory} from "./state.js"
import {getItemSprite, getItemMenuSprite} from "./item.js"
import {Menu} from "./menu.js"

//Preset Rotations of the object.
export let Orientation = {
    DEFAULT: 0,
    MIRRORED: 1,
    ROTATED_45: 2
}

//Abstraction from Sprite to abstract from Transformation to the position and size of the object
export let GameObject = function(spritePath, position, size, type, scale = vec2.fromValues(1, 1), offset = vec2.fromValues(0, 0), orientation = Orientation.DEFAULT) {
    this.position = position;
    this.halfSize = vec2.create();
    this.type = type;
	this.scale = scale;
	this.baseScale = vec2.clone(scale);
	this.offset = offset;
	this.orientation = orientation;
    vec2.scale(this.halfSize, size, 0.5); //use center as reference point for position

	if (spritePath === null) {
		this.sprite = null;
	} else {
		this.sprite = new Sprite(spritePath, this.calculateTransform(), null);
	}
}
//compute new transformation for the sprite
GameObject.prototype.calculateTransform = function() {
    let transform = mat4.create();
    
    mat4.fromRotationTranslationScale(
        transform,
        this.orientation == Orientation.ROTATED_45 ? quat.fromEuler(quat.create(), 0, 0, 45) : quat.create(),
        vec3.fromValues(this.position[0] + this.offset[0], this.position[1] + this.offset[1], 0),
        vec3.fromValues(this.halfSize[0] * (this.orientation == Orientation.MIRRORED ? -1 : 1) * this.scale[0], this.halfSize[1] * this.scale[1], 1));
    return transform;
}
//update scale
GameObject.prototype.setSize = function(size) {
	let lastHalfY = this.halfSize[1]
    vec2.scale(this.halfSize, size, 0.5);
	
	//vec2.div(this.scale, this.baseScale, size)
	
    this.position[1] -= (lastHalfY - this.halfSize[1]) * this.baseScale[1]
	//this.offset[1] += (lastHalfY - this.halfSize[1]) * this.baseScale[1]
	
	if (this.sprite !== null)
		this.sprite.setTransformation(this.calculateTransform());
}
GameObject.prototype.setPosition = function(position) {
    this.position = position;
	if (this.sprite !== null)
		this.sprite.setTransformation(this.calculateTransform());
}
GameObject.prototype.draw = function(shader) {
    if (this.sprite !== null)
		this.sprite.draw(shader);
}

GameObject.prototype.onInteract = function(obj) {}
GameObject.prototype.canInteract = function(obj) {return false;}
GameObject.prototype.onCollide = function(intersection, other) {}
GameObject.prototype.isPlayer = function(){return false;}


export let MobileGameObject = function(spritePath, position, size, type, scale = vec2.fromValues(1, 1), offset = vec2.fromValues(0, 0), orientation = Orientation.DEFAULT) {
    GameObject.call(this, spritePath, position, size, type, scale, offset, orientation);
    
    this.velocity = vec2.fromValues(0, 0);
    this.onGround = false;
    this.canInteract = false;
}
MobileGameObject.prototype = Object.create(GameObject.prototype);
Object.defineProperty(MobileGameObject.prototype, 'constructor', {
    value: MobileGameObject,
    enumerable: false, // so that it does not appear in 'for in' loop
    writable: true });
//apply teleportation
MobileGameObject.prototype.handlePhysicsChange = function() {
    if (typeof this.teleport !== 'undefined') {
        this.velocity[0] = 0;
        this.velocity[1] = 0;
        //player.onGround = false;
        this.setPosition(this.teleport)
        delete this.teleport
    }
}
//teleport ignoring all other updates
MobileGameObject.prototype.forceTeleport = function(pos) {
    this.teleport = pos
    this.handlePhysicsChange();
}


export let CollidableGameObject = function(spritePath, position, size, scale = vec2.fromValues(1, 1), offset = vec2.fromValues(0, 0), orientation = Orientation.DEFAULT) {
    GameObject.call(this, spritePath, position, size, "collidable", scale, offset, orientation);
}
CollidableGameObject.prototype = Object.create(GameObject.prototype);
Object.defineProperty(CollidableGameObject.prototype, 'constructor', {
    value: CollidableGameObject,
    enumerable: false, // so that it does not appear in 'for in' loop
    writable: true });
CollidableGameObject.prototype.onCollide = function(intersection, other) {
    other.position[1] -= intersection[1];
    if (intersection[1] == 0 || this.orientation != Orientation.ROTATED_45) {
        other.position[0] -= intersection[0];
    }
    if (intersection[0] != 0) {
        other.velocity[0] = 0;
    }
    if (intersection[1] != 0){
        other.velocity[1] = 0;
        if (intersection[1] < 0) other.onGround = true;
    }
}


export let ForceTeleporter = function(spritePath, position, size, scale = vec2.fromValues(1, 1), offset = vec2.fromValues(0, 0), orientation = Orientation.DEFAULT) {
    GameObject.call(this, spritePath, position, size, "fire", scale, offset, orientation);
}
ForceTeleporter.prototype = Object.create(GameObject.prototype);
Object.defineProperty(ForceTeleporter.prototype, 'constructor', {
    value: ForceTeleporter,
    enumerable: false, // so that it does not appear in 'for in' loop
    writable: true });
ForceTeleporter.prototype.onCollide = function(intersection, other) {
    obj.teleport = vec2.fromValues(this.to["x"], this.to["y"])
}


export let VerticalCollidableGameObject = function(spritePath, position, size, scale = vec2.fromValues(1, 1), offset = vec2.fromValues(0, 0), orientation = Orientation.DEFAULT) {
    GameObject.call(this, spritePath, position, size, "xcollidable", scale, offset, orientation);
}
VerticalCollidableGameObject.prototype = Object.create(GameObject.prototype);
Object.defineProperty(VerticalCollidableGameObject.prototype, 'constructor', {
    value: VerticalCollidableGameObject,
    enumerable: false, // so that it does not appear in 'for in' loop
    writable: true });
VerticalCollidableGameObject.prototype.onCollide = function(intersection, other) {
    if (intersection[0] == 0 && intersection[1] < 0 && player.velocity[1] < 0 && player.maxY >= obj.position[1] + obj.halfSize[1] - 0.0001) {
        player.setPosition(vec2.sub(player.position, player.position, intersection));
        player.velocity[1] = 0;
        player.onGround = true;
    }
}

export let Interactable = function(spritePath, position, size, scale = vec2.fromValues(1, 1), offset = vec2.fromValues(0, 0), orientation = Orientation.DEFAULT) {
    GameObject.call(this, spritePath, position, size, "interactable", scale, offset, orientation);
}

export let Teleporter = function(spritePath, position, size, scale = vec2.fromValues(1, 1), offset = vec2.fromValues(0, 0), orientation = Orientation.DEFAULT) {
    Interactable.call(this, spritePath, position, size, "teleporter", scale, offset, orientation);
}
Teleporter.prototype = Object.create(Interactable.prototype);
Object.defineProperty(Teleporter.prototype, 'constructor', {
    value: Teleporter,
    enumerable: false, // so that it does not appear in 'for in' loop
    writable: true });
Teleporter.prototype.onInteract = function(obj) {
    obj.teleport = vec2.fromValues(this.to["x"], this.to["y"])
}

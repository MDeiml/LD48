import {Sprite} from "./Sprite.js"
import {mat4, vec2, vec3, quat} from "./gl-matrix-min.js"
import {updateRegistry, player} from "./state.js"

//Preset Rotations of the object.
export let Transformation = {
    TOP_LEFT: 0,
    TOP_RIGHT: 270, //rotate +90 deg
    BOTTOM_LEFT: 90, //rotate 180 deg
    BOTTOM_RIGHT: 180 //rotate -90 deg
}

//Abstraction from Sprite to abstract from Transformation to the position and size of the object
export let GameObject = function(spritePath, position, size, type, parent = null, scale = vec2.fromValues(1, 1), offset = vec2.fromValues(0, 0), orientation = Transformation.TOP_LEFT) {
    this.position = position;
    this.halfSize = vec2.create();
    this.type = type;
	this.scale = scale;
	this.baseScale = vec2.clone(scale);
	this.offset = offset;
	this.orientation = orientation;
    this.flip = false;
    this.parent = parent;
    
    vec2.scale(this.halfSize, size, 0.5); //use center as reference point for position

	if (spritePath === null) {
		this.sprite = null;
	} else {
		this.sprite = new Sprite(spritePath, this.calculateTransform(), this.parent ? this.parent.sprite : null);
	}
}
//compute new transformation for the sprite
GameObject.prototype.calculateTransform = function() {
    let transform = mat4.create();
    let rotation = quat.fromEuler(quat.create(), 0, this.flip ? 180 : 0, this.orientation);

    mat4.fromRotationTranslationScale(
        transform,
        rotation,
        vec3.fromValues(this.position[0] + this.offset[0], this.position[1] + this.offset[1], 0),
        vec3.fromValues(this.halfSize[0] * this.scale[0], this.halfSize[1] * this.scale[1], 1));

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
    if (this.parent)
        this.position = vec2.sub(vec2.create(), position, this.parent.getPosition());
    else
        this.position = position;
	if (this.sprite !== null)
		this.sprite.setTransformation(this.calculateTransform());
}
GameObject.prototype.getPosition = function() {
    if (this.parent)
        return vec2.add(vec2.create(), this.position, this.parent.getPosition());
    return vec2.clone(this.position);
}
GameObject.prototype.setOrientation = function(newOrientation) {
    if (this.parent)
        this.orientation = newOrientation - this.parent.orientation;
    else
        this.orientation = newOrientation;
	if (this.sprite !== null)
		this.sprite.setTransformation(this.calculateTransform());
}
GameObject.prototype.draw = function(shader) {
    if (this.sprite !== null)
		this.sprite.draw(shader);
}

GameObject.prototype.isPlayer = function(){return false;}

export let MobileGameObject = function(spritePath, position, size, type, parent = null, scale = vec2.fromValues(1, 1), offset = vec2.fromValues(0, 0), orientation = Transformation.TOP_LEFT) {
    GameObject.call(this, spritePath, position, size, type, parent, scale, offset, orientation);

    this.velocity = vec2.fromValues(0, 0);
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


export let CollidableGameObject = function(spritePath, position, size, shape, parent = null, scale = vec2.fromValues(1, 1), offset = vec2.fromValues(0, 0), orientation = Transformation.TOP_LEFT) {
    GameObject.call(this, spritePath, position, size, "collidable", parent, scale, offset, orientation);
    this.shape = shape;
}
CollidableGameObject.prototype = Object.create(GameObject.prototype);
Object.defineProperty(CollidableGameObject.prototype, 'constructor', {
    value: CollidableGameObject,
    enumerable: false, // so that it does not appear in 'for in' loop
    writable: true });


export let AnimatedGameObject = function(spritePath, position, size, type, frames = 1, updateStep = 20, parent = null, scale = vec2.fromValues(1, 1), offset = vec2.fromValues(0, 0), orientation = Transformation.TOP_LEFT) {
    GameObject.call(this, spritePath, position, size, type, parent, scale, offset, orientation);

    this.sprite.texture.frames = frames;
    this.sprite.texture.currFrame = Math.floor(Math.random() * frames);

    this.cntr = Math.floor(Math.random() * 20);
    this.updateStep = updateStep;
    this.updateName = "GameObj_anim" + Math.random()
    updateRegistry.registerUpdate(this.updateName, this.updateAnimation.bind(this))
}

AnimatedGameObject.prototype = Object.create(GameObject.prototype);
Object.defineProperty(AnimatedGameObject.prototype, 'constructor', {
    value: AnimatedGameObject,
    enumerable: false, // so that it does not appear in 'for in' loop
    writable: true });

AnimatedGameObject.prototype.updateAnimation = function() {
    this.cntr = this.cntr + 1;
    if (this.cntr >= this.updateStep){
        this.sprite.texture.nextFrame();
        this.cntr = this.cntr - this.updateStep;
        this.cntr = this.cntr % this.updateStep;
    }
}

AnimatedGameObject.prototype.remove = function() {
    updateRegistry.unregisterUpdate(this.updateName)
}

export let ParallaxGameObject = function(spritePath, position, size, scroll_dist = vec2.fromValues( 0, 0), parent = null, scale = vec2.fromValues(1, 1), offset = vec2.fromValues(0, 0), orientation = Transformation.TOP_LEFT) {
    GameObject.call(this, spritePath, position, size, "background", parent, scale, offset, orientation);
    this.scroll = scroll_dist
    
    this.base_pos = position
    
    this.updateName = "GameObj_parallax" + Math.random()
    updateRegistry.registerUpdate(this.updateName, this.updateScroll.bind(this))
}
ParallaxGameObject.prototype = Object.create(GameObject.prototype);
Object.defineProperty(ParallaxGameObject.prototype, 'constructor', {
    value: ParallaxGameObject,
    enumerable: false, // so that it does not appear in 'for in' loop
    writable: true });

ParallaxGameObject.prototype.updateScroll = function() {
    //compute distance of player to base_pos. 
    let x = player.position[0] - this.base_pos[0]
    let y = player.position[1] - this.base_pos[1]
    
    x *= 1/this.scroll[0]
    y *= 1/this.scroll[1]
    
    //compute offset of center
    let offsetX = this.scroll[0] - this.halfSize[0]
    let offsetY = this.scroll[1] - this.halfSize[1]
    
    //clamp
    x  = Math.min(Math.max( x, -offsetX), offsetX)
    y  = Math.min(Math.max( y, -offsetY), offsetY)
    
    this.setPosition(vec2.fromValues(this.base_pos[0] + x, this.base_pos[1] + y))
}

ParallaxGameObject.prototype.remove = function() {
    updateRegistry.unregisterUpdate(this.updateName)
}


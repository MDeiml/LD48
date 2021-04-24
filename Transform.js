import {mat4, vec3} from "./gl-matrix-min.js"

//handles the projection change matrix as an object.
export let Projection = function(aspectRatio)
{
	this.updateAspect(aspectRatio);
}
//updates the aspect
//TODO add other variables
Projection.prototype.updateAspect = function(aspectRatio) {
	this.mat = mat4.create();
	mat4.ortho(this.mat, -aspectRatio, aspectRatio, -1, 1, -1, 1);
	let zoom = 0.25;
	mat4.scale(this.mat, this.mat, vec3.fromValues(zoom, zoom, zoom)); //linear zoom.
	mat4.mul(this.mat, this.mat,
		mat4.fromValues(1, 0, 0, 0,
						0, 1, 0, 0,
						0, 1, 1, 0,
						0, 0, 0, 1)); //handles the perspective shift of distance
}
Projection.prototype.get = function() {
	return this.mat;
}

//the view matrix to go from model to world space
export let View = function(pos) {
    this.pos = vec3.clone(pos);
    this.mat = mat4.create();
    this.upsideDown = false;
    this.updateMatrix();
}
//recalculates the Matrix
View.prototype.updateMatrix = function() {
    mat4.fromTranslation(this.mat, vec3.fromValues(-this.pos[0], -this.pos[1], 0));
    if (this.upsideDown) {
        let m = mat4.fromScaling(mat4.create(), vec3.fromValues(-1, -1, 1));
        mat4.mul(this.mat, m, this.mat);
    }
}

//flips view
View.prototype.setUpsideDown = function(upsideDown) {
    this.upsideDown = upsideDown;
    this.updateMatrix();
}
//moves view
View.prototype.setPos = function(newPos) {
	vec3.copy(this.pos, newPos);
    this.updateMatrix();
}

View.prototype.get = function() {
	return this.mat;
}


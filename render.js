import {Shader} from "./Shader.js"
import * as Sprite from "./Sprite.js"
import {Projection, View} from "./Transform.js"
import {mat4, vec2, vec3, quat} from "./gl-matrix-min.js"
import {gl, setGl, level, player} from "./state.js"

let shaders = {};

export let projection = null;
let camera = null;
let cameraLeftFixed = true;
let updateViewMat = false;
let pvMatrix = mat4.create();
//move to global state in some way
let w = 0;
let h = 0;

export function init(c) {
	let canvas = c;
	w = canvas.clientWidth;
	h = canvas.clientHeight;
	canvas.width = w;
	canvas.height = h;
    setGl(canvas.getContext("webgl"));
	gl.clearColor(0, 0, 0, 1);
	gl.frontFace(gl.CCW);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
	initShaders();
    gl.clear(gl.COLOR_BUFFER_BIT);

    //credits = new Sprite.Sprite("assets/lvl7/credits.png", mat4.create());

	camera = new View(vec2.fromValues(0, 0));
	projection = new Projection(w/h);
	updateViewMat = true;

    //handle window resizing
    window.addEventListener('resize', updateProjection);
    window.addEventListener('orientationchange', updateProjection);
    window.addEventListener('fullscreenchange', updateProjection);
}

function initShaders() {
	shaders["defaultShader"] = new Shader("shader", "shader")
	shaders["lightShader"] = new Shader("shader", "light")
	shaders["blurShader"] = new Shader("shader", "blur")
	shaders["bgShader"] = new Shader("shader", "bg-light")

	shaders["defaultShader"].bind();
    let defaultPositionAttribute = gl.getAttribLocation(shaders["defaultShader"].get(), 'position');
    let defaultTexCoordAttribute = gl.getAttribLocation(shaders["defaultShader"].get(), 'texCoord');

    gl.enableVertexAttribArray(defaultPositionAttribute);
    gl.enableVertexAttribArray(defaultTexCoordAttribute);

}

export function updateView() {
    let pos = vec2.clone(player.position);
    camera.setPos(pos);
    camera.setUpsideDown(level.upsideDown);
    updateViewMat = true;
}

function updateProjection() {
    let w = gl.canvas.clientWidth;
    let h = gl.canvas.clientHeight;
    gl.canvas.width = w;
    gl.canvas.height = h;
    gl.viewport(0, 0, w, h);
    projection.updateAspect(w/h);

	updateViewMat = true;
}

export function update() {
    gl.clear(gl.COLOR_BUFFER_BIT);

	if (updateViewMat) {
		mat4.identity(pvMatrix);
		mat4.mul(pvMatrix, projection.get(), camera.get());
		updateViewMat = false;
	}

    // drawLightShader();
    drawBaseShader();
}

//RENDER MODES

function drawBaseShader() {
	shaders["defaultShader"].bind();

	gl.uniformMatrix4fv(shaders["defaultShader"].getUniform('VP'), false, pvMatrix);

	for (let sprite of level.objects)
	{
		if (sprite.type === "background")
		{
			shaders["bgShader"].bind();
			gl.uniform3fv(shaders["bgShader"].getUniform('backgroundFilter'), level.bgFilter);
			gl.uniformMatrix4fv(shaders["bgShader"].getUniform('VP'), false, pvMatrix);

			sprite.draw(shaders["bgShader"]);

			shaders["defaultShader"].bind();
			gl.uniformMatrix4fv(shaders["defaultShader"].getUniform('VP'), false, pvMatrix);
		}
		else
			sprite.draw(shaders["defaultShader"]);
	}
}

function drawLightShader() {
	shaders["lightShader"].bind();

	gl.uniform1f(shaders["lightShader"].getUniform('lightCount'), level.lightCnt)
	gl.uniform1fv(shaders["lightShader"].getUniform('lights'), level.lights)
	gl.uniformMatrix4fv(shaders["lightShader"].getUniform('VP'), false, pvMatrix);

	for (let sprite of level.objects)
	{
		if (sprite.type === "background")
		{
			shaders["bgShader"].bind();
			gl.uniformMatrix4fv(shaders["bgShader"].getUniform('VP'), false, pvMatrix);
			gl.uniform1f(shaders["bgShader"].getUniform('lightCount'), level.lightCnt)
			gl.uniform1fv(shaders["bgShader"].getUniform('lights'), level.lights)
			gl.uniform3fv(shaders["bgShader"].getUniform('backgroundFilter'), level.bgFilter);
			sprite.draw(shaders["bgShader"]);

			shaders["lightShader"].bind();
			gl.uniformMatrix4fv(shaders["lightShader"].getUniform('VP'), false, pvMatrix);
		}
		else if (sprite.type == "door" && sprite.state) {
			let t = (sprite.state == "opening" ? 0.3 - sprite.timer : (sprite.state == "closing" ? sprite.timer : 0.3)) / 0.3;
			mat4.fromRotationTranslationScale(sprite.door.transform, quat.create(), vec3.fromValues(sprite.position[0] + t * DOOR_WIDTH, sprite.position[1], 0), vec3.fromValues(-t * DOOR_WIDTH, sprite.halfSize[1], 1));
			sprite.door.draw(shaders["lightShader"]);
		}
		else
			sprite.draw(shaders["lightShader"]);

	}

    player.draw(shaders["lightShader"]);
	if (player.canInteract) {
		shaders["defaultShader"].bind();
		gl.uniformMatrix4fv(shaders["defaultShader"].getUniform('VP'), false, pvMatrix);
		player.eyeSprite.draw(shaders["defaultShader"]);
	}
}

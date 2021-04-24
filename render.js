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

    //drawBaseShader();
    drawLightShader();
}

//RENDER MODES

function drawBaseShader() {
	shaders["defaultShader"].bind();

	gl.uniformMatrix4fv(shaders["defaultShader"].getUniform('VP'), false, pvMatrix);

    for (let type in level.objects) {
        for (let sprite of level.objects[type])
        {
            sprite.draw(shaders["defaultShader"]);
        }
    }
}

function drawLightShader() {
	shaders["lightShader"].bind();

	gl.uniform1f(shaders["lightShader"].getUniform('lightCount'), level.lightCnt)
	gl.uniform1fv(shaders["lightShader"].getUniform('lights'), level.lights)
	gl.uniformMatrix4fv(shaders["lightShader"].getUniform('VP'), false, pvMatrix);

    for (let sprite of level.objects["background"]) {
        sprite.draw(shaders["lightShader"]);
    }
    for (let sprite of level.objects["random_shit"]) {
        sprite.draw(shaders["lightShader"]);
    }
    for (let sprite of level.objects["rope"]) {
        sprite.draw(shaders["lightShader"]);
    }
    for (let type in level.objects) {
        if (type == "background" || type == "random_shit" || type == "rope") continue;
        for (let sprite of level.objects[type]) {
            sprite.draw(shaders["lightShader"]);
        }
	}

    //player.draw(shaders["lightShader"]);
	//if (player.canInteract) {
	//	shaders["defaultShader"].bind();
	//	gl.uniformMatrix4fv(shaders["defaultShader"].getUniform('VP'), false, pvMatrix);
	//	player.eyeSprite.draw(shaders["defaultShader"]);
	//}
}

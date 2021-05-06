import {Shader} from "./Shader.js"
import * as Sprite from "./Sprite.js"
import {Projection, View} from "./Transform.js"
import {mat4, vec2, vec3, quat} from "./gl-matrix-min.js"
import {gl, setGl, level, player, ui} from "./state.js"
import {MAP_HEIGHT} from "./generation.js";
import {GRID_SIZE} from "./walking_squares.js";

const CLEAR_COLOR_VEC = [22/255, 24/255, 29/255]

let shaders = {};

export let projection = null;
let camera = null;
let cameraLeftFixed = true;
let updateViewMat = false;
let pvMatrix = mat4.create();
//move to global state in some way
let aspct = 1;

let renderContainer = null;
let sigma = 1
let gauss = []
let sigmaChanged = true
let minDist = 1

export function aspect() {
    return aspct;
}

export function init(c) {
	let canvas = c;
	let w = canvas.clientWidth;
	let h = canvas.clientHeight;
	canvas.width = w;
	canvas.height = h;
    setGl(canvas.getContext("webgl"));
	gl.clearColor(CLEAR_COLOR_VEC[0], CLEAR_COLOR_VEC[1], CLEAR_COLOR_VEC[2], 1);
	gl.frontFace(gl.CCW);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
	initShaders();
    gl.clear(gl.COLOR_BUFFER_BIT);

    //credits = new Sprite.Sprite("assets/lvl7/credits.png", mat4.create());

	camera = new View(vec2.fromValues(0, 0));
    aspct = w/h;
	projection = new Projection(w/h);
	updateViewMat = true;


	renderContainer = new Sprite.Sprite(null, mat4.create(), null)
	renderContainer.texture = new Sprite.DynamicTexture2D() //hackery but static, don't judge me


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

export function setSigma(s) {
    sigma = s
    sigmaChanged = true
}

export function setMinDist(d) {
    minDist = d
}

function hypotenuse(x1, y1, x2, y2) {
  var xSquare = Math.pow(x1 - x2, 2);
  var ySquare = Math.pow(y1 - y2, 2);
  return Math.sqrt(xSquare + ySquare);
}

function computeGauss() {
    if (!sigmaChanged)
        return gauss;
    
    var kernel = [];

    var twoSigmaSquare = 2 * sigma * sigma;
    var centre = 8;

    for (let i = 0; i < 15; i++) {
        for (let j = 0; j < 15; j++) {
            var distance = hypotenuse(i, j, centre, centre);

            // The following is an algorithm that came from the gaussian blur
            // wikipedia page [1].
            //
            // http://en.wikipedia.org/w/index.php?title=Gaussian_blur&oldid=608793634#Mechanics
            var gaussian = (1 / Math.sqrt(
            Math.PI * twoSigmaSquare
            )) * Math.exp((-1) * (Math.pow(distance, 2) / twoSigmaSquare));

            kernel.push(gaussian);
        }
    }
    
    gauss = kernel
    sigmaChanged = false;
    
    return gauss
}

let flicker = 1;
export function setFlicker(f) {
    flicker = f;
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
    aspct = w/h;
    gl.canvas.width = w;
    gl.canvas.height = h;
    gl.viewport(0, 0, w, h);
    projection.updateAspect(w/ h);

    ui.updateAspects(w/h)

	updateViewMat = true;
}

export function update() {
    let multiplier = 0.8 - 0.799 * Math.min(1, 1 * -player.position[1] / MAP_HEIGHT * 2 / GRID_SIZE)
	gl.clearColor(CLEAR_COLOR_VEC[0] * multiplier, CLEAR_COLOR_VEC[1] * multiplier, CLEAR_COLOR_VEC[2] * multiplier, 1);

    gl.clear(gl.COLOR_BUFFER_BIT);

	if (updateViewMat) {
		mat4.identity(pvMatrix);
		mat4.mul(pvMatrix, projection.get(), camera.get());
		updateViewMat = false;
	}
    renderContainer.texture.bindFramebuffer()
    drawLightShader();
    renderContainer.texture.unbindFramebuffer()

	shaders["blurShader"].bind();
    //gl.uniformMatrix4fv(shaders["blurShader"].getUniform('VP'), false, mat4.create());
    gl.uniformMatrix4fv(shaders["blurShader"].getUniform('VP'), false, mat4.fromQuat(mat4.create(), quat.fromEuler(quat.create(), 180, 0, 0)));
    // gl.uniform1fv(shaders["blurShader"].getUniform('gaussian'), computeGauss())
    // gl.uniform1f(shaders["blurShader"].getUniform('threshhold'), minDist)
    gl.uniform1f(shaders["blurShader"].getUniform('time'), level.time)
    renderContainer.draw(shaders["blurShader"]);

    drawUI();
}

//RENDER MODES

function drawBaseShader() {
	shaders["defaultShader"].bind();

	gl.uniform1f(shaders["defaultShader"].getUniform('alpha'), 1.0)
	gl.uniformMatrix4fv(shaders["defaultShader"].getUniform('VP'), false, pvMatrix);

    for (let type in level.objects) {
        for (let sprite of level.objects[type])
        {
            sprite.draw(shaders["defaultShader"]);
        }
    }
}

function drawLightShader() {

	shaders["defaultShader"].bind();
	gl.uniformMatrix4fv(shaders["defaultShader"].getUniform('VP'), false, pvMatrix);
    for (let sprite of level.objects["background_surface"]) {
        sprite.draw(shaders["defaultShader"]);
    }

    let draw_order = [
        { ambientLight: 0.8 - 0.799 * Math.min(1, 1 * -player.position[1] / MAP_HEIGHT * 2 / GRID_SIZE), types: ["background"] },
        { ambientLight: 0.6 - 0.599 * Math.min(1, 1 * -player.position[1] / MAP_HEIGHT * 2 / GRID_SIZE), types: ["background-parallax"] },
        { ambientLight: 1 - 0.5 * Math.min(1, 1 * -player.position[1] / MAP_HEIGHT * 2 / GRID_SIZE), types: ["bubble", "bubbles"] },
        { ambientLight: 1, types: ["jelly"] },
        { ambientLight: 0.8 - 0.5 * Math.min(1, 1 * -player.position[1] / MAP_HEIGHT * 2 / GRID_SIZE), types: ["fish", "plant-coral"] },
        { ambientLight: 0.8 - 0.799 * Math.min(1, 3 * -player.position[1] / MAP_HEIGHT * 2 / GRID_SIZE), types: ["rope", "plant"] }
    ];
    let drawn = { background_surface: true };

	shaders["lightShader"].bind();
	// gl.uniform1f(shaders["lightShader"].getUniform('lightCount'), level.lightCnt)
	gl.uniform1fv(shaders["lightShader"].getUniform('lights'), level.lights)
	gl.uniformMatrix4fv(shaders["lightShader"].getUniform('VP'), false, pvMatrix);

    for (let stage of draw_order) {
        gl.uniform1f(shaders["lightShader"].getUniform('ambientLight'), stage.ambientLight * flicker);
        for (let type of stage.types) {
            drawn[type] = true;
            if (type == "background-parallax")
                gl.uniform1f(shaders["lightShader"].getUniform('alpha'), 0.3)
            else
                gl.uniform1f(shaders["lightShader"].getUniform('alpha'), 1.0)

            for (let sprite of level.objects[type]) {
                if (type != "background" && type != "background-parallax" && vec2.squaredDistance(sprite.getPosition(), player.position) > 15 * 15) continue;
                sprite.draw(shaders["lightShader"]);
            }
        }
    }
    for (let type in level.objects) {
        if (drawn[type] || type == "plant-deco") continue;
        for (let sprite of level.objects[type]) {
            if (vec2.squaredDistance(sprite.position, player.position) > 15 * 15) continue;
            sprite.draw(shaders["lightShader"]);
        }
	}
    for (let sprite of level.objects["plant-deco"]) {
        if (vec2.squaredDistance(sprite.position, player.position) > 15 * 15) continue;
        sprite.draw(shaders["lightShader"]);
    }

    //player.draw(shaders["lightShader"]);
	//if (player.canInteract) {
	//	shaders["defaultShader"].bind();
	//	gl.uniformMatrix4fv(shaders["defaultShader"].getUniform('VP'), false, pvMatrix);
	//	player.eyeSprite.draw(shaders["defaultShader"]);
	//}
}

function drawUI() {
    //TODO THIS NEEDS TO MOVE
    shaders["defaultShader"].bind();
	gl.uniform1f(shaders["defaultShader"].getUniform('alpha'), 1.0)
    gl.uniformMatrix4fv(shaders["defaultShader"].getUniform('VP'), false, projection.get());

    for (let element of ui.elements) {
        element.draw(shaders["defaultShader"]);
    }
}

import {Shader} from "./Shader.js"
import * as Sprite from "./Sprite.js"
import {Projection, View} from "./Transform.js"
import {mat4, vec2, vec3, quat} from "./gl-matrix-min.js"
import { Menu } from "./menu.js"
import {level, player, gl, setGl} from "./state.js"
import {Inventory} from "./inventory.js"

let shaders = {};

const DOOR_WIDTH = 1;

export let projection = null;
let camera = null;
let cameraLeftFixed = true;
let updateViewMat = false;
let pvMatrix = mat4.create();
//move to global state in some way
let w = 0;
let h = 0;

let lastSwitch = 0
let credits = null;

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

    //Container Texture for when the inventory is open
	Menu.backgroundContainer = new Sprite.Sprite(null, mat4.create(), null)
	Menu.backgroundContainer.texture = new Sprite.DynamicTexture2D() //TODO hackery but static, don't judge me
    //container for rendering blur
	Menu.blurredBackgroundContainer = new Sprite.Sprite(null, mat4.create(), null)
	Menu.blurredBackgroundContainer.texture = new Sprite.DynamicTexture2D() //TODO hackery but static, don't judge me

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
    pos[0] = Math.max(0, pos[0]);
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

    
    if (Inventory.end_end && !Inventory.opened) { //TODO Move condition
        shaders["defaultShader"].bind();
        credits.draw(shaders["defaultShader"]);
        gl.uniformMatrix4fv(shaders["defaultShader"].getUniform('VP'), false, mat4.create());
    } else {

        if (Inventory.opened || Menu.current !== null)
        {
            if (lastSwitch === 0)
            {
                lastSwitch = 1
                Menu.backgroundContainer.texture.bindFramebuffer()
            }
        }
        else {
            if (lastSwitch === 2)
                lastSwitch = 0
        }
        if (lastSwitch < 2)
            drawLightShader();
            //drawBaseShader();
        if (lastSwitch === 1) {
            lastSwitch = 2;
            Menu.backgroundContainer.texture.unbindFramebuffer()

            Menu.blurredBackgroundContainer.texture.bindFramebuffer()
            shaders["blurShader"].bind();
            gl.uniformMatrix4fv(shaders["blurShader"].getUniform('VP'), false, mat4.create());
            gl.uniform1fv(shaders["blurShader"].getUniform('gaussian'), [0.000533, 0.000799, 0.001124, 0.001487, 0.001849, 0.00216, 0.002371, 0.002445, 0.002371, 0.00216, 0.001849, 0.001487, 0.001124, 0.000799, 0.000533, 0.000799, 0.001196, 0.001684, 0.002228, 0.002769, 0.003235, 0.003551, 0.003663, 0.003551, 0.003235, 0.002769, 0.002228, 0.001684, 0.001196, 0.000799, 0.001124, 0.001684, 0.002371, 0.003136, 0.003898, 0.004554, 0.004999, 0.005157, 0.004999, 0.004554, 0.003898, 0.003136, 0.002371, 0.001684, 0.001124, 0.001487, 0.002228, 0.003136, 0.004148, 0.005157, 0.006024, 0.006613, 0.006822, 0.006613, 0.006024, 0.005157, 0.004148, 0.003136, 0.002228, 0.001487, 0.001849, 0.002769, 0.003898, 0.005157, 0.006411, 0.007489, 0.008221, 0.00848, 0.008221, 0.007489, 0.006411, 0.005157, 0.003898, 0.002769, 0.001849, 0.00216, 0.003235, 0.004554, 0.006024, 0.007489, 0.008748, 0.009603, 0.009906, 0.009603, 0.008748, 0.007489, 0.006024, 0.004554, 0.003235, 0.00216, 0.002371, 0.003551, 0.004999, 0.006613, 0.008221, 0.009603, 0.010542, 0.010875, 0.010542, 0.009603, 0.008221, 0.006613, 0.004999, 0.003551, 0.002371, 0.002445, 0.003663, 0.005157, 0.006822, 0.00848, 0.009906, 0.010875, 0.011218, 0.010875, 0.009906, 0.00848, 0.006822, 0.005157, 0.003663, 0.002445, 0.002371, 0.003551, 0.004999, 0.006613, 0.008221, 0.009603, 0.010542, 0.010875, 0.010542, 0.009603, 0.008221, 0.006613, 0.004999, 0.003551, 0.002371, 0.00216, 0.003235, 0.004554, 0.006024, 0.007489, 0.008748, 0.009603, 0.009906, 0.009603, 0.008748, 0.007489, 0.006024, 0.004554, 0.003235, 0.00216, 0.001849, 0.002769, 0.003898, 0.005157, 0.006411, 0.007489, 0.008221, 0.00848, 0.008221, 0.007489, 0.006411, 0.005157, 0.003898, 0.002769, 0.001849, 0.001487, 0.002228, 0.003136, 0.004148, 0.005157, 0.006024, 0.006613, 0.006822, 0.006613, 0.006024, 0.005157, 0.004148, 0.003136, 0.002228, 0.001487, 0.001124, 0.001684, 0.002371, 0.003136, 0.003898, 0.004554, 0.004999, 0.005157, 0.004999, 0.004554, 0.003898, 0.003136, 0.002371, 0.001684, 0.001124, 0.000799, 0.001196, 0.001684, 0.002228, 0.002769, 0.003235, 0.003551, 0.003663, 0.003551, 0.003235, 0.002769, 0.002228, 0.001684, 0.001196, 0.000799, 0.000533, 0.000799, 0.001124, 0.001487, 0.001849, 0.00216, 0.002371, 0.002445, 0.002371, 0.00216, 0.001849, 0.001487, 0.001124, 0.000799, 0.000533]);

            Menu.backgroundContainer.draw(shaders["blurShader"]);
            Menu.blurredBackgroundContainer.texture.unbindFramebuffer()
        }
        if (lastSwitch > 0)
            drawGUI();
    }

	gl.flush();
}

//draw UI Overlay
function drawGUI() {
	shaders["defaultShader"].bind();
	gl.uniformMatrix4fv(shaders["defaultShader"].getUniform('VP'), false, mat4.create());
	Menu.blurredBackgroundContainer.draw(shaders["defaultShader"]);
	gl.uniformMatrix4fv(shaders["defaultShader"].getUniform('VP'), false, projection.get());

    //TODO THIS NEEDS TO MOVE
    if (Menu.current !== null) {
        Menu.current.draw(shaders["defaultShader"]);
    } else if (Inventory.opened) {
        Inventory.board.draw(shaders["defaultShader"]);
        for (let i = 0; i < Inventory.objects.length; i++) {
            if (Inventory.level_end && i < level.id - 1) {
                continue;
            }
            if (Inventory.cursorPosition == i) {
                Inventory.postits[i].texture = Inventory.glowingPostit;
            } else {
                Inventory.postits[i].texture = Inventory.postit;
            }
            Inventory.postits[i].draw(shaders["defaultShader"]);
            Inventory.objects[i].draw(shaders["defaultShader"]);
        }
        
        if (Inventory.level_end && level.id == 1) {
            new Sprite.Sprite("assets/endLvTut.png", mat4.fromRotationTranslationScale(mat4.create(), quat.create(), vec3.fromValues(0, 4, 0), vec3.fromValues(5, 1, 1))).draw(shaders["defaultShader"]);
        }
    }
}

//RENDER MODES

function drawBaseShader() {
	shaders["defaultShader"].bind();

	gl.uniformMatrix4fv(shaders["defaultShader"].getUniform('VP'), false, pvMatrix);

	for (let sprite of level.objects)
	{
		console.log(sprite.type)
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

	player.draw(shaders["defaultShader"]);
	if (player.canInteract)
		player.eyeSprite.draw(shaders["defaultShader"]);
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

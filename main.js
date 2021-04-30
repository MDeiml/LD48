import { init as initGraphics, update as updateGraphics, projection, updateView } from "./render.js"
import {mat4, vec3, vec2} from "./gl-matrix-min.js"
import { init as initInput, update as updateInput} from "./input.js"
import {Sprite} from "./Sprite.js";
import {updateAudio, initAudio, playMusic} from "./audio.js"
import {updateRegistry, player, setPlayer, level} from "./state.js"
import {reset} from "./generation.js"
import {Player} from "./player.js"
import {init as initResource} from "./resource.js"
import {GameObject, AnimatedGameObject, ParallaxGameObject} from "./GameObject.js"
import {updatePhysics} from "./physics.js"
import {updateBubbles, initBubbles} from "./bubble.js"
import {updateFish, initFish} from "./fish.js";
import {set_seed, MAP_WIDTH, MAP_HEIGHT, GRID_SIZE} from "./util.js"
import {updateRopes} from "./rope.js";
import {createUI} from "./menu.js"


//timekeeper
var lastTick = null;
var unprocessed = 0;

const FRAME_TIME = 1000/60;
let dir = true

function removeOpening() {
    document.getElementById("loadingAnimation").style.display = "none"
    window.running = true;
    requestAnimationFrame(update);
}

function setup() {
    document.getElementById("credits").onclick = function() {
        document.getElementById("reset").style.display = "none";
        document.getElementById("credits").style.display = "none";
        document.getElementById("message").style.display = "none";
        document.getElementById("credits_img").style.display = "block";
    }
    document.getElementById("startImage").style.display = "none"
    document.getElementById("startImage").onclick = null
    document.getElementById("message").style.display = "none"
    document.getElementById("message").onclick = null
    document.getElementById("loadingAnimation").style.display = "unset"

    // set_seed(Math.floor(Math.random() * 256))
    set_seed(0);
    initGraphics(document.getElementById('glCanvas'));
    initAudio();
    updateRegistry.registerUpdate("bubbles", updateBubbles);
    updateRegistry.registerUpdate("ropes", updateRopes);
    updateRegistry.registerUpdate("fish", updateFish);

    var startDate = new Date();

    initResource(function() {
        level.addObject(new GameObject("Assets/background_blue.png", vec2.fromValues(-0.5 * GRID_SIZE, -MAP_HEIGHT * GRID_SIZE / 4), vec2.fromValues( (MAP_WIDTH + 1) * GRID_SIZE, MAP_HEIGHT / 2 * GRID_SIZE), "background" ))
        level.addObject(new GameObject("Assets/background2.png", vec2.fromValues(-0.5 * GRID_SIZE, (-MAP_HEIGHT * GRID_SIZE / 4) - MAP_HEIGHT * GRID_SIZE / 2), vec2.fromValues( (MAP_WIDTH + 1) * GRID_SIZE, MAP_HEIGHT / 2 * GRID_SIZE), "background" ))
        level.addObject(new GameObject("Assets/hintergrund-boot-leer.png", vec2.fromValues(-0.5 * GRID_SIZE, 3 * GRID_SIZE), vec2.fromValues((MAP_WIDTH + 1) * GRID_SIZE, 6 * GRID_SIZE), "background_surface" ))

        level.addObject(new ParallaxGameObject("Assets/wreck.png", vec2.fromValues(-(MAP_WIDTH - 6)/2 * GRID_SIZE, -MAP_HEIGHT * GRID_SIZE / 4), vec2.fromValues( 16, 12), vec2.fromValues(0, 4*GRID_SIZE)))

        // for (let i = 0; i < MAP_WIDTH; i++) {
        //     let h = GRID_SIZE * 920 / 1323;
        //     level.addObject(new GameObject(
        //         i == Math.floor(MAP_WIDTH / 2) ? "Assets/hintergrund_boot_leer.png" : "Assets/hintergrund.png",
        //         vec2.fromValues((i - MAP_WIDTH / 2) * GRID_SIZE, h/2),
        //         vec2.fromValues(GRID_SIZE, h),
        //         "background_surface"
        //     ));
        // }
        createUI()
        reset();
        // setPlayer(new Player(vec2.fromValues(-0.5 * GRID_SIZE, -MAP_HEIGHT * GRID_SIZE / 2)))
        // setPlayer(new Player(vec2.sub(vec2.create(), level.objects["target"][0].position, vec2.fromValues(4, 0))));
        initFish();
        initBubbles();



        var seconds = ((new Date()).getTime() - startDate.getTime());
		setTimeout(removeOpening, 3000 - seconds); //should handle interrupt so any key can skip this
        playMusic();
    });
}

function main() {
    initInput();
    document.getElementById("message").onclick = setup;
    document.getElementById("startImage").onclick = setup;
}


function update(now) {
    if (!lastTick) {
        lastTick = now;
    }

    unprocessed += now - lastTick;
    lastTick = now;

    if (unprocessed >= 1000) {
        // this means game has probably stopped running (e.g. computer was turned off)
		// TODO force game state into pause
        unprocessed = 0;
    }

    let shouldRender = false;
    while (unprocessed >= FRAME_TIME) { //time for a new frame
        unprocessed -= FRAME_TIME;
        shouldRender = true;
        level.time += FRAME_TIME / 1000;
        updateInput(); //pull keypresses
		updateRegistry.update(FRAME_TIME / 1000); //update all that needs to be updated
        updatePhysics(FRAME_TIME / 1000);

        updateView();
        updateAudio(player.position);
    }

    // don't render if there was no update
    if (shouldRender) {
        updateGraphics();
    }

    if (window.running) {
        requestAnimationFrame(update);
    }
}

main();

import { init as initGraphics, update as updateGraphics, projection, updateView } from "./render.js"
import {mat4, vec3, vec2} from "./gl-matrix-min.js"
import { init as initInput, update as updateInput} from "./input.js"
import {Sprite} from "./Sprite.js";
import {updateAudio, initAudio, music, walk_wood} from "./audio.js"
import {updateRegistry, player, setPlayer, level} from "./state.js"
import {generateLevel, MAP_WIDTH, MAP_HEIGHT} from "./generation.js"
import {Player} from "./player.js"
import {computeSquareMap, GRID_SIZE} from "./walking_squares.js"
import {init as initResource} from "./resource.js"
import {GameObject} from "./GameObject.js"
import {updatePhysics} from "./physics.js"

//timekeeper
var lastTick = null;
var unprocessed = 0;

const FRAME_TIME = 1000/60;
let dir = true

function main() {
    initGraphics(document.getElementById('glCanvas'));
    initInput();
    initAudio();

    initResource(function() {
        level.objects.push(new GameObject("Assets/background.jpg", vec2.fromValues(-0.5 * GRID_SIZE, -MAP_HEIGHT * GRID_SIZE / 2), vec2.fromValues( (MAP_WIDTH - 1) * GRID_SIZE, MAP_HEIGHT * GRID_SIZE), "background" ))
        let map_data = generateLevel();
        computeSquareMap(map_data);
        setPlayer(new Player());
        window.running = true;
        requestAnimationFrame(update);
    });
    
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
        updateInput(); //pull keypresses
		updateRegistry.update(); //update all that needs to be updated
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

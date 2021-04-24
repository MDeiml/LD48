import { init as initGraphics, update as updateGraphics, projection, updateView } from "./render.js"
import {mat4, vec3, vec2} from "./gl-matrix-min.js"
import {update as updatePhysics} from "./physics.js"
import { init as initInput, update as updateInput, toggleInventory, menuUp, menuDown, menuLeft, menuRight, pickingUp} from "./input.js"
import {gl, setPlayer, player, level, updateRegistry, inventory, setInventory} from "./state.js"
import {Menu} from "./menu.js"
import {Inventory} from "./inventory.js"
import {Sprite} from "./Sprite.js";
import {loadLevel} from "./level.js"
import {init as initResource} from "./test/resource.js"
import {updateAudio, initAudio, music, walk_wood} from "./audio.js"
import {Player} from "./player.js"

//timekeeper
var lastTick = null;
var unprocessed = 0;

const FRAME_TIME = 1000/60;
let MIN_FIRE_SCALE = 1.0
let MAX_FIRE_SCALE = 3.0
let fireCntr = 0
let firePos = 0
let dir = true

function main() {
    initGraphics(document.getElementById('glCanvas'));
    initInput();
    initAudio();
    
    setInventory(new Inventory())
    
    initResource(function() {
        
        setPlayer(new Player());
        
        loadLevel(1) //TODO maybe remove. maybe replace with menu

        window.running = true;
        requestAnimationFrame(update);
    });
}

//TODO move to Fire. this also has the advantage to give them random offsets. so that they aren't uniform.
function updateFires() {
	fireCntr += 1;
	if ((fireCntr % 60) === 0) {
		fireCntr = 0;
		firePos += 1
		if (firePos > 5)
			firePos = 0
	}
	for (let sprite of level.objects) {
		if (sprite.type !== "fire")
			continue

		sprite.setSize(vec2.fromValues(1, (firePos + 1) / 2))
		sprite.sprite.texture.setFrame(firePos)
	}
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
        if (!inventory.level_end && toggleInventory()) { //TODO inventory code
            inventory.opened = !inventory.opened;
            inventory.cursorPosition = 0;
        }
        if (Menu.current !== null) { //TODO create menu object
            walk_wood.pause();
            if (Menu.current.cooldown == -1) {
                if (pickingUp()) {
                    if (music.paused) {
                        music.play();
                    }
                    Menu.current.close();
                }
            } else {
                Menu.current.cooldown -= FRAME_TIME / 1000;
                if (Menu.current.cooldown < 0) {
                    Menu.current.close();
                }
            }
        } else if (inventory.opened) {
            walk_wood.pause();
            inventory.updateInventory();
        } else if (!inventory.end_end) {
            //THIS IS THE MAIN UPDATE
            player.handleInput()
            updatePhysics(FRAME_TIME / 1000); //update physics
			updateView(); //update camera
			player.updatePlayerAnimation(); //operate on player

			updateFires();
        }
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

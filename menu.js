import {mat4, vec3, vec2, quat} from "./gl-matrix-min.js"
import {GameObject} from "./GameObject.js"
import {ui, player, updateRegistry} from "./state.js"
import {MAX_BREATH} from "./player.js";
import {aspect} from "./render.js";


const MIN_ORIENTATION = 112.5;//247.5
const MAX_ORIENTATION = -202.5;

export let Menu = function(spritePath, position, size, parent) {
    GameObject.call(this, spritePath, position, size, "ui", parent);
    ui.elements.push(this)
}
Menu.prototype = Object.create(GameObject.prototype);
Object.defineProperty(Menu.prototype, 'constructor', {
    value: Menu,
    enumerable: false, // so that it does not appear in 'for in' loop
    writable: true });

function updateOxygen() {
    let ratio = player.breath / MAX_BREATH;
    this.setOrientation((MIN_ORIENTATION - MAX_ORIENTATION) * (1 - ratio) + MAX_ORIENTATION);
}

function updatePrompt() {
    this.sprite.visible = player.returnPromptTimer > 0;
}

export function createUI() {
    //create tank
    //let frame = new Menu("Assets/frame.png", vec2.fromValues(0, 0), vec2.fromValues(8 * aspect(), 8));
    let tank = new Menu("Assets/tank+barometer.png", vec2.fromValues( 6, -2.5), vec2.fromValues(3, 3));
    let pfeil = new Menu("Assets/anzeigepfeil.png", vec2.fromValues(-0.75,  -0.02), vec2.fromValues(0.18, 0.18), tank);
    let return_prompt = new Menu("Assets/prompt.png", vec2.fromValues(0, 1.5), vec2.fromValues(4 * 20/12, 4));
    //updateRegistry.registerUpdate("frame_aspect", function() {
    //    if (player.position[1] > -4) {
    //        frame.halfSize[0] = 0;
    //    } else {
    //        frame.halfSize[0] = frame.halfSize[1] * aspect();
    //    }
    //    frame.setPosition(frame.position);
    //})
    tank.base_pos = vec2.clone(tank.position)
    pfeil.setOrientation(MIN_ORIENTATION);
    updateRegistry.registerUpdate("oxygen_scale", updateOxygen.bind(pfeil))
    updateRegistry.registerUpdate("return_prompt", updatePrompt.bind(return_prompt))
    //create barometer
    //add updates



}

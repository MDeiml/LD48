import {mat4, vec3, vec2, quat} from "./gl-matrix-min.js"
import {GameObject} from "./GameObject.js"
import {ui, player, updateRegistry} from "./state.js"
import {MAX_BREATH} from "./player.js";


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
    this.setOrientation((MIN_ORIENTATION - MAX_ORIENTATION) * ratio + MAX_ORIENTATION);
}

export function createUI() {
    //create tank
    let tank = new Menu("Assets/tank+barometer.png", vec2.fromValues( 0.75, -0.6), vec2.fromValues(0.4, 0.8));
    let pfeil = new Menu("Assets/anzeigepfeil.png", vec2.fromValues(-0.75,  -0.02), vec2.fromValues(0.18, 0.18), tank);
    pfeil.setOrientation(MIN_ORIENTATION);
    updateRegistry.registerUpdate("oxygen_scale", updateOxygen.bind(pfeil))
    //create barometer
    //add updates



}

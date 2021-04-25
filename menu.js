import {mat4, vec3, vec2, quat} from "./gl-matrix-min.js"
import {GameObject} from "./GameObject.js"
import {ui} from "./state.js"

export let Menu = function(spritePath, position, size, parent) {
    GameObject.call(this, spritePath, position, size, "ui", parent);
    ui.elements.push(this)
}
Menu.prototype = Object.create(GameObject.prototype);
Object.defineProperty(Menu.prototype, 'constructor', {
    value: Menu,
    enumerable: false, // so that it does not appear in 'for in' loop
    writable: true });


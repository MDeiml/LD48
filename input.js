//the three states of keys
let lastKeys = {};
let currentKeys = {};
let nextKeys = {};

//registers key tracking
export function init() {
    document.addEventListener("keydown", function(event) {
        nextKeys[event.code] = true;
        if (event.code == "Tab") {
            event.preventDefault(); //stop the browser from handling the keypress
        }
    });
    document.addEventListener("keyup", function(event) {
        delete nextKeys[event.code]; //this is delete so we can make checks on the collection which can be faster.
        if (event.code == "Tab") {
            event.preventDefault(); //stop the browser from handling the keypress
        }
    });
}

//move keys to new state
export function update() {
    lastKeys = Object.assign({}, currentKeys);
    currentKeys = Object.assign({}, nextKeys);
}

//check if the key is currently down
function key(code) {
    return code in currentKeys;
}

//checks if the key has been pressed last frame
function keyDown(code) {
    return code in currentKeys && !(code in lastKeys);
}

//CONTROLS STARTING HERE
export function swimmingLeft() {
	return key("KeyA") || key("ArrowLeft");
}

export function swimmingRight() {
	return key("KeyD") || key("ArrowRight");
}

export function swimmingUp() {
	return key("KeyW") || key("ArrowUp");
}

export function swimmingDown() {
	return key("KeyS") || key("ArrowDown");
}

export function menuLeft() {
	return keyDown("KeyA") || keyDown("ArrowLeft");
}

export function menuRight() {
	return keyDown("KeyD") || keyDown("ArrowRight");
}

export function menuUp() {
	return keyDown("KeyW") || keyDown("ArrowUp");
}

export function menuDown() {
	return keyDown("KeyS") || keyDown("ArrowDown");
}

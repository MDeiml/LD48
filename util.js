import {vec2} from "./gl-matrix-min.js";
import {MAP_WIDTH} from "./generation.js";

export const GRID_SIZE = 4;

export function mapToPixel(point) {
    let res = vec2.scale(vec2.create(), point, 1 / GRID_SIZE);
    res[0] += Math.floor(MAP_WIDTH / 2);
    res[1] += 1;
    return res;
}

export function pixelToMap(point) {
    let res = vec2.scale(vec2.create(), point, GRID_SIZE);
    res[0] -= Math.floor(MAP_WIDTH / 2) * GRID_SIZE;
    res[1] -= GRID_SIZE;
    return res;
}

//reads content from an element ID
export function readElements(id) {
	const elem = document.getElementById(id);
	let source = '';
	let child = elem.firstChild;
	while (child) {
		if (child.nodeType == 3) {
			source += child.textContent;
		}
		child = child.nextSibling;
	}

	return source
}

//reads json
export function readJSON(file, callback) {
	var rawFile = new XMLHttpRequest();
	rawFile.overrideMimeType("application/json");
	rawFile.open("GET", file, false);
	rawFile.onreadystatechange = function() {
		if (rawFile.readyState === 4 && rawFile.status == "200") {
			callback(rawFile.responseText);
		}
		else if (rawFile.status != "200")
		{
			alert("failed to load JSON file " + file)
		}
	}
	rawFile.send(null);
}

export function heartbeat(point) {
    let x = point % 6;
    return Math.max( -3 * Math.pow(x, 4.0) + 18.5 * Math.pow(x, 3.0) - 36 * Math.pow(x, 2.0) + 22.5 * x, 0) / 4.4;
}

let random_state = {
    S: [],
    i: 0,
    j: 0,
    k: 0,
}

export function set_seed(seed) {
    let seed_str = seed + "_salt"
    random_state.S = []
    random_state.i = 0
    random_state.j = 0
    random_state.k = 0

    for (let h = 0; h < 256; h++)
        random_state.S[h] = h

    for (let r = 0; r < 320; r++)
    {
        random_state.j = (random_state.j + random_state.S[random_state.i] + seed_str[r % seed_str.length].charCodeAt(0)) % 256
        random_state.k = (random_state.k ^ random_state.j) & 256
        let tmp = random_state.S[random_state.i]
        random_state.S[random_state.i] = random_state.S[random_state.j] % 256
        random_state.S[random_state.j] = random_state.S[random_state.k] % 256
        random_state.S[random_state.k] = tmp % 256
        random_state.i = (random_state.i + 1) % 256
    }
    random_state.i = random_state.j + random_state.k
}

export function random() {
    random_state.i = (random_state.i + 1) % 256
    random_state.j = (random_state.j + random_state.S[random_state.i]) % 256
    random_state.k = (random_state.k ^ random_state.j) % 256
    let tmp = random_state.S[random_state.i]
    random_state.S[random_state.i] = random_state.S[random_state.j] % 256
    random_state.S[random_state.j] = tmp % 256
    let m = (random_state.S[random_state.j] + random_state.S[random_state.k]) % 256
    let n = (random_state.S[random_state.i] + random_state.S[random_state.j]) % 256

    let res = (random_state.S[m] << 24 | random_state.S[n] << 16 | random_state.S[m ^ random_state.j] << 8 | random_state.S[n ^ random_state.k]) / Math.pow(2.0, 32.0)
    res += 0.5;

    return res;
}

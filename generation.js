import {random} from "./util.js"

const GEN_WIDTH = 8;
const GEN_HEIGHT = 64;
export const MAP_WIDTH = GEN_WIDTH * 2 + 1;
export const MAP_HEIGHT = GEN_HEIGHT * 2 + 1;

export function generateLevel() {
    let pixels = [];
    for (let i = 0; i < MAP_HEIGHT * MAP_WIDTH; i++) {
        pixels.push(true);
    }

    let current = GEN_WIDTH;
    let queue = {};
    let prev = {};
    while (true) {
        pixels[current] = false;
        let neighbours = [];
        if (current % MAP_WIDTH != 0 && pixels[current - 2]) {
            neighbours.push(current - 2);
        }
        if (current % MAP_WIDTH != MAP_WIDTH - 1 && pixels[current + 2]) {
            neighbours.push(current + 2);
        }
        if (Math.floor(current / MAP_WIDTH) != 0 && pixels[current - 2 * MAP_WIDTH]) {
            neighbours.push(current - 2 * MAP_WIDTH);
        }
        if (Math.floor(current / MAP_WIDTH) != MAP_HEIGHT - 1 && pixels[current + 2 * MAP_WIDTH]) {
            neighbours.push(current + 2 * MAP_WIDTH);
        }

        let next;
        if (neighbours.length == 0) {
            let keys = Object.keys(queue);
            if (keys.length == 0)
                break;
            next = +keys[Math.floor(random() * keys.length)];
            pixels[(next + queue[next]) / 2] = false;
            prev[next] = queue[next];
        } else {
            let rand = Math.floor(random() * neighbours.length)
            next = neighbours[rand];
            pixels[(next + current) / 2] = false;
            for (let i = 0; i < neighbours.length; i++) {
                queue[neighbours[i]] = current;
            }
            prev[next] = current;
        }
        delete queue[next];
        current = next;
    }

    for (let i = 0; i < pixels.length; i++) {
        if (Math.random() > i * 2 / pixels.length) {
            pixels[i] = false;
        }
    }

    return [pixels, prev];
}

import {player } from './state.js';
import { vec2 } from './gl-matrix-min.js'
import { GRID_SIZE } from './walking_squares.js';
import { MAP_WIDTH } from './generation.js';
import { swimmingAccelerate, swimmingDown, swimmingUp, swimmingLeft, swimmingRight } from './input.js';

//the global collection of sounds
let sounds = {}

//ambient Audio handles
export let music;

//TODO currently it is impossible to play the same audio from multiple positions
export let PositionalAudio = function(pos, name, loop) {
	this.name = name;
	sounds[name] = this; //register globally

	this.sound = new Audio(name);

	if (loop)
		this.sound.loop = true;

	this.pos = vec2.clone(pos);
}

//base audio functions
PositionalAudio.prototype.play = function() { this.sound.play(); }
PositionalAudio.prototype.pause = function() { this.sound.pause(); }
PositionalAudio.prototype.stop = function() {
	this.sound.pause();
	this.sound.currentTime = 0;
}
//set volume based on distance to audio source
PositionalAudio.prototype.update = function(listenPos) {
    this.sound.volume = 1 / Math.max(1, vec2.dist(listenPos, this.pos));
}

//manipulate position of audio source.
PositionalAudio.prototype.moveTo = function(newPos) { vec2.copy(this.pos, newPos); }
PositionalAudio.prototype.move = function(trans) { vec2.add(this.pos, this.pos, trans); }

//create ambient audio
export function initAudio() {
    music = [new Audio("./music/chords.ogg"), new Audio("./music/lead.ogg"), new Audio("./music/bass.ogg")];
    for (let i = 0; i < 3; i++) {
        music[i].loop = true;
        if (i != 0) music[i].volume = 0;
    }
}

export function playMusic() {
    for (let i = 0; i < 3; i++) {
        music[i].play();
    }
}

let lastTime = 0;
let randomPause = false;
//update volume of all positional sounds.
export function updateAudio(listener) {
    if (music[0].currentTime + 3 * (music[0].currentTime - lastTime) > music[0].duration || music[0].currentTime < lastTime) {
        music[1].volume = (!randomPause && player.position[0] > - (MAP_WIDTH + 1) * GRID_SIZE / 2) ? 0.5 : 0;
        music[2].volume = player.position[1] < - 32 * GRID_SIZE / 2 ? 0.8 : 0;
    }
    if (music[0].currentTime < lastTime) {
        randomPause = Math.random() < 0.2;
    }
    lastTime = music[0].currentTime;
	for (let soundID in sounds)
		if (typeof sounds[soundID].update === "function")
			sounds[soundID].update(listener);
}

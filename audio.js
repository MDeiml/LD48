import { vec2 } from './gl-matrix-min.js'

//the global collection of sounds
let sounds = {}

//ambient Audio handles
export let walk_wood = null;
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
}

//update volume of all positional sounds.
export function updateAudio(listener) {
	for (let soundID in sounds)
		if (typeof sounds[soundID].update === "function")
			sounds[soundID].update(listener);

}

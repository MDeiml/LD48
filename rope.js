import {level, player, updateRegistry} from "./state.js";
import {GameObject} from "./GameObject.js";
import {vec2} from "./gl-matrix-min.js";
import {handlePhysics} from "./physics.js";

let ropes = [];

export function cutRopes() {
    for (let rope of ropes) {
        for (let j = 0; j < rope.segments.length; j++) {
            level.removeObject(rope.segments[j]);
        }
    }
    ropes = [];
}

export function updateRopes(delta) {
    for (let rope of ropes) {
        rope.update(delta);
    }
}

export let Rope = function(asset) {
    this.segments = [];
    this.points = [];
    this.points_velocity = [];
    this.asset = asset;
    ropes.push(this);
}

Rope.prototype.addPoint = function(point) {
    this.points.push(point);
    this.points_velocity.push(vec2.fromValues(Math.random() * 0.1 - 0.05, Math.random() * 0.1 - 0.05));
    if (this.points.length >= 2) {
        let segment = new GameObject(this.asset, vec2.create(), vec2.fromValues(0.3, 1.05), "rope", null, vec2.fromValues(1, 1), vec2.fromValues(0, 0), 0);
        this.segments.push(segment);
        level.addObject(segment);
        this.updateSegment(this.segments.length - 1);
    }
}

Rope.prototype.updateSegment = function(index) {
    let ropeDir = vec2.sub(vec2.create(), this.points[index], this.points[index + 1]);
    let ropeDirLength = vec2.length(ropeDir);
    let angle = -Math.atan2(ropeDir[0], ropeDir[1]) / Math.PI * 180;
    let ropeMid = vec2.add(vec2.create(), this.points[index], this.points[index + 1]);
    vec2.scale(ropeMid, ropeMid, 0.5);
    this.segments[index].halfSize[1] = ropeDirLength / 2 * 1.05;
    this.segments[index].orientation = angle;
    this.segments[index].setPosition(ropeMid);
}

Rope.prototype.update = function(delta) {
    let updateLast = false;
    for (let i = 0; i < this.points.length; i++) {
        let updateCurrent = vec2.squaredDistance(this.points[i], player.position) < 15 * 15;
        if (i < 1 || i >= this.points.length - 2) {
            updateCurrent = false;
        }
        if (updateCurrent) {
            let dir = vec2.create();
            vec2.sub(dir, this.points[i - 1], this.points[i]);
            let dirLen = vec2.length(dir);
            vec2.scale(dir, dir, dirLen - 1);
            vec2.scaleAndAdd(this.points_velocity[i], this.points_velocity[i], dir, delta * 0.1);
            vec2.sub(dir, this.points[i + 1], this.points[i]);
            dirLen = vec2.length(dir);
            vec2.scale(dir, dir, dirLen - 1);
            vec2.scaleAndAdd(this.points_velocity[i], this.points_velocity[i], dir, delta * 0.1);
            vec2.scaleAndAdd(this.points[i], this.points[i], this.points_velocity[i], delta);
            this.points[i][1] = Math.min(this.points[i][1], 0);
            vec2.scale(this.points_velocity[i], this.points_velocity[i], Math.pow(0.9, delta));
            handlePhysics(delta, this.points[i], this.points_velocity[i], vec2.fromValues(0.2, 0.2));
        }
        if ((updateLast || updateCurrent) && i != 0) {
            this.updateSegment(i - 1);
        }
        updateLast = updateCurrent;
    }
}

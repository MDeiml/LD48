import {level} from "./state.js";
import {GameObject} from "./GameObject.js";
import {vec2} from "./gl-matrix-min.js";

export let Rope = function(asset) {
    this.segments = [];
    this.points = [];
    this.asset = asset;
}

Rope.prototype.addPoint = function(point) {
    this.points.push(point);
    if (this.points.length >= 2) {
        let segment = new GameObject(this.asset, vec2.create(), vec2.fromValues(0.3, 1.05), "rope", vec2.fromValues(1, 1), vec2.fromValues(0, 0), 0);
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

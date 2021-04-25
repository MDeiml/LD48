import { vec2 } from "./gl-matrix-min.js"
import { Sprite } from "./Sprite.js"

export const COLLIDABLE_GRID_SIZE = 4;

export let gl = null;
export function setGl(context) {
    gl = context;
}
export let player = null;
export function setPlayer(obj) {
    player = obj;
    level.addObject(player);
}

export let level = {
    collidables: {},
    objects: {
        "bubble": [],
        "collidable": [],
        "random_shit": [],
        "player": []
    },
	lights: new Array(180), //TODO move
    lightCnt: 2,
	updateLight: function(lightID, color, pos, dir, cutoff, intensity) {
		let startPos = lightID * 9;

		this.lights[startPos] = color[0]
		this.lights[startPos + 1] = color[1]
		this.lights[startPos + 2] = color[2]

		this.lights[startPos + 3] = pos[0]
		this.lights[startPos + 4] = pos[1]

		this.lights[startPos + 5] = dir[0]
		this.lights[startPos + 6] = dir[1]

		this.lights[startPos + 7] = cutoff

		this.lights[startPos + 8] = intensity
	},
    addObject: function(obj) {
        let type = obj.type;
        if (!type) {
            type = "default";
        }
        if (this.objects[type] === undefined) {
            this.objects[type] = [];
        }
        if (type == "collidable") {
            let coords = vec2.scale(vec2.create(), obj.position, 1/COLLIDABLE_GRID_SIZE);
            vec2.round(coords, coords);
            if (this.collidables[coords] === undefined) {
                this.collidables[coords] = [obj]
            } else {
                this.collidables.push(obj);
            }
        }
        this.objects[type].push(obj);
    }

};

export let updateRegistry = {
	updateList : {},
	registerUpdate : function(name, callback) {
		this.updateList[name] = callback;
	},
	unregisterUpdate : function(name) {
		delete this.updateList[name];
	},
	update : function(delta) {
		for (let updateName in this.updateList)
			this.updateList[updateName](delta);
	},
}

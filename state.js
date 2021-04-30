import { vec2 } from "./gl-matrix-min.js"
import { Sprite } from "./Sprite.js"
import { GRID_SIZE } from "./util.js"

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
    time: 0,
    upsideDown: false,
    collidables: {},
    checkpoint: false,
    objects: {
        "bubble": [],
        "collidable": [],
        "random_shit": [],
        "jelly": [],
        "player": [],
        "big_fish": [],
        "background_surface": [],
        "background-parallax": [],
        "fish": []
    },
	lights: new Array(36), //TODO move
    lightCnt: 4,
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
        if (type == "collidable" || type == "bubbles") {
            let coords = vec2.scale(vec2.create(), obj.getPosition(), 1/GRID_SIZE);
            vec2.round(coords, coords);
            if (this.collidables[coords] === undefined) {
                this.collidables[coords] = [obj]
            } else {
                this.collidables[coords].push(obj);
            }
        }

        this.objects[type].push(obj);
    },
    removeObject: function(obj) {
        let type = obj.type;
        if (type == "collidable" || type == "bubbles") {
            let coords = vec2.scale(vec2.create(), obj.getPosition(), 1/GRID_SIZE);
            vec2.round(coords, coords);
            let objPos = null
            for (let index in this.collidables[coords]) {
                if (this.collidables[coords][index] === obj) {
                    objPos = index;
                    break;
                }
            }
            this.collidables[coords].splice(objPos,1);
        }
        let objPos = null
        for (let index in this.objects[type]) {
            if (this.objects[type][index] === obj) {
                objPos = index;
                break;
            }
        }
        this.objects[type].splice(objPos,1);
    },
    clear: function() {
        for (let type in this.objects) {
            this.objects[type] = [];
        }
        this.collidables = {};
        this.time = 0;
    }
};

export let ui = {
    elements: [],
    updateAspects: function(aspect) {
        for (let element of this.elements) {
            if (element.base_pos) {
                element.setPosition(vec2.fromValues(element.base_pos[0] * aspect / 2, element.base_pos[1]))
            }
        }
    }
}

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

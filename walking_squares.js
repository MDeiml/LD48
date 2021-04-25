import {CollidableGameObject, AnimatedGameObject, GameObject, Transformation} from "./GameObject.js"
import {level} from "./state.js"
import {MAP_WIDTH, MAP_HEIGHT} from "./generation.js"
import {vec2} from "./gl-matrix-min.js"
import {Coral} from "./interactable.js"
import {Rope} from "./rope.js";

function initTileAssets() {
    //TODO init array for tiles. Could be optimized out
}

export const GRID_SIZE = 4; // when changing also check state.js COLLIDABLE_GRID_SIZE
const COLLISION_SHAPES = {
    tl : [[vec2.fromValues(-0.5 * GRID_SIZE, 0), vec2.fromValues(0, 0.5 * GRID_SIZE)]],
    tr : [[vec2.fromValues(0, 0.5 * GRID_SIZE), vec2.fromValues(0.5 * GRID_SIZE, 0)]],
    bl : [[vec2.fromValues(-0.5 * GRID_SIZE, 0), vec2.fromValues(0, -0.5 * GRID_SIZE)]],
    br : [[vec2.fromValues(0, -0.5 * GRID_SIZE), vec2.fromValues(0.5 * GRID_SIZE, 0)]],
    vert : [[vec2.fromValues(0, -0.5 * GRID_SIZE), vec2.fromValues(0, 0.5 * GRID_SIZE)]],
    hor : [[vec2.fromValues(-0.5 * GRID_SIZE, 0), vec2.fromValues(0.5 * GRID_SIZE, 0)]],
    corrL : [[vec2.fromValues(-0.5 * GRID_SIZE, 0), vec2.fromValues(0, 0.5 * GRID_SIZE)], [vec2.fromValues(0, -0.5 * GRID_SIZE), vec2.fromValues(0.5 * GRID_SIZE, 0)]],
    corrR : [[vec2.fromValues(0, 0.5 * GRID_SIZE), vec2.fromValues(0.5 * GRID_SIZE, 0)], [vec2.fromValues(-0.5 * GRID_SIZE, 0), vec2.fromValues(0, -0.5 * GRID_SIZE)]],
}
function spawnAlgaeAt(pos, size) {
    level.addObject(new AnimatedGameObject(
        "./Assets/animationen/alge_anim.png",
        pos,
        vec2.fromValues(size, size),
        "plant",
        2,
        25 + Math.floor(Math.random(15))
    ));
}
function spawnCoralAt(pos, size) {

    level.addObject(new Coral( pos, size));
}

export function computeSquareMap(map_data) {
    let scanlineArr = map_data[0];
    let prev = map_data[1];

    let side_offset = Math.floor(MAP_WIDTH / 2) * GRID_SIZE; //offset cube objects so that they start at the middle
    let depth_offset = GRID_SIZE;

    // TODO: besserer start knoten
    let current = 0 + MAP_WIDTH * MAP_HEIGHT - 1;
    let x = current % MAP_WIDTH;
    let y = Math.floor(current / MAP_WIDTH);
    let rope = new Rope("./Assets/rope_g.png");
    rope.addPoint(vec2.fromValues(x * GRID_SIZE - 0.5 * GRID_SIZE - side_offset, -(y * GRID_SIZE - 0.5 * GRID_SIZE + depth_offset)));
    let randomOffset = vec2.create();
    while (prev[current]) {
        let x = current % MAP_WIDTH;
        let y = Math.floor(current / MAP_WIDTH);
        let nextX = prev[current] % MAP_WIDTH;
        let nextY = Math.floor(prev[current] / MAP_WIDTH);
        const N = 2 * GRID_SIZE;
        for (let i = 0; i < N; i++) {
            let nextRopePoint = vec2.fromValues((x + (nextX - x) * ((i + 1) / N)) * GRID_SIZE - 0.5 * GRID_SIZE - side_offset, -((y + (nextY - y) * ((i + 1) / N)) * GRID_SIZE - 0.5 * GRID_SIZE + depth_offset));
            vec2.add(randomOffset, randomOffset, vec2.fromValues(Math.random() - 0.5, Math.random() -  0.5));
            vec2.scale(randomOffset, randomOffset, 0.5);
            vec2.add(nextRopePoint, nextRopePoint, randomOffset);
            rope.addPoint(nextRopePoint);
        }
        current = prev[current];
    }

    for (let h = 0; h < MAP_HEIGHT - 1; h++) {
        for (let w = -1; w < MAP_WIDTH; w++) {
            let tl = 1;
            let bl = 1;

            let tr = 1;
            let br = 1;

            if (w >= 0)
            {
                tl = scanlineArr[w + h * MAP_WIDTH] ? 1 : 0;
                bl = scanlineArr[w + (h + 1) * MAP_WIDTH] ? 1 : 0;
            }

            if (w < MAP_WIDTH - 1)
            {
                tr = scanlineArr[w + 1 + h * MAP_WIDTH] ? 1 : 0;
                br = scanlineArr[w + 1 + (h + 1) * MAP_WIDTH] ? 1 : 0;
            }

            let type = tl + tr + bl + br;
            let transform = null;
            let shape = null;
            switch(type) {
                case 0:       //open space
                    break;
                case 1:       //corner
                    if (tl == 1) {
                        transform = Transformation.TOP_LEFT
                        shape = COLLISION_SHAPES.tl
                    } else if (tr == 1) {
                        transform = Transformation.TOP_RIGHT
                        shape = COLLISION_SHAPES.tr
                    } else if (bl == 1) {
                        transform = Transformation.BOTTOM_LEFT
                        shape = COLLISION_SHAPES.bl
                        let n = Math.random() * 2;
                        for (let i = 0; i < n; i++) {
                            let size = Math.random() * 0.4 + 0.8;
                            let x = Math.random() * 0.5;
                            spawnAlgaeAt(vec2.fromValues(w * GRID_SIZE - side_offset + (x - 0.5) * GRID_SIZE, -(h * GRID_SIZE + depth_offset) + size / 2 - x * GRID_SIZE), size);
                        }
                        if (Math.random() < 2)
                        {
                            let size = Math.random() * 0.4 + 0.8;
                            let x = Math.random() * 0.5;
                            spawnCoralAt(vec2.fromValues(w * GRID_SIZE - side_offset + (x - 0.5) * GRID_SIZE, -(h * GRID_SIZE + depth_offset) + size / 2 - x * GRID_SIZE), size);
                        }

                    } else if (br == 1) {
                        transform = Transformation.BOTTOM_RIGHT;
                        shape = COLLISION_SHAPES.br;
                        let n = Math.random() * 2;
                        for (let i = 0; i < n; i++) {
                            let size = Math.random() * 0.4 + 0.8;
                            let x = Math.random() * 0.5;
                            spawnAlgaeAt(vec2.fromValues(w * GRID_SIZE - side_offset + x * GRID_SIZE, -(h * GRID_SIZE + depth_offset) + size / 2 - (0.5 - x) * GRID_SIZE), size);
                        }
                        if (Math.random() < 2)
                        {
                            let size = Math.random() * 0.4 + 0.8;
                            let x = Math.random() * 0.5;
                            spawnCoralAt(vec2.fromValues(w * GRID_SIZE - side_offset + x * GRID_SIZE, -(h * GRID_SIZE + depth_offset) + size / 2 - (0.5 - x) * GRID_SIZE), size);
                        }
                    }

                    level.addObject(new CollidableGameObject(
                        "Segments/1000.png",
                        vec2.fromValues(w * GRID_SIZE - side_offset, -(h * GRID_SIZE + depth_offset)),
                        vec2.fromValues(GRID_SIZE, GRID_SIZE),
                        shape,
                        vec2.fromValues(1, 1),
                        vec2.fromValues(0, 0),
                        transform
                    ));
                    break;
                case 2:       //wall or corridor
                    if ((tl == br) && (tr == bl)) { //corridor
                        shape = []
                        if (Math.random() > 0.5) {
                            if (tl == 1) {
                                shape = COLLISION_SHAPES.corrL
                            } else {
                                shape = COLLISION_SHAPES.corrR
                            }
                            level.addObject(new CollidableGameObject(
                                "Segments/0101_e.png",
                                vec2.fromValues(w * GRID_SIZE - side_offset, -(h * GRID_SIZE + depth_offset)),
                                vec2.fromValues(GRID_SIZE, GRID_SIZE),
                                shape,
                                vec2.fromValues(1, 1),
                                vec2.fromValues(0, 0),
                                tl == 1 ? Transformation.TOP_RIGHT : Transformation.TOP_LEFT
                            ));
                        } else {
                            if (tl == 1) {
                                shape = COLLISION_SHAPES.corrR
                            } else {
                                shape = COLLISION_SHAPES.corrL
                            }
                            level.addObject(new CollidableGameObject(
                                "Segments/1010_f.png",
                                vec2.fromValues(w * GRID_SIZE - side_offset, -(h * GRID_SIZE + depth_offset)),
                                vec2.fromValues(GRID_SIZE, GRID_SIZE),
                                shape,
                                vec2.fromValues(1, 1),
                                vec2.fromValues(0, 0),
                                tl == 0 ? Transformation.TOP_RIGHT : Transformation.TOP_LEFT
                            ));
                        }
                    }
                    else {
                        if (tl == 1 && tr == 1) {
                            transform = Transformation.TOP_LEFT;
                            shape = COLLISION_SHAPES.hor;
                        } else if (tr == 1 && br == 1) {
                            transform = Transformation.TOP_RIGHT;
                            shape = COLLISION_SHAPES.vert;
                        } else if (br == 1 && bl == 1) {
                            transform = Transformation.BOTTOM_RIGHT;
                            shape = COLLISION_SHAPES.hor;
                            let n = Math.random() * 3;
                            for (let i = 0; i < n; i++) {
                                let size = Math.random() * 0.4 + 0.8;
                                spawnAlgaeAt(vec2.fromValues(w * GRID_SIZE - side_offset + (Math.random() - 0.5) * GRID_SIZE, -(h * GRID_SIZE + depth_offset) + size / 2), size);
                            }
                            if (Math.random() < 2)
                            {
                                let size = Math.random() * 0.4 + 0.8;
                                let x = Math.random() * 0.5;
                                spawnCoralAt(vec2.fromValues(w * GRID_SIZE - side_offset + (Math.random() - 0.5) * GRID_SIZE, -(h * GRID_SIZE + depth_offset) + size / 2), size);
                            }
                        } else if (bl == 1 && tl == 1) {
                            transform = Transformation.BOTTOM_LEFT;
                            shape = COLLISION_SHAPES.vert;
                        }

                        level.addObject(new CollidableGameObject(
                            "Segments/1100.png",
                            vec2.fromValues(w * GRID_SIZE - side_offset, -(h * GRID_SIZE + depth_offset)),
                            vec2.fromValues(GRID_SIZE, GRID_SIZE),
                            shape,
                            vec2.fromValues(1, 1),
                            vec2.fromValues(0, 0),
                            transform
                        ));
                    }
                    break;
                case 3:       //inverted corner
                    if (tl == 0) {
                        transform = Transformation.TOP_LEFT
                        shape = COLLISION_SHAPES.tl;
                        let n = Math.random() * 2;
                        for (let i = 0; i < n; i++) {
                            let size = Math.random() * 0.4 + 0.8;
                            let x = Math.random() * 0.5;
                            spawnAlgaeAt(vec2.fromValues(w * GRID_SIZE - side_offset + (x - 0.5) * GRID_SIZE, -(h * GRID_SIZE + depth_offset) + size / 2 + x * GRID_SIZE), size);
                        }
                        if (Math.random() < 2)
                        {
                            let size = Math.random() * 0.4 + 0.8;
                            let x = Math.random() * 0.5;
                            spawnCoralAt(vec2.fromValues(w * GRID_SIZE - side_offset + (x - 0.5) * GRID_SIZE, -(h * GRID_SIZE + depth_offset) + size / 2 + x * GRID_SIZE), size);
                        }
                    } else if (tr == 0) {
                        transform = Transformation.TOP_RIGHT
                        shape = COLLISION_SHAPES.tr;
                        let n = Math.random() * 2;
                        for (let i = 0; i < n; i++) {
                            let size = Math.random() * 0.4 + 0.8;
                            let x = Math.random() * 0.5;
                            spawnAlgaeAt(vec2.fromValues(w * GRID_SIZE - side_offset + x * GRID_SIZE, -(h * GRID_SIZE + depth_offset) + size / 2 - (x - 0.5) * GRID_SIZE), size);
                        }
                        if (Math.random() < 2)
                        {
                            let size = Math.random() * 0.4 + 0.8;
                            let x = Math.random() * 0.5;
                            spawnCoralAt(vec2.fromValues(w * GRID_SIZE - side_offset + x * GRID_SIZE, -(h * GRID_SIZE + depth_offset) + size / 2 - (x - 0.5) * GRID_SIZE), size);
                        }
                    } else if (bl == 0) {
                        transform = Transformation.BOTTOM_LEFT
                        shape = COLLISION_SHAPES.bl;
                    } else if (br == 0) {
                        transform = Transformation.BOTTOM_RIGHT
                        shape = COLLISION_SHAPES.br;
                    }

                    level.addObject(new CollidableGameObject(
                        "Segments/0111.png",
                        vec2.fromValues(w * GRID_SIZE - side_offset, -(h * GRID_SIZE + depth_offset)),
                        vec2.fromValues(GRID_SIZE, GRID_SIZE),
                        shape,
                        vec2.fromValues(1, 1),
                        vec2.fromValues(0, 0),
                        transform
                    ));
                    break;
                case 4:       //solid wall
                    level.addObject(new CollidableGameObject(
                        "Segments/1111.png",
                        vec2.fromValues(w * GRID_SIZE - side_offset, -(h * GRID_SIZE + depth_offset)),
                        vec2.fromValues(GRID_SIZE, GRID_SIZE),
                        [],
                        vec2.fromValues(1, 1),
                        vec2.fromValues(0, 0),
                        transform
                    ));
                    break;
            }
        }
    }
}

import {CollidableGameObject, GameObject, Transformation} from "./GameObject.js"
import {level} from "./state.js"
import {MAP_WIDTH, MAP_HEIGHT} from "./generation.js"
import {vec2} from "./gl-matrix-min.js"

function initTileAssets() {
    //TODO init array for tiles. Could be optimized out
}

export const GRID_SIZE = 4;
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

export function computeSquareMap(scanlineArr) {

    let side_offset = Math.floor(MAP_WIDTH / 2) * GRID_SIZE; //offset cube objects so that they start at the middle
    let depth_offset = GRID_SIZE;

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
                    } else if (br == 1) {
                        transform = Transformation.BOTTOM_RIGHT
                        shape = COLLISION_SHAPES.br
                    }

                    level.addObject(new CollidableGameObject(
                        "Segments/0010.png",
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
                                level.addObject(new GameObject(
                                    Math.random() > 0.5 ? "./Assets/animationen/alge1.png" : "./Assets/animationen/alge2.png",
                                    vec2.fromValues(w * GRID_SIZE - side_offset + (Math.random() - 0.5) * GRID_SIZE, -(h * GRID_SIZE + depth_offset) + size / 2),
                                    vec2.fromValues(size, size),
                                    "plant"
                                ));
                            }
                        } else if (bl == 1 && tl == 1) {
                            transform = Transformation.BOTTOM_LEFT;
                            shape = COLLISION_SHAPES.vert;
                        }

                        level.addObject(new CollidableGameObject(
                            "Segments/0011.png",
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
                    } else if (tr == 0) {
                        transform = Transformation.TOP_RIGHT
                        shape = COLLISION_SHAPES.tr;
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

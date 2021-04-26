import {CollidableGameObject, AnimatedGameObject, GameObject, Transformation} from "./GameObject.js"
import {level} from "./state.js"
import {MAP_WIDTH, MAP_HEIGHT} from "./generation.js"
import {vec2} from "./gl-matrix-min.js"
import {Coral} from "./interactable.js"
import {Rope} from "./rope.js";
import {GRID_SIZE as U_GRID_SIZE} from "./util.js";

export const MAX_ALGAE_PER_UNIT = 2
export const CORAL_PROBABILITY = 0.6
export const GRID_SIZE = U_GRID_SIZE; // when changing also check state.js COLLIDABLE_GRID_SIZE
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

const tutorial_map = [[
        true, false, true, true, true, true, true,
        true, false, true, true, true, false, false,
        true, false, true, true, false, false, true,
        true, false, true, false, false, true, true,
        true, false, true, false, true, true, true,
        true, false, true, false, true, true, true,
        true, false, false, false, true, true, true,
        true, true, true, true, true, true, true,
        true, true, true, true, true, true, true,
        true, true, true, true, true, true, true
]]

export function generateTutorial() {
    let tut_background = new GameObject("Assets/background_blue.png", vec2.fromValues(-(MAP_WIDTH + 9)/2 * GRID_SIZE, -7 * GRID_SIZE), vec2.fromValues( 15 * GRID_SIZE, 7 * GRID_SIZE), "background")
    tut_background.setOrientation(270)
    level.addObject(tut_background)
    computeSquareMap(tutorial_map, 7, 10, (MAP_WIDTH + 9) * GRID_SIZE/2, -GRID_SIZE, false, 0, false);
    let collision_coords = vec2.fromValues(-(MAP_WIDTH + 1)/2, -2);
    vec2.round(collision_coords, collision_coords);


    let side_offset = Math.floor(7 / 2) * GRID_SIZE + MAP_WIDTH + 9 * GRID_SIZE/2; //offset cube objects so that they start at the middle
    let depth_offset = GRID_SIZE - GRID_SIZE;

    let size = 2;
    spawnCoralAt(vec2.fromValues(-(MAP_WIDTH + 12)/2 * GRID_SIZE, -5.76 * GRID_SIZE), size);

    //console.log(Object.keys(level.collidables))

    //for (let x = 0; x <= 1; x++) {
        //for (let y = 0; y <= 1; y++) {
            //for (let obj of level.collidables[vec2.fromValues(collision_coords[0] - x, collision_coords[1] - y)])
            //{
                //if (obj.type == "collidable")
                //{
                    //The Edge Objects
                //}
            //}
        //}
    //}
    //Collision Boxes: (-9, -3); (-9, -2)
}

export function generateRopePath(map_data) {
    let prev = map_data[1];
    let pixels = map_data[0];

    let side_offset = Math.floor(MAP_WIDTH / 2) * GRID_SIZE; //offset cube objects so that they start at the middle
    let depth_offset = GRID_SIZE;

    let y = Math.floor(MAP_HEIGHT / 2);
    y += y % 2;
    let x;
    let start;
    let current;
    for (let i = 0; i < 100; i++) {
        x = Math.floor(Math.random() * MAP_WIDTH);
        x += x % 2;
        start = x + MAP_WIDTH * y;
        current = start;

        const MAX_DEPTH = MAP_HEIGHT / 2 + 3;

        while (prev[current]) { //stuck. Terminates when 0
            let y = Math.floor(current / MAP_WIDTH);
            if (y > MAX_DEPTH) {
                start = prev[current];
            }
            current = prev[current];
            console.log(current)
        }
        if (pixels[start + MAP_WIDTH]) {
            break;
        }
    }
    current = start;
    x = current % MAP_WIDTH;
    y = Math.floor(current / MAP_WIDTH);

    let target_pos = vec2.fromValues(x * GRID_SIZE - 0.5 * GRID_SIZE - side_offset, -(y * GRID_SIZE - 0.5 * GRID_SIZE + depth_offset) - 1.5);
    level.addObject(new GameObject("./Assets/leiche.png", target_pos, vec2.fromValues(1, 1), "target"));
    let rope = new Rope("./Assets/rope_g.png");
    rope.addPoint(vec2.fromValues(x * GRID_SIZE - 0.5 * GRID_SIZE - side_offset, -(y * GRID_SIZE - 0.5 * GRID_SIZE + depth_offset) - 1.5));
    let randomOffset = vec2.fromValues(0, -1.5);
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

}

export function computeSquareMap(map_data, width = MAP_WIDTH, height = MAP_HEIGHT, side_off = 0, depth_off = 0, genHoleLeft = true, hole_height = -1, spawn_deco = true) {
    let scanlineArr = map_data[0];
    let side_offset = Math.floor(width / 2) * GRID_SIZE + side_off; //offset cube objects so that they start at the middle
    let depth_offset = GRID_SIZE + depth_off;

    for (let h = -2; h < height; h++) {
        for (let w = -1; w < width; w++) {
            let tl = 1;
            let bl = 1;

            let tr = 1;
            let br = 1;

            if (w >= 0)
            {
                tl = scanlineArr[w + h * width] ? 1 : 0;
                if (h < height - 1)
                    bl = scanlineArr[w + (h + 1) * width] ? 1 : 0;
            }
            else if(genHoleLeft)
            {
                if (h == hole_height) {
                    bl = 0;
                }
                else if (h == hole_height + 1) {
                    tl = 0;
                }
            }

            if (w < width - 1)
            {
                tr = scanlineArr[w + 1 + h * width] ? 1 : 0;
                if (h < height - 1)
                    br = scanlineArr[w + 1 + (h + 1) * width] ? 1 : 0;
            }
            else if (!genHoleLeft)
            {
                if (h == hole_height) {
                    br = 0;
                }
                else if (h == hole_height + 1) {
                    tr = 0;
                }
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

                        if (spawn_deco) {
                            let n = Math.random() * MAX_ALGAE_PER_UNIT;
                            for (let i = 0; i < n; i++) {
                                let size = Math.random() * 0.4 + 0.8;
                                let x = Math.random() * 0.5;
                                spawnAlgaeAt(vec2.fromValues(w * GRID_SIZE - side_offset + (x - 0.5) * GRID_SIZE, -(h * GRID_SIZE + depth_offset) + size / 2 - x * GRID_SIZE), size);
                            }
                            if (Math.random() < CORAL_PROBABILITY)
                            {
                                let size = Math.random() * 0.4 + 0.8;
                                let x = Math.random() * 0.5;
                                spawnCoralAt(vec2.fromValues(w * GRID_SIZE - side_offset + (x - 0.5) * GRID_SIZE, -(h * GRID_SIZE + depth_offset) + size / 2 - x * GRID_SIZE), size);
                            }
                        }
                    } else if (br == 1) {
                        transform = Transformation.BOTTOM_RIGHT;
                        shape = COLLISION_SHAPES.br;
                        if (spawn_deco) {
                            let n = Math.random() * MAX_ALGAE_PER_UNIT;
                            for (let i = 0; i < n; i++) {
                                let size = Math.random() * 0.4 + 0.8;
                                let x = Math.random() * 0.5;
                                spawnAlgaeAt(vec2.fromValues(w * GRID_SIZE - side_offset + x * GRID_SIZE, -(h * GRID_SIZE + depth_offset) + size / 2 - (0.5 - x) * GRID_SIZE), size);
                            }
                            if (Math.random() < CORAL_PROBABILITY)
                            {
                                let size = Math.random() * 0.4 + 0.8;
                                let x = Math.random() * 0.5;
                                spawnCoralAt(vec2.fromValues(w * GRID_SIZE - side_offset + x * GRID_SIZE, -(h * GRID_SIZE + depth_offset) + size / 2 - (0.5 - x) * GRID_SIZE), size);
                            }
                        }
                    }

                    level.addObject(new CollidableGameObject(
                        "Segments/1000.png",
                        vec2.fromValues(w * GRID_SIZE - side_offset, -(h * GRID_SIZE + depth_offset)),
                        vec2.fromValues(GRID_SIZE, GRID_SIZE),
                        shape,
                        null,
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
                                null,
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
                                null,
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
                            if (spawn_deco) {
                                let n = Math.random() * 1.5 * MAX_ALGAE_PER_UNIT;
                                for (let i = 0; i < n; i++) {
                                    let size = Math.random() * 0.4 + 0.8;
                                    spawnAlgaeAt(vec2.fromValues(w * GRID_SIZE - side_offset + (Math.random() - 0.5) * GRID_SIZE, -(h * GRID_SIZE + depth_offset) + size / 2), size);
                                }
                                if (Math.random() < CORAL_PROBABILITY)
                                {
                                    let size = Math.random() * 0.4 + 0.8;
                                    let x = Math.random() * 0.5;
                                    spawnCoralAt(vec2.fromValues(w * GRID_SIZE - side_offset + (Math.random() - 0.5) * GRID_SIZE, -(h * GRID_SIZE + depth_offset) + size / 2), size);
                                }
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
                            null,
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
                        if (spawn_deco) {
                            let n = Math.random() * MAX_ALGAE_PER_UNIT;
                            for (let i = 0; i < n; i++) {
                                let size = Math.random() * 0.4 + 0.8;
                                let x = Math.random() * 0.5;
                                spawnAlgaeAt(vec2.fromValues(w * GRID_SIZE - side_offset + (x - 0.5) * GRID_SIZE, -(h * GRID_SIZE + depth_offset) + size / 2 + x * GRID_SIZE), size);
                            }
                            if (Math.random() < CORAL_PROBABILITY)
                            {
                                let size = Math.random() * 0.4 + 0.8;
                                let x = Math.random() * 0.5;
                                spawnCoralAt(vec2.fromValues(w * GRID_SIZE - side_offset + (x - 0.5) * GRID_SIZE, -(h * GRID_SIZE + depth_offset) + size / 2 + x * GRID_SIZE), size);
                            }
                        }
                    } else if (tr == 0) {
                        transform = Transformation.TOP_RIGHT
                        shape = COLLISION_SHAPES.tr;
                        if (spawn_deco) {
                            let n = Math.random() * MAX_ALGAE_PER_UNIT;
                            for (let i = 0; i < n; i++) {
                                let size = Math.random() * 0.4 + 0.8;
                                let x = Math.random() * 0.5;
                                spawnAlgaeAt(vec2.fromValues(w * GRID_SIZE - side_offset + x * GRID_SIZE, -(h * GRID_SIZE + depth_offset) + size / 2 - (x - 0.5) * GRID_SIZE), size);
                            }
                            if (Math.random() < CORAL_PROBABILITY)
                            {
                                let size = Math.random() * 0.4 + 0.8;
                                let x = Math.random() * 0.5;
                                spawnCoralAt(vec2.fromValues(w * GRID_SIZE - side_offset + x * GRID_SIZE, -(h * GRID_SIZE + depth_offset) + size / 2 - (x - 0.5) * GRID_SIZE), size);
                            }
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
                        null,
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
                        null,
                        vec2.fromValues(1, 1),
                        vec2.fromValues(0, 0),
                        transform
                    ));
                    break;
            }
        }
    }
}

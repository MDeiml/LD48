import {CollidableGameObject} from "./GameObject.js"
import {level} from "./state.js"

function initTileAssets() {
    //TODO init array for tiles. Could be optimized out
}

export let Transformation = {
    TOP_LEFT: 0,
    TOP_RIGHT: 1, //rotate +90 deg
    BOTTOM_LEFT: 2 //rotate 180 deg
    BOTTOM_RIGHT: 1, //rotate -90 deg
}

function computeSquareMap(scanlineArr, width, height) {
    
    let side_offset = floor(width / 2) //offset cube objects so that they start at the middle
    let depth_offset = 1
    
    for (let h = 0; h < height - 1; h++) {
        for (let w = 0; w < width - 1; w++) {
            let tl = scanlineArr[w + h * width] ? 1 : 0;
            let tr = scanlineArr[w + 1 + h * width] ? 1 : 0;
            let bl = scanlineArr[w + (h + 1) * width] ? 1 : 0;
            let br = scanlineArr[w + 1 + (h + 1) * width] ? 1 : 0;
            
            let type = tl + tr + bl + br;
            switch(type) {
                case 0:       //open space
                    break;
                case 1:       //corner
                    let transform = null;
                    if (tl == 1)
                        transform = Transformation.TOP_LEFT
                    else if (tr == 1)
                        transform = Transformation.TOP_RIGHT
                    else if (bl == 1)
                        transform = Transformation.BOTTOM_LEFT
                    else if (br == 1)
                        transform = Transformation.BOTTOM_RIGHT
                    
                    level.objects.push(new CollidableGameObject("corner.png", vec2.fromValues(w - side_offset, -(h + depth_offset)), vec2.size(10, 10)))
                    break;
                case 2:       //wall or corridor
                    if ((tl == br) && (tr == bl)) { //corridor
                        level.objects.push(new CollidableGameObject("corridor.png", vec2.fromValues(w - side_offset, -(h + depth_offset)), vec2.size(10, 10)))
                    }
                    else {
                        level.objects.push(new CollidableGameObject("wall.png", vec2.fromValues(w - side_offset, -(h + depth_offset)), vec2.size(10, 10)))
                    }
                    break;
                case 3:       //inverted corner
                    let transform = null;
                    if (tl == 0)
                        transform = Transformation.TOP_LEFT
                    else if (tr == 0)
                        transform = Transformation.TOP_RIGHT
                    else if (bl == 0)
                        transform = Transformation.BOTTOM_LEFT
                    else if (br == 0)
                        transform = Transformation.BOTTOM_RIGHT
                    
                    level.objects.push(new CollidableGameObject("corner.png", vec2.fromValues(w - side_offset, -(h + depth_offset)), vec2.size(10, 10)))
                    break;
                case 4:       //solid wall
                    level.objects.push(new CollidableGameObject("wall.png", vec2.fromValues(w - side_offset, -(h + depth_offset)), vec2.size(10, 10)))
                    break;
            }
        }
    }
}

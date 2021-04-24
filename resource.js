import {Texture2D} from "../Sprite.js"

// ls -1 assets/* | xargs printf "%s",\n
let preload_textures = [
"Segments/0010.png",
"Segments/0011.png",
"Segments/0111.png"

];

export function init(callback) {
    let loading = preload_textures.length;
    for (let path of preload_textures) {
        new Texture2D(path, null, function() {
            loading--;
            if (loading <= 0) {
                callback();
            }
        });
    }
}

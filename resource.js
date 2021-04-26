import {Texture2D} from "./Sprite.js"

// ls -1 assets/* | xargs printf "%s",\n
let preload_textures = [
    //segments
    "Segments/1000.png",
    "Segments/1100.png",
    "Segments/0101_e.png",
    "Segments/1010_f.png",
    "Segments/1111.png",
    "Segments/0111.png",

    //deco
    "Assets/animationen/qualle_anim.png",
    "Assets/bubble-alt.png",
    "Assets/bubble.png",
    "Assets/luftblase_koralle.png",
    "Assets/animationen/koralle_anim.png",
    "Assets/animationen/alge_anim.png",
    "Assets/leiche.png",
    "Assets/rope_g.png",

    //taucher
    "Assets/animationen/taucher-animation.png",
    "Assets/animationen/idle_anim.png",
    "Assets/rope.png",

    //fishes
    "Assets/fish1/pussy_anim.png",
    "Assets/fish1/koi_anim.png",
    "Assets/fish1/angelfish.png",
    "Assets/fish1/salmon.png",
    "Assets/fish2/shark_anim.png",
    "Assets/fish2/guppy.png",
    "Assets/fish2/wels.png",
    "Assets/fish2/clownfish.png",
    "Assets/fish4/anglerfisch_anim.png",
    "Assets/fish3/pirania.png",
    "Assets/fish3/eel_anim.png",
    "Assets/fish3/blobfish.png",

    //background
    "Assets/background_blue.png",
    "Assets/hintergrund-leer.png",
    "Assets/hintergrund-boot-leer.png",
    "Assets/background2.png",

    //ui
    "Assets/frame.png",
    "Assets/tank+barometer.png",
    "Assets/anzeigepfeil.png",


    //sounds
    //"Assets/audio/bubble_pop.wav",
    //"Assets/audio/blubbles_breath1.wav",
    //"Assets/audio/blubbles_breath2.wav",
    //"Assets/audio/blubbles_breath3.wav",
    //"Assets/audio/breath1.wav",
    //"Assets/audio/breath2.wav",
    //"Assets/audio/breath3.wav",
    //"Assets/audio/death_short1.wav"
]


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

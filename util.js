
//reads content from an element ID
export function readElements(id) {
	const elem = document.getElementById(id);
	let source = '';
	let child = elem.firstChild;
	while (child) {
		if (child.nodeType == 3) {
			source += child.textContent;
		}
		child = child.nextSibling;
	}
	
	return source
}

//reads json
export function readJSON(file, callback) {
	var rawFile = new XMLHttpRequest();
	rawFile.overrideMimeType("application/json");
	rawFile.open("GET", file, false);
	rawFile.onreadystatechange = function() {
		if (rawFile.readyState === 4 && rawFile.status == "200") {
			callback(rawFile.responseText);
		}
		else if (rawFile.status != "200")
		{
			alert("failed to load JSON file " + file)
		}
	}
	rawFile.send(null);
}

let random_state = {
    S: [],
    i: 0,
    j: 0,
    k: 0,
}

export function set_seed(seed) {
    seed_str = seed + "_salt"
    random_state.S = []
    random_state.i = 0
    random_state.j = 0
    random_state.k = 0

    for (let h = 0; h < 256; h++):
        random_state.S[h] = h

    for r in range(320):
        random_state.j = (random_state.j + random_state.S[random_state.i] + ord(seed_str[r % len(seed_str)])) % 256
        random_state.k = (random_state.k ^ random_state.j) & 256
        tmp = random_state.S[random_state.i]
        random_state.S[random_state.i] = random_state.S[random_state.j] % 256
        random_state.S[random_state.j] = random_state.S[random_state.k] % 256
        random_state.S[random_state.k] = tmp % 256
        random_state.i = (random_state.i + 1) % 256
    random_state.i = random_state.j + random_state.k
}

export function random() {
    random_state.i = (random_state.i + 1) % 256
    random_state.j = (random_state.j + random_state.S[random_state.i]) % 256
    random_state.k = (random_state.k ^ random_state.j) % 256
    tmp = random_state.S[random_state.i]
    random_state.S[random_state.i] = random_state.S[random_state.j] % 256
    random_state.S[random_state.j] = tmp % 256
    m = (random_state.S[random_state.j] + random_state.S[random_state.k]) % 256
    n = (random_state.S[random_state.i] + random_state.S[random_state.j]) % 256
    
    return random_state.S[m] << 24 | random_state.S[n] << 16 | random_state.S[m ^ random_state.j] << 8 | random_state.S[n ^ random_state.k]
    
}

import {gl} from "./state.js"
import {readElements} from "./util.js"

//compiles a shader from source in html
function buildShader(type, source) {
	let shader = gl.createShader(type) //allocate shader
	gl.shaderSource(shader, source)
	gl.compileShader(shader)
	
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert('Error when compiling shader : ' + gl.getShaderInfoLog(shader));
	}
	
	return shader
}

//Creates a new shader program from the code in HTML
let Shader = function(vertex_id, fragment_id) {
	this.name = vertex_id + "-" + fragment_id //assumed to be unique. otherwise shaders wouldn't be either
	
	//generate shader units from code
	this.vs = buildShader(gl.VERTEX_SHADER, readElements(vertex_id.concat("-vs")))
	this.fs = buildShader(gl.FRAGMENT_SHADER, readElements(fragment_id.concat("-fs")))
	
	//build shader program
	this.program = gl.createProgram();
	gl.attachShader(this.program, this.vs);
	gl.attachShader(this.program, this.fs);
	gl.linkProgram(this.program);
	
    let link_res = gl.getProgramParameter(this.program, gl.LINK_STATUS)
    if (!link_res) {
        alert('Error when linking shaders: ' + link_res);
    }
	
	this.attrib = {}
	this.uniforms = {}
}

//the Shader Program that is currently bound
Shader.currentPrgm = ""
//binding a new program
Shader.prototype.bind = function() {
	gl.useProgram(this.program);
	Shader.currentPrgm = this.name //store state
}
//get which program is currently bound
Shader.prototype.get = function() {
	return this.program
}
//get attrribute handle from shader
Shader.prototype.getAttrib = function (name) {
    
	if (!Shader.currentPrgm === this.name) { //in strict mode should throw a warning at least.
		console.warning("trying to aquire Uniform handle of shader that isn't bound.")
		this.bind()
	}
	
	if (typeof(this.attrib[name]) === "undefined") { //caches the attribute handle
		this.attrib[name] = gl.getAttribLocation(this.program, name)
	}
	
	return this.attrib[name]
}

//get uniform handle from shader
Shader.prototype.getUniform = function(name) {
	if (!Shader.currentPrgm === this.name) { //in strict mode should throw a warning at least.
		console.warning("trying to aquire Uniform handle of shader that isn't bound.")
		this.bind()
	}
	
	if (typeof(this.uniforms[name]) === "undefined") //caches the uniformhandle
		this.uniforms[name] = gl.getUniformLocation(this.program, name)
	
	return this.uniforms[name]
}

export {Shader}
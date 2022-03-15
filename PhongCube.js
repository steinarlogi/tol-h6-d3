/////////////////////////////////////////////////////////////////
//    Sýnidæmi í Tölvugrafík
//     Hvert horn teningsins er með tiltekinn lit og hann
//      blandast við lit hinna hornanna yfir hverja hlið
//
//    Hjálmtýr Hafsteinsson, febrúar 2022
/////////////////////////////////////////////////////////////////
var canvas;
var gl;

var NumVertices  = 36;

var points = [];
var colors = [];

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

var axis = 0;
var theta = [ 0, 0, 0 ];

var movement = false;     // Do we rotate?
var spinX = 0;
var spinY = 0;
var origX;
var origY;

var specularColor = vec4(1.0, 1.0, 1.0, 1.0);
var diffuseColor = vec4(1.0, 0.0, 0.0, 1.0);
var ambientColor = vec4(0.20, 0.0, 0.0, 1.0);
var shininess = 16;

var lightPosition = vec4(1.0, 1.0, 1.0, 1.0);

var matrixLoc;
var normMatLoc;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    normalCube();

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // FLytja yfir litina
    var specLoc = gl.getUniformLocation(program, "specularColor");
    gl.uniform4fv(specLoc, flatten(specularColor));
    var ambLoc = gl.getUniformLocation(program, "ambientColor");
    gl.uniform4fv(ambLoc, flatten(ambientColor));
    var diffuseLoc = gl.getUniformLocation(program, "diffuseColor");
    gl.uniform4fv(diffuseLoc, flatten(diffuseColor));

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    matrixLoc = gl.getUniformLocation( program, "rotation" );
    normMatLoc = gl.getUniformLocation(program, "normalMatrix");

    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), shininess);

    //event listeners for mouse
    canvas.addEventListener("mousedown", function(e){
        movement = true;
        origX = e.offsetX;
        origY = e.offsetY;
        e.preventDefault();         // Disable drag and drop
    } );

    canvas.addEventListener("mouseup", function(e){
        movement = false;
    } );

    canvas.addEventListener("mousemove", function(e){
        if(movement) {
    	    spinY = ( spinY + (e.offsetX - origX) ) % 360;
            spinX = ( spinX + (e.offsetY - origY) ) % 360;
            origX = e.offsetX;
            origY = e.offsetY;
        }
    } );
    
    render();
}

function normalCube()
{
    //quadFrontBack( 1, 0, 3, 2 );
    //quadTopBottom( 2, 3, 7, 6 );
    //quadLeftRight( 3, 0, 4, 7 );
    //quadLeftRight( 6, 5, 1, 2 );
    //quadFrontBack( 4, 5, 6, 7 );
    //quadTopBottom( 5, 4, 0, 1 );

    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

function quadTopBottom(a, b, c, d) 
{
    var vertices = [
        vec3( -0.5, -0.5,  0.5 ),
        vec3( -0.5,  0.5,  0.5 ),
        vec3(  0.5,  0.5,  0.5 ),
        vec3(  0.5, -0.5,  0.5 ),
        vec3( -0.5, -0.5, -0.5 ),
        vec3( -0.5,  0.5, -0.5 ),
        vec3(  0.5,  0.5, -0.5 ),
        vec3(  0.5, -0.5, -0.5 )
    ];

    var vertexNormals = [
        [ 0.0, -1.0, 0.0, 0.0 ],  // red
        [ 0.0, -1.0, 0.0, 0.0 ],  // black
        [ 0.0, 1.0, 0.0, 0.0 ],  // yellow
        [ 0.0, 1.0, 0.0, 0.0 ],  // green
        [ 0.0, -1.0, 0.0, 0.0 ],  // blue
        [ 0.0, -1.0, 0.0, 0.0 ],  // magenta
        [ 0.0, 1.0, 0.0, 0.0 ],  // cyan
        [ 0.0, 1.0, 0.0, 0.0 ]   // white
    ];

    // We need to partition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices
    
    //vertex color assigned by the index of the vertex
    
    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        colors.push( vertexNormals[indices[i]] );
    
        // for solid colored faces use 
        //colors.push(vertexColors[a]);
        
    }
}

function quadLeftRight(a, b, c, d) {
    var vertices = [
        vec3( -0.5, -0.5,  0.5 ),
        vec3( -0.5,  0.5,  0.5 ),
        vec3(  0.5,  0.5,  0.5 ),
        vec3(  0.5, -0.5,  0.5 ),
        vec3( -0.5, -0.5, -0.5 ),
        vec3( -0.5,  0.5, -0.5 ),
        vec3(  0.5,  0.5, -0.5 ),
        vec3(  0.5, -0.5, -0.5 )
    ];

    var vertexNormals = [
        [ -1.0, 0.0, 0.0, 0.0 ],  // black
        [ 1.0, 0.0, 0.0, 0.0 ],  // red
        [ 1.0, 0.0, 0.0, 0.0 ],  // yellow
        [ -1.0, 0.0, 0.0, 0.0 ],  // green
        [ -1.0, 0.0, 0.0, 0.0 ],  // blue
        [ 1.0, 0.0, 0.0, 0.0 ],  // magenta
        [ 1.0, 0.0, 0.0, 0.0 ],  // cyan
        [ -1.0, 0.0, 0.0, 0.0 ]   // white
    ];

    // We need to partition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices
    
    //vertex color assigned by the index of the vertex
    
    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        colors.push( vertexNormals[indices[i]] );
    
        // for solid colored faces use 
        //colors.push(vertexColors[a]);
        
    }
}

function quadFrontBack(a, b, c, d) {
    var vertices = [
        vec3( -0.5, -0.5,  0.5 ),
        vec3( -0.5,  0.5,  0.5 ),
        vec3(  0.5,  0.5,  0.5 ),
        vec3(  0.5, -0.5,  0.5 ),
        vec3( -0.5, -0.5, -0.5 ),
        vec3( -0.5,  0.5, -0.5 ),
        vec3(  0.5,  0.5, -0.5 ),
        vec3(  0.5, -0.5, -0.5 )
    ];

    var vertexNormals = [
        [ 0.0, 0.0, 1.0, 0.0 ],  // black
        [ 0.0, 0.0, 1.0, 0.0 ],  // red
        [ 0.0, 0.0, 1.0, 0.0 ],  // yellow
        [ 0.0, 0.0, 1.0, 0.0 ],  // green
        [ 0.0, 0.0, -1.0, 0.0 ],  // blue
        [ 0.0, 0.0, -1.0, 0.0 ],  // magenta
        [ 0.0, 0.0, -1.0, 0.0 ],  // cyan
        [ 0.0, 0.0, -1.0, 0.0 ]   // white
    ];

    // We need to partition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices
    
    //vertex color assigned by the index of the vertex
    
    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        colors.push( vertexNormals[indices[i]] );
    
        // for solid colored faces use 
        //colors.push(vertexColors[a]);
        
    }
}

function quad(a, b, c, d) {
    var vertices = [
        vec3( -0.5, -0.5,  0.5 ),
        vec3( -0.5,  0.5,  0.5 ),
        vec3(  0.5,  0.5,  0.5 ),
        vec3(  0.5, -0.5,  0.5 ),
        vec3( -0.5, -0.5, -0.5 ),
        vec3( -0.5,  0.5, -0.5 ),
        vec3(  0.5,  0.5, -0.5 ),
        vec3(  0.5, -0.5, -0.5 )
    ];

    // We need to partition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices
    
    //vertex color assigned by the index of the vertex
    
    var indices = [ a, b, c, a, c, d ];
    var t1 = subtract(vertices[b], vertices[a]);
    var t2 = subtract(vertices[c], vertices[a]);
    
    var normal = normalize(cross(t2, t1));
    normal = vec4(normal);

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        colors.push( normal );
    
        // for solid colored faces use 
        //colors.push(vertexColors[a]);
        
    }
}


function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var mv = mat4();
    mv = mult( mv, rotateX(spinX) );
    mv = mult( mv, rotateY(spinY) );

    
    let normMat = [];
    for (let i = 0; i < 3; i++) {
        let rows = [];
        for (let j = 0; j < 3; j++) {
            rows.push(mv[i][j])
        }
        normMat.push(rows)
    }

    gl.uniformMatrix3fv(normMatLoc, false, flatten(normMat));
    
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv));

    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

    requestAnimFrame( render );
}


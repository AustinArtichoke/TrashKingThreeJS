import * as THREE from 'three';

//some loaders and utilities need to be imported separately from three as addons
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MathUtils } from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { randFloat } from 'three/src/math/MathUtils';


//scene setup
const scene = new THREE.Scene();

//render setup
const renderer = new THREE.WebGLRenderer();
//if it was set to fit exactly in browser window it would be slight *too* big in my browser, just subtracted a pixel to fix it
renderer.setSize( window.innerWidth-1, window.innerHeight-1 );
document.body.appendChild( renderer.domElement );
//turn on shadows in renderer
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
//camera aspect value
const aspect = window.innerWidth / window.innerHeight;
//d value determines how much the camera sees - higher value means smaller raccoon etc (frustrum)
const d = 15;
//set up isometric camera based on d value
let camera = new THREE.OrthographicCamera( - d * aspect, d * aspect, d, - d, 1, 100 );
//set camera location - doesn't change viewing frustrum but needs to be far enough away not to clip model
const camPos = 20;
camera.position.set( camPos, camPos, camPos ); // all components equal for iso camera
camera.lookAt( scene.position ); // or the origin



//variables
let model; //raccoon
let modelB; //bushtit
let mixer; //animation mixer
let perched = false; //using for bird animation

//add clock
let clock = new THREE.Clock();

//action for walking
let action;

//speed variables
let xspeed=0;
let zspeed=0;

//soft ambient light, kind of yellowish to warm up the scene
const light = new THREE.AmbientLight( 0xEAE3C5, 1 ); 
scene.add( light );

// directional light operates like the sun - parallel rays
const directionalLight = new THREE.DirectionalLight( 0xEAE3C5, 3);
//moving the light to not shine directly down - otherwise lose the sides of the letters (will be the same color)
//trying to move the light any further away REALLY makes the rendering chunky and terrible
//light is technically intersecting the geometry but it works
directionalLight.position.set (.4, 2, .1);
//need to cast shadow from our sun
directionalLight.castShadow = true; // default false
//this didn't actully seem to change anything, test later
directionalLight.shadowDarkness = .5;
//Set up shadow properties for the light - this is real fun! (ie frustrating)
directionalLight.shadow.mapSize.width = 1400; 
directionalLight.shadow.mapSize.height = 1400;
//making the near negative was the only solution to moving the shadow camera where it captures most of the scene!
directionalLight.shadow.camera.near = -5.5; 
directionalLight.shadow.camera.far = 20; 
directionalLight.shadow.camera.position.set (.4, 2, .1);
//add light
scene.add( directionalLight );

//have to extend shadow area of the shadow camera - too big and it quality really drops
var side = 40;
directionalLight.shadow.camera.top = side;
directionalLight.shadow.camera.bottom = -side;
directionalLight.shadow.camera.left = side;
directionalLight.shadow.camera.right = -side;
directionalLight.shadow.camera.lookAt(scene.position);

//turn on to see the shadow camera position - this helps for troubleshooting!!
// var shadowHelper = new THREE.CameraHelper( directionalLight.shadow.camera );
// scene.add( shadowHelper );

// const helper = new THREE.DirectionalLightHelper( directionalLight, 5 );
// scene.add( helper );


//3D TEXT!
const loaderFont = new FontLoader();

//grab font - just using one of the defaults but it looks pretty good - could use a ttf importer if needed
loaderFont.load( 'https://unpkg.com/three@0.77.0/examples/fonts/helvetiker_bold.typeface.json', function ( font ) {

	const textGeometry = new TextGeometry( 'TRASH KING', {
		font: font,
		size: 5.5,
		height: 2,
		curveSegments: 12,

	} );

	  // Create a lambert material - this one looked better than standard for shadows
	  const material = new THREE.MeshLambertMaterial({
		color: 0xF09797, //light coral
	  });
	  
	  // Geometries are attached to meshes so that they get rendered
	  const textMesh = new THREE.Mesh(textGeometry, material);
	  //cast and recieve shadows - defaults are false
	  textMesh.castShadow = true; 
	  textMesh.receiveShadow = true; 
	  // Update positioning of the text to fit in our scene
	  // mathUtils are useful for conversion!
	  textMesh.rotation.x = MathUtils.degToRad(-90);
	  textMesh.rotation.z = MathUtils.degToRad(90);
	  textMesh.rotation.y = MathUtils.degToRad(90);
	  //shift over on z axis to fit in scene
	  textMesh.position.set(0, 0, 27);
	  scene.add(textMesh);
} );

//Create a ground plane that receives shadows (but does not cast them)
const planeGeometry = new THREE.PlaneGeometry( 200, 200, 32, 32 );
//use REALLY dark greenish yellow color - normal is basically facing the sun and will be basically white if it's not super dark
const planeMaterial = new THREE.MeshStandardMaterial( { color: 0x333615 } )
const plane = new THREE.Mesh( planeGeometry, planeMaterial );
//rotate to sit correctly
plane.rotation.x = MathUtils.degToRad(-90);
plane.receiveShadow = true;
scene.add( plane );


function animategrass() {
	//animate grass - conflicts with raccoon animation so turned off trigger at end of code 
	requestAnimationFrame( animategrass );
	leavesMaterial.uniforms.time.value = clock.getElapsedTime();
	leavesMaterial.uniformsNeedUpdate = true;
}


function animate() {
	requestAnimationFrame( animate );

	// Update the mixer on each frame
	if (mixer) {
		mixer.update( clock.getDelta() );
	}
	
	//adding x and z speeds to the position of the raccoon
	model.position.x+=xspeed;
	model.position.z+=zspeed;

	if (perched) {
		//if set to perched, move up in space to "hop"
		modelB.position.set (2, 6.1, 14.3);
	}
	else { 
		//if it is not perched, then set back to starting position
		modelB.position.set (2,5.8,14.3);
	}


	renderer.render( scene, camera );
}


//functions for delaying the switch between hop and perch
function hop(){
	perched=true;
	window.setTimeout(perch, 100);
}

function perch(){
	perched=false;
	//times how long we wait before hopping again - set to random
	window.setTimeout(hop, randFloat(100,2000));
}

// RACCOON!
// used an old rigged blender model and saved as glb file (and then fixed animation again)
const loader = new GLTFLoader();

loader.load( 'assets/raccoonpoly11.glb', function ( gltf ) {

	scene.add( gltf.scene );
	model = gltf.scene;
	gltf.scene.traverse(function(child) {
		//let raccoon cast and receive shadows
		if (child.isMesh) {
		  child.castShadow = true;
		  child.receiveShadow = true;
		}
	})
	scene.add( model );

	//create animation mixer for the raccoon
	mixer = new THREE.AnimationMixer( model );

	//attach the walk cycle animation
	action = mixer.clipAction( THREE.AnimationClip.findByName(gltf.animations, 'Walk Cycle 2') );

	animate();

}, undefined, function ( error ) {

	console.error( error );

} );


//add the bushtit!
const loaderBird = new GLTFLoader();

loaderBird.load( 'assets/bushtit.glb', function ( gltf ) {

	scene.add( gltf.scene );
	modelB = gltf.scene;
	gltf.scene.traverse(function(child) {
		//let bird cast and receive shadows
		if (child.isMesh) {
		  child.castShadow = true;
		  child.receiveShadow = true;
		}
	})

	scene.add( modelB );
	//setting the bird on top of the A in TRASH
	modelB.position.set (2,5.8,14.3);
	//scale down bird
	modelB.scale.set(.5,.5,.5);

	hop();


}, undefined, function ( error ) {

	console.error( error );

} );

//when key is pressed, rotate raccoon model around axis and animate the walk action
window.addEventListener("keydown", function (ev) {
	switch(ev.code) {
		case "ArrowRight":
			model.rotation.y = MathUtils.degToRad(0);
			xspeed=.18;
			action.play();
			break;
		case "ArrowLeft":
			model.rotation.y = MathUtils.degToRad(180);
			xspeed=-.18;
			action.play();
			break;
		case "ArrowUp":
			model.rotation.y = MathUtils.degToRad(90);
			zspeed=-.18;
			action.play();
			break;
		case "ArrowDown":
			model.rotation.y = MathUtils.degToRad(270);
			zspeed=.2;
			action.play();
			break;
	}
}, true);

//adding keyup stops the action when key is no longer pressed
window.addEventListener("keyup", function (ev) {
	switch(ev.code) {
		case "ArrowRight":
		case "ArrowUp":
		case "ArrowDown":
		case "ArrowLeft":
			action.stop();
			xspeed=0;
			zspeed=0;
			break;
	}
}, true);


//GRASS!
//grass resource from here: https://jsfiddle.net/felixmariotto/hvrg721n/
//added notes to try to explain (to myself) what each part does


//grass shader (magic?)
const vertexShader = `
  varying vec2 vUv;
  uniform float time;
  
	void main() {

    vUv = uv;
    
    // VERTEX POSITION
    
    vec4 mvPosition = vec4( position, 1.0 );
    #ifdef USE_INSTANCING
    	mvPosition = instanceMatrix * mvPosition;
    #endif
    
    // DISPLACEMENT
    
    // here the displacement is made stronger on the blades tips.
    float dispPower = 1.0 - cos( uv.y * 3.1416 / 2.0 );
    
    float displacement = sin( mvPosition.z + time * 10.0 ) * ( 0.1 * dispPower );
    mvPosition.z += displacement;
    
    //
    
    vec4 modelViewPosition = modelViewMatrix * mvPosition;
    gl_Position = projectionMatrix * modelViewPosition;

	}
`;

//grass color shader (also magic?)
const fragmentShader = `
  varying vec2 vUv;
  
  void main() {
  	//base color for blades here - made it much less green to fit with the scene
	//color is rgb but between 0 and 1 instead of 255
	vec3 baseColor = vec3( .9, 1.0, 0.4 );
    float clarity = ( vUv.y * 0.5 ) + 0.5;
    gl_FragColor = vec4( baseColor * clarity, 1 );
  }
`;

const uniforms = {
	time: {
  	value: 0
  }
}

//construct grass material from the shaders and make double-sided
const leavesMaterial = new THREE.ShaderMaterial({
	vertexShader,
  fragmentShader,
  uniforms,
  side: THREE.DoubleSide
});


//change density of grass blades
const instanceNumber = 70000;
const dummy = new THREE.Object3D();

//dimensions of each grass blade (plane), change y for taller/shorter grass
const geometry = new THREE.PlaneGeometry( 0.1, 2, 1, 4 );
geometry.translate( 0, .5, 0 ); // move grass blade geometry lowest point at 0.

//feed in the geometry, shader, and the count of instances into an instanced mesh
const instancedMesh = new THREE.InstancedMesh( geometry, leavesMaterial, instanceNumber );

//add to scene
scene.add( instancedMesh );

//position and scale the grass blade instances randomly
for ( let i=0 ; i<instanceNumber ; i++ ) {

	//moves around the y and z position
	dummy.position.set(
  	( Math.random() - 0.5 ) * 80,
    0,
    ( Math.random() - 0.5 ) * 80
  );
  
  dummy.scale.setScalar( 0.5 + Math.random() * 0.5 );
  
  dummy.rotation.y = Math.random() * Math.PI;
  
  dummy.updateMatrix();
  instancedMesh.setMatrixAt( i, dummy.matrix );

}


//turned off grass animation - when turned on it stops the walk cycle playing correctly (future thing to explore)
//animategrass();




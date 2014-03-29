$(function() {
  window.Game = {};
  window.Resources = {};
  var player = new Player({});

  Resources.ballShape = new CANNON.Sphere(0.03);
  Resources.ballGeometry = new THREE.SphereGeometry(Resources.ballShape.radius);
  Resources.peeMaterial = new THREE.MeshLambertMaterial( { color: 0xFFFF00 } );

  Game.scene = new THREE.Scene();
  Game.camera = null;

  var sphereShape, sphereBody, world, physicsMaterial, walls=[], balls=[], ballMeshes=[], boxes=[], boxMeshes=[];
  var playerBalls=[];

  var camera, scene, renderer;
  var geometry, material, mesh;
  var controls, time = Date.now();

  var blocker = document.getElementById( 'blocker' );
  var instructions = document.getElementById( 'instructions' );

  var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

  if ( havePointerLock ) {

    var element = document.body;

    var pointerlockchange = function ( event ) {

      if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {
        controls.enabled = true;
        blocker.style.display = 'none';
      } else {
        controls.enabled = false;
        blocker.style.display = '-webkit-box';
        blocker.style.display = '-moz-box';
        blocker.style.display = 'box';
        instructions.style.display = '';
      }
    }

    var pointerlockerror = function ( event ) {
      instructions.style.display = '';
    }

    var loader = new THREE.OBJLoader();
    loader.load('../res/models/can-maes.obj', function(object) {
      Game.scene.add(object);
    });

    // Hook pointer lock state change events
    document.addEventListener( 'pointerlockchange', pointerlockchange, false );
    document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
    document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

    document.addEventListener( 'pointerlockerror', pointerlockerror, false );
    document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
    document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

    instructions.addEventListener( 'click', function ( event ) {
      instructions.style.display = 'none';

      // Ask the browser to lock the pointer
      element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

      if ( /Firefox/i.test( navigator.userAgent ) ) {
        var fullscreenchange = function ( event ) {

          if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {

            document.removeEventListener( 'fullscreenchange', fullscreenchange );
            document.removeEventListener( 'mozfullscreenchange', fullscreenchange );

            element.requestPointerLock();
          }

        }

        document.addEventListener( 'fullscreenchange', fullscreenchange, false );
        document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );

        element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;

        element.requestFullscreen();

      } else {

        element.requestPointerLock();

      }

    }, false );

  } else {

    instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';

  }

  initCannon();
  init();
  animate();

  function initCannon(){
    // Setup our world
    Game.world = new CANNON.World();
    Game.world.quatNormalizeSkip = 0;
    Game.world.quatNormalizeFast = false;

    var solver = new CANNON.GSSolver();

    Game.world.defaultContactMaterial.contactEquationStiffness = 1e9;
    Game.world.defaultContactMaterial.contactEquationRegularizationTime = 4;

    solver.iterations = 7;
    solver.tolerance = 0.1;
    var split = true;
    if(split)
      Game.world.solver = new CANNON.SplitSolver(solver);
    else
      Game.world.solver = solver;

    Game.world.gravity.set(0,-20,0);
    Game.world.broadphase = new CANNON.NaiveBroadphase();

    // Create a slippery material (friction coefficient = 0.0)
    physicsMaterial = new CANNON.Material("slipperyMaterial");
    var physicsContactMaterial = new CANNON.ContactMaterial(physicsMaterial,
        physicsMaterial,
        0.0, // friction coefficient
        0.3  // restitution
        );
    // We must add the contact materials to the world
    Game.world.addContactMaterial(physicsContactMaterial);

    // Create a sphere
    var mass = 5, radius = 1.3;
    Resources.sphereShape = new CANNON.Sphere(radius);
    sphereShape = Resources.sphereShape;
    Game.sphereBody = new CANNON.RigidBody(mass, sphereShape, physicsMaterial);
    Game.sphereBody.position.set(0,5,0);
    Game.sphereBody.linearDamping = 0.9;
    Game.world.add(Game.sphereBody);

    // Create a plane
    var groundShape = new CANNON.Plane();
    var groundBody = new CANNON.RigidBody(0,groundShape,physicsMaterial);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
    Game.world.add(groundBody);
  }

  function init() {

    Game.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

    Game.scene = new THREE.Scene();
    Game.scene.fog = new THREE.Fog( 0x000000, 0, 500 );

    var ambient = new THREE.AmbientLight( 0x111111 );
    Game.scene.add( ambient );

    light = new THREE.SpotLight( 0xffffff );
    light.position.set( 10, 30, 20 );
    light.target.position.set( 0, 0, 0 );
    if(true){
      light.castShadow = true;

      light.shadowCameraNear = 20;
      light.shadowCameraFar = 50;//camera.far;
      light.shadowCameraFov = 40;

      light.shadowMapBias = 0.1;
      light.shadowMapDarkness = 0.7;
      light.shadowMapWidth = 2*512;
      light.shadowMapHeight = 2*512;

      //light.shadowCameraVisible = true;
    }
    Game.scene.add( light );



    controls = new PointerLockControls( Game.camera , Game.sphereBody );
    Game.scene.add( controls.getObject() );

    // floor
    geometry = new THREE.PlaneGeometry( 300, 300, 50, 50 );
    geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );

    material = new THREE.MeshLambertMaterial( { color: 0xDDDDDD } );
    THREE.ColorUtils.adjustHSV( material.color, 0, 0, 0.9 );


    mesh = new THREE.Mesh( geometry, material );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    Game.scene.add( mesh );

    renderer = new THREE.WebGLRenderer();
    renderer.shadowMapEnabled = true;
    renderer.shadowMapSoft = true;
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( Game.scene.fog.color, 1 );

    document.body.appendChild( renderer.domElement );

    window.addEventListener( 'resize', onWindowResize, false );

    // Add boxes
    var halfExtents = new CANNON.Vec3(1,1,1);
    var boxShape = new CANNON.Box(halfExtents);
    var boxGeometry = new THREE.CubeGeometry(halfExtents.x*2,halfExtents.y*2,halfExtents.z*2);
    for(var i=0; i<7; i++){
      var x = (Math.random()-0.5)*20;
      var y = 1 + (Math.random()-0.5)*1;
      var z = (Math.random()-0.5)*20;
      var boxBody = new CANNON.RigidBody(5,boxShape);
      var boxMesh = new THREE.Mesh( boxGeometry, material );
      Game.world.add(boxBody);
      Game.scene.add(boxMesh);
      boxBody.position.set(x,y,z);
      boxMesh.position.set(x,y,z);
      boxMesh.castShadow = true;
      boxMesh.receiveShadow = true;
      boxMesh.useQuaternion = true;
      boxes.push(boxBody);
      boxMeshes.push(boxMesh);
    }

    // Add linked boxes
    var size = 0.5;
    var he = new CANNON.Vec3(size,size,size*0.1);
    var boxShape = new CANNON.Box(he);
    var mass = 0;
    var space = 0.1*size;
    var N=5, last;
    var boxGeometry = new THREE.CubeGeometry(he.x*2,he.y*2,he.z*2);

    for(var i=0; i<N; i++){
      var boxbody = new CANNON.RigidBody(mass,boxShape);
      var boxMesh = new THREE.Mesh( boxGeometry, material );
      boxbody.position.set(5,(N-i)*(size*2+2*space) + size*2+space,0);
      boxbody.linearDamping=0.01;
      boxbody.angularDamping=0.01;
      boxMesh.useQuaternion = true;
      boxMesh.castShadow = true;
      boxMesh.receiveShadow = true;
      Game.world.add(boxbody);
      Game.scene.add(boxMesh);
      boxes.push(boxbody);
      boxMeshes.push(boxMesh);

      if(i!=0){
        // Connect this body to the last one
        var c1 = new CANNON.PointToPointConstraint(boxbody,new CANNON.Vec3(-size,size+space,0),last,new CANNON.Vec3(-size,-size-space,0));
        var c2 = new CANNON.PointToPointConstraint(boxbody,new CANNON.Vec3(size,size+space,0),last,new CANNON.Vec3(size,-size-space,0));
        Game.world.addConstraint(c1);
        Game.world.addConstraint(c2);
      } else {
        mass=0.3;
      }
      last = boxbody;
    }
  }

  function onWindowResize() {
    Game.camera.aspect = window.innerWidth / window.innerHeight;
    Game.camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
  }

  var dt = 1/60;
  function animate() {
    requestAnimationFrame( animate );
    if ( controls.enabled ) {
      Game.world.step(dt);
      player.updateBalls();

      // Update box positions
      for(var i=0; i<boxes.length; i++){
        boxes[i].position.copy(boxMeshes[i].position);
        boxes[i].quaternion.copy(boxMeshes[i].quaternion);
      }

      // Shoot ballz
      if ( controls.enabled == true ) { player.pee(); }
    }

    controls.update( Date.now() - time );
    renderer.render( Game.scene, Game.camera );
    time = Date.now();
  }

  // Particles
  var particles = new THREE.Geometry;
  for (var p = 0; p < 2000; p++) {
    var particle = new THREE.Vector3(Math.random() * 500 - 250, Math.random() * 500 - 250, Math.random() * 500 - 250);
    particles.vertices.push(particle);
  }

  var particleMaterial  = new THREE.ParticleBasicMaterial({ color: 0xeeeeee, size: 2 });
  var particleSystem    = new THREE.ParticleSystem(particles, particleMaterial);

  Game.scene.add(particleSystem);
});
;var Player = function(args) {
  this.name   = args.name;
  this.color  = args.color;
  this.balls  = [];
  this.ballMeshes = [];

  this.shootDirection = new THREE.Vector3();
  this.shootVelo = 3;
  this.projector = new THREE.Projector();
};

Player.prototype.pee = function() {
  var Game = window.Game;
  var x = Game.sphereBody.position.x;
  var y = Game.sphereBody.position.y - 0.75;
  var z = Game.sphereBody.position.z;
  var maxBalls = 100;

  var ballBody = new CANNON.RigidBody(1, Resources.ballShape);
  var ballMesh = new THREE.Mesh( Resources.ballGeometry, Resources.peeMaterial );
  Game.world.add(ballBody);
  Game.scene.add(ballMesh);
  ballMesh.castShadow = true;
  ballMesh.receiveShadow = true;
  this.balls.push(ballBody);
  this.ballMeshes.push(ballMesh);

  if (this.balls.length >= maxBalls) {
    var oldestBall = this.balls.shift();
    var oldestBallMesh = this.ballMeshes.shift();
    Game.world.remove(oldestBall);
    Game.scene.remove(oldestBallMesh);
  }

  this.getShootDir(this.shootDirection);
  ballBody.velocity.set(this.shootDirection.x * this.shootVelo,
      this.shootDirection.y * this.shootVelo + 10,
      this.shootDirection.z * this.shootVelo);

  // Move the ball outside the player sphere
  x += this.shootDirection.x * (Resources.sphereShape.radius*1.02 + Resources.ballShape.radius);
  y += this.shootDirection.y * (Resources.sphereShape.radius*1.02 + Resources.ballShape.radius);
  z += this.shootDirection.z * (Resources.sphereShape.radius*1.02 + Resources.ballShape.radius);
  ballBody.position.set(x,y,z);
  ballMesh.position.set(x,y,z);
  ballMesh.useQuaternion = true;
};

Player.prototype.updateBalls = function() {
  // Update ball positions
  for (var i=0; i<this.balls.length; i++) {
    this.balls[i].position.copy(this.ballMeshes[i].position);
    this.balls[i].quaternion.copy(this.ballMeshes[i].quaternion);
  }
};

Player.prototype.getShootDir = function(targetVec) {
  var vector = targetVec;
  targetVec.set(0,0,1);
  this.projector.unprojectVector(vector, Game.camera);
  var ray = new THREE.Ray(Game.sphereBody.position, vector.subSelf(Game.sphereBody.position).normalize() );
  targetVec.x = ray.direction.x;
  targetVec.y = ray.direction.y;
  targetVec.z = ray.direction.z;
};

$(function() {

  var currentURl = function () {
    var url = window.location.href;
    var loc = window.location;
    if (loc.port != undefined) {
      var url = loc.protocol + '//' + loc.hostname + ':' + loc.port;
    } else {
      var url = loc.protocol + '//' + loc.hostname;
    }
    return url;
  };


  window.Game = {};
  window.Game.socket = io.connect(currentURl());
  var collidableMeshList = [];
  window.Game.playerData = {};
  window.Resources = {};
  Game.players = {};

  var setupPlayers = function(playerData) {
    if (playerData.length <= 0 || !playerData[0]) return;

    for (var i = 0; i < playerData.length; i++) {
      var dude    = playerData[i].player;

      if ( dude.uid && !Game.players[dude.uid] ) {
        Game.players[dude.uid] = new Player({})
        Game.players[dude.uid].setPeeColor(parseInt(dude.color, 16));
      }
    }
  };

  Game.socket.on('mothership', function (o) {
    if (!o.init) {
      Game.playerData = o;
      setupPlayers(o);
    }
  });

  Resources.ballShape = new CANNON.Sphere(0.03);
  Resources.ballGeometry = new THREE.SphereGeometry(Resources.ballShape.radius);

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
    Game.scene.fog = new THREE.Fog( 0xFFFFFF, 500, 500 );

    var ambient = new THREE.AmbientLight( 0x111111 );
    Game.scene.add( ambient );

    light = new THREE.SpotLight( 0xffffff );
    light.position.set( 10, 30, 20 );
    light.target.position.set( 0, 0, 0 );

    otherLight = new THREE.HemisphereLight( 0xDDDDDD, 0x0000FF, 0.75);
    otherLight.position.set( 0.0001, 100.0001, -18.5001 );

    Game.scene.add(otherLight);


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

    material = new THREE.MeshLambertMaterial( { color: 0xDDFF77 } );
    // woodMaterial = new THREE.MeshLambertMaterial( { color: 0xFFFF77 } );
    woodMaterial = new THREE.MeshLambertMaterial( { color: 0x964B00 } );
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

    // Add new boxes
    var halfExtents = new CANNON.Vec3(0.5,0.2,0.5);
    var boxShape = new CANNON.Box(halfExtents);
    var boxGeometry = new THREE.CubeGeometry(halfExtents.x*2,halfExtents.y*2,halfExtents.z*2);
    for(var i=0; i<8; i++){
      var x =  -i +3;
      var y = 2;
      var z = -4.2;
      var boxBody = new CANNON.RigidBody(5,boxShape);
      var boxMesh = new THREE.Mesh( boxGeometry, woodMaterial );

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

    // Add cans
    var halfExtents = new CANNON.Vec3(0.25,0.5,0.25);
    var boxShape = new CANNON.Box(halfExtents);
    //var boxShape = new CANNON.Cylinder(0.25,0.25,2*0.25,10);
    var boxGeometry = new THREE.CubeGeometry(halfExtents.x*2,halfExtents.y*2,halfExtents.z*2);
    //var boxGeometry = new CANNON.RigidBody(mass,boxShape);
    var maesImage = new THREE.MeshLambertMaterial({
        map: THREE.ImageUtils.loadTexture('../res/images/maes_texture.jpeg')
      });


    for(var i=0; i<8; i++){
      var x =  -i + 3;
      var y = 4;
      var z = -4.2;
      var boxBody = new CANNON.RigidBody(5,boxShape);
      var boxMesh = new THREE.Mesh( boxGeometry, maesImage );
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

    var rows = 3;

    var minX = 3;
    var maxX = minX + 6;
    var xWidth = maxX - minX;
    var width = halfExtents.y + 0.01;

    for(var rowI=0; rowI<rows; rowI++) {
      var boxCount = 9 - rowI;
      for(var i=0; i < boxCount; i++){
        var w = xWidth / boxCount
        var x = (-i * w) + 3;
        var y = 1 + rowI;
        var z = -3.2;

        var boxBody = new CANNON.RigidBody(5 ,boxShape);
        var boxMesh = new THREE.Mesh( boxGeometry, maesImage );
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

    }


    /*** OBJ Loading ***/
    /*var loader = new THREE.OBJLoader();

    // As soon as the OBJ has been loaded this function looks for a mesh
    // inside the data and applies the texture to it.
    loader.load( '../res/models/can-maes.obj', function ( event ) {
      var object = event;
      object.traverse( function ( child ) {
        if ( child instanceof THREE.Mesh ) {
          child.material.map = texture;
        }
      } );

      // My initial model was too small, so I scaled it upwards.
      object.scale = new THREE.Vector3( 25, 25, 25 );

      // You can change the position of the object, so that it is not
      // centered in the view and leaves some space for overlay text.
      object.position.y -= 2.5;
      Game.scene.add( object );
    });*/

    /*var loader = new THREE.OBJLoader();
    var objURL = '../res/models/can-maes.obj';
    loader.load( objURL, function ( object ) {
      object.position.y = -10;
      Game.scene.add( object );
    } );

    var loader = new THREE.OBJLoader();
      loader.load( '../res/models/can-maes.obj', function ( object ) {

        object.traverse( function ( child ) {

          if ( child instanceof THREE.Mesh ) {

            child.material.map = texture;

          }

        } );

        object.position.y = -10;
        Game.scene.add( object );

      } );*/

    /*var loader = new THREE.OBJMTLLoader();
        loader.load( '../res/models/can-maes.obj', '../res/models/can-maes.mtl', function ( object ) {

          object.position.y = - 5;
          Game.scene.add( object );

        } );*/


    // Check detection pee / cans

    // Add boxes
    /*var halfExtents = new CANNON.Vec3(1,1,1);
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
    }*/

    // Add linked boxes
    /*var size = 0.5;
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
    }*/

    var geometry = new THREE.CubeGeometry( 1000, 1000, 1000 );

    var texture = THREE.ImageUtils.loadTexture(  "../res/images/background1.jpg" );
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 2.2, 2.2 );

    var material = new THREE.MeshBasicMaterial( {
        color: 0xffffff,
        map: texture,
        side: THREE.BackSide
    } );

    var mesh = new THREE.Mesh( geometry, material );
    Game.scene.add( mesh );
  }

  function onWindowResize() {
    Game.camera.aspect = window.innerWidth / window.innerHeight;
    Game.camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
  }

  var fixGimbal = function(axis) {
    if ( axis < 0 ) {
      return Math.PI * 2 - axis;
    } else {
      return axis;
    }
  };

  var generateRotationVector = function(beta, alpha) {
    var v3 = new THREE.Vector3()

    v3.x = beta * Math.PI / 180;
    v3.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, v3.x));
    v3.x /=5;

    v3.y = alpha * Math.PI / 180;
    v3.y = fixGimbal(v3.y);
    if ( v3.y < Math.PI/2 ) {
      v3.y += Math.PI;
    } else if ( v3.y > (Math.PI*2*0.75) ) {
      v3.y -= Math.PI;
    }

    $('.value').text(v3.y || 'NOTHING');
    // y = Math.max(-Math.PI, Math.min(Math.PI, y));
    // y /= 5;

    v3.z = 0;

    return v3;
  };

  var dt = 1/60;

  function updateBoxes() {
      // Update box positions
      for(var i=0; i<boxes.length; i++){
        boxes[i].position.copy(boxMeshes[i].position);
        boxes[i].quaternion.copy(boxMeshes[i].quaternion);
      }
  };

  function animate() {
    for (var key in Game.players) {
      animatePlayer(key, Game.players[key]);
    };

    requestAnimationFrame(animate);
    updateBoxes();
    Game.world.step(dt);

    controls.update( Date.now() - time );
    renderer.render( Game.scene, Game.camera );
    time = Date.now();
  }

  function animatePlayer(uid, player) {
    var playah = _.find(Game.playerData, function(pl) { return pl.player.uid == uid; });
    if (Game.playerData.length > 0 && playah) {
      var dude = playah.player;
      var gyro = dude.gyro;
      var gyroVector = generateRotationVector(gyro.beta, gyro.alpha);

      var tmpGyroVector = new THREE.Vector3();
      tmpGyroVector.copy(gyroVector);

      if (player.oldGyroRotation.x == -999) {
        player.oldGyroRotation = gyroVector;
      }

      tmpGyroVector.subSelf(player.oldGyroRotation);

      player.targetplayerRotation.addSelf(tmpGyroVector);

      tempTargetCopy = new THREE.Vector3();
      tempTargetCopy.copy(player.targetplayerRotation);

      tempTargetCopy.subSelf(player.playerRotation);
      tempTargetCopy.multiplyScalar(0.2);

      player.playerRotation.addSelf(tempTargetCopy);

      player.setShootDirection(player.playerRotation);

      player.oldGyroRotation = gyroVector;
    }

    if (controls.enabled) {
      player.update(dude.isPeeing);
      player.updateBalls();
      player.pee();
    }
  }

});

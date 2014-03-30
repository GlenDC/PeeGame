/**
 * @author mrdoob / http://mrdoob.com/
 * @author schteppe / https://github.com/schteppe
 */
var PointerLockControls = function ( camera, cannonBody ) {

  var eyeYPos = 2; // eyes are 2 meters above the ground
  var velocityFactor = 0.2;
  var jumpVelocity = 20;
  var scope = this;

  var pitchObject = new THREE.Object3D();
  pitchObject.add( camera );

  var yawObject = new THREE.Object3D();
  yawObject.position.y = 2;
  yawObject.add( pitchObject );

  var moveForward = false;
  var moveBackward = false;
  var moveLeft = false;
  var moveRight = false;

  var canJump = false;

  cannonBody.addEventListener("collide",function(e){
    canJump = true;
  });

  var velocity = cannonBody.velocity;

  var PI_2 = Math.PI / 2;

  var mouseRotation = new THREE.Vector3();
  mouseRotation.x = 0;
  mouseRotation.y = 0;
  mouseRotation.z = 0;

  var onMouseMove = function ( event ) {
    if ( scope.enabled === false ) return;

    var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    mouseRotation.x -= movementY * 0.002;
    mouseRotation.y -= movementX * 0.002;
    // mouseRotation.y = Math.max( - PI_2, Math.min( PI_2, mouseRotation.y ) );
  };

  this.getMouseDir = function() {
    return mouseRotation;
  }

  document.addEventListener( 'mousemove', onMouseMove, false );

  this.enabled = false;

  this.getObject = function () {
    return yawObject;
  };

  this.getDirection = function(targetVec){
    targetVec.set(0,0,-1);
    quat.multiplyVector3(targetVec);
  }

  // Moves the camera to the Cannon.js object position and adds velocity to the object if the run key is down
  var inputVelocity = new THREE.Vector3();
  this.update = function ( delta ) {

    if ( scope.enabled === false ) return;

    delta *= 0.1;

    inputVelocity.set(0,0,0);

    // Convert velocity to world coordinates
    // quat.setFromEuler({x:pitchObject.rotation.x, y:yawObject.rotation.y, z:0},"XYZ");
    // quat.multiplyVector3(inputVelocity);

    // Add to the object
    velocity.x += inputVelocity.x;
    velocity.z += inputVelocity.z;

    cannonBody.position.copy(yawObject.position);
  };
};

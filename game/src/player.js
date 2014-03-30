var Player = function(args) {
  this.name   = args.name;
  this.color  = args.color;
  this.balls  = [];
  this.ballMeshes = [];

  this.shootDirection = new THREE.Vector3();
  this.shootVelo = 3;
  this.projector = new THREE.Projector();
  this.vectorForward = new THREE.Vector3(0, 0, -1);
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

  //this.getShootDir();
  ballBody.velocity.set(this.shootDirection.x * this.shootVelo,
      this.shootDirection.y * this.shootVelo + 6 + (Math.random() * 4),
      this.shootDirection.z * this.shootVelo);

  // Move the ball outside the player sphere
  x += this.shootDirection.x * (Resources.sphereShape.radius*1.02 + Resources.ballShape.radius);
  y += this.shootDirection.y * (Resources.sphereShape.radius*1.02 + Resources.ballShape.radius);
  z += this.shootDirection.z * (Resources.sphereShape.radius*1.02 + Resources.ballShape.radius);
  ballBody.position.set(x,y,z);
  ballMesh.position.set(x,y,z);
  ballMesh.useQuaternion = true;
};

Player.prototype.setShootDirection = function( mouseRotation ) {
  var quat = new THREE.Quaternion();
  quat.setFromEuler({x:mouseRotation.x, y:mouseRotation.y, z:0},"XYZ");
  quat.multiplyVector3(this.vectorForward, this.shootDirection);
}

Player.prototype.updateBalls = function() {
  // Update ball positions
  for (var i=0; i<this.balls.length; i++) {
    this.balls[i].position.copy(this.ballMeshes[i].position);
    this.balls[i].quaternion.copy(this.ballMeshes[i].quaternion);
  }
};
/*
Player.prototype.getShootDir = function() {
  this.shootDirection.set(0,0,1);
  this.projector.unprojectVector(vector, Game.camera);
  var ray = new THREE.Ray(Game.sphereBody.position, vector.subSelf(Game.sphereBody.position).normalize() );
  this.shootDirection.x = ray.direction.x;
  this.shootDirection.y = ray.direction.y;
  this.shootDirection.z = ray.direction.z;
};
*/

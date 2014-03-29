(function() {
  var ASPECT, FAR, HEIGHT, NEAR, VIEW_ANGLE, WIDTH, camera, counter, emitter, emitterpos, p, pMaterial, pX, pY, pZ, particle, particleCount, particleSystem, particles, pointLight, render, renderer, scene, vector, _i;

  WIDTH = 640;

  HEIGHT = 360;

  VIEW_ANGLE = 45;

  ASPECT = WIDTH / HEIGHT;

  NEAR = 0.1;

  FAR = 10000;

  renderer = new THREE.WebGLRenderer();

  camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);

  scene = new THREE.Scene();

  scene.add(camera);

  camera.position.z = 300;

  renderer.setSize(WIDTH, HEIGHT);

  document.body.appendChild(renderer.domElement);

  pointLight = new THREE.PointLight(0xFFFFFF);

  pointLight.position.x = 10;

  pointLight.position.y = 50;

  pointLight.position.z = 130;

  scene.add(pointLight);

  particleCount = 1800;

  particles = new THREE.Geometry();

  pMaterial = new THREE.ParticleSystemMaterial({
    color: 0xFFFF00,
    size: 2
  });

  for (p = _i = 0; 0 <= particleCount ? _i <= particleCount : _i >= particleCount; p = 0 <= particleCount ? ++_i : --_i) {
    pX = Math.random() * 500 - 250;
    pY = Math.random() * 500 - 250;
    pZ = Math.random() * 500 - 250;
    particle = new THREE.Vertex(new THREE.Vector3(pX, pY, pZ));
    particles.vertices.push(particle);
  }

  particleSystem = new THREE.ParticleSystem(particles, pMaterial);

  scene.add(particleSystem);

  counter = new SPARKS.SteadyCounter(500);

  emitter = new SPARKS.Emitter(counter);

  emitter.start();

  emitterpos = new THREE.Vector3(0, 0, 0);

  emitter.addInitializer(new SPARKS.Position(new SPARKS.PointZone(emitterpos)));

  emitter.addInitializer(new SPARKS.Lifetime(1, 15));

  vector = new THREE.Vector3(0, -5, 1);

  emitter.addInitializer(new SPARKS.Velocity(new SPARKS.PointZone(vector)));

  emitter.addAction(new SPARKS.Age());

  emitter.addAction(new SPARKS.Accelerate(0, 0, -50));

  emitter.addAction(new SPARKS.Move());

  emitter.addAction(new SPARKS.RandomDrift(90, 100, 2000));

  scene.add(emitter);

  render = function() {
    requestAnimationFrame(render);
    return renderer.render(scene, camera);
  };

  render();

}).call(this);

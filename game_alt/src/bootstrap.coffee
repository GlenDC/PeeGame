# set the scene size
WIDTH   = 640
HEIGHT  = 360

# set some camera attributes
VIEW_ANGLE = 45
ASPECT = WIDTH / HEIGHT
NEAR = 0.1
FAR = 10000

renderer  = new THREE.WebGLRenderer()
camera    = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR)

scene = new THREE.Scene()
scene.add(camera)

# the camera starts at 0,0,0 so pull it back
camera.position.z = 300

renderer.setSize(WIDTH, HEIGHT)

document.body.appendChild renderer.domElement

# -----------------------------------------------------------------------------

# create a point light
pointLight = new THREE.PointLight(0xFFFFFF);

# set its position
pointLight.position.x = 10;
pointLight.position.y = 50;
pointLight.position.z = 130;

# add to the scene
scene.add(pointLight);

# create the particle variables
particleCount = 1800
particles = new THREE.Geometry()
pMaterial = new THREE.ParticleSystemMaterial({
  color:  0xFFFF00,
  size:   2
})

# now create the individual particles
for p in [0 .. particleCount]
  # create a particle with random
  # position values, -250 -> 250
  pX = Math.random() * 500 - 250
  pY = Math.random() * 500 - 250
  pZ = Math.random() * 500 - 250
  particle = new THREE.Vertex(new THREE.Vector3(pX, pY, pZ))

  # add it to the geometry
  particles.vertices.push(particle)

# create the particle system
particleSystem = new THREE.ParticleSystem(particles, pMaterial)

# add it to the scene
scene.add(particleSystem)

# -----------------------------------------------------------------------------

counter = new SPARKS.SteadyCounter(500)
emitter = new SPARKS.Emitter(counter)
emitter.start()

emitterpos = new THREE.Vector3( 0, 0, 0 )
emitter.addInitializer( new SPARKS.Position( new SPARKS.PointZone( emitterpos ) ) )
emitter.addInitializer( new SPARKS.Lifetime( 1, 15 ))
vector = new THREE.Vector3( 0, -5, 1 )
emitter.addInitializer( new SPARKS.Velocity( new SPARKS.PointZone( vector ) ) )

emitter.addAction(new SPARKS.Age())
emitter.addAction(new SPARKS.Accelerate( 0, 0, -50 ))
emitter.addAction(new SPARKS.Move())
emitter.addAction(new SPARKS.RandomDrift( 90, 100, 2000 ))

scene.add(emitter)

# -----------------------------------------------------------------------------

render = ->
  requestAnimationFrame(render)
  renderer.render(scene, camera)

render()

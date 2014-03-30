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

sphereShape, sphereBody, world, physicsMaterial, walls=[], balls=[], ballMeshes=[], boxes=[], boxMeshes=[]

geometry, material, mesh = null
controls = null
time = Date.now()

blocker = document.getElementById( 'blocker' )
instructions = document.getElementById( 'instructions' )

havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document

if havePointerLock
  element = document.body
  pointerlockchange = (event) ->
    if (document.pointerLockElement == element || document.mozPointerLockElement == element || document.webkitPointerLockElement == element )
      controls.enabled = true
      blocker.style.display = 'none'
    else
      controls.enabled = false
      blocker.style.display = '-webkit-box'
      blocker.style.display = '-moz-box'
      blocker.style.display = 'box'
      instructions.style.display = ''

  pointerlockerror = (event) -> instructions.style.display = ''

  # Hook pointer lock state change events
  document.addEventListener( 'pointerlockchange', pointerlockchange, false )
  document.addEventListener( 'mozpointerlockchange', pointerlockchange, false )
  document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false )

  document.addEventListener( 'pointerlockerror', pointerlockerror, false )
  document.addEventListener( 'mozpointerlockerror', pointerlockerror, false )
  document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false )

  instructions.addEventListener('click', (event) ->
    instructions.style.display = 'none'

    # Ask the browser to lock the pointer
    element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock

    if /Firefox/i.test( navigator.userAgent )
      fullscreenchange = (event) ->
        if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element )
          document.removeEventListener( 'fullscreenchange', fullscreenchange )
          document.removeEventListener( 'mozfullscreenchange', fullscreenchange )
          element.requestPointerLock()

      document.addEventListener( 'fullscreenchange', fullscreenchange, false )
      document.addEventListener( 'mozfullscreenchange', fullscreenchange, false )
      element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen
      element.requestFullscreen()
    else
      element.requestPointerLock()
  , false)
else
  instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API'

initCannon()
init()
animate()

initCannon = ->
  # Setup our world
  world = new CANNON.World()
  world.quatNormalizeSkip = 0
  world.quatNormalizeFast = false

  solver = new CANNON.GSSolver()

  world.defaultContactMaterial.contactEquationStiffness = 1e9
  world.defaultContactMaterial.contactEquationRegularizationTime = 4

  solver.iterations = 7
  solver.tolerance = 0.1
  split = true
  if(split)
    world.solver = new CANNON.SplitSolver(solver)
  else
    world.solver = solver

  world.gravity.set(0,-20,0)
  world.broadphase = new CANNON.NaiveBroadphase()

  # Create a slippery material (friction coefficient = 0.0)
  physicsMaterial = new CANNON.Material("slipperyMaterial")
  physicsContactMaterial = new CANNON.ContactMaterial(physicsMaterial,
      physicsMaterial,
      0.0, # friction coefficient
      0.3  # restitution
      )
  # We must add the contact materials to the world
  world.addContactMaterial(physicsContactMaterial)

  # Create a sphere
  mass = 5, radius = 1.3
  sphereShape = new CANNON.Sphere(radius)
  sphereBody = new CANNON.RigidBody(mass,sphereShape,physicsMaterial)
  sphereBody.position.set(0,5,0)
  sphereBody.linearDamping = 0.9
  world.add(sphereBody)

  # Create a plane
  groundShape = new CANNON.Plane()
  groundBody = new CANNON.RigidBody(0,groundShape,physicsMaterial)
  groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2)
  world.add(groundBody)

init = ->
  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 )

  scene = new THREE.Scene()
  scene.fog = new THREE.Fog( 0x000000, 0, 500 )

  ambient = new THREE.AmbientLight( 0x111111 )
  scene.add( ambient )

  light = new THREE.SpotLight( 0xffffff )
  light.position.set( 10, 30, 20 )
  light.target.position.set( 0, 0, 0 )
  if true
    light.castShadow = true

    light.shadowCameraNear = 20
    light.shadowCameraFar = 50;#camera.far
    light.shadowCameraFov = 40

    light.shadowMapBias = 0.1
    light.shadowMapDarkness = 0.7
    light.shadowMapWidth = 2*512
    light.shadowMapHeight = 2*512

    #light.shadowCameraVisible = true

  scene.add( light )

  controls = new PointerLockControls( camera , sphereBody )
  scene.add( controls.getObject() )

  # floor
  geometry = new THREE.PlaneGeometry( 300, 300, 50, 50 )
  geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) )

  material = new THREE.MeshLambertMaterial( { color: 0xdddddd } )
  THREE.ColorUtils.adjustHSV( material.color, 0, 0, 0.9 )

  mesh = new THREE.Mesh( geometry, material )
  mesh.castShadow = true
  mesh.receiveShadow = true
  scene.add( mesh )

  renderer = new THREE.WebGLRenderer()
  renderer.shadowMapEnabled = true
  renderer.shadowMapSoft = true
  renderer.setSize( window.innerWidth, window.innerHeight )
  renderer.setClearColor( scene.fog.color, 1 )

  document.body.appendChild( renderer.domElement )

  window.addEventListener( 'resize', onWindowResize, false )

  # Add boxes
  halfExtents = new CANNON.Vec3(1,1,1)
  boxShape = new CANNON.Box(halfExtents)
  boxGeometry = new THREE.CubeGeometry(halfExtents.x*2,halfExtents.y*2,halfExtents.z*2)
  for i in [0..7]
    x = (Math.random()-0.5)*20
    y = 1 + (Math.random()-0.5)*1
    z = (Math.random()-0.5)*20
    boxBody = new CANNON.RigidBody(5,boxShape)
    boxMesh = new THREE.Mesh( boxGeometry, material )
    world.add(boxBody)
    scene.add(boxMesh)
    boxBody.position.set(x,y,z)
    boxMesh.position.set(x,y,z)
    boxMesh.castShadow = true
    boxMesh.receiveShadow = true
    boxMesh.useQuaternion = true
    boxes.push(boxBody)
    boxMeshes.push(boxMesh)

  # Add linked boxes
  size = 0.5
  he = new CANNON.Vec3(size,size,size*0.1)
  boxShape = new CANNON.Box(he)
  mass = 0
  space = 0.1*size
  N=5, last
  boxGeometry = new THREE.CubeGeometry(he.x*2,he.y*2,he.z*2)

  for i in [0..N]
    boxbody = new CANNON.RigidBody(mass,boxShape)
    boxMesh = new THREE.Mesh( boxGeometry, material )
    boxbody.position.set(5,(N-i)*(size*2+2*space) + size*2+space,0)
    boxbody.linearDamping=0.01
    boxbody.angularDamping=0.01
    boxMesh.useQuaternion = true
    boxMesh.castShadow = true
    boxMesh.receiveShadow = true
    world.add(boxbody)
    scene.add(boxMesh)
    boxes.push(boxbody)
    boxMeshes.push(boxMesh)

    if i != 0
      # Connect this body to the last one
      c1 = new CANNON.PointToPointConstraint(boxbody,new CANNON.Vec3(-size,size+space,0),last,new CANNON.Vec3(-size,-size-space,0))
      c2 = new CANNON.PointToPointConstraint(boxbody,new CANNON.Vec3(size,size+space,0),last,new CANNON.Vec3(size,-size-space,0))
      world.addConstraint(c1)
      world.addConstraint(c2)
    else
      mass=0.3

    last = boxbody

onWindowResize = ->
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize( window.innerWidth, window.innerHeight )

dt = 1/60
animate = ->
  requestAnimationFrame( animate )
  if controls.enabled
    world.step(dt)

    # Update ball positions
    for i in [0...balls.length]
      balls[i].position.copy(ballMeshes[i].position)
      balls[i].quaternion.copy(ballMeshes[i].quaternion)

    # Update box positions
    for i in [0...boxes.length]
      boxes[i].position.copy(boxMeshes[i].position)
      boxes[i].quaternion.copy(boxMeshes[i].quaternion)

    # Shoot ballz
    if controls.enabled == true
      x = sphereBody.position.x
      y = sphereBody.position.y
      z = sphereBody.position.z
      ballBody = new CANNON.RigidBody(1,ballShape)
      ballMesh = new THREE.Mesh( ballGeometry, material )
      world.add(ballBody)
      scene.add(ballMesh)
      ballMesh.castShadow = true
      ballMesh.receiveShadow = true
      balls.push(ballBody)
      ballMeshes.push(ballMesh)
      getShootDir(shootDirection)
      ballBody.velocity.set(  shootDirection.x * shootVelo,
          shootDirection.y * shootVelo,
          shootDirection.z * shootVelo)

      # Move the ball outside the player sphere
      x += shootDirection.x * (sphereShape.radius*1.02 + ballShape.radius)
      y += shootDirection.y * (sphereShape.radius*1.02 + ballShape.radius)
      z += shootDirection.z * (sphereShape.radius*1.02 + ballShape.radius)
      ballBody.position.set(x,y,z)
      ballMesh.position.set(x,y,z)
      ballMesh.useQuaternion = true

  controls.update( Date.now() - time )
  renderer.render( scene, camera )
  time = Date.now()

# Particles
particles = new THREE.Geometry

for p in [0...2000]
  particle = new THREE.Vector3(Math.random() * 500 - 250, Math.random() * 500 - 250, Math.random() * 500 - 250)
  particles.vertices.push(particle)

particleMaterial = new THREE.ParticleBasicMaterial({ color: 0xeeeeee, size: 2 })
particleSystem = new THREE.ParticleSystem(particles, particleMaterial)

scene.add(particleSystem)

ballShape = new CANNON.Sphere(0.03)

#/*var ballShape = THREE.Geometry
  #var particleMaterial = new THREE.ParticleBasicMaterial({ color: 0xeeeeee, size: 2 })
  #var particleSystem = new THREE.ParticleSystem(particles, particleMaterial);*/

ballGeometry = new THREE.SphereGeometry(ballShape.radius)
shootDirection = new THREE.Vector3()
shootVelo = 20
projector = new THREE.Projector()

getShootDir = (targetVec) ->
  vector = targetVec
  targetVec.set(0,0,1)
  projector.unprojectVector(vector, camera)
  ray = new THREE.Ray(sphereBody.position, vector.subSelf(sphereBody.position).normalize() )
  targetVec.x = ray.direction.x
  targetVec.y = ray.direction.y
  targetVec.z = ray.direction.z

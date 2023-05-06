// @ts-nocheck
import * as THREE from 'three'
import { meanBy, last, flatten } from 'lodash-es'
import Delaunator from 'delaunator'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

export class FaceView {
  constructor(scene, width, height, datgui, stats) {
    this.cameraX = -150
    this.cameraY = -15
    this.cameraZ = 270
    this.cameraAngleX = 0.04
    this.cameraAngleY = -0.8
    this.cameraAngleZ = 0

    this.targetFaceHeight = 200
    this.applyScaling = true

    this.shouldCapture = null

    this.width = width
    this.height = height

    this.wireframe = false
    this.showPoints = false
    this.showAxes = false
    this.showNormal = false

    this.cachedPredictions = null
    this.debugElement = document.querySelector('#debugConsole')

    this.scene = new THREE.Scene();
    this.scene.add(new THREE.HemisphereLight());

    this.renderer = new THREE.WebGLRenderer({
      canvas: scene,
      antialias: true
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);

    this.wireMaterial = new THREE.MeshLambertMaterial({
      side: THREE.DoubleSide,
      vertexColors: true,
      wireframe: true,
      wireframeLinewidth: 6
    })

    this.meshMaterial = new THREE.MeshNormalMaterial({
      side: THREE.DoubleSide,
      vertexColors: true,
      flatShading: true,
      wireframe: false,
      wireframeLinewidth: 6
    })

    if (datgui) {
      datgui.add(this, 'wireframe').onFinishChange(this.updateScene.bind(this))
      datgui.add(this, 'showPoints').onFinishChange(this.updateScene.bind(this))
      datgui.add(this, 'showNormal').onFinishChange(this.updateScene.bind(this))
      datgui.add(this, 'showAxes').onFinishChange(this.updateAxes.bind(this))
      datgui.add(this, 'applyScaling')
      datgui.add(this, 'targetFaceHeight', 10, 500, 10)
      let cameraControls = datgui.addFolder('Camera')
      cameraControls.add(this, 'cameraX', -300, 300, 1).onChange(this.cameraControlsDidUpdate.bind(this))
      cameraControls.add(this, 'cameraY', -300, 300, 1).onChange(this.cameraControlsDidUpdate.bind(this))
      cameraControls.add(this, 'cameraZ', -300, 300, 1).onChange(this.cameraControlsDidUpdate.bind(this))
      cameraControls.add(this, 'cameraAngleX', -3, 3, 0.01).onChange(this.cameraControlsDidUpdate.bind(this))
      cameraControls.add(this, 'cameraAngleY', -3, 3, 0.01).onChange(this.cameraControlsDidUpdate.bind(this))
      cameraControls.add(this, 'cameraAngleZ', -3, 3, 0.01).onChange(this.cameraControlsDidUpdate.bind(this))
    }

    this.stats = stats

    this.updateAxes()

    this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1000);
    this.camera.add(new THREE.PointLight(0xffffff, 1));

    let controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.minDistance = 50;
    controls.maxDistance = 600;
    controls.enablePan = true;
    controls.addEventListener('change', this.cameraDidMove.bind(this));
    controls.update();

    // Position should be set after OrbitControls is applied, otherwise it overwrites everything.
    this.camera.position.x = this.cameraX
    this.camera.position.y = this.cameraY
    this.camera.position.z = this.cameraZ
    this.camera.rotation.x = this.cameraAngleX
    this.camera.rotation.y = this.cameraAngleY
    this.camera.rotation.z = this.cameraAngleZ
    this.cameraDebug()
  }

  get canvas() {
    return this.renderer.domElement
  }

  showDebug(message) {
    if (this.debugElement) {
      this.debugElement.innerHTML = message
    }
  }

  cameraDebug() {
    if (this.debugElement) {
      let debug = `${this.camera.position.x.toFixed(2)}, 
      ${this.camera.position.y.toFixed(2)}, 
      ${this.camera.position.z.toFixed(2)} | 
      ${this.camera.rotation.x.toFixed(2)},
      ${this.camera.rotation.y.toFixed(2)},
      ${this.camera.rotation.z.toFixed(2)}
      `
      this.showDebug(debug)
    }
  }

  cameraControlsDidUpdate() {
    this.camera.position.x = this.cameraX
    this.camera.position.y = this.cameraY
    this.camera.position.z = this.cameraZ

    this.camera.rotation.x = this.cameraAngleX
    this.camera.rotation.y = this.cameraAngleY
    this.camera.rotation.z = this.cameraAngleZ
  }

  cameraDidMove() {
    this.cameraDebug()
    this.renderOnce()
  }

  updateAxes() {
    if (this.showAxes) {
      if (!this.axes) {
        this.axes = new THREE.AxesHelper(300)
        this.scene.add(this.axes)
      }
    } else {
      if (this.axes) {
        this.scene.remove(this.axes)
        this.axes = null
      }
    }
  }

  computeMeshIndex(uvCoords) {
    // Compute triangular surface.
    let indexDelaunay = Delaunator.from(uvCoords)
    let meshIndex = []; // delaunay index => three.js index
    for (let i = 0; i < indexDelaunay.triangles.length; i++) {
      meshIndex.push(indexDelaunay.triangles[i]);
    }
    this.meshIndex = meshIndex
  }

  updateScene() {
    if (this.cachedPredictions) {
      this.updateFaceWithPredictions(this.cachedPredictions)
    }
  }

  updateFaceWithPredictions(predictions) {
    this.cachedPredictions = predictions
    if (this.mesh) {
      this.scene.remove(this.mesh)
    }
    let material = this.wireframe ? this.wireMaterial : this.meshMaterial
    this.mesh = this.buildFaceMeshWithPrediction(predictions, material)
    this.scene.add(this.mesh)
  }

  negateMatrix() {
    return new THREE.Matrix4().makeScale(-1, -1, -1)
  }

  centerAlignTranslationMatrix(vertices) {
    const centerX = meanBy(vertices, 0)
    const centerY = meanBy(vertices, 1)
    const centerZ = meanBy(vertices, 2)
    return new THREE.Matrix4().makeTranslation(-centerX, -centerY, -centerZ)
  }

  computeFaceNormal(face, translationMatrix) {
    // Pick three points that we use to determine the plane the face is "facing".
    const leftEyeCorner = last(face.annotations.leftEyeLower0)
    const rightEyeCorner = last(face.annotations.rightEyeLower0)
    const lowerMouthCenter = face.annotations.lipsLowerOuter[4]

    // order matters (thumb-rule)
    let triangleVerts = [
      new THREE.Vector3(...rightEyeCorner),
      new THREE.Vector3(...leftEyeCorner),
      new THREE.Vector3(...lowerMouthCenter)
    ]

    triangleVerts = triangleVerts.map(v => {
      return v
        .applyMatrix4(translationMatrix)
        .applyMatrix4(this.negateMatrix())
    })

    const faceTriangle = new THREE.Triangle(...triangleVerts)
    let faceNormal = new THREE.Vector3()
    faceTriangle.getNormal(faceNormal)

    return {
      normal: faceNormal,
      triangle: faceTriangle
    }
  }

  transformFace(vertices, transforms) {
    let vectors = vertices.map(v => {
      let vec = new THREE.Vector3(v[0], v[1], v[2])
      transforms.forEach(transform => { vec = vec.applyMatrix4(transform) })
      return vec
    })
    return vectors
  }

  buildFaceMeshWithPrediction(predictions, material) {
    let face = predictions[0]

    const translationMatrix = this.centerAlignTranslationMatrix(face.scaledMesh)
    const negateMatrix = this.negateMatrix()  // I don't understand why the face is returned upside down and inverted.

    // Attempt to normalize the face height.
    // from https://github.com/tensorflow/tfjs-models/blob/master/facemesh/mesh_map.jpg
    const topPoint = new THREE.Vector3(...face.scaledMesh[151])
    const bottomPoint = new THREE.Vector3(...face.scaledMesh[199])
    const faceHeight = topPoint.distanceTo(bottomPoint)
    let scaleFactor = this.targetFaceHeight / faceHeight
    if (!this.applyScaling) {
      scaleFactor = 1
    }
    const scaleMatrix = new THREE.Matrix4().makeScale(scaleFactor, scaleFactor, scaleFactor)

    // Attempt to always point face at (0, 0, 1)
    const faceNormal = this.computeFaceNormal(face, translationMatrix)
    const rotationQuat = new THREE.Quaternion().setFromUnitVectors(faceNormal.normal, new THREE.Vector3(0, 0, 1))
    const rotationMatrix = new THREE.Matrix4().makeRotationFromQuaternion(rotationQuat)

    const vertices = this.transformFace(face.scaledMesh, [translationMatrix, scaleMatrix, negateMatrix, rotationMatrix])
    const geometry = new THREE.BufferGeometry().setFromPoints(vertices)
    geometry.setIndex(this.meshIndex); // order vertices based on delauney triangles computed in computeMeshIndex

    let normalsArray = flatten(vertices.map(v => [0, 0, -1]))
    let colorsArray = flatten(vertices.map((v, i) => [i / vertices.length, 0.5, 0.5]))
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normalsArray, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colorsArray, 3))

    const faceMesh = new THREE.Group()
    const mesh = new THREE.Mesh(geometry, material)
    faceMesh.add(mesh)

    if (this.showPoints || this.wireframe) {
      const cloud = new THREE.Points(
        geometry,
        new THREE.PointsMaterial({ color: 0x99ccff, size: 2 })
      );
      faceMesh.add(cloud)
    }

    if (this.showNormal) {
      const rotatedNormal = faceNormal.normal.applyMatrix4(scaleMatrix).applyMatrix4(rotationMatrix)
      const normalArrow = new THREE.ArrowHelper(rotatedNormal, new THREE.Vector3(0, 0, 0), 100, 0xffff00)
      faceMesh.add(normalArrow)
    }

    return faceMesh;
  }

  renderOnce() {
    if (this.stats) {
      this.stats.begin()
    }
    if (this.didCanvasResize(this.renderer)) {
      const canvas = this.renderer.domElement;
      this.width = canvas.clientWidth
      this.height = canvas.clientHeight
      this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
      this.camera.updateProjectionMatrix();
    }
    this.renderer.render(this.scene, this.camera)

    if (this.shouldCapture) {
      let data = this.canvas.toDataURL('image/png', 1)
      this.shouldCapture(data)
      this.shouldCapture = null
    }
    if (this.stats) {
      this.stats.end()
    }
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.renderOnce();
  }

  capture(callback) {
    this.shouldCapture = callback
  }

  didCanvasResize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }
}
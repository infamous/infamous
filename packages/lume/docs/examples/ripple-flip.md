# Ripple flip

<div id="example"></div>
<script type="application/javascript">
  new Vue({
    el: '#example',
    template: '<live-code class="full" :template="code" mode="html>iframe" :debounce="200" />',
    data: {
      code:
`
<script src="${location.origin+location.pathname}/global.js"><\/script>
<script src="${location.origin+location.pathname}/node_modules/tinycolor2/tinycolor.js"><\/script>
<script src="${location.origin+location.pathname}/node_modules/tween.js/src/Tween.js"><\/script>

<style>
  html, body {
    width: 100%; height: 100%; padding:0; margin: 0;
  }
</style>

<body>

<script>
  LUME.useDefaultNames()

  const {Motor, Scene, Node} = LUME
  const {Tween, Easing} = TWEEN
  const color = tinycolor

  const sleep = duration => new Promise(r => setTimeout(r, duration))

  const rippleFlipOptions = {
    amountToRotate: 180,
    rotationDuration: 1600,
    rotationCurve: Easing.Exponential.Out,

    amountToDisplace: 200,
    displaceDuration: 1600,
    displaceCurve: Easing.Exponential.Out,

    amountToOpacify: 1,
    opacifyDuration: 2400,
    opacifyCurve: Easing.Exponential.Out,

    rippleDuration: 1000,
    rippleCurve: Easing.Linear.None,
    // rippleCurve: Easing.Exponential.In,
    // rippleCurve: Easing.Quadratic.In,

    rotation: true,
    displacement: true,
    opacification: true,
  }

  async function rippleFlip(options) {
    const mainColor = color('#7ac5de')

    document.body.style.background = mainColor

    const scene = new Scene
    scene.mount('body')

    const gridSizeX = 13
    const gridSizeY = 13
    const gridCellSize = 200

    const grid = new Node().set({
      size: [gridSizeX*gridCellSize, gridSizeY*gridCellSize],
      align: [0.5, 0.5],
      mountPoint: [0.5, 0.5],
      rotation: [30],
      position: {z: -600},
    })

    scene.add(grid)

    await grid.mountPromise
    await sleep(500)

    console.log('grid size', grid.calculatedSize)

    options = Object.assign({}, options, {
      // ripple center
      cx: grid.calculatedSize.x / 2,
      cy: grid.calculatedSize.y / 2,
      rippleDistance: grid.calculatedSize.x / 2,
    })

    // make a grid of rectangles
    for (let i=0; i<gridSizeX; i++) {
      for (let j=0; j<gridSizeY; j++) {
        const node = new Node().set({
          size: [gridCellSize, gridCellSize],
          position: [i*gridCellSize, j*gridCellSize],
          opacity: 0,
        })

        node.opacity = 0

        node.style.background = ''+mainColor.clone().darken(10)
        node.style.border = '1px solid ' + mainColor.clone().darken(35)

        grid.add(node)
      }
    }

    await sleep(500)

    while (true) {
      await ripple(grid, options)
      await sleep(1000)
    }
  }

  function ripple(grid, {
      cx, cy,
      amountToRotate, rotationDuration, rotationCurve,
      amountToDisplace, displaceDuration, displaceCurve,
      amountToOpacify, opacifyDuration, opacifyCurve,
      rippleDistance, rippleDuration, rippleCurve,
      rotation, displacement, opacification,
  }) {
      let resolve = null
      const promise = new Promise(r => resolve = r)

      let radiusTweenComplete = false
      const radius = {value:0}
      const radiusTween = new Tween(radius)
          .to({value:rippleDistance}, rippleDuration)
          .easing(rippleCurve)
          .onComplete(() => radiusTweenComplete = true)
          .start()

      Motor.addRenderTask(time => {
          radiusTween.update(time)

          for (let i = 0, l=grid.children.length; i<l; i+=1) {
              const node = grid.children[i]

              if (node.animating) continue

              if (!node.distanceFromCircle) {
                  const dx = cx - (node.position.x + 50)
                  const dy = cy - (node.position.y + 50)
                  const distanceToCircleCenter = Math.sqrt(dx**2 + dy**2)
                  node.initialDistanceFromCircle = distanceToCircleCenter - radius.value
                  node.distanceFromCircle = node.initialDistanceFromCircle
              }
              else {
                  node.distanceFromCircle = node.initialDistanceFromCircle - radius.value
              }

              if (node.distanceFromCircle <= 0) {
                  node.animating = true

                  if (rotation) rotateNode(node, amountToRotate, rotationDuration, rotationCurve)
                  if (displacement) displaceNode(node, amountToDisplace, displaceDuration, displaceCurve)
                  if (opacification) opacifyNode(node, amountToOpacify, opacifyDuration, opacifyCurve)
              }
          }

          if (radiusTweenComplete) {
              const children = grid.children
              for (let i = 0, l=children.length; i<l; i+=1) {
                  children[i].animating = false
              }
              resolve()
              return false
          }
      })

      return promise
  }

  function rotateNode(node, finalValue, duration, curve) {
      let resolve = null
      const promise = new Promise(r => resolve = r)

      let tweenDone = false

      const rotationTween = new Tween(node.rotation)
          .to({y:'+180'}, duration)
          .easing(curve)
          .onComplete(() => tweenDone = true)
          .start()

      Motor.addRenderTask(time => {
          rotationTween.update(time)
          if (tweenDone) {
              resolve()
              return false
          }
      })

      return promise
  }

  function displaceNode(node, amount, duration, curve) {
      let resolve = null
      const promise = new Promise(r => resolve = r)

      const displace = {value: 0}
      let tweenDone = false

      const displacementTween = new Tween(displace)
          .to({value: Math.PI}, duration)
          .easing(curve)
          .onComplete(() => tweenDone = true)
          .start()

      Motor.addRenderTask(time => {
          displacementTween.update(time)

          node.position.z = amount * Math.sin(displace.value)

          if (tweenDone) {
              resolve()
              return false
          }
      })

      return promise
  }

  function opacifyNode(node, amount, duration, curve) {
      let resolve = null
      const promise = new Promise(r => resolve = r)

      const opacify = {value: 0}
      let tweenDone = false

      const opacifyTween = new Tween(opacify)
          .to({value: Math.PI}, duration)
          .easing(curve)
          .onComplete(() => tweenDone = true)
          .start()

      Motor.addRenderTask(time => {
          opacifyTween.update(time)

          node.opacity = amount * Math.sin(opacify.value)

          if (tweenDone) {
              resolve()
              return false
          }
      })

      return promise
  }

  rippleFlip(rippleFlipOptions)
<\/script>

<body>

`
    },
  })
</script>

<!-- TODO show demo information without breaking the full height demo view:
- The 3D scene is defined with imperative JavaScript
- Rendering: CSS3D
- [Fork on codepen](https://codepen.io/trusktr/pen/bWwdqR) -->

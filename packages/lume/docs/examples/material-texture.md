# material-texture

<div id="example"></div>
<script type="application/javascript">
  new Vue({
    el: '#example',
    template: '<live-code class="full" :template="code" mode="html>iframe" :debounce="200" />',
    data: {
      code:
`
<script src="${location.origin+location.pathname}/global.js"><\/script>

<style>
    body, html {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        overflow: hidden;
        background: #191919;
        touch-action: none; /* prevent touch drag from scrolling */
        color: #ccc;
    }
    i-scene { position: absolute!important; top: 0; left: 0; }
    i-scene:nth-child(2) { pointer-events: none; }
    i-node { padding: 15px; pointer-events: all; }
    label { padding-right: 10px; }
</style>

<i-scene id="scene" experimental-webgl perspective="150">
    <i-ambient-light intensity="0.3"></i-ambient-light>
    <i-point-light
        id="light"
        color="white"
        position="300 300 300"
        size="0 0 0"
        cast-shadow="true"
        intensity="0.8"
        >
    </i-point-light>
    <!-- Specify a color otherwise the material will be tinted deeppink by default -->
    <i-box id="model"
        rotation="40 40 0"
        align="0.5 0.5 0.5"
        mount-point="0.5 0.5 0.5"
        size="100 100 100"
        color="white"
        texture="${location.origin+location.pathname}/textures/cement.jpg"
    >
    </i-box>
</i-scene>

<i-scene id="scene2">
    <i-node size-mode="proportional literal" size="1 80">
        <!-- FIXME When toggling these too fast, the toggling breaks. Three.js Loader problem? -->
        <label>
            X size:
            <select id="sizeX">
                <option value="50">50</option>
                <option selected value="100">100</option>
                <option value="150">150</option>
            </select>
        </label>
        <label>
            Y size:
            <select id="sizeY">
                <option value="50">50</option>
                <option selected value="100">100</option>
                <option value="150">150</option>
            </select>
        </label>
        <label>
            Z size:
            <select id="sizeZ">
                <option value="50">50</option>
                <option selected value="100">100</option>
                <option value="150">150</option>
            </select>
        </label>
        <label>
            Enable texture:
            <input type="checkbox" id="enableTex" checked />
        </label>
        <br />
        <label>
            Perspective <code id="perspectiveVal"></code>:
            <input id="perspective" type="range" min="75" max="250">
        </label>
    </i-node>
</i-scene>

<script>
    // defines the default names for the HTML elements
    LUME.useDefaultNames()

    const light = document.querySelector('#light')

    document.addEventListener('pointermove', event => {
        event.preventDefault()
        light.position.x = event.clientX
        light.position.y = event.clientY
    })

    const el = document.querySelector('#model')

    const rotate = (t) => 180 * Math.sin(0.0005 * t)
    el.rotation = (x, y, z, t) => [rotate(t/1.4), rotate(t/2.1), rotate(t/2.5)]

    // This shows three ways to update a node's properties.
    sizeX.addEventListener('change', event => el.size = {x: event.target.value})
    sizeY.addEventListener('change', event => el.size.y = event.target.value)
    sizeZ.addEventListener('change', event => el.behaviors.get('box-geometry').size = {z: event.target.value})

    enableTex.addEventListener('click', event => {
      // TODO FIXME Make sure ForwardProps sets initial values. Currently el.texture
      // starts as 'undefined' althought the attribute value is not.
      // el.texture = el.texture ? '' : '${location.origin+location.pathname}/textures/cement.jpg'
      el.setAttribute('texture', el.getAttribute('texture') ? '' : '${location.origin+location.pathname}/textures/cement.jpg')
    })

    perspectiveVal.textContent = '('+scene.perspective.toString().padStart(3, '0')+'px)'
    perspective.value = scene.perspective

    const onPerspectiveChange = event => {
        scene.perspective = perspective.value
        perspectiveVal.textContent = '('+perspective.value.padStart(3, ' ')+'px)'
    }

    perspective.addEventListener('change', onPerspectiveChange)
    perspective.addEventListener('input', onPerspectiveChange)
<\/script>

`
    },
  })
</script>

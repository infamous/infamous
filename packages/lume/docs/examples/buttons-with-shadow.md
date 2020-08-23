# Buttons with shadow

<div id="example"></div>
<script>
  new Vue({
    el: '#example',
    template: '<live-code class="full" :template="code" :autorun="true" mode="html>iframe" />',
    data: {
      code:
`
<body>

<script src="${location.origin+location.pathname}/global.js"><\/script>
<script src="${location.origin+location.pathname}/node_modules/vue/dist/vue.js"><\/script>
<script src="${location.origin+location.pathname}/node_modules/tween.js/src/Tween.js"><\/script>

<style>
    body, html {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        overflow: hidden;
        font-family: sans-serif;
        // prevent default touch actions so we can move the light with touch without scrolling
        touch-action: none;
    }
    i-node {
        text-align: center;
    }
    #bg {
        background: #62b997;
    }
    button {
        width: 100%;
        height: 100%;
        white-space: nowrap;
        border-radius: 0px;
        border: 1px solid #494455;
        background: #e96699;
        color: #494455;
        outline: none;
    }
    button:focus,
    button:hover {
        background: #0099d9;
        color: #0a3359;
        border-color: #0a3359;
    }
</style>

<template vue>
    <!-- Lights and shadows are powered by WebGL, but written with HTML: -->
    <i-scene
        experimental-webgl="true"
        id="scene"
        background-color="black"
        background-opacity="0"
        perspective="800"
        shadowmap-type="pcfsoft" NOTE="one of basic, pcf, pcfsoft"
    >
        <i-ambient-light color="#ffffff" intensity="0"></i-ambient-light>
        <i-dom-plane ref="plane" id="bg" size-mode="proportional proportional" size="1 1 0" color="#444">
            <i-node
                id="button-container"
                position="0 0 20"
                size="600 31 0"
                align="0.5 0.5 0"
                mount-point="0.5 0.5 0"
            >
                <i-dom-plane
                    v-for="n in [0,1,2,3,4]"
                    ref="btn"
                    :key="n"
                    size-mode="literal proportional"
                    size="100 1 0"
                    :align="\`\${n*0.25} 0 0\`"
                    :mount-point="\`\${n*0.25} 0 0\`"
                    color="#444"
                >
                    <button>button {{n+1}}</button>
                </i-dom-plane>
            </i-node>
            <i-node id="lightContainer" size="0 0 0" position="0 0 300">
                <i-point-light
                    id="light"
                    color="white"
                    size="0 0 0"
                    cast-shadow="true"
                    intensity="0.8"
                >
                    <i-mesh
                        has="sphere-geometry basic-material"
                        size="10 10 10"
                        color="white"
                        receive-shadow="false"
                        cast-shadow="false"
                        style="pointer-events: none"
                    >
                    </i-mesh>
                </i-point-light>
            </i-node>
        </i-dom-plane>
    </i-scene>
</template>

<div id="root"></div>

<script>
    LUME.useDefaultNames()

    new Vue({
        el: '#root',
        template: document.querySelector('[vue]').innerHTML,
        mounted: function() {
            const {Motor, Events} = LUME
            const scene = document.querySelector('#scene')
            const lightContainer = document.querySelector('#lightContainer')
            const light = document.querySelector('#light')

            scene.on(Events.GL_LOAD, async () => {
                // TODO fix order of events. Promise.resolve() should not be needed here.
                await Promise.resolve()
                light.three.shadow.radius = 2
                light.three.distance = 800
                light.three.shadow.bias = -0.001

                // The following is a temporary hack because opacity isn't
                // exposed through the HTML API yet. work-in-progress...
                // TODO this stuff should be doable via the HTML
                Array.from( document.querySelectorAll('i-dom-plane') ).forEach(function(n) {
                    n.three.material.opacity = 0.3
                })

                document.querySelector('#bg').three.material.opacity = 0.3
                document.querySelector('#bg').three.material.dithering = true

                scene.needsUpdate()
            })

            const targetPosition = {x: window.innerWidth / 2, y: window.innerHeight / 2}

            document.addEventListener('pointermove', function(e) {
                e.preventDefault()
                targetPosition.x = e.clientX
                targetPosition.y = e.clientY
            })

            Motor.addRenderTask(time => {
                lightContainer.position.x += (targetPosition.x - lightContainer.position.x) * 0.01
                lightContainer.position.y += (targetPosition.y - lightContainer.position.y) * 0.01
                light.position.x = 100 * Math.sin(time * 0.001)
                light.position.y = 100 * Math.cos(time * 0.001)
            })

            let downTween, upTween, pressedButton

            // On mouse down animate the button downward
            document.addEventListener('pointerdown', function(e) {
                if ( is( e.target, 'button' ) ) {
                    pressedButton = e.target

                    if (upTween) {
                        upTween.stop()
                        upTween = null
                    }

                    downTween = new TWEEN.Tween(e.target.parentNode.position)
                        .to({z: -20}, 75)
                        .start()
                        .onComplete(function () { downTween = null })

                    Motor.addRenderTask(function(time) {
                        if (!downTween) return false
                        downTween.update(time)
                    })
                }
            })

            // On mouse up animate the button upward
            document.addEventListener('pointerup', function(e) {
                if ( pressedButton ) {
                    if (downTween) {
                        downTween.stop()
                        downTween = null
                    }

                    upTween = new TWEEN.Tween(pressedButton.parentNode.position)
                        .to({z: 0}, 75)
                        .start()
                        .onComplete(function() { upTween = null })

                    Motor.addRenderTask(function(time) {
                        if (!upTween) return false
                        upTween.update(time)
                    })
                }
            })

            function is( el, selector ) {
                if ( [].includes.call(
                    document.querySelectorAll( selector ),
                    el
                ) ) return true
                return false
            }
        },
    })

<\/script>

</body>

`
    },
  })
</script>

<!-- TODO show demo information without breaking the full height demo view:
- A ["picked" pen](https://codepen.io/trusktr/pen/rpegZR) on CodePen!
- The 3D scene is defined using HTML
- JavaScript used for event handling and animating with Tween.js.
- Rendering: experimental WebGL and CSS3D, blended together in "mixed mode",
  where regular DOM elements (CSS3D) and WebGL objects are rendered together
  in the same 3D space with lighting and shadow -->

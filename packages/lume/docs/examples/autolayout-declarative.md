# Autolayout (declarative)

<div id="example"></div>
<script type="application/javascript">
  new Vue({
    el: '#example',
    template: '<live-code class="full" :template="code" mode="html>iframe" :debounce="1000" />',
    data: {
      code:
`
<script src="${location.origin+location.pathname}/global.js"><\/script>

<style>
    body, html {
        width: 100%; height: 100%;
        margin: 0; padding: 0;
        overflow: hidden;
        touch-action: none; /* prevent touch drag from scrolling */
    }
</style>

<!-- In general it is always better to ensure custom elements are defined before using them. -->
<!-- FIXME: If we move this script to after the scene's markup, then the last item in the layout never becomes visible for some reason. -->
<script> LUME.useDefaultNames() <\/script>

<i-scene id="scene" experimental-webgl>
    <i-ambient-light intensity="0.1"></i-ambient-light>
    <i-point-light
        id="light"
        color="white"
        position="300 300 120"
        size="0 0 0"
        cast-shadow="true"
        intensity="0.5"
        >
        <i-mesh
            has="sphere-geometry basic-material"
            size="10 10 10"
            color="white"
            receive-shadow="false"
            cast-shadow="false"
            mount-point="0.5 0.5 0.5"
            style="pointer-events: none"
            >
        </i-sphere>
    </i-point-light>
    <i-autolayout-node
        id="layout"
        size="100 100 0" TODO="why do we need Z size 0 here, but not in the imperative example?"
        position="0 0 0"
        align=" 0.5 0.5 0"
        mount-point=" 0.5 0.5 0"
        visual-format="
            V:|-[child1(child3)]-[child3]-|
            V:|-[child2(child4)]-[child4]-|
            V:[child5(child4)]-|
            |-[child1(child2)]-[child2]-|
            |-[child3(child4,child5)]-[child4]-[child5]-|
        "
        style="background: rgba(0,0,0,0.3)"
    >
        <i-dom-plane size="1 1 0" color="deeppink" class="child1">This is a paragraph of text to show that it reflows when the size of the layout changes size so that the awesomeness can be observed in its fullness.</i-dom-plane>
        <i-dom-plane size="1 1 0" color="deeppink" class="child2">This is a paragraph of text to show that it reflows when the size of the layout changes size so that the awesomeness can be observed in its fullness.</i-dom-plane>
        <i-dom-plane size="1 1 0" color="deeppink" class="child3">This is a paragraph of text to show that it reflows when the size of the layout changes size so that the awesomeness can be observed in its fullness.</i-dom-plane>
        <i-dom-plane size="1 1 0" color="deeppink" class="child4">This is a paragraph of text to show that it reflows when the size of the layout changes size so that the awesomeness can be observed in its fullness.</i-dom-plane>
        <i-dom-plane size="1 1 0" color="deeppink" class="child5">This is a paragraph of text to show that it reflows when the size of the layout changes size so that the awesomeness can be observed in its fullness.</i-dom-plane>
    </i-autolayout-node>
</i-scene>

<script>

    const layout = document.querySelector('#layout')
    layout.size = (x,y,z,t) => [600+200*Math.sin(t/1000),400+200*Math.sin(t/1000),z]

    const light = document.querySelector('#light')

    document.addEventListener('pointermove', function(e) {
        e.preventDefault()
        light.position.x = e.clientX
        light.position.y = e.clientY
    })

    const vfl1 = \`
        //viewport aspect-ratio:3/1 max-height:300
        H:|-[row:[child1(child2,child5)]-[child2]-[child5]]-|
        V:|-[row]-|
    \`
    const vfl2 = \`
        V:|-[child1(child3)]-[child3]-|
        V:|-[child2(child4)]-[child4]-|
        V:[child5(child4)]-|
        |-[child1(child2)]-[child2]-|
        |-[child3(child4,child5)]-[child4]-[child5]-|
    \`

    let lastSize = 'big'
    let size = 'big' // or 'small'

    layout.on('sizechange', ({x, y, z}) => {
        if (x <= 600) size = 'small'
        else size = 'big'

        if (lastSize !== size) {
            if (size === 'small') layout.visualFormat = vfl1
            else layout.visualFormat = vfl2
        }

        lastSize = size
    })

    Array.from( document.querySelectorAll('i-dom-plane') ).forEach(plane => {
        plane.three.material.opacity = 0.3
        plane.needsUpdate()
    })

    light.three.shadow.radius = 2
    light.three.distance = 800
    light.three.shadow.bias = -0.01
    light.needsUpdate()
<\/script>

`
    },
  })
</script>

# Reactivity

<div id="example"></div>
<script type="application/javascript">
  new Vue({
    el: '#example',
    template: '<live-code class="full" :template="code" mode="html>iframe" :debounce="200" />',
    data: {
      code:
`
<script src="${location.origin+location.pathname}/global.js"><\/script>

<body>

  <style>
    html, body {
      margin: 0; padding: 0;
      height: 100%; width: 100%;
    }
    i-scene {
      background: #333;
    }
    i-node {
      background: deeppink;
      font-family: sans serif;
      border-radius: 5px;
    }
  </style>

  <script>
    LUME.useDefaultNames()

    const {variable, html, Motor} = LUME

    const count = variable(0)
    const rotationY = variable(-45)
    const rotation = () => [0, rotationY(), 0]

    setInterval(() => count(count() + 1), 1000)

    const div = html\`
      <i-scene>
        <i-node
          id="node"
          rotation=\${rotation}
          size="100 100"
          align="0.5 0.5 0.5"
          mount-point="0.5 0.5 0.5"
        >
          <h3 align="center">\${count}</h3>
        </i-node>
      </i-scene>
    \`

    document.body.append(div)

    Motor.addRenderTask(() => {
      rotationY(rotationY() + 1)
    })
  <\/script>
</body>
`
    },
  })
</script>

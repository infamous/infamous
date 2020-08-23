import {html as _html} from '@lume/element'
import DeclarativeBase, {initDeclarativeBase} from './DeclarativeBase'

// TODO This type cast not needed on the next lit-dom-expressions release after v0.19.10.
const html = _html as any

initDeclarativeBase()

export default class HTMLScene extends DeclarativeBase {
	// TODO move these things (and others) out of the HTML interfaces, and
	// enable them when the HTML interfaces are present, so that we can
	// decouple HTML interfaces being present from functionality. We can
	// make these things private if they are in the Scene class, and expose
	// the private helper from there to friend modules.
	protected _glLayer: HTMLDivElement | null = null
	protected _cssLayer: HTMLDivElement | null = null

	template = () => html`
		<div class="i-scene-inner">
			<div ref=${(el: HTMLDivElement) => (this._cssLayer = el)} class="i-scene-CSS3DLayer">
				${/* WebGLRendererThree places the CSS3DRendererNested domElement
				here, which contains a <slot> element that child elements of
				a Scene are distributed into (rendered relative to).
				*/ ''}
			</div>
			<div ref=${(el: HTMLDivElement) => (this._glLayer = el)} class="i-scene-WebGLLayer">
				${/* WebGLRendererThree places the Three.js <canvas> element here. */ ''}
			</div>
			<div class="i-scene-MiscellaneousLayer">
				<slot name="misc"></slot>
			</div>
		</div>
	`

	static css = /*css*/ `
		:host {
			/*
			 * All items of the scene graph are hidden until they are mounted in
			 * a scene (this changes to display:block). 'display' gets toggled
			 * between "none" and "block" by ImperativeBase depending on if CSS
			 * rendering is enabled.
			 */
			display: none;

			box-sizing: border-box;
			position: static;
			overflow: hidden;
			top: 0;
			left: 0;

			/*
			// Defaults to [0.5,0.5,0.5] (the Z axis doesn't apply for DOM elements,
			// but will for 3D objects in WebGL.)
			*/
			transform-origin: 50% 50% 0; /* default */

			transform-style: preserve-3d;
		}

		.i-scene-inner {
			position: relative
		}

		.i-scene-inner,
		.i-scene-CSS3DLayer,
		.i-scene-MiscellaneousLayer,
		.i-scene-WebGLLayer,
		.i-scene-WebGLLayer > canvas  {
			margin: 0; padding: 0;
			width: 100%; height: 100%;
			display: block;
		}

		.i-scene-CSS3DLayer,
		.i-scene-MiscellaneousLayer,
		.i-scene-WebGLLayer {
			/* make sure all layers are stacked on top of each other */
			position: absolute; top: 0; left: 0;
		}

		.i-scene-CSS3DLayer {
			transform-style: preserve-3d;
		}

		.i-scene-WebGLLayer,
		.i-scene-MiscellaneousLayer {
			pointer-events: none;
		}
	`

	// from Scene
	// TODO PossiblyScene type, or perhaps a mixin that can be applied to the
	// Scene class to make it gain the HTML interface
	protected _mounted = false
	mount?(f?: string | Element | null): void
	unmount?(): void

	connectedCallback() {
		super.connectedCallback()

		// When the HTMLScene gets addded to the DOM, make it be "mounted".
		if (!this._mounted) this.mount!(this.parentNode as Element)

		const root = this._cssLayer!.attachShadow({mode: 'open'})
		root.append(html`
			<style>
				.i-scene-CSS3DLayer-inner {
					/*
					 * make sure CSS3D rendering is contained inside of the
					 * CSS3DLayer (all 3D elements have position:absolute,
					 * which will be relative to this container)
					 */
					position: relative;
				}
			</style>
		`)
		root.append(html`
			<div class="i-scene-CSS3DLayer-inner">
				<slot></slot>
			</div>
		`)
	}

	disconnectedCallback() {
		super.disconnectedCallback()

		this.unmount!()
	}
}

export {HTMLScene}

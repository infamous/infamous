// import styles from './HTMLNode.style'
import DeclarativeBase, {initDeclarativeBase} from './DeclarativeBase'

initDeclarativeBase()

export default class HTMLNode extends DeclarativeBase {
	// TODO delete this line, which will in turn cause all nodes to have a
	// shadow root. Then if we can make that work, we'll be in good shape for
	// ShadowDOM support.
	root = this

	static css = /*css*/ `
		:host {
			/*
			 * All items of the scene graph are hidden until they are mounted in
			 * a scene (this changes to display:block). This gets toggled
			 * between "none" and "block" by ImperativeBase depending on if CSS
			 * rendering is enabled.
			 */
			display: none;

			box-sizing: border-box;
			position: absolute;
			top: 0;
			left: 0;

			/*
			 * Defaults to [0.5,0.5,0.5] (the Z axis doesn't apply for DOM
			 * elements, but does for 3D objects in WebGL that have any size
			 * along Z.)
			 */
			transform-origin: 50% 50% 0; /* default */

			transform-style: preserve-3d;
		}
	`

	// getStyles() {
	// 	return styles
	// }
}

export {HTMLNode}

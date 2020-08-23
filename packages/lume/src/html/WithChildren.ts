import {Mixin, MixinResult, Constructor} from 'lowclass'
import {observeChildren} from '../core/Utility'

import type {PossibleCustomElement, PossibleCustomElementConstructor} from './PossibleCustomElement'

// polyfill for Node.isConnected based on Ryosuke Niwa's
// https://github.com/w3c/webcomponents/issues/789#issuecomment-459858405
if (!Object.getOwnPropertyDescriptor(Node.prototype, 'isConnected')) {
	let rootNode: any = null

	if ((Node.prototype as any).getRootNode) rootNode = (node: Node) => node.getRootNode({composed: true})
	else {
		rootNode = (node: Node) => {
			for (let ancestor: Node = node, ancestorParent; ancestor; ancestor = ancestorParent) {
				ancestorParent = ancestor.parentNode || (ancestor as ShadowRoot).host
				if (!ancestorParent) return ancestor
			}
			return node
		}
	}

	Object.defineProperty(Node.prototype, 'isConnected', {
		get() {
			return rootNode(this).nodeType === Node.DOCUMENT_NODE
		},
		enumerable: true,
		configurable: true,
	})
}

function WithChildrenMixin<T extends Constructor<HTMLElement>>(Base: T) {
	class WithChildren extends Constructor<PossibleCustomElement, PossibleCustomElementConstructor>(Base) {
		constructor(...args: any[]) {
			super(...args)

			this.__createObserver()

			if (!this.isConnected) {
				this.__handleChildrenWhenConnected = true
				return
			}

			this.__handleConnectedChildren()
		}

		connectedCallback() {
			super.connectedCallback && super.connectedCallback()

			if (this.__handleChildrenWhenConnected) {
				this.__handleConnectedChildren()
			}

			this.__createObserver()
		}

		disconnectedCallback() {
			console.log('WithChildren disconnectedCallback')
			super.disconnectedCallback && super.disconnectedCallback()

			this.__destroyObserver()
			this.__handleChildrenWhenConnected = true
		}

		childConnectedCallback?(_child: Element): void
		childDisconnectedCallback?(_child: Element): void

		private __handleChildrenWhenConnected = false
		private __observer: MutationObserver | null = null

		private __createObserver() {
			if (this.__observer) return

			// observeChildren returns a MutationObserver observing childList
			this.__observer = observeChildren(
				this,
				(child: Element) => {
					if (!this.isConnected) return
					this.childConnectedCallback && this.childConnectedCallback(child)
				},
				(child: Element) => {
					if (!this.isConnected) return
					this.childDisconnectedCallback && this.childDisconnectedCallback(child)
				},
				true,
			)
		}

		private __destroyObserver() {
			if (!this.__observer) return
			this.__observer.disconnect()
			this.__observer = null
		}

		private __handleConnectedChildren() {
			if (!this.isConnected) return

			for (let element = this.firstElementChild; element; element = element.nextElementSibling) {
				this.__handleConnectedChild(element)
			}
		}

		private __handleConnectedChild(element: Element) {
			Promise.resolve().then(() => {
				if (isNotPossiblyCustom(element) || element.matches(':defined')) {
					this.childConnectedCallback && this.childConnectedCallback(element)
				} else {
					setTimeout(() => {
						this.childConnectedCallback && this.childConnectedCallback(element)
					})
				}
			})
		}
	}

	return WithChildren as MixinResult<typeof WithChildren, T>
}

function isNotPossiblyCustom(element: Element) {
	return !element.localName.includes('-')
}

export const WithChildren = Mixin(WithChildrenMixin)
export interface WithChildren extends InstanceType<typeof WithChildren> {}
export default WithChildren

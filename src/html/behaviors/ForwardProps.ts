import {observe, unobserve} from 'james-bond'
import {Mixin, MixinResult, Constructor} from 'lowclass'
import {PossibleCustomElement} from '../WithUpdate'

/**
 * A mixin class that causes props from a specified objecet to be forwarded to this object.
 * The consuming class (subclass) of this mixin class should define a protected
 * _observedObject method which returns the object to be observed.
 */
function ForwardPropsMixin<T extends Constructor<HTMLElement>>(Base: T) {
    class ForwardProps extends Constructor<PossibleCustomElement>(Base) {
        constructor(...args: any[]) {
            super(...args)
            this.__propChangedCallback = this.__propChangedCallback.bind(this)
        }

        connectedCallback() {
            super.connectedCallback && super.connectedCallback()
            this.__forwardInitialProps()
            this.__observeProps()
        }

        disconnectedCallback() {
            super.disconnectedCallback && super.disconnectedCallback()
            this.__unobserveProps()
        }

        protected get _observedObject(): object {
            throw new TypeError(`
                The subclass using ForwardProps must define a protected
                _observedObject property defining the object from which props
                are forwarded.
            `)
        }

        private __propChangedCallback(propName: string, value: any) {
            ;(this as any)[propName] = value
        }

        private __observeProps() {
            observe(this._observedObject, this.__getProps(), this.__propChangedCallback, {
                // inherited: true, // XXX the 'inherited' option doesn't work in this case. Why?
            })
        }

        private __unobserveProps() {
            unobserve(this._observedObject, this.__getProps(), this.__propChangedCallback)
        }

        private __getProps() {
            let result
            const props = (this.constructor as any).props

            if (Array.isArray(props)) result = props
            else {
                result = []
                if (typeof props === 'object') for (const prop in props) result.push(prop)
            }

            return result
        }

        private __forwardInitialProps() {
            const observed = this._observedObject

            for (const prop of this.__getProps()) {
                prop in observed && this.__propChangedCallback(prop, (observed as any)[prop])
            }
        }
    }

    return ForwardProps as MixinResult<typeof ForwardProps, T>
}

export const ForwardProps = Mixin(ForwardPropsMixin)
export interface ForwardProps extends InstanceType<typeof ForwardProps> {}
export default ForwardProps

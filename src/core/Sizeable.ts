import {Mixin, MixinResult, Constructor} from 'lowclass'
import Observable from './Observable'
import TreeNode from './TreeNode'
import XYZSizeModeValues from './XYZSizeModeValues'
import XYZNonNegativeValues from './XYZNonNegativeValues'
import Motor, {RenderTask} from './Motor'
import {props} from './props'
import {prop} from '../html/WithUpdate'
type XYZValuesObject<T> = import('./XYZValues').XYZValuesObject<T>
type XYZValuesArray<T> = import('./XYZValues').XYZValuesArray<T>

// Property functions are used for animating properties of type XYZNumberValues or XYZNonNegativeValues
type XYZPropertyFunction = (
    x: number,
    y: number,
    z: number,
    time: number
) => XYZValuesObject<number> | XYZValuesArray<number> | false

type SinglePropertyFunction = (value: number, time: number) => number | false

export type SizeProp = 'sizeMode' | 'size'

// working variables (used synchronously only, to avoid making new variables in
// repeatedly-called methods)
let propFunctionTask: RenderTask | undefined | null
const previousSize: Partial<XYZValuesObject<number>> = {}

function SizeableMixin<T extends Constructor>(Base: T) {
    const Parent = Observable.mixin(TreeNode.mixin(Constructor(Base)))

    // Sizeable extends TreeNode because Sizeable knows about its `parent` when
    // calculating proportional sizes. Also Transformable knows about it's parent
    // in order to calculate it's world matrix based on it's parent's.
    class Sizeable extends Parent {
        // TODO TS remove any
        // protected _properties: (typeof Parent)['_props']
        protected _properties: any = this._props // alias to WithUpdate._props

        // TODO handle ctor arg types
        constructor(...args: any[]) {
            super(...args)

            this.__calculatedSize = {x: 0, y: 0, z: 0}
            this._setPropertyObservers()
        }

        // TODO types for props
        updated(modifiedProps: any) {
            if (!this.isConnected) return

            // this covers single-valued properties like opacity, but has the
            // sideeffect of trigger propertychange more than needed for
            // XYZValues (here, and in the above valuechanged handlers).
            //
            // TODO FIXME we want to batch Observable updates so that this doesn't
            // happen. Maybe we'll do it by batching events that have the same
            // name. We should make it possible to choose to have sync or async
            // events, and whether they should batch or not.
            for (const [prop, modified] of Object.entries(modifiedProps))
                if (modified) this.trigger('propertychange', prop)
        }

        /**
         * Set the size mode for each axis. Possible size modes are "literal"
         * and "proportional". The default values are "literal" for all axes.
         */
        @prop(props.XYZSizeModeValues)
        set sizeMode(newValue) {
            if (typeof newValue === 'function') throw new TypeError('property functions are not allowed for sizeMode')
            this._setPropertyXYZ<Sizeable, SizeProp>('sizeMode', newValue)
        }
        get sizeMode() {
            return this._props.sizeMode
        }

        // TODO: A "differential" size would be cool. Good for padding,
        // borders, etc. Inspired from Famous' differential sizing.
        //
        // TODO: A "target" size where sizing can be relative to another node.
        // This would be tricky though, because there could be circular size
        // dependencies. Maybe we'd throw an error in that case, because there'd be no original size to base off of.

        /**
         * Set the size of each axis. The size for each axis depends on the
         * sizeMode for each axis. For example, if node.sizeMode is set to
         * `sizeMode = ['literal', 'proportional', 'literal']`, then setting
         * `size = [20, 0.5, 30]` means that X size is a literal value of 20,
         * Y size is 0.5 of it's parent Y size, and Z size is a literal value
         * of 30. It is easy this way to mix literal and proportional sizes for
         * the different axes.
         *
         * Literal sizes can be any value (the literal size that you want) and
         * proportional sizes are a number between 0 and 1 representing a
         * proportion of the parent node size. 0 means 0% of the parent size,
         * and 1.0 means 100% of the parent size.
         *
         * All size values must be positive numbers.
         *
         * @param {Object} newValue
         * @param {number} [newValue.x] The x-axis size to apply.
         * @param {number} [newValue.y] The y-axis size to apply.
         * @param {number} [newValue.z] The z-axis size to apply.
         */
        // TODO A scene breaks on a negative values. Should we clamp it to 0?
        @prop(props.XYZNonNegativeValues)
        set size(newValue) {
            this._setPropertyXYZ<Sizeable, SizeProp>('size', newValue)
        }
        get size() {
            return this._props.size
        }

        /**
         * Get the actual size of the Node. This can be useful when size is
         * proportional, as the actual size of the Node depends on the size of
         * it's parent.
         *
         * @readonly
         *
         * @return {Array.number} An Oject with x, y, and z properties, each
         * property representing the computed size of the x, y, and z axes
         * respectively.
         */
        get calculatedSize() {
            // TODO
            // if (this.__sizeDirty) Protected(this._calcSize)
            return {...this.__calculatedSize}
        }

        makeDefaultProps() {
            return Object.assign(super.makeDefaultProps(), {
                sizeMode: new XYZSizeModeValues('literal', 'literal', 'literal'),
                size: new XYZNonNegativeValues(100, 100, 100),
            })
        }

        // TODO change all event values to objects. See here for reasoning:
        // https://github.com/airbnb/javascript#events
        protected _setPropertyObservers() {
            this._properties.sizeMode.on('valuechanged', () => this.trigger('propertychange', 'sizeMode'))
            this._properties.size.on('valuechanged', () => this.trigger('propertychange', 'size'))
        }

        // TODO, refactor, this is from DeclarativeBase, but doesn't make sense in TypeScript inheritance
        hasHtmlApi?: boolean
        protected _composedParent?: Sizeable
        protected _composedChildren?: Sizeable

        protected get _renderParent(): Sizeable {
            if (this.hasHtmlApi) {
                return this._composedParent as Sizeable
            } else {
                return this.parent as Sizeable
            }
        }

        protected get _renderChildren() {
            if (this.hasHtmlApi) {
                return this._composedChildren
            } else {
                return this.subnodes
            }
        }

        protected _getParentSize() {
            const parent = this._renderParent
            return parent ? parent.__calculatedSize : {x: 0, y: 0, z: 0}
        }

        protected _calcSize() {
            const calculatedSize = this.__calculatedSize
            Object.assign(previousSize, calculatedSize)
            const {sizeMode, size} = this._properties
            const parentSize = this._getParentSize()

            if (sizeMode.x == 'literal') {
                calculatedSize.x = size.x
            } else {
                // proportional
                calculatedSize.x = parentSize.x * size.x
            }

            if (sizeMode.y == 'literal') {
                calculatedSize.y = size.y
            } else {
                // proportional
                calculatedSize.y = parentSize.y * size.y
            }

            if (sizeMode.z == 'literal') {
                calculatedSize.z = size.z
            } else {
                // proportional
                calculatedSize.z = parentSize.z * size.z
            }

            if (
                previousSize.x !== calculatedSize.x ||
                previousSize.y !== calculatedSize.y ||
                previousSize.z !== calculatedSize.z
            ) {
                this.trigger('sizechange', {...calculatedSize})
            }
        }

        protected _setPropertyXYZ<T, K extends keyof T>(name: K, newValue: T[K]) {
            if (isXYZPropertyFunction(newValue)) {
                this.__handleXYZPropertyFunction<T, K>(newValue, name)
            } else {
                if (!this.__settingValueFromPropFunction) this.__removePropertyFunction<T, K>(name)
                else this.__settingValueFromPropFunction = false

                this._props[name] = newValue
            }
        }

        protected _setPropertySingle<T, K extends keyof T>(name: K, newValue: T[K]) {
            if (isSinglePropertyFunction(newValue)) {
                this.__handleSinglePropertyFunction<T, K>(newValue, name)
            } else {
                if (!this.__settingValueFromPropFunction) this.__removePropertyFunction<T, K>(name)
                else this.__settingValueFromPropFunction = false

                this._props[name] = newValue
            }
        }

        private __calculatedSize: XYZValuesObject<number>
        private __propertyFunctions: Map<string, RenderTask> | null = null
        private __settingValueFromPropFunction = false

        private __handleXYZPropertyFunction<T, K extends keyof T>(fn: XYZPropertyFunction, name: K) {
            if (!this.__propertyFunctions) this.__propertyFunctions = new Map()

            if ((propFunctionTask = this.__propertyFunctions.get(name as string))) {
                Motor.removeRenderTask(propFunctionTask)
                propFunctionTask = null
            }

            this.__propertyFunctions.set(
                name as string,
                Motor.addRenderTask(time => {
                    const result = fn(
                        this._properties[name].x,
                        this._properties[name].y,
                        this._properties[name].z,
                        time
                    )

                    if (result === false) {
                        this.__propertyFunctions!.delete(name as string)
                        return false
                    }

                    // mark this true, so that the following set of this[name]
                    // doesn't override the prop function (normally a
                    // user can set this[name] to a value that isn't a function
                    // to disable the prop function).
                    this.__settingValueFromPropFunction = true

                    this[name as SizeProp] = result
                })
            )
        }

        private __handleSinglePropertyFunction<T, K extends keyof T>(fn: SinglePropertyFunction, name: K) {
            if (!this.__propertyFunctions) this.__propertyFunctions = new Map()

            if ((propFunctionTask = this.__propertyFunctions.get(name as string))) {
                Motor.removeRenderTask(propFunctionTask)
                propFunctionTask = null
            }

            this.__propertyFunctions.set(
                name as string,
                Motor.addRenderTask(time => {
                    const result = fn(this._properties[name], time)

                    if (result === false) {
                        this.__propertyFunctions!.delete(name as string)
                        return false
                    }

                    this.__settingValueFromPropFunction = true

                    this[name as SizeProp] = result
                })
            )
        }

        // remove property function (render task) if any.
        private __removePropertyFunction<T, K extends keyof T>(name: K) {
            if (this.__propertyFunctions && (propFunctionTask = this.__propertyFunctions.get(name as string))) {
                Motor.removeRenderTask(propFunctionTask)
                this.__propertyFunctions.delete(name as string)
                if (!this.__propertyFunctions.size) this.__propertyFunctions = null
                propFunctionTask = null
            }
        }
    }

    return Sizeable as MixinResult<typeof Sizeable, T>
}

// the following type guards are used above just to satisfy the type system,
// though the actual runtime check does not guarantee that the functions are of
// the expected shape.

function isXYZPropertyFunction(f: any): f is XYZPropertyFunction {
    return typeof f === 'function'
}

function isSinglePropertyFunction(f: any): f is SinglePropertyFunction {
    return typeof f === 'function'
}

export const Sizeable = Mixin(SizeableMixin)
export interface Sizeable extends InstanceType<typeof Sizeable> {}
export default Sizeable

// const s: Sizeable = new Sizeable()
// s.sizeMode
// s.asdfasdf
// s.calculatedSize = 123
// s.innerHTML = 123
// s.innerHTML = 'asdf'
// s.emit('asfasdf', 1, 2, 3)
// s.removeNode('asfasdf')
// s.updated(1, 2, 3, 4)
// s.blahblah

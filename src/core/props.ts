import {props as basicProps, PropDefinitionObject} from '../html/WithUpdate'
import {Color} from 'three'
import XYZValues from './XYZValues'
import XYZNumberValues from './XYZNumberValues'
import XYZNonNegativeValues from './XYZNonNegativeValues'
import XYZStringValues from './XYZStringValues'
import XYZSizeModeValues from './XYZSizeModeValues'
import {Constructor} from 'lowclass'

// NOTES
// - In a prop definition's functions, `this` refers to instances of the class
// on which the prop is defined.

type XYZValuesConstructor = new (...args: any[]) => XYZValues

// This helper is meant to be used to create prop types for props who's values
// are instances of XYZValues (or subclasses of XYZValues), general on Node and
// Behavior class hierarchies.
function createXYZPropType<T extends XYZValuesConstructor, I extends InstanceType<T>>(_Type: T, override = {}) {
    return {
        attribute: true, // get the value from an attribute (but don't reflect it back)
        coerce(this: any, val: any, propName: string): I {
            // if we have a property function, pass it along as is
            if (typeof val === 'function') return val

            // if we're setting the same instance, use it as is
            if (val === this[propName]) return val

            // otherwise we process the input value into the XYZValues object
            return this[propName].from(val)
        },
        default(this: any, propName: string): I {
            return this._props[propName]
        },
        deserialize(this: any, val: string, propName: string) {
            return this[propName].fromString(val)
        },
        serialize(this: any, _val: I, propName: string) {
            return this[propName].toString()
        },
        ...override,
    }
}

function createGenericPropType<T extends Constructor<{}>>(Type: T, override = {}) {
    return {
        attribute: true, // get the value from an attribute (but don't mirror it back)
        coerce: (val: any) => (val instanceof Type ? val : new Type(val)),
        default: new Type(),
        deserialize: (val: string) => new Type(val),
        serialize: (val: T) => val.toString(),
        ...override,
    }
}

// basicProps gives us some generic prop types:
// props.any
// props.array
// props.boolean
// props.number
// props.object
// props.string
export const props = {
    ...basicProps,
    boolean: {
        ...basicProps.boolean,
        deserialize: (val: string) => val != null && val !== 'false',
    },
    THREE: {
        // TODO replace THREE.Color with a persistent object that can be
        // dynamically updated, like with XYZValues
        Color: createGenericPropType(Color, {
            default: () => new Color(Math.random(), Math.random(), Math.random()),
            serialize: (val: Color | string | number) => (val instanceof Color ? val : new Color(val)).getStyle(), // returns a CSS "rbg()" string
        }),
    },
    XYZNumberValues: createXYZPropType(XYZNumberValues),
    XYZNonNegativeValues: createXYZPropType(XYZNonNegativeValues),
    XYZStringValues: createXYZPropType(XYZStringValues),
    XYZSizeModeValues: createXYZPropType(XYZSizeModeValues),
}

// map a SkateJS prop value to another target specified by getTarget
// NOTE `this` refers to the instance on which the prop exists
// export const mapPropTo = (prop: PropDefinitionObject, getTarget: (ctx: any) => object) => ({
//     ...prop,
//     coerce: prop.coerce
//         ? function coerce(this: any, val: any, key: string): any {
//               const target: any = getTarget.call(this, this)
//               const coerced = prop.coerce!.call(this, val, key)
//               if (target) target[key] = coerced
//               return coerced
//           }
//         : undefined,
//     deserialize: prop.deserialize
//         ? function deserialize(this: any, val: string, key: string): any {
//               const target: any = getTarget.call(this, this)
//               const deserialized = prop.deserialize!.call(this, val, key)
//               if (target) target[key] = deserialized
//               return deserialized
//           }
//         : undefined,
// })

export const changePropContext = (prop: PropDefinitionObject, getContext: (ctx: any) => any) => ({
    ...prop,
    coerce: prop.coerce
        ? function coerce(this: any, val: any, propName: string) {
              return prop.coerce!.call(getContext.call(this, this), val, propName)
          }
        : undefined,
    default: prop.default
        ? function(this: any, propName: string): any {
              return prop.default!.call(getContext.call(this, this), propName)
          }
        : undefined,
    deserialize: prop.deserialize
        ? function deserialize(this: any, val: string, propName: string) {
              return prop.deserialize!.call(getContext.call(this, this), val, propName)
          }
        : undefined,
    serialize: prop.serialize
        ? function serialize(this: any, val: any, propName: string) {
              return prop.serialize!.call(getContext.call(this, this), val, propName)
          }
        : undefined,
})

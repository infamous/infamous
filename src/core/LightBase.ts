import {Color, Light} from 'three'
import Node from './Node'
import {props} from './props'
import {prop} from '../html/WithUpdate'

// base class for light elements.
export default class LightBase extends Node {
    @prop(props.THREE.Color) color: Color | string | number = new Color('white')
    @prop(Number) intensity: number = 1

    three!: Light

    // TODO we shouldn't need to define passInitialValuesToThree, the default
    // value of the props should automatically be in place.
    passInitialValuesToThree() {
        this.three.color = this.color as Color
        this.three.intensity = this.intensity
    }

    updated(modifiedProps: any) {
        super.updated(modifiedProps)

        if (!this.isConnected) return

        if (modifiedProps.intensity) this._forwardProp('intensity', this.three)
        if (modifiedProps.color) this._forwardProp('color', this.three)

        this.needsUpdate()
    }
}

export {LightBase}

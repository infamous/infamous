import {Color, Light} from 'three'
import Node from './Node'
import {props} from './props'
import {mapPropTo} from './props'
import {prop} from '../html/WithUpdate'

// base class for light elements.
export default class LightBase extends Node {
    @prop(mapPropTo(props.THREE.Color, (self: any) => self.three))
    color: Color | string | number = new Color('white')

    @prop(mapPropTo(props.number, (self: any) => self.three))
    intensity = 1

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

        this.needsUpdate()
    }
}

export {LightBase}

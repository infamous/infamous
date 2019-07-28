import LightBase from './LightBase'
import {AmbientLight as ThreeAmbientLight} from 'three'

export default class AmbientLight extends LightBase {
    static defaultElementName = 'i-ambient-light'

    protected _makeThreeObject3d() {
        const light = new ThreeAmbientLight()
        // light.intensity = 1 // default
        light.intensity = this.intensity
        return light
    }
}

export {AmbientLight}

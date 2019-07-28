import {PointLight as ThreePointLight} from 'three'
import LightBase from './LightBase'
import {props} from './props'
import {mapPropTo} from './props'
import {prop} from '../html/WithUpdate'

export default class PointLight extends LightBase {
    static defaultElementName = 'i-point-light'

    @prop(mapPropTo(props.number, (self: any) => self.three))
    distance = 0

    @prop(mapPropTo(props.number, (self: any) => self.three))
    decay = 1

    @prop(mapPropTo(props.boolean, (self: any) => self.three))
    castShadow = true

    @prop(Number)
    shadowMapWidth = 512

    @prop(Number)
    shadowMapHeight = 512

    @prop(Number)
    shadowRadius = 3

    @prop(Number)
    shadowBias = 0

    @prop(Number)
    shadowCameraNear = 1

    @prop(Number)
    shadowCameraFar = 2000

    three!: ThreePointLight

    passInitialValuesToThree() {
        super.passInitialValuesToThree()

        const light = this.three

        light.distance = this.distance
        light.decay = this.decay
        light.castShadow = this.castShadow
        console.log(' ?????????????????????????????? PointLight, pass initial values to three', light.castShadow)

        const shadow = light.shadow

        shadow.mapSize.width = this.shadowMapWidth
        shadow.mapSize.height = this.shadowMapHeight
        shadow.radius = this.shadowRadius
        shadow.bias = this.shadowBias

        // TODO: auto-adjust near and far planes like we will with Camera,
        // unless the user supplies a manual value.
        shadow.camera.near = this.shadowCameraNear
        shadow.camera.far = this.shadowCameraFar
    }

    updated(modifiedProps: any) {
        super.updated(modifiedProps)

        if (!this.isConnected) return

        const shadow = this.three.shadow

        if (modifiedProps.shadowMapWidth) shadow.mapSize.width = this.shadowMapWidth
        if (modifiedProps.shadowMapHeight) shadow.mapSize.height = this.shadowMapHeight
        if (modifiedProps.shadowRadius) shadow.radius = this.shadowRadius
        if (modifiedProps.shadowBias) shadow.bias = this.shadowBias
        if (modifiedProps.shadowCameraNear) shadow.camera.near = this.shadowCameraNear
        if (modifiedProps.shadowCameraFar) shadow.camera.far = this.shadowCameraFar
    }

    protected _makeThreeObject3d() {
        return new ThreePointLight()
    }
}

export {PointLight}

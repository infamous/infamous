import {PerspectiveCamera as ThreePerspectiveCamera} from 'three'
import {props} from './props'
import Node from './Node'
import {Scene} from './Scene'
import {prop} from '../html/WithUpdate'
type XYZValuesObject<T> = import('./XYZValues').XYZValuesObject<T>

// TODO: update this to have a CSS3D-perspective-like API like with the Scene's
// default camera.
export default class PerspectiveCamera extends Node {
    static defaultElementName = 'i-perspective-camera'

    // TODO remove attributeChangedCallback, replace with updated based on these props

    @prop(Number) fov = 75
    @prop(Number) near = 0.1
    @prop(Number) far = 1000
    @prop(Number) zoom = 1
    @prop(Boolean) active = false

    // TODO TS `this` type for props
    @prop({
        ...props.number,
        deserialize(val: any, _name: string) {
            // TODO TS NormalizedPropDefinition, and remove the following non-null assertion
            val == null ? this.constructor.props.aspect.default.call(this) : props.number.deserialize(val)
        },
    } as ThisType<any>)
    aspect = this.__getDefaultAspect()

    three!: ThreePerspectiveCamera

    updated(modifiedProps: any) {
        super.updated(modifiedProps)

        if (!this.isConnected) return

        if (modifiedProps.active) {
            this.__setSceneCamera(this.active ? undefined : 'unset')
        }
        if (modifiedProps.aspect) {
            if (!this.aspect)
                // default aspect value based on the scene size.
                this.__startAutoAspect()
            else this.__stopAutoAspect()
        }
        // TODO handle the other props here, remove attributeChangedCallback
    }

    connectedCallback() {
        super.connectedCallback()

        this.__lastKnownScene = this.scene
    }

    // TODO, unmountedCallback functionality. issue #150
    unmountedCallback() {}

    attributeChangedCallback(attr: string, oldVal: string | null, newVal: string | null) {
        super.attributeChangedCallback(attr, oldVal, newVal)

        if (typeof newVal == 'string') {
            this.__attributeAddedOrChanged(attr, newVal)
        } else {
            this.__attributeRemoved(attr)
        }
    }

    protected _makeThreeObject3d() {
        return new ThreePerspectiveCamera(75, 16 / 9, 1, 1000)
    }

    // TODO replace with unmountedCallback #150
    protected _deinit() {
        super._deinit && super._deinit()

        // TODO we want to call this in the upcoming
        // unmountedCallback, but for now it's harmless but
        // will run unnecessary logic. #150
        this.__setSceneCamera('unset')
        this.__lastKnownScene = null
    }

    private __lastKnownScene: Scene | null = null

    // TODO CAMERA-DEFAULTS, get defaults from somewhere common.
    private __attributeRemoved(attr: string) {
        const three = this.three

        if (attr == 'fov') {
            three.fov = 75
            three.updateProjectionMatrix()
        } else if (attr == 'aspect') {
            this.__startAutoAspect()
            three.aspect = this.__getDefaultAspect()
            three.updateProjectionMatrix()
        } else if (attr == 'near') {
            three.near = 0.1
            three.updateProjectionMatrix()
        } else if (attr == 'far') {
            three.far = 1000
            three.updateProjectionMatrix()
        } else if (attr == 'zoom') {
            three.zoom = 1
            three.updateProjectionMatrix()
        } else if (attr == 'active') {
            this.__setSceneCamera('unset')
        }
    }

    private __attributeAddedOrChanged(attr: string, newVal: string) {
        const three = this.three

        if (attr == 'fov') {
            three.fov = parseFloat(newVal)
            three.updateProjectionMatrix()
        } else if (attr == 'aspect') {
            this.__stopAutoAspect()
            three.aspect = parseFloat(newVal)
            three.updateProjectionMatrix()
        } else if (attr == 'near') {
            three.near = parseFloat(newVal)
            three.updateProjectionMatrix()
        } else if (attr == 'far') {
            three.far = parseFloat(newVal)
            three.updateProjectionMatrix()
        } else if (attr == 'zoom') {
            three.zoom = parseFloat(newVal)
            three.updateProjectionMatrix()
        } else if (attr == 'active') {
            this.__setSceneCamera()
        }
    }

    private __startedAutoAspect = false

    private __startAutoAspect() {
        if (!this.__startedAutoAspect) {
            this.__startedAutoAspect = true
            this.scene.on('sizechange', this.__updateAspectOnSceneResize, this)
        }
    }
    private __stopAutoAspect() {
        if (this.__startedAutoAspect) {
            this.__startedAutoAspect = false
            this.scene.off('sizechange', this.__updateAspectOnSceneResize)
        }
    }

    private __updateAspectOnSceneResize({x, y}: XYZValuesObject<number>) {
        ;(this.three as ThreePerspectiveCamera).aspect = x / y
    }

    private __getDefaultAspect() {
        let result = 0

        if (this.scene) {
            result = this.scene.calculatedSize.x / this.scene.calculatedSize.y
        }

        // in case of a 0 or NaN (0 / 0 == NaN)
        if (!result) result = 16 / 9

        return result
    }

    private __setSceneCamera(unset?: 'unset') {
        if (unset) {
            // TODO: unset might be triggered before the scene was mounted, so
            // there might not be a last known scene. We won't need this check
            // when we add unmountedCallback. #150
            if (this.__lastKnownScene)
                this.__lastKnownScene
                    // @ts-ignore: call protected method
                    ._removeCamera(this)
        } else {
            if (!this.scene || !this.isConnected) return

            this.scene
                // @ts-ignore: call protected method
                ._addCamera(
                    //
                    this
                )
        }
    }
}

export {PerspectiveCamera}

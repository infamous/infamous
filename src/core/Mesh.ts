import {Mesh as ThreeMesh, Material} from 'three'
import Node from './Node'
import {props} from './props'

// register behaviors that can be used on this element
// TODO: maybe useDefaultNames() should register these, otherwise the user can
// choose names for better flexibility. See TODO NAMING below.
import '../html/behaviors/BasicMaterialBehavior'
import '../html/behaviors/PhongMaterialBehavior'
import '../html/behaviors/DOMNodeMaterialBehavior'
import '../html/behaviors/BoxGeometryBehavior'
import '../html/behaviors/SphereGeometryBehavior'
import '../html/behaviors/PlaneGeometryBehavior'
import '../html/behaviors/DOMNodeGeometryBehavior'
import {prop} from '../html/WithUpdate'

// TODO:
// - [ ] API for registering new behaviors as they pertain to our API, built on top
//   of element-behaviors.
// - [x] Ability specify default initial behaviors. Make this generic, or on top of
//   element-behaviors? DONE, with DefaultBehaviors class
// - [x] generic ability to specify custom element attribute types, as an addon to
//   Custom Elements. We can use the same mechanism to specify types for behaviors too? DONE, with WithUpdate class.

export default class Mesh extends Node {
    static defaultElementName = 'i-mesh'

    // TODO NAMING: It would be neat to be able to return an array of classes
    // as well, so that it can be agnostic of the naming. Either way should
    // work.
    static defaultBehaviors: {[k: string]: any} = {
        'box-geometry': (initialBehaviors: any) => {
            return !initialBehaviors.some((b: any) => b.endsWith('-geometry'))
        },
        'phong-material': (initialBehaviors: any) => {
            return !initialBehaviors.some((b: any) => b.endsWith('-material'))
        },
    }

    @prop(props.boolean) castShadow = true
    @prop(props.boolean) receiveShadow = true

    three!: ThreeMesh

    passInitialValuesToThree() {
        this.three.castShadow = this.castShadow
        console.log(' ?????????????????? Mesh, pass initial values to three', this.three.castShadow)
        this.three.receiveShadow = this.receiveShadow
    }

    updated(modifiedProps: any) {
        super.updated(modifiedProps)

        if (!this.isConnected) return

        if (modifiedProps.castShadow) {
            this._forwardProp('castShadow', this.three)
        }

        if (modifiedProps.receiveShadow) {
            this._forwardProp('receiveShadow', this.three)
            // TODO handle material arrays
            ;(this.three.material as Material).needsUpdate = true
        }

        this.needsUpdate()
    }

    protected _makeThreeObject3d() {
        return new ThreeMesh()
    }
}

export {Mesh}

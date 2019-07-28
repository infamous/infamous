import 'element-behaviors'
import {OBJLoader} from '../../lib/three/OBJLoader'
import {MTLLoader} from '../../lib/three/MTLLoader'
import {Events} from '../../core/Events'
import Behavior from './Behavior'
import {disposeObjectTree, setRandomColorPhongMaterial, isRenderItem} from '../../utils/three'
import {Object3D} from 'three'
// import * as THREE from 'three' // this import needed for OBJLoader and MTLLoader
import BaseMaterialBehavior from './BaseMaterialBehavior'
import {prop} from '../WithUpdate'

declare global {
    interface Element {
        behaviors: Map<string, unknown>
    }
}

export default class ObjModelBehavior extends Behavior {
    /**
     * path to a `.obj` file
     */
    @prop(String) obj!: string

    /**
     * path to a `.mtl` file
     */
    @prop(String) mtl!: string

    // TODO no any
    model: any
    objLoader: any
    mtlLoader: any

    updated(modifiedProps: any) {
        if (modifiedProps.obj || modifiedProps.mtl) {
            // TODO if only mtl changes, maybe we can update only the material
            // instead of reloading the whole object?
            if (!this.obj) return
            this.__cleanup()
            this.__loadObj()
        }
    }

    async connectedCallback() {
        super.connectedCallback()
        this.model = null
        // TODO TS augment the THREE module so 'as any' is not needed
        this.objLoader = new OBJLoader() // TODO types for loaders
        this.mtlLoader = new MTLLoader(this.objLoader.manager)
        // Allow cross-origin images to be loaded.
        this.mtlLoader.crossOrigin = ''

        this.objLoader.manager.onLoad = () => {
            this.element.needsUpdate()
        }
    }

    async disconnectedCallback() {
        super.disconnectedCallback()
        this.__cleanup()
    }

    private __materialIsFromMaterialBehavior = false

    private __cleanup() {
        if (!this.model) return
        disposeObjectTree(this.model, {
            destroyMaterial: !this.__materialIsFromMaterialBehavior,
        })
        this.__materialIsFromMaterialBehavior = false
    }

    private __loadObj() {
        const {obj, mtl, mtlLoader, objLoader} = this

        if (mtl) {
            mtlLoader.setTexturePath(mtl.substr(0, mtl.lastIndexOf('/') + 1))
            mtlLoader.load(mtl, (materials: any) => {
                materials.preload()
                objLoader.setMaterials(materials)
                objLoader.load(obj, (model: any) => this.__setModel(model))
            })
        } else {
            objLoader.load(obj, (model: any) => {
                let materialBehavior = this.element.behaviors.get('basic-material') as BaseMaterialBehavior
                if (!materialBehavior)
                    materialBehavior = this.element.behaviors.get('phong-material') as BaseMaterialBehavior
                if (!materialBehavior)
                    materialBehavior = this.element.behaviors.get('standard-material') as BaseMaterialBehavior
                if (!materialBehavior)
                    materialBehavior = this.element.behaviors.get('lambert-material') as BaseMaterialBehavior

                if (materialBehavior) {
                    this.__materialIsFromMaterialBehavior = true
                    // TODO this part only works on Mesh elements at the
                    // moment. We will update the geometry and material
                    // behaviors to work in tandem with or without a mesh
                    // behavior, and other behaviors can use the geometry or
                    // material features.
                    model.traverse((child: Object3D) => {
                        if (isRenderItem(child)) {
                            console.log(materialBehavior.getMeshComponent('material'))
                            child.material = materialBehavior.getMeshComponent('material')
                        }
                    })
                } else {
                    // if no material, make a default one with random color
                    setRandomColorPhongMaterial(model)
                }

                this.__setModel(model)
            })
        }
    }

    private __setModel(model: any) {
        this.element.three.add((this.model = model))
        this.element.emit(Events.MODEL_LOAD, {format: 'obj', model: model})
        this.element.needsUpdate()
    }
}

elementBehaviors.define('obj-model', ObjModelBehavior)

export {ObjModelBehavior}

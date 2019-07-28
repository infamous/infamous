import BaseMeshBehavior, {MeshComponentType} from './BaseMeshBehavior'
import {props, changePropContext} from '../../core/props'
import XYZNonNegativeValues from '../../core/XYZNonNegativeValues'
import {XYZSizeModeValues, SizeModeValue, XYZPartialValuesArray, XYZPartialValuesObject} from '../../core'
import {prop} from '../WithUpdate'

// base class for geometry behaviors
export default class BaseGeometryBehavior extends BaseMeshBehavior {
    type: MeshComponentType = 'geometry'

    @prop(changePropContext(props.XYZNonNegativeValues, (self: BaseGeometryBehavior) => self.element))
    size!: XYZNonNegativeValues | XYZPartialValuesArray<number> | XYZPartialValuesObject<number> | string

    @prop(changePropContext(props.XYZSizeModeValues, (self: BaseGeometryBehavior) => self.element))
    sizeMode!: XYZSizeModeValues | XYZPartialValuesArray<SizeModeValue> | XYZPartialValuesObject<SizeModeValue> | string

    updated(modifiedProps: any) {
        const {size, sizeMode} = modifiedProps

        // if (size) this._forwardProp('size', this.element)
        // if (sizeMode) this._forwardProp('sizeMode', this.element)

        if (size || sizeMode) {
            this.__updateGeometryOnSizeChange(this.size as XYZNonNegativeValues)
        }
    }

    protected _listenToElement() {
        super._listenToElement()

        // TODO the following three events can be replaced with a single propchange:size event
        this.element.on('sizechange', this.__onSizeValueChanged, this)
        this.element.size.on('valuechanged', this.__onSizeValueChanged, this)
        this.element.sizeMode.on('valuechanged', this.__onSizeValueChanged, this)
    }

    protected _unlistenToElement() {
        super._unlistenToElement()

        this.element.off('sizechange', this.__onSizeValueChanged)
        this.element.size.off('valuechanged', this.__onSizeValueChanged)
        this.element.sizeMode.off('valuechanged', this.__onSizeValueChanged)
    }

    private __onSizeValueChanged() {
        // tells WithUpdate (from BaseMeshBehavior) which prop
        // changed and makes it finally trigger our updated method
        // this.size = this.size
        this.triggerUpdateForProp('size')
    }

    // NOTE we may use the x, y, z args to calculate scale when/if we
    // implement size under the hood as an Object3D.scale.
    private __updateGeometryOnSizeChange(_size: XYZNonNegativeValues) {
        // TODO PERFORMANCE, resetMeshComponent creates a new geometry.
        // Re-creating geometries is wasteful, re-use them when possible, and
        // add instancing. Maybe we use Object3D.scale as an implementation
        // detail of our `size` prop.
        this.resetMeshComponent()
    }
}

export {BaseGeometryBehavior}

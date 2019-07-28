import {Mixin, MixinResult, Constructor} from 'lowclass'
import {TextureLoader, MeshPhongMaterial} from 'three'
import WithUpdate, {prop} from '../WithUpdate'
import Behavior from './Behavior'
import {Mesh} from '../../core'

/**
 * Mixin class for adding textures to a mesh behavior
 */
function MaterialTextureMixin<T extends Constructor<Behavior>>(Base: T) {
    // TODO, use a Pick<> of HTMLElement instead, pick just parts WithUpdate needs.
    class MaterialTexture extends WithUpdate.mixin(Constructor<Behavior>(Base)) {
        @prop(String) texture!: string

        element!: Mesh

        updated(modifiedProps: any) {
            super.updated && super.updated(modifiedProps)

            const {texture} = modifiedProps

            if (texture && this.texture) {
                // TODO default material color (if not specified) when there's a
                // texture should be white

                const texture = new TextureLoader().load(this.texture, () => this.element.needsUpdate())

                    // "as MeshPhongMaterial" needed because we don't know what
                    // material it will be, and Material base class doesn't have
                    // `map`., but most other materrials do. So this shows
                    // intent, and we assume all materials are subclasses of
                    // Material, and have `.map`, at least for now.
                    // TODO handle material arrays
                ;(this.element.three.material as MeshPhongMaterial).map = texture
                this.element.needsUpdate()
            }
        }
    }

    return MaterialTexture as MixinResult<typeof MaterialTexture, T>
}

export const MaterialTexture = Mixin(MaterialTextureMixin)
export interface MaterialTexture extends InstanceType<typeof MaterialTexture> {}
export default MaterialTexture

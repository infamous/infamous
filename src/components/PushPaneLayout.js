import Class from 'lowclass'
import Node from '../core/Node'

export default
Class('PushPaneLayout').extends( Node, ({ Super }) => ({
    static: {
        defaultElementName: 'i-push-pane-layout',
    },
    constructor(...args) {
        console.log(' -- PushPaneLayout created (TODO)')
        const self = Super(this).constructor(...args)
        return self
    }

    // TODO
}))

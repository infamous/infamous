/* Copyright © 2015-2016 David Valdman */

define(function(require, exports, module){
    var Stream = require('../streams/Stream');
    var OptionsManager = require('../core/_OptionsManager');
    var nextTick = require('../core/queues/nextTick');

    /**
     * Differential is a Stream that emits differentials of consecutive
     *  input values.
     *
     *  It emits `start`, `update` and `end` events.
     *
     *  @example
     *
     *      var differential = new Differential();
     *      // this gives differentials of mouse input
     *      differential.subscribe(mouseInput.pluck('value'));
     *
     *
     * @class Differential
     * @extends Streams.Stream
     * @uses Core._OptionsManager
     * @namespace Streams
     * @constructor
     * @param [options] {Object}        Options
     * @param [options.scale] {Number}  Scale to apply to differential
     */
    function Differential(options){
        this.options = OptionsManager.setOptions(this, options);

        var previous = undefined;
        var delta = undefined;

        Stream.call(this, {
            set : set.bind(this),
            start : set.bind(this),
            update : update.bind(this),
            end : end.bind(this)
        });

        // TODO: correct diff on set
        function set (value){
            var scale = this.options.scale;
            if (value instanceof Array){
                if (previous === undefined){
                    delta = value.map(function(val){ return 0; });
                    previous = value.slice();
                }
                else {
                    for (var i = 0; i < value.length; i++)
                        delta[i] = scale * (value[i] - previous[i]);
                    previous = value.slice();
                }
            }
            else {
                if (previous === undefined){
                    delta = 0;
                    previous = value;
                }
                else {
                    delta = scale * (value - previous);
                    previous = value;
                }
            }
            return delta;
        }

        function update(value) {
            var scale = this.options.scale;
            if (previous instanceof Array) {
                delta = [];
                for (var i = 0; i < previous.length; i++) {
                    delta[i] = scale * (value[i] - previous[i]);
                    previous[i] = value[i];
                }
            }
            else {
                delta = scale * (value - previous);
                previous = value;
            }

            return delta;
        }

        function end(value){
            if (previous instanceof Array) {
                delta = [];
                for (var i = 0; i < previous.length; i++) {
                    delta[i] = 0;
                }
            }
            else {
                delta = 0;
                previous = value;
            }

            return delta;
        }
    }

    Differential.DEFAULT_OPTIONS = {
        scale : 1
    };

    Differential.prototype = Object.create(Stream.prototype);
    Differential.prototype.constructor = Differential;

    module.exports = Differential;
});

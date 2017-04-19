'use strict';

module.exports = class WOD {

    constructor (props) {
        if (!props) { props = {}; }

        this.datekey  = props.datekey || Date.getDateKey();
        this.workouts = props.workouts instanceof Array ? props.workouts : [];
    }
}
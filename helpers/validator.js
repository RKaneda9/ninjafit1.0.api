const utils = {

    isArray   : (val) => { return val instanceof Array || val == null; },
    isBoolean : (val) => { return typeof (val) === 'boolean'; },
    isString  : (val) => { return typeof (val) === 'string' || val == null; },
    isObject  : (val) => { return typeof (val) === 'object' && !(val instanceof Array); },
    isInteger : (val) => { return typeof (val) === 'number' && parseInt  (val) == val.toString(); },
    isFloat   : (val) => { return typeof (val) === 'number' && parseFloat(val) == val.toString(); },

    isPhoneNumber: (val) => {

        return val
            && utils.isString(val)
            && /^(?:\([2-9]\d{2}\)\ ?|[2-9]\d{2}(?:\-?|\ ?))[2-9]\d{2}[- ]?\d{4}$/.test(val);
    },

    isEmailAddress: (val) => {

        return val 
            && utils.isString(val)
            && /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(val);
    },

    isValidUrl : (val) => {
        // TODO:
        return utils.isString(val);
    }
};

class Validate {

    constructor(data) {

        this.data    = data;
        this.isValid = true;
    }

    isArray       () { if (this.isValid) { this.isValid = utils.isArray       (this.data); } return this; }
    isObject      () { if (this.isValid) { this.isValid = utils.isObject      (this.data); } return this; }
    isString      () { if (this.isValid) { this.isValid = utils.isString      (this.data); } return this; }
    isInt         () { if (this.isValid) { this.isValid = utils.isInteger     (this.data); } return this; }
    isBool        () { if (this.isValid) { this.isValid = utils.isBoolean     (this.data); } return this; }
    isEmailAddress() { if (this.isValid) { this.isValid = utils.isEmailAddress(this.data); } return this; }
    isPhoneNumber () { if (this.isValid) { this.isValid = utils.isPhoneNumber (this.data); } return this; }

    notEmpty() {

        if (this.isValid) {

                 if (utils.isObject(this.data)) { this.isValid = this.data && Object.keys(this.data).length > 0; }
            else if (utils.isArray (this.data)) { this.isValid = this.data && this.data.length > 0; }
            else if (utils.isString(this.data)) { this.isValid = this.data && this.data.trim().length > 0; }
            else                                { this.isValid = false; }
        }

        return this;
    }

    notNull() { 

        if (this.isValid) {

            this.isValid = !!this.data || utils.isInteger(this.data);
        }

        return this;
    }

    len(min, max) {

        if (this.isValid) { 

            if (utils.isString(this.data)) { 

                this.isValid = (!min || this.data.trim().length >= min)
                            && (!max || this.data.trim().length <= max);

            }

            else if (utils.isArray(this.data)) {

                this.isValid = (!min || this.data.length >= min)
                            && (!max || this.data.length <= max);
            }

            else { this.isValid = false; }
        }

        return this;
    }

    check (data) { this.data = data; return this; }
}

const check = (data) => (new Validate(data));

const trim  = (val, maxlength) => {
    val = val && utils.isString(val) ? val.trim() : val;

    if (maxlength) { val = val.substr(0, maxlength); }

    return val;
};

module.exports = { check, trim };
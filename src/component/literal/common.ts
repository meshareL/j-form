type Prop = {
    modelValue?: string;
    novalidate?: boolean;
    required?: boolean;
};

const propOption = {
    modelValue: {
        type: String,
        required: false
    },
    novalidate: {
        type: Boolean,
        required: false,
        default: false
    },
    required: {
        type: Boolean,
        required: false,
        default: false
    }
};

export { propOption };
export type { Prop };

import {
    defineComponent,
    h as createElement,
    inject,
    ref,
    readonly,
    toRef,
    nextTick,
    watch
} from 'vue';
import type {
    PropType,
    VNodeProps,
    AllowedComponentProps,
    ComponentCustomProps,
    SelectHTMLAttributes,
    VNode,
    VNodeChild
} from 'vue';
import { ComponentStatus, validSizes, Violation } from '../../support';
import type { ValidSize } from '../../support';
import {
    ValidationResult,
    fetchShareIdKey,
    inheritedNovalidateKey,
    inheritedRequiredKey,
    inheritedSizeKey,
    validationStatusReporterKey
} from '../../key';
import { pushControlAction, inferComponentStatus } from '../../helper/common';
import type { Prop as OptionProp } from './option';

// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/option#attributes
type OptionStruct = {
    disabled?: boolean;
    selected?: boolean;
    label?: string;
    value: string;
    text: string;
};

// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/option#attributes
type OptGroupStruct = {
    disabled?: boolean;
    label: string;
    children: OptionStruct[];
};

type SelectChildren = Array<OptionStruct | OptGroupStruct>;

type Multiple = { minimum: number, maximum: number };

type Prop = {
    novalidate?: boolean;
    modelValue?: string | string[];
    children?: SelectChildren;
    size?: ValidSize;
    required?: boolean;
    multiple?: Multiple;
    /** @see https://vuejs.org/guide/essentials/forms.html#select */
    placeholder?: string;
};

function renderOption(struct: OptionStruct, selectedList: Set<string>): VNode {
    const { text, ...data } = struct
        , props: Record<string, unknown> = {
        ...data,
        selected: selectedList.has(data.value)
    };
    return createElement('option', props, text);
}

function renderChildren(struct: SelectChildren, selectedList: Set<string>): VNode[] {
    const result: VNode[] = [];

    for (const value of struct) {
        if (!('children' in value)) {
            result.push(renderOption(value, selectedList));
            continue;
        }

        const { children, ...data } = value
            , options: VNode[] = [];

        children
            .map(child => renderOption(child, selectedList))
            .forEach(child => options.push(child));

        result.push(createElement('optgroup', data, options));
    }

    return result;
}

const component = defineComponent({
    name: 'JSelect',
    inheritAttrs: true,
    props: {
        modelValue: {
            type: [ String, Array ] as PropType<string | string[]>,
            required: false
        },
        children: {
            type: Array as PropType<SelectChildren>,
            required: false
        },
        novalidate: {
            type: Boolean,
            required: false,
            default: false
        },
        size: {
            type: String as PropType<ValidSize>,
            required: false,
            default: 'medium',
            validator: (value: string) => validSizes.includes(value)
        },
        required: {
            type: Boolean,
            required: false,
            default: false
        },
        multiple: {
            type: Object as PropType<Multiple>,
            required: false,
            validator: (value: Multiple) => 'minimum' in value && 'maximum' in value
        },
        placeholder: {
            type: String,
            required: false,
            default: ''
        }
    },
    emits: [ 'update:modelValue' ],
    setup(props, { slots, emit }) {
        const selectRef = ref<HTMLSelectElement>()
            , shareId = inject(fetchShareIdKey, null)?.fetch()
            , errormessageId = shareId?.concat('_errormessage')
            , novalidate = inject(inheritedNovalidateKey, () => readonly(toRef(props, 'novalidate')), true)
            , controlSize = inject(inheritedSizeKey, () => readonly(toRef(props, 'size')), true)
            , isRequired = inject(inheritedRequiredKey, () => readonly(toRef(props, 'required')), true)
            , { status: selfStatus, infer } = inferComponentStatus();

        const selectedList = ref<Set<string>>(new Set());

        watch(() => props.children, value => {
            if (value === undefined) {
                return;
            }

            for (const child of value) {
                if ('children' in child) {
                    child.children
                        .filter(val => val.selected)
                        .forEach(val => selectedList.value.add(val.value));
                    continue;
                }

                if (child.selected) {
                    selectedList.value.add(child.value);
                }
            }
        }, { immediate: true });

        watch(() => props.modelValue, value => {
            if (value === undefined) {
                return;
            }

            if (typeof value === 'string') {
                selectedList.value.clear();
                selectedList.value.add(value);
                return;
            }

            if (selectedList.value.size === value.length
                && value.every(val => selectedList.value.has(val))) {
                return;
            }

            selectedList.value.clear();
            value.forEach(val => selectedList.value.add(val));
        }, { immediate: true });

        function onChange(event: Event): void {
            const select = event.target;
            if (!(select instanceof HTMLSelectElement)) return;

            if (typeof props.modelValue === 'string') {
                selectedList.value.clear();
                selectedList.value.add(select.value);
                emit('update:modelValue', select.value);

            } else {
                const selectedOptions = Array
                    .from(select.selectedOptions)
                    .map(option => option.value);

                if (selectedList.value.size !== selectedOptions.length
                    || selectedOptions.every(val => selectedList.value.has(val))) {
                    selectedList.value.clear();
                    selectedOptions.forEach(val => selectedList.value.add(val));
                }

                emit('update:modelValue', selectedOptions);
            }
        }

        const validationStatusReporter = inject(validationStatusReporterKey, null);

        async function checkValidity(): Promise<ValidationResult> {
            if (novalidate?.value) {
                infer(ValidationResult.DISABLED);
                return ValidationResult.DISABLED;
            }

            const select = selectRef.value;
            if (!(select instanceof HTMLSelectElement)) {
                infer(ValidationResult.EXCEPTION);
                return Promise.reject();
            }

            if (!select.willValidate) {
                infer(ValidationResult.UNREQUIRED);
                return ValidationResult.UNREQUIRED;
            }

            validationStatusReporter?.start();

            if (props.multiple) {
                const count = select.selectedOptions.length;

                if (count >= props.multiple.minimum
                    && count <= props.multiple.maximum) {
                    infer(ValidationResult.SUCCEED);
                    validationStatusReporter?.passed();
                    return ValidationResult.SUCCEED;
                }

                const violation = count < props.multiple.minimum
                    ? Violation.RANGE_UNDERFLOW
                    : Violation.RANGE_OVERFLOW;

                infer(ValidationResult.ERRORED);
                validationStatusReporter?.failed(violation);
                return ValidationResult.ERRORED;
            }

            if (select.checkValidity()) {
                infer(ValidationResult.SUCCEED);
                validationStatusReporter?.passed();
                return ValidationResult.SUCCEED;
            }

            infer(ValidationResult.ERRORED);
            validationStatusReporter?.failed(Violation.VALUE_MISSING);
            return ValidationResult.ERRORED;
        }

        function focus(): Promise<void> {
            return nextTick(() => {
                const select = selectRef.value;
                if (!(select instanceof HTMLSelectElement)) {
                    return Promise.reject();
                }

                select.focus();
            });
        }

        pushControlAction({
            checkValidity,
            focus,
            isSuitableFocus: () => true
        }, shareId);

        return () => {
            const classes = [
                'j-form-select',
                {
                    'select-sm': controlSize.value === 'small',
                    'select-lg': controlSize.value === 'large',
                    'is-valid': selfStatus.value === ComponentStatus.VALIDATION_SUCCEED,
                    'is-invalid': selfStatus.value === ComponentStatus.VALIDATION_ERRORED
                }
            ]
                , data: Record<string, unknown> = {
                ref: selectRef,
                id: shareId,
                class: classes,
                multiple: props.multiple !== undefined,
                required: isRequired.value,
                onChange: [ onChange, checkValidity ]
            };

            switch (selfStatus.value) {
                case ComponentStatus.VALIDATION_SUCCEED: {
                    data['aria-invalid'] = false;
                    break;
                }
                case ComponentStatus.VALIDATION_ERRORED:
                case ComponentStatus.VALIDATION_EXCEPTION: {
                    data['aria-invalid'] = true;
                    data['aria-errormessage'] = errormessageId;
                    break;
                }
            }

            const children: VNodeChild = [];
            if (props.placeholder) {
                const data: OptionProp = {
                    value: '',
                    disabled: true
                }
                    , placeholder = createElement('option', data, props.placeholder);
                children.push(placeholder);
            }

            if (props.children) {
                children.push(renderChildren(props.children, selectedList.value));
            } else {
                children.push(slots['default']?.());
            }

            return createElement('select', data, children);
        }
    }
});

/**
 * - {@link Violation.VALUE_MISSING VALUE_MISSING}
 * - {@link Violation.RANGE_UNDERFLOW RANGE_UNDERFLOW}
 * - {@link Violation.RANGE_OVERFLOW RANGE_OVERFLOW}
 */
export default component as new() => {
    $props:
        VNodeProps
        & AllowedComponentProps
        & ComponentCustomProps
        & Omit<SelectHTMLAttributes, 'id' | keyof Prop>
        & Pick<Prop, 'modelValue'>
        & Omit<Prop, 'modelValue'>
        & { 'onUpdate:modelValue'?: (value: string | string[]) => void; };

    $slots: {
        default?: () => VNode[];
    }
};
export type  { Prop, OptionStruct, OptGroupStruct, SelectChildren, Multiple };

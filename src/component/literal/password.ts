import {
    defineComponent,
    h as createElement,
    inject,
    readonly,
    ref,
    toRef,
    watch,
    mergeProps,
    nextTick
} from 'vue';
import type {
    PropType,
    InputHTMLAttributes,
    AllowedComponentProps,
    ComponentCustomProps,
    VNodeProps,
    FunctionalComponent,
    ButtonHTMLAttributes
} from 'vue';
import { validSizes } from '../../support';
import type { ValidSize } from '../../support';
import { pushControlAction, inferComponentStatus } from '../../helper/common';
import { imeHelper, checkValidityHelper } from './helper';
import { ComponentStatus } from '../../support';
import {
    fetchShareIdKey,
    inheritedRequiredKey,
    inheritedSizeKey,
    inheritedNovalidateKey,
    ValidationResult
} from '../../key';
import { debounce } from 'throttle-debounce';
import { propOption as commonPropOption } from './common';
import type { Prop as CommonProp } from './common';
import type { KebabCasedProperties } from 'type-fest';

type Prop = CommonProp & {
    modelModifiers?: { lazy: boolean };
    size?: ValidSize;
    revalidate?: (value: string) => Promise<boolean>;
};

type ToggleComponentProp = ButtonHTMLAttributes & {
    passwordShowing: boolean;
};

const showIconPath =
    'M8 2c1.981 0 3.671.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 ' +
    '1.62 0 0 1 0 1.798c-.45.678-1.367 1.932-2.637 3.023C11.67 13.008 9.981 14 8 ' +
    '14c-1.981 0-3.671-.992-4.933-2.078C1.797 10.83.88 9.576.43 8.898a1.62 1.62 0 ' +
    '0 1 0-1.798c.45-.677 1.367-1.931 2.637-3.022C4.33 2.992 6.019 2 8 2ZM1.679 ' +
    '7.932a.12.12 0 0 0 0 .136c.411.622 1.241 1.75 2.366 2.717C5.176 11.758 6.527 ' +
    '12.5 8 12.5c1.473 0 2.825-.742 3.955-1.715 1.124-.967 1.954-2.096 2.366-2.717a.12.12 ' +
    '0 0 0 0-.136c-.412-.621-1.242-1.75-2.366-2.717C10.824 4.242 9.473 3.5 8 3.5c-1.473 ' +
    '0-2.825.742-3.955 1.715-1.124.967-1.954 2.096-2.366 2.717ZM8 10a2 2 0 1 1-.001-3.999A2 ' +
    '2 0 0 1 8 10Z'
    , hideIconPath =
    'M.143 2.31a.75.75 0 0 1 1.047-.167l14.5 10.5a.75.75 0 1 1-.88 1.214l-2.248-1.628C11.346 ' +
    '13.19 9.792 14 8 14c-1.981 0-3.67-.992-4.933-2.078C1.797 10.832.88 9.577.43 ' +
    '8.9a1.619 1.619 0 0 1 0-1.797c.353-.533.995-1.42 1.868-2.305L.31 3.357A.75.75 ' +
    '0 0 1 .143 2.31Zm1.536 5.622A.12.12 0 0 0 1.657 8c0 .021.006.045.022.068.412.621 ' +
    '1.242 1.75 2.366 2.717C5.175 11.758 6.527 12.5 8 12.5c1.195 0 2.31-.488 ' +
    '3.29-1.191L9.063 9.695A2 2 0 0 1 6.058 7.52L3.529 5.688a14.207 14.207 0 0 0-1.85 ' +
    '2.244ZM8 3.5c-.516 0-1.017.09-1.499.251a.75.75 0 1 1-.473-1.423A6.207 6.207 0 0 ' +
    '1 8 2c1.981 0 3.67.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 0 ' +
    '1 0 1.798c-.11.166-.248.365-.41.587a.75.75 0 1 1-1.21-.887c.148-.201.272-.382.371-.53a.119.119 ' +
    '0 0 0 0-.137c-.412-.621-1.242-1.75-2.366-2.717C10.825 4.242 9.473 3.5 8 3.5Z';

const toggleComponent: FunctionalComponent<ToggleComponentProp> = (props) => {
    const data: Record<string, unknown> = {
        class: 'toggle',
        type: 'button',
        'aria-label': `${props.passwordShowing ? 'Hide' : 'Show'} password`,
        'aria-pressed': String(props.passwordShowing)
    }
        , iconData: Record<string, unknown> = {
        class: [
            'toggle-icon',
            props.passwordShowing ? 'hide' : 'show'
        ],
        viewBox: '0 0 16 16',
        width: '16',
        height: '16',
        fill: 'currentColor',
        'aria-hidden': 'true',
        role: 'img'
    }
        , path = createElement('path', {
        'fill-rule': 'evenodd',
        d: props.passwordShowing ? hideIconPath : showIconPath
    });
    return createElement('button', data, createElement('svg', iconData, path));
};

const component = defineComponent({
    name: 'JPassword',
    inheritAttrs: false,
    props: {
        ...commonPropOption,
        modelModifiers: {
            type: Object as PropType<{ lazy?: boolean }>,
            required: false,
            default: () => ({ lazy: false })
        },
        size: {
            type: String as PropType<ValidSize>,
            required: false,
            default: 'medium',
            validator: (value: string) => validSizes.includes(value)
        },
        revalidate: {
            type: Function as PropType<(value: string) => Promise<boolean>>,
            required: false
        }
    },
    emits: [ 'update:modelValue' ],
    setup(props, { emit, attrs }) {
        const inputRef = ref<HTMLInputElement | null>(null)
            , shareId = inject(fetchShareIdKey)?.fetch()
            , errormessageId = shareId?.concat('_errormessage')
            , isRequired = inject(inheritedRequiredKey, () => readonly(toRef(props, 'required')), true)
            , controlSize = inject(inheritedSizeKey, () => readonly(toRef(props, 'size')), true)
            , { status: selfStatus, infer } = inferComponentStatus()
            , { isComposing, onCompositionstart, onCompositionend } = imeHelper();

        const inputValue = ref(props.modelValue ?? '');

        watch(() => props.modelValue, value => {
            if (value === undefined || inputValue.value === value) {
                return;
            }

            inputValue.value = value;
        }, { immediate: true });

        function syncAndEmitInputValue(event: Event): void {
            if (isComposing.value) return;

            const input = event.target;
            if (!(input instanceof HTMLInputElement)) return;

            inputValue.value = input.value;

            if (!props.modelModifiers?.lazy || event.type === 'change') {
                emit('update:modelValue', input.value);
            }
        }

        const novalidate = inject(inheritedNovalidateKey, () => readonly(ref(false)), true)
            , _checkValidity = checkValidityHelper({
            novalidate,
            isComposing,
            elementRef: inputRef
        });

        async function checkValidity(): Promise<ValidationResult> {
            let result: ValidationResult;
            try {
                if (props.revalidate) {
                    result = await _checkValidity(props.revalidate.bind(null, inputValue.value));
                } else {
                    result = await _checkValidity();
                }
            } catch (e) {
                result = ValidationResult.EXCEPTION;
            }

            infer(result);
            return result;
        }

        function focus(): Promise<void> {
            return nextTick(() => {
                const input = inputRef.value;
                if (!(input instanceof HTMLInputElement)) {
                    return Promise.reject();
                }

                input.focus();
            });
        }

        pushControlAction({
            checkValidity,
            focus,
            isSuitableFocus: () => true
        }, shareId);

        const onInputCheckValidity = debounce(300, () => {
            if (isComposing.value) return;
            checkValidity().catch(() => {/* Don't do anything. */});
        });

        const inputType = ref<'password' | 'text'>('password')
            , passwordShowing = ref(false);

        function onToggleClick(event: MouseEvent): void {
            const button = event.currentTarget;
            if (!(button instanceof HTMLButtonElement)) return;

            const status = !passwordShowing.value;
            passwordShowing.value = status;
            inputType.value = status ? 'text' : 'password';
        }

        return () => {
            const sizeClasses = {
                'input-sm': controlSize.value === 'small',
                'input-lg': controlSize.value === 'large'
            }
                , inputData: Record<string, unknown> = mergeProps(attrs, {
                ref: inputRef,
                id: shareId,
                class: [ 'j-form-control', sizeClasses ],
                value: inputValue.value,
                required: isRequired.value,
                type: inputType.value,
                onInput: [ syncAndEmitInputValue, onInputCheckValidity ],
                onChange: [ syncAndEmitInputValue, onInputCheckValidity ]
            })
                , toggleData: ToggleComponentProp = {
                passwordShowing: passwordShowing.value,
                onClick: onToggleClick
            };

            switch (selfStatus.value) {
                case ComponentStatus.VALIDATION_SUCCEED: {
                    inputData['aria-invalid'] = false;
                    break;
                }
                case ComponentStatus.VALIDATION_EXCEPTION:
                case ComponentStatus.VALIDATION_ERRORED: {
                    inputData['aria-invalid'] = true;
                    inputData['aria-errormessage'] = errormessageId;
                    break;
                }
            }

            if (inputType.value === 'text') {
                inputData['onCompositionstart'] = onCompositionstart;
                inputData['onCompositionend'] = onCompositionend;
            }

            return createElement('div', { class: [ 'visible-password', sizeClasses] }, [
                createElement(toggleComponent, toggleData),
                createElement('input', inputData)
            ]);
        };
    }
});

/**
 * 可切换显示隐藏的密码框
 *
 * 该组件只支持 .lazy 修饰符
 */
export default component as new() => {
    $props:
        VNodeProps
        & AllowedComponentProps
        & ComponentCustomProps
        & Omit<InputHTMLAttributes, 'id' | 'type' | keyof Prop>
        & Pick<Prop, 'modelValue' | 'modelModifiers'>
        & KebabCasedProperties<Omit<Prop, 'modelValue' | 'modelModifiers'>>
        & { 'onUpdate:modelValue'?: (value: string) => void; }
};
export type { Prop };

import {
    defineComponent,
    h as createElement,
    inject,
    ref,
    readonly,
    toRef,
    watch,
    nextTick
} from 'vue';
import type {
    PropType,
    VNodeProps,
    AllowedComponentProps,
    ComponentCustomProps,
    TextareaHTMLAttributes
} from 'vue';
import {
    fetchShareIdKey,
    inheritedRequiredKey,
    inheritedNovalidateKey,
    ValidationResult
} from '../../key';
import { debounce } from 'throttle-debounce';
import { propOption as commonPropOption } from './common';
import type { Prop as CommonProp } from './common';
import { imeHelper, checkValidityHelper } from './helper';
import { pushControlAction, inferComponentStatus } from '../../helper/common';
import { ComponentStatus } from '../../support';
import type { KebabCasedProperties } from 'type-fest';

type Prop = CommonProp & {
    modelModifiers?: { trim?: boolean, lazy?: boolean }
};

const component = defineComponent({
    name: 'JTextarea',
    inheritAttrs: true,
    props: {
        ...commonPropOption,
        modelModifiers: {
            type: Object as PropType<{ trim?: boolean, lazy?: boolean }>,
            required: false,
            default: () => ({ trim: false, lazy: false })
        }
    },
    emits: [ 'update:modelValue' ],
    setup(props, { emit }) {
        const textareaRef = ref<HTMLTextAreaElement | null>(null)
            , shareId = inject(fetchShareIdKey, null)?.fetch()
            , errormessageId = shareId?.concat('_errormessage')
            , isRequired = inject(inheritedRequiredKey, () => readonly(toRef(props, 'required')), true)
            , { status: selfStatus, infer } = inferComponentStatus()
            , { isComposing, onCompositionstart, onCompositionend } = imeHelper();

        const textareaValue = ref(props.modelValue ?? '');

        watch(() => props.modelValue, value => {
            if (value === undefined
                || textareaValue.value === value
                || textareaValue.value.trim() === value) {
                return;
            }

            textareaValue.value = value;
        }, { immediate: true });

        function syncAndEmitInputValue(event: Event): void {
            if (isComposing.value) return;

            const textarea = event.target;
            if (!(textarea instanceof HTMLTextAreaElement)) return;

            textareaValue.value = textarea.value;

            let shouldEmit = true;
            const emitText = props.modelModifiers?.trim
                ? textarea.value.trim()
                : textarea.value;

            if (event.type === 'input') {
                shouldEmit = !props.modelModifiers?.lazy;
            } else if (event.type === 'change') {
                textareaValue.value = emitText;
            } else {
                return;
            }

            shouldEmit && emit('update:modelValue', emitText);
        }

        const novalidate = inject(inheritedNovalidateKey, () => readonly(toRef(props, 'novalidate')), true)
            , _checkValidity = checkValidityHelper({
            novalidate,
            isComposing,
            elementRef: textareaRef
        });

        async function checkValidity(): Promise<ValidationResult> {
            let validationResult: ValidationResult;
            try {
                validationResult = await _checkValidity();
            } catch (e) {
                validationResult = ValidationResult.EXCEPTION;
            }

            infer(validationResult);
            return validationResult;
        }

        function focus(): Promise<void> {
            return nextTick(() => {
                const textarea = textareaRef.value;
                if (!(textarea instanceof HTMLTextAreaElement)) {
                    return Promise.reject();
                }

                textarea.focus();
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

        return () => {
            const data: Record<string, unknown> = {
                ref: textareaRef,
                id: shareId,
                class: [ 'j-form-control' ],
                value: textareaValue.value,
                required: isRequired.value,
                onCompositionstart,
                onCompositionend,
                onInput: [ syncAndEmitInputValue, onInputCheckValidity ],
                onChange:[ syncAndEmitInputValue, onInputCheckValidity ]
            };

            switch (selfStatus.value) {
                case ComponentStatus.VALIDATION_SUCCEED: {
                    data['aria-invalid'] = false;
                    break;
                }
                case ComponentStatus.VALIDATION_EXCEPTION:
                case ComponentStatus.VALIDATION_ERRORED: {
                    data['aria-invalid'] = true;
                    data['aria-errormessage'] = errormessageId;
                    break;
                }
            }

            return createElement('textarea', data);
        }
    }
});

export default component as new() => {
    $props:
        VNodeProps
        & AllowedComponentProps
        & ComponentCustomProps
        & Omit<TextareaHTMLAttributes, 'id' | keyof Prop>
        & Pick<Prop, 'modelValue' | 'modelModifiers'>
        & KebabCasedProperties<Omit<Prop, 'modelValue' | 'modelModifiers'>>
        & { 'onUpdate:modelValue'?: (value: string) => void; };
};
export type { Prop };

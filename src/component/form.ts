import {
    defineComponent,
    h as createElement,
    provide,
    readonly,
    toRef
} from 'vue';
import type {
    FormHTMLAttributes,
    VNodeProps,
    AllowedComponentProps,
    ComponentCustomProps,
    VNode
} from 'vue';
import { inheritedNovalidateKey, ValidationResult } from '../key';
import { collectControlAction } from '../helper/common';

type Prop = {
    /**
     * 是否进行表单验证
     *
     * 该属性不是 form 表单的原生 novalidate 属性
     */
    novalidate?: boolean;
};

function focusable(element: HTMLElement): boolean {
    if (element.hidden) {
        return false;
    }

    if (element instanceof HTMLInputElement
        || element instanceof HTMLTextAreaElement
        || element instanceof HTMLSelectElement) {
        return !(
            element.hasAttribute('readonly')
            || element.getAttribute('aria-readonly') === 'true'
            || element.disabled
            || element.getAttribute('aria-disabled') === 'true'
            || element.type === 'hidden'
        );
    }

    // radio group, checkbox group
    return [ 'group', 'radiogroup' ].includes(element.getAttribute('role') ?? '');
}

const component = defineComponent({
    name: 'JForm',
    inheritAttrs: true,
    props: {
        novalidate: {
            type: Boolean,
            required: false,
            default: false
        }
    },
    emits: {
        submit: null as unknown as (event: Event) => void | Promise<void>
    },
    setup(props, { slots, emit }) {
        const validationActions = collectControlAction();

        async function onsubmit(event: Event): Promise<void> {
            const form = event.target;
            if (!(form instanceof HTMLFormElement)) return;

            !event.defaultPrevented && event.preventDefault();

            if (props.novalidate) {
                emit('submit', event);
                return;
            }

            let passed = true;
            const checks = Array
                .from(validationActions.values())
                .map(value => value.checkValidity())

            for (const result of await Promise.allSettled(checks)) {
                if (result.status === 'rejected') {
                    passed = false;
                    break;
                }

                const val = result as PromiseFulfilledResult<ValidationResult>;
                if (val.value === ValidationResult.ERRORED) {
                    passed = false;
                    break;
                }
            }

            if (passed) {
                emit('submit', event);
                return;
            }

            // 无法在 Form 组件中确保 FormGroup 组件在 dom 中的正确顺序
            // 手动搜索 Form 组件具有 aria-invalid=true 属性的表单控件元素
            const action = Array
                .from(form.querySelectorAll('[aria-invalid="true"]'))
                .filter((element): element is HTMLElement => element instanceof HTMLElement)
                .filter(element => focusable(element))
                .map(element => element.id || element.dataset['id'])
                .filter((id): id is string => id !== undefined)
                .map(id => validationActions.get(id))
                .filter(action => action?.isSuitableFocus())
                [0];

            await action?.focus();
        }

        provide(inheritedNovalidateKey, readonly(toRef(props, 'novalidate')));

        return () => {
            const data: Record<string, unknown> = {
                class: 'j-form',
                // 为了防止浏览器弹出原生的验证信息, form 表单的 novalidate
                // 属性始终被设置为 true
                novalidate: true,
                onSubmit: onsubmit
            };
            return createElement('form', data, slots['default']?.());
        };
    }
});

export default component as new() => {
    $props:
        VNodeProps
        & AllowedComponentProps
        & ComponentCustomProps
        & FormHTMLAttributes
        & Prop
        & { onSubmit?: (event: Event) => void | Promise<void> };

    $slots: {
        default?: () => VNode[]
    }
};
export type { Prop };

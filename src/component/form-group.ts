import {
    defineComponent,
    h as createElement,
    inject,
    provide,
    readonly,
    ref,
    toRef,
    nextTick
} from 'vue';
import type {
    VNodeChild,
    VNodeProps,
    AllowedComponentProps,
    ComponentCustomProps,
    HTMLAttributes,
    VNode
} from 'vue';
import {
    ShareIdProvider,
    ValidationResult,
    fetchShareIdKey,
    inheritedRequiredKey,
    inheritedNovalidateKey,
    validationStatusReporterKey
} from '../key';
import { Violation, ComponentStatus } from '../support';
import {
    collectControlAction,
    pushControlAction,
    inferComponentStatus
} from '../helper/common';

type Prop = {
    novalidate?: boolean;
    required?: boolean;
};

type InvalidFeedbackSlotProp = {
    contain: (violation: Violation) => boolean;
    containAny: (...violations: Violation[]) => boolean;
};

function generateId(): string {
    return new Date().getTime().toString(16) + Math.random().toString(16).substring(2);
}

const component = defineComponent({
    name: 'JFormGroup',
    inheritAttrs: true,
    props: {
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
    },
    setup(props, { slots }) {
        const formGroupRef = ref<HTMLDivElement | null>(null)
            , shareId = generateId()
            , errormessageId = `${shareId}_errormessage`
            , { status: selfStatus, infer: inferStatus, force: forceStatus } = inferComponentStatus();

        const validationActions = collectControlAction();

        // 焦点管理与表单验证
        const novalidate = inject(inheritedNovalidateKey, () => readonly(toRef(props, 'novalidate')), true)
            , tabindex = ref<number>();

        async function checkValidity(): Promise<ValidationResult> {
            if (novalidate.value) {
                inferStatus(ValidationResult.DISABLED);
                return ValidationResult.DISABLED;
            }

            try {
                for (const action of validationActions.values()) {
                    switch (await action.checkValidity()) {
                        case ValidationResult.ERRORED:
                        case ValidationResult.EXCEPTION: {
                            inferStatus(ValidationResult.ERRORED);
                            return ValidationResult.ERRORED;
                        }
                    }
                }
            } catch (e) {
                inferStatus(ValidationResult.EXCEPTION);
                return ValidationResult.EXCEPTION;
            }

            inferStatus(ValidationResult.SUCCEED);
            return ValidationResult.SUCCEED;
        }

        async function tryFocus(): Promise<void> {
            for (const action of validationActions.values()) {
                if (!action.isSuitableFocus()) {
                    continue;
                }

                try {
                    await action.focus();
                    tabindex.value = undefined;
                    return;
                } catch (e) { }
            }

            // 当表单控件不适合聚焦时, 尝试聚焦 FormGroup 组件自身
            const formGroup = formGroupRef.value;
            if (!(formGroup instanceof HTMLDivElement)) {
                return Promise.reject();
            }

            tabindex.value ??= -1;
            return nextTick(() => formGroup.focus());
        }

        const violationReasons = new Set();

        function validationStart(): void {
            violationReasons.clear();
            forceStatus(ComponentStatus.VALIDATION_STARTED);
        }

        function validationPass(): void {
            violationReasons.clear();
            inferStatus(ValidationResult.SUCCEED);
        }

        function validationFail(...violations: Violation[]): void {
            violationReasons.clear();
            inferStatus(ValidationResult.ERRORED);

            for (const violation of violations) {
                violationReasons.add(violation);
            }
        }

        function contain(violation: Violation): boolean {
            return violationReasons.has(violation);
        }

        function containAny(...violations: Violation[]): boolean {
            return violations.some(contain);
        }

        pushControlAction({
            checkValidity,
            focus: tryFocus,
            isSuitableFocus: () => true
        }, shareId);

        provide(fetchShareIdKey, {
            fetch: () => shareId,
            provider: ShareIdProvider.FORM_GROUP
        });
        provide(inheritedNovalidateKey, novalidate);
        provide(inheritedRequiredKey, readonly(toRef(props, 'required')));
        provide(validationStatusReporterKey, {
            start: validationStart,
            passed: validationPass,
            failed: validationFail
        });

        return () => {
            const classes = [
                'j-form-group',
                { 'required': props.required }
            ]
                , data: Record<string, unknown> = {
                ref: formGroupRef,
                class: classes,
                tabindex: tabindex.value
            }
                , children: VNodeChild = [ slots['default']?.() ];

            switch (selfStatus.value) {
                case ComponentStatus.VALIDATION_SUCCEED: {
                    classes.push('is-valid');

                    if (!slots['valid-feedback']) {
                        break;
                    }

                    const feedback = createElement(
                        'div',
                        { class: 'valid-feedback' },
                        slots['valid-feedback']()
                    );
                    children.push(feedback);
                    break;
                }
                case ComponentStatus.VALIDATION_ERRORED: {
                    classes.push('is-invalid');

                    if (!slots['invalid-feedback']) {
                        break;
                    }

                    const data: Record<string, unknown> = {
                        id: errormessageId,
                        class: 'invalid-feedback',
                        'aria-live': 'assertive'
                    }
                        , feedback = createElement(
                        'div',
                        data,
                        slots['invalid-feedback']({ contain, containAny })
                    );
                    children.push(feedback);
                    break;
                }
                case ComponentStatus.VALIDATION_EXCEPTION: {
                    classes.push('is-except');

                    if (!slots['except-feedback']) {
                        break;
                    }

                    const data: Record<string, unknown> = {
                        id: errormessageId,
                        class: 'except-feedback',
                        'aria-live': 'assertive'
                    }
                        , feedback = createElement(
                        'div',
                        data,
                        slots['except-feedback']()
                    );
                    children.push(feedback);
                    break;
                }
            }

            return createElement('div', data, children);
        };
    }
});

export default component as new() => {
    $props:
        VNodeProps
        & AllowedComponentProps
        & ComponentCustomProps
        & HTMLAttributes
        & Prop;

    $slots: {
        default?: () => VNode[],
        'valid-feedback'?: () => VNode[],
        'invalid-feedback'?: (props: InvalidFeedbackSlotProp) => VNode[],
        'expect-feedback'?: () => VNode[]
    }
};
export type { Prop, InvalidFeedbackSlotProp };

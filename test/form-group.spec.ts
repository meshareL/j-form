import { describe, it, expect, vitest, afterEach, beforeAll, afterAll } from 'vitest';
import { inject, h as createElement, readonly, ref } from 'vue';
import type { FunctionalComponent, VNodeChild } from 'vue';
import { shallowMount, enableAutoUnmount, config, mount, flushPromises } from '@vue/test-utils';
import FormGroup from '../src/component/form-group';
import {
    ValidationResult,
    validationManagerKey,
    validationStatusReporterKey,
    fetchShareIdKey,
    inheritedNovalidateKey,
    inheritedRequiredKey
} from '../src/key';
import type { ValidationManager } from '../src/key';
import { Violation } from '../src';

const validationPassedChild: FunctionalComponent = () => {
    const manager = inject(validationManagerKey)
        , reporter = inject(validationStatusReporterKey);
    manager?.addAction({
        checkValidity: () => {
            reporter?.start();
            reporter?.passed();
            return Promise.resolve(ValidationResult.SUCCEED);
        },
        focus: () => Promise.resolve(),
        isSuitableFocus: () => true
    }, '0');
    return createElement('input');
}
    , validationFailedChild: FunctionalComponent = () => {
    const manager = inject(validationManagerKey)
        , reporter = inject(validationStatusReporterKey);
    manager?.addAction({
        checkValidity: () => {
            reporter?.start();
            reporter?.failed(
                Violation.VALUE_MISSING,
                Violation.TYPE_MISMATCH,
                Violation.PATTERN_MISMATCH);
            return Promise.resolve(ValidationResult.ERRORED);
        },
        focus: () => Promise.resolve(),
        isSuitableFocus: () => true
    }, '1');
    return createElement('input');
}
    , validationExceptionChild: FunctionalComponent = () => {
    const manager = inject(validationManagerKey)
        , reporter = inject(validationStatusReporterKey);
    manager?.addAction({
        checkValidity: () => {
            reporter?.start();
            return Promise.reject();
        },
        focus: () => Promise.resolve(),
        isSuitableFocus: () => true
    }, '2');
    return createElement('input');
};

enableAutoUnmount(afterEach);

// todo: refactor
describe('FormGroup component', () => {
    const defaultConfigProvide = config.global.provide
        , validationManager = {
        addAction: vitest.fn<Parameters<ValidationManager['addAction']>, ReturnType<ValidationManager['addAction']>>(),
        removeAction: vitest.fn<Parameters<ValidationManager['removeAction']>, ReturnType<ValidationManager['removeAction']>>()
    };

    beforeAll(() => {
        config.global.provide = { [validationManagerKey as symbol]: validationManager };
    });

    afterAll(() => {
        config.global.provide = defaultConfigProvide
    });

    describe('create component', () => {
        it('create', () => {
            const child: FunctionalComponent = () => {
                const novalidate = inject(inheritedNovalidateKey);
                expect(novalidate?.value).toBe(false);

                const fetchShareId = inject(fetchShareIdKey);
                expect(fetchShareId?.fetch()).not.toBeUndefined();
                expect(fetchShareId?.provider).not.toBeUndefined();

                const required = inject(inheritedRequiredKey);
                expect(required?.value).toBe(false);

                const manager = inject(validationManagerKey);
                expect(manager?.addAction).toBeInstanceOf(Function);
                expect(manager?.removeAction).toBeInstanceOf(Function);

                const management = inject(validationStatusReporterKey);
                expect(management?.start).toBeInstanceOf(Function);
                expect(management?.passed).toBeInstanceOf(Function);
                expect(management?.failed).toBeInstanceOf(Function);

                return 'Child';
            }
                , instance = shallowMount(FormGroup as any, {
                    slots: { default: () => createElement(child) }
            });

            expect(instance.exists()).toBe(true);
            expect(instance.classes('j-form-group')).toBe(true);
            expect(instance.attributes('tabindex')).toBeUndefined();
            expect(instance.find('.valid-feedback').exists()).toBe(false);
            expect(instance.find('.invalid-feedback').exists()).toBe(false);
            expect(instance.find('.expect-feedback').exists()).toBe(false);
            expect(validationManager.addAction).toBeCalled();
        });

        it('unmount component', () => {
            const instance = shallowMount(FormGroup as any);
            expect(instance.exists()).toBe(true);

            instance.unmount();
            expect(validationManager.removeAction).toBeCalled();
        });
    });

    describe('slot', () => {
        it('default slot', () => {
            const instance = shallowMount(FormGroup as any, {
                slots: { default: () => createElement('span', { class: 'slot-default' }, 'default') }
            });
            expect(instance.exists()).toBe(true);

            const defaultSlot = instance.find('.slot-default');
            expect(defaultSlot.exists()).toBe(true);
            expect(defaultSlot.text()).toBe('default');
        });

        it('the feedback slot is not rendered by default', () => {
            const instance = mount(FormGroup as any, {
                slots: {
                    'valid-feedback': () => 'message',
                    'invalid-feedback': () => 'errormessage'
                }
            });
            expect(instance.exists()).toBe(true);

            expect(instance.find('.valid-feedback').exists()).toBe(false);
            expect(instance.find('.invalid-feedback').exists()).toBe(false);
        });

        it('invalid-feedback slot prop', async () => {
            function invalidFeedbackSlot(props: Record<string, Function>): VNodeChild {
                const children: VNodeChild = [];

                if (props['contain']?.(Violation.VALUE_MISSING)) {
                    children.push(createElement('p', { class: 'contain' }, 'contain'));
                }

                if (props['containAny']?.(Violation.TYPE_MISMATCH, Violation.PATTERN_MISMATCH)) {
                    children.push(createElement('p', { class: 'contain-any' }, 'containAny'));
                }

                return children;
            }

            const instance = mount(FormGroup as any, {
                slots: {
                    default: () => createElement(validationFailedChild),
                    'invalid-feedback': invalidFeedbackSlot
                }
            });
            expect(instance.exists()).toBe(true);

            const action = validationManager.addAction.mock.calls[0]?.[0];
            await action?.checkValidity();

            await flushPromises();
            expect(instance.find('.contain').exists()).toBe(true);
            expect(instance.find('.contain-any').exists()).toBe(true);
        });
    });

    it('required prop', async () => {
        const instance = shallowMount(FormGroup as any, { props: { required: true } });
        expect(instance.exists()).toBe(true);
        expect(instance.classes('required')).toBe(true);

        await instance.setProps({ required: false });
        expect(instance.classes('required')).toBe(false);
    });

    it('the novalidate provided by the parent component is preferred', () => {
        const child: FunctionalComponent = () => {
            const novalidate = inject(inheritedNovalidateKey);
            expect(novalidate).not.toBeUndefined();
            expect(novalidate!.value).toBe(true);
            return 'Child';
        }
            , instance = shallowMount(FormGroup as any, {
            props: { novalidate: false },
            slots: { default: () => createElement(child) },
            global: {
                provide: { [inheritedNovalidateKey as symbol]: readonly(ref(true)) }
            }
        });
        expect(instance.exists()).toBe(true);
    });

    it('parent component does not provide novalidate and will use its own property', () => {
        const child: FunctionalComponent = () => {
            const novalidate = inject(inheritedNovalidateKey);
            expect(novalidate).not.toBeUndefined();
            expect(novalidate!.value).toBe(true);
            return 'Child';
        }
            , instance = shallowMount(FormGroup as any, {
            props: { novalidate: true },
            slots: { default: () => createElement(child) }
        });
        expect(instance.exists()).toBe(true);
    });

    describe('validation', () => {
        it('validation passed, render valid-feedback slots', async () => {
            const instance = mount(FormGroup as any, {
                slots: {
                    default: () => createElement(validationPassedChild),
                    'valid-feedback': () => 'message'
                }
            });
            expect(instance.exists()).toBe(true);

            const action = validationManager.addAction.mock.calls[0]?.[0];
            await expect(action?.checkValidity()).resolves.toBe(ValidationResult.SUCCEED);

            await flushPromises();
            expect(instance.find('.invalid-feedback').exists()).toBe(false);
            expect(instance.find('.except-feedback').exists()).toBe(false);

            expect(instance.classes('is-valid')).toBe(true);
            expect(instance.get('.valid-feedback').text()).toBe('message');
        });

        it('validation passed, valid-feedback is not provided', async () => {
            const instance = mount(FormGroup as any, {
                slots: { default: () => createElement(validationPassedChild) }
            });
            expect(instance.exists()).toBe(true);

            const action = validationManager.addAction.mock.calls[0]?.[0];
            await expect(action?.checkValidity()).resolves.toBe(ValidationResult.SUCCEED);

            await flushPromises();
            expect(instance.find('.valid-feedback').exists()).toBe(false);
            expect(instance.find('.invalid-feedback').exists()).toBe(false);
            expect(instance.find('.except-feedback').exists()).toBe(false);
        });

        it('validation failed, render invalid-feedback slots', async () => {
            const instance = mount(FormGroup as any, {
                slots: {
                    default: () => createElement(validationFailedChild),
                    'invalid-feedback': () => 'errormessage'
                }
            });
            expect(instance.exists()).toBe(true);

            const action = validationManager.addAction.mock.calls[0]?.[0];
            await expect(action?.checkValidity()).resolves.toBe(ValidationResult.ERRORED);

            await flushPromises();
            expect(instance.classes('is-invalid')).toBe(true);
            expect(instance.find('.valid-feedback').exists()).toBe(false);
            expect(instance.find('.except-feedback').exists()).toBe(false);

            const feedback = instance.get('.invalid-feedback');
            expect(feedback.attributes('id')).not.toBeUndefined();
            expect(feedback.text()).toBe('errormessage');
        });

        it('validation failed, invalid-feedback is not provided', async () => {
            const instance = mount(FormGroup as any, {
                slots: { default: () => createElement(validationFailedChild) }
            });
            expect(instance.exists()).toBe(true);

            const action = validationManager.addAction.mock.calls[0]?.[0];
            await expect(action?.checkValidity()).resolves.toBe(ValidationResult.ERRORED);

            await flushPromises();
            expect(instance.classes('is-invalid')).toBe(true);
            expect(instance.find('.valid-feedback').exists()).toBe(false);
            expect(instance.find('.invalid-feedback').exists()).toBe(false);
            expect(instance.find('.except-feedback').exists()).toBe(false);
        });

        it('validation exception, render except-feedback slot', async () => {
            const instance = mount(FormGroup as any, {
                slots: {
                    default: () => createElement(validationExceptionChild),
                    'except-feedback': () => 'errormessage'
                }
            });
            expect(instance.exists()).toBe(true);

            const action = validationManager.addAction.mock.calls[0]?.[0];
            await expect(action?.checkValidity()).resolves.toBe(ValidationResult.EXCEPTION);

            await flushPromises();
            expect(instance.classes('is-except')).toBe(true);
            expect(instance.find('.valid-feedback').exists()).toBe(false);
            expect(instance.find('.invalid-feedback').exists()).toBe(false);

            const feedback = instance.get('.except-feedback');
            expect(feedback.attributes('id')).not.toBeUndefined();
            expect(feedback.text()).toBe('errormessage');
        });

        it('validation exception, except-feedback is not provided', async () => {
            const instance = mount(FormGroup as any, {
                slots: { default: () => createElement(validationExceptionChild) }
            });
            expect(instance.exists()).toBe(true);

            const action = validationManager.addAction.mock.calls[0]?.[0];
            await expect(action?.checkValidity()).resolves.toBe(ValidationResult.EXCEPTION);

            await flushPromises();
            expect(instance.classes('is-except')).toBe(true);
            expect(instance.find('.valid-feedback').exists()).toBe(false);
            expect(instance.find('.invalid-feedback').exists()).toBe(false);
            expect(instance.find('.except-feedback').exists()).toBe(false);
        });

        it('parent component disables validation', async () => {
            const instance = mount(FormGroup as any, {
                slots: {
                    default: () => createElement(validationPassedChild),
                    'valid-feedback': () => 'message',
                    'invalid-feedback': () => 'errormessage'
                },
                global: {
                    provide: { [inheritedNovalidateKey as symbol]: readonly(ref(true)) }
                }
            });
            expect(instance.exists()).toBe(true);

            const action = validationManager.addAction.mock.calls[0]?.[0];
            await action?.checkValidity();

            await flushPromises();

            expect(instance.find('.valid-feedback').exists()).toBe(false);
            expect(instance.find('.invalid-feedback').exists()).toBe(false);
            expect(instance.find('.except-feedback').exists()).toBe(false);
        });
    });

    it('focus on subcomponent when they are suitable for aggregation', async () => {
        const onFocus = vitest.fn(() => Promise.resolve())
            , child: FunctionalComponent = () => {
            const manager = inject(validationManagerKey);
            manager?.addAction({
                checkValidity: () => Promise.resolve(ValidationResult.ERRORED),
                focus: onFocus,
                isSuitableFocus: () => true
            }, '0');
            return createElement('input');
        }
            , instance = mount(FormGroup as any, {
                slots: { default: () => createElement(child) }
        });
        expect(instance.exists()).toBe(true);

        const action = validationManager.addAction.mock.calls[0]?.[0];
        await action?.focus();

        await flushPromises();
        expect(instance.attributes('tabindex')).toBeUndefined();
        expect(onFocus).toBeCalled();
    });

    it('focus on itself when input field is not suitable for focusing', async () => {
        const child: FunctionalComponent = () => {
            const manager = inject(validationManagerKey);
            manager?.addAction({
                checkValidity: () => Promise.resolve(ValidationResult.ERRORED),
                focus: () => Promise.reject(),
                isSuitableFocus: () => false
            }, '0');
            return 'child';
        }
            , onFocus = vitest.fn()
            , instance = mount(FormGroup as any, {
                attrs: { focus: onFocus },
                slots: { default: () => createElement(child) }
        });
        expect(instance.exists()).toBe(true);

        const action = validationManager.addAction.mock.calls[0]?.[0];
        await action?.focus();

        await flushPromises();
        expect(instance.attributes('tabindex')).toBe('-1');
        expect(onFocus).toBeCalled();
    });
});

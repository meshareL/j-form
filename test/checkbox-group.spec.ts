import { afterEach, describe, expect, it, beforeAll, afterAll, vitest } from 'vitest';
import { enableAutoUnmount, shallowMount, config, mount } from '@vue/test-utils';
import type { FunctionalComponent } from 'vue';
import { h as createElement, inject, readonly, ref } from 'vue';
import {
    delegateValidationKey,
    fetchShareIdKey,
    inheritedDisabledKey,
    inheritedNameKey,
    ShareIdProvider,
    validationManagerKey,
    ValidationResult,
    validationStatusReporterKey,
    inheritedNovalidateKey
} from '../src/key';
import type { ValidationManager } from '../src/key';
import { Violation } from '../src/support';
import CheckboxGroup from '../src/component/checkbox/checkbox-group';

enableAutoUnmount(afterEach);

const checkedChild: FunctionalComponent<{ id: string }> = (props) => {
    const manager = inject(validationManagerKey, null);

    function checkValidity(): Promise<ValidationResult> {
        return Promise.resolve(ValidationResult.SUCCEED);
    }

    manager?.addAction({
        checkValidity,
        focus: () => Promise.reject(),
        isSuitableFocus: () => false
    }, props.id);

    return createElement('input', { type: 'checkbox', checked: true });
}
    , uncheckedChild: FunctionalComponent<{ id: string }> = (props) => {
    const manager = inject(validationManagerKey, null);

    function checkValidity(): Promise<ValidationResult> {
        return Promise.resolve(ValidationResult.ERRORED);
    }

    manager?.addAction({
        checkValidity,
        focus: () => Promise.reject(),
        isSuitableFocus: () => false
    }, props.id);

    return createElement('input', { type: 'checkbox', checked: false });
}
    , exceptionChild: FunctionalComponent<{ id: string }> = (props) => {
    const manager = inject(validationManagerKey, null);

    function checkValidity(): Promise<ValidationResult> {
        return Promise.reject();
    }

    manager?.addAction({
        checkValidity,
        focus: () => Promise.reject(),
        isSuitableFocus: () => false
    }, props.id);

    return createElement('input', { type: 'checkbox', checked: false });
};

describe('CheckboxGroup component', () => {
    const defaultConfigProvide = config.global.provide
        , shareId = '0'
        , validationManager = {
        addAction: vitest.fn<Parameters<ValidationManager['addAction']>, ReturnType<ValidationManager['addAction']>>(),
        removeAction: vitest.fn<Parameters<ValidationManager['removeAction']>, ReturnType<ValidationManager['removeAction']>>()
    }
        , validationStatusReporter = {
        start: vitest.fn(),
        passed: vitest.fn(),
        failed: vitest.fn()
    }

    beforeAll(() => {
        config.global.provide = {
            [fetchShareIdKey as symbol]: { fetch: () => shareId, provider: ShareIdProvider.FORM_GROUP },
            [validationManagerKey as symbol]: validationManager,
            [validationStatusReporterKey as symbol]: validationStatusReporter
        }
    });

    afterAll(() => {
        config.global.provide = defaultConfigProvide;
    });

    it('create component', () => {
        const instance = shallowMount(CheckboxGroup as any);

        expect(instance.exists()).toBe(true);
        expect(instance.classes('j-form-checkbox-group')).toBe(true);
        expect(instance.classes()).not.toEqual(
            expect.arrayContaining([ 'is-valid', 'is-invalid' ])
        );
        expect(instance.classes('orientation-vertical')).toBe(true);
        expect(instance.attributes('aria-disabled')).toBe('false');
        expect(instance.attributes('tabindex')).toBe('-1');
        expect(instance.attributes('role')).toBe('group');
        expect(validationManager.addAction).toBeCalled();
    });

    it('unmount component', () => {
        const instance = shallowMount(CheckboxGroup as any);
        expect(instance.exists()).toBe(true);

        instance.unmount();
        expect(validationManager.removeAction).toBeCalled();
    });

    it('CheckboxGroup components should provide dependencies for subcomponents', () => {
        const child: FunctionalComponent = () => {
            const fetchShareId = inject(fetchShareIdKey, null);
            expect(fetchShareId?.fetch()).not.toBeUndefined();
            expect(fetchShareId?.provider).toBe(ShareIdProvider.CHECKBOX_GROUP);

            expect(inject(inheritedNameKey, null)?.value).toBe('0');
            expect(inject(inheritedDisabledKey, null)?.value).toBe(false);
            expect(inject(delegateValidationKey, null)).toBeInstanceOf(Function);
            return 'Child';
        }
            , instance = mount(CheckboxGroup as any, {
            props: { name: '0', disabled: false },
            slots: { default: () => createElement(child) }
        });
        expect(instance.exists()).toBe(true);
    });

    describe('prop', () => {
        it('disabled', async () => {
            const instance = shallowMount(CheckboxGroup as any, { props: { disabled: true } });
            expect(instance.exists()).toBe(true);
            expect(instance.attributes('aria-disabled')).toBe('true');

            await instance.setProps({ disabled: false });
            expect(instance.attributes('aria-disabled')).toBe('false');
        });

        it('orientation', async () => {
            const instance = shallowMount(CheckboxGroup as any, { props: { orientation: 'horizontal' } });
            expect(instance.exists()).toBe(true);
            expect(instance.classes('orientation-horizontal')).toBe(true);

            await instance.setProps({ orientation: 'vertical' });
            expect(instance.classes('orientation-vertical')).toBe(true);
        });
    });

    it('parent novalidate', async () => {
        const instance = shallowMount(CheckboxGroup as any, {
            props: { novalidate: false },
            global: { provide: { [inheritedNovalidateKey as symbol]: readonly(ref(true)) } }
        });
        expect(instance.exists()).toBe(true);

        const action = validationManager.addAction.mock.calls[0]?.[0];
        await expect(action?.checkValidity()).resolves.toBe(ValidationResult.DISABLED);
    });

    describe('validation', () => {
        it('validation passed', async () => {
            const instance = mount(CheckboxGroup as any, {
                props: { name: 'check', minimum: 1, maximum: 3 },
                slots: {
                    default: () => [
                        createElement(checkedChild, { id: '0' }),
                        createElement(checkedChild, { id: '1' }),
                        createElement(uncheckedChild, { id: '3' })
                    ]
                }
            });
            expect(instance.exists()).toBe(true);

            const action = validationManager.addAction.mock.calls[0]?.[0];

            await expect(action?.checkValidity()).resolves.toBe(ValidationResult.SUCCEED);
            expect(validationStatusReporter.start).toBeCalled();
            expect(validationStatusReporter.passed).toBeCalled();
        });

        it('the minimum number of checks was not reached', async () => {
            const instance = mount(CheckboxGroup as any, {
                props: { name: 'check', minimum: 1 },
                slots: { default: () => createElement(uncheckedChild, { id: '0' }) }
            });
            expect(instance.exists()).toBe(true);

            const action = validationManager.addAction.mock.calls[0]?.[0];

            await expect(action?.checkValidity()).resolves.toBe(ValidationResult.ERRORED);
            expect(validationStatusReporter.start).toBeCalled();
            expect(validationStatusReporter.failed).toBeCalledWith(Violation.RANGE_UNDERFLOW);
        });

        it('the maximum number of checks was not reached', async () => {
            const instance = mount(CheckboxGroup as any, {
                props: { name: 'check', maximum: 1 },
                slots: {
                    default: () => [
                        createElement(checkedChild, { id: '0' }),
                        createElement(checkedChild, { id: '1' })
                    ]
                }
            });
            expect(instance.exists()).toBe(true);

            const action = validationManager.addAction.mock.calls[0]?.[0];

            await expect(action?.checkValidity()).resolves.toBe(ValidationResult.ERRORED);
            expect(validationStatusReporter.start).toBeCalled();
            expect(validationStatusReporter.failed).toBeCalledWith(Violation.RANGE_OVERFLOW);
        });

        it('validation exception', async () => {
            const instance = mount(CheckboxGroup as any, {
                props: { name: 'check' },
                slots: { default: () => createElement(exceptionChild, { id: '0' }) }
            });
            expect(instance.exists()).toBe(true);

            const action = validationManager.addAction.mock.calls[0]?.[0];

            await expect(action?.checkValidity()).rejects.toThrow();
            expect(validationStatusReporter.start).toBeCalled();
        });
    });

    it('focus on oneself', async () => {
        const onFocus = vitest.fn();

        mount(CheckboxGroup as any, {
            attrs: { focus: onFocus },
            slots: { default: () => createElement(checkedChild) }
        });

        const action = validationManager.addAction.mock.calls[0]?.[0];
        await action?.focus();

        expect(onFocus).toBeCalled();
    });
});

import { describe, it, beforeAll, afterAll, afterEach, vitest, expect } from 'vitest';
import { enableAutoUnmount, shallowMount, mount, config } from '@vue/test-utils';
import { readonly, ref } from 'vue';
import {
    fetchShareIdKey,
    ShareIdProvider,
    validationManagerKey,
    ValidationResult,
    inheritedNovalidateKey,
    inheritedRequiredKey,
    validationStatusReporterKey
} from '../src/key';
import type { ValidationManager } from '../src/key';
import { Violation } from '../src/support';
import Password from '../src/component/literal/password';

enableAutoUnmount(afterEach);

vitest.mock('throttle-debounce', async () => {
    const actual = await vitest.importActual<typeof import('throttle-debounce')>('throttle-debounce');

    const debounce = vitest.fn((_, callback: Function) => {
        const fun = (...args: any[]) => callback.apply(this, args);
        fun.cancel = () => undefined;
        return fun;
    });

    return { __esModule: true, ...actual, debounce };
});

describe('Password component', () => {
    const defaultConfigProvide = config.global.provide
        , shareId = 'abc'
        , validationManager = {
        addAction: vitest.fn<Parameters<ValidationManager['addAction']>, ReturnType<ValidationManager['addAction']>>(),
        removeAction: vitest.fn<Parameters<ValidationManager['removeAction']>, ReturnType<ValidationManager['removeAction']>>()
    }
        , validationReporter = {
        start: vitest.fn(),
        passed: vitest.fn(),
        failed: vitest.fn()
    };

    beforeAll(() => {
        config.global.provide = {
            [fetchShareIdKey as symbol]: { fetch: () => shareId, provider: ShareIdProvider.FORM_GROUP },
            [validationManagerKey as symbol]: validationManager,
            [validationStatusReporterKey as symbol]: validationReporter
        };
    });

    afterAll(() => {
        config.global.provide = defaultConfigProvide;
    });

    it('create component', () => {
        const instance = mount(Password as any);
        expect(instance.exists()).toBe(true);
        expect(instance.classes('visible-password')).toBe(true);
        expect(instance.classes()).not.toEqual(
            expect.arrayContaining([ 'is-validating', 'is-valid', 'is-invalid' ])
        );
        expect(Object.keys(instance.attributes())).not.toEqual(
            expect.arrayContaining([ 'aria-invalid', 'aria-errormessage' ])
        );
        expect(validationManager.addAction).toBeCalled();

        const toggle = instance.get('.toggle');
        expect(toggle.element).toBeInstanceOf(HTMLButtonElement);
        expect(toggle.attributes('aria-label')).toBe('Show password');
        expect(toggle.attributes('aria-pressed')).toBe('false');
        expect(toggle.find('.toggle-icon').exists()).toBe(true);

        const input = instance.get('input');
        expect(input.classes('j-form-control')).toBe(true);
        expect(input.attributes('type')).toBe('password');
    });

    it('unmount component', () => {
        const instance = shallowMount(Password as any);
        expect(instance.exists()).toBe(true);

        instance.unmount();
        expect(validationManager.removeAction).toBeCalled();
    });

    describe('v-model directive', () => {
        describe('optional v-model', () => {
            it('use directive', async () => {
                const instance = shallowMount(Password as any, {
                    props: {
                        modelValue: 'init',
                        'onUpdate:modelValue': (value: string) => instance.setProps({ modelValue: value })
                    }
                });
                expect(instance.exists()).toBe(true);

                await instance.get('input').setValue('text');
                expect(instance.props('modelValue')).toBe('text');
            });

            it('unused directive', async () => {
                const instance = shallowMount(Password as any);
                expect(instance.exists()).toBe(true);

                await instance.get('input').setValue('text');
                expect(instance.props('modelValue')).toBeUndefined();
            });
        });

        it('v-model lazy modifier', async () => {
            const initText = 'init'
                , instance = shallowMount(Password as any, {
                props: {
                    modelValue: initText,
                    modelModifiers: { lazy: true },
                    'onUpdate:modelValue': (value: string) => instance.setProps({ modelValue: value })
                }
            });
            expect(instance.exists()).toBe(true);

            const input = instance.get('input');
            input.element.value = 'text';
            await input.trigger('input');
            expect(instance.props('modelValue')).toBe(initText);

            input.element.value = 'text';
            await input.trigger('change');
            expect(instance.props('modelValue')).toBe('text');
        });
    });

    describe('prop', () => {
        it('required', async () => {
            const instance = mount(Password as any, { props: { required: true } });
            expect(instance.exists()).toBe(true);
            expect(instance.get('input').attributes('required')).not.toBeUndefined();

            await instance.setProps({ required: false });
            expect(instance.get('input').attributes('required')).toBeUndefined();
        });

        it('size', async () => {
            const instance = mount(Password as any, { props: { size: 'small' } });
            expect(instance.exists()).toBe(true);

            const input = instance.get('input');
            expect(instance.classes('input-sm')).toBe(true);
            expect(instance.classes('input-lg')).toBe(false);
            expect(input.classes('input-sm')).toBe(true);
            expect(input.classes('input-lg')).toBe(false);

            await instance.setProps({ size: 'medium' });
            expect(instance.classes('input-sm')).toBe(false);
            expect(instance.classes('input-lg')).toBe(false);
            expect(input.classes('input-sm')).toBe(false);
            expect(input.classes('input-lg')).toBe(false);

            await instance.setProps({ size: 'large' });
            expect(instance.classes('input-sm')).toBe(false);
            expect(instance.classes('input-lg')).toBe(true);
            expect(input.classes('input-sm')).toBe(false);
            expect(input.classes('input-lg')).toBe(true);

            const validator = instance.vm.$options.props.size.validator;
            for (const size of [ 'small', 'medium', 'large', 'xl' ]) {
                if (size === 'xl') {
                    expect(validator(size)).toBe(false);
                    continue;
                }

                expect(validator(size)).toBe(true);
            }
        });
    });

    it('parent share id', () => {
        const instance = mount(Password as any);
        expect(instance.exists()).toBe(true);
        expect(instance.get('input').attributes('id')).toBe('abc');
    });

    it('parent novalidate', async () => {
        const instance = shallowMount(Password as any, {
            props: { novalidate: false },
            global: { provide: { [inheritedNovalidateKey as symbol]: readonly(ref(true)) } }
        });
        expect(instance.exists()).toBe(true);

        const action = validationManager.addAction.mock.calls[0]?.[0];
        await expect(action?.checkValidity()).resolves.toBe(ValidationResult.DISABLED);
    });

    it('parent required', () => {
        const instance = mount(Password as any, {
            props: { required: false },
            global: { provide: { [inheritedRequiredKey as symbol]: readonly(ref(true)) } }
        });
        expect(instance.exists()).toBe(true);
        expect(instance.get('input').attributes('required')).not.toBeUndefined();
    });

    it('password visibility', async () => {
        const instance = mount(Password as any);
        expect(instance.exists()).toBe(true);

        const input = instance.get('input')
            , button = instance.get<HTMLButtonElement>('.toggle');

        await button.trigger('click');
        expect(input.attributes('type')).toBe('text');
        expect(button.attributes('aria-label')).toBe('Hide password');
        expect(button.attributes('aria-pressed')).toBe('true');

        await button.trigger('click');
        expect(input.attributes('type')).toBe('password');
        expect(button.attributes('aria-label')).toBe('Show password');
        expect(button.attributes('aria-pressed')).toBe('false');
    });

    describe('validation', () => {
        it('parent novalidate', async () => {
            const instance = mount(Password as any, {
                global: { provide: { [inheritedNovalidateKey as symbol]: readonly(ref(true)) } }
            });
            expect(instance.exists()).toBe(true);

            const input = instance.get('input')
                , action = validationManager.addAction.mock.calls[0]?.[0];

            await expect(action?.checkValidity()).resolves.toBe(ValidationResult.DISABLED);
            expect(validationReporter.start).not.toBeCalled();
            expect(validationReporter.passed).not.toBeCalled();
            expect(validationReporter.failed).not.toBeCalled();
            expect(input.attributes()).not.toHaveProperty('aria-invalid');
            expect(input.attributes()).not.toHaveProperty('aria-errormessage');
        });

        it('validation passed', async () => {
            const instance = mount(Password as any, {
                props: { required: true, modelValue: 'text' }
            });
            expect(instance.exists()).toBe(true);

            const input = instance.get('input')
                , action = validationManager.addAction.mock.calls[0]?.[0];

            await expect(action?.checkValidity()).resolves.toBe(ValidationResult.SUCCEED);
            expect(validationReporter.start).toBeCalled();
            expect(validationReporter.passed).toBeCalled();
            expect(input.attributes('aria-invalid')).toBe('false');
            expect(input.attributes()).not.toHaveProperty('aria-errormessage');
        });

        it('validation failed', async () => {
            const instance = mount(Password as any, { props: { required: true } });
            expect(instance.exists()).toBe(true);

            const input = instance.get('input')
                , action = validationManager.addAction.mock.calls[0]?.[0];

            await expect(action?.checkValidity()).resolves.toBe(ValidationResult.ERRORED);
            expect(validationReporter.start).toBeCalled();
            expect(validationReporter.failed).toBeCalledWith(Violation.VALUE_MISSING);
            expect(input.attributes('aria-invalid')).toBe('true');
            expect(input.attributes('aria-errormessage')).toBe(`${shareId}_errormessage`);
        });

        it('revalidate passed', async () => {
            const revalidateFun = vitest.fn(() => Promise.resolve(true))
                , instance = mount(Password as any, {
                props: {
                    modelValue: 'text',
                    required: true,
                    revalidate: revalidateFun
                }
            });
            expect(instance.exists()).toBe(true);

            const input = instance.get('input')
                , action = validationManager.addAction.mock.calls[0]?.[0];

            await expect(action?.checkValidity()).resolves.toBe(ValidationResult.SUCCEED);
            expect(validationReporter.start).toBeCalled();
            expect(validationReporter.passed).toBeCalled();
            expect(input.attributes('aria-invalid')).toBe('false');
            expect(input.attributes()).not.toHaveProperty('aria-errormessage');
        });

        it('revalidate failed', async () => {
            const revalidateFun = vitest.fn(() => Promise.resolve(false))
                , instance = mount(Password as any, {
                props: {
                    modelValue: 'text',
                    required: true,
                    revalidate: revalidateFun
                }
            });
            expect(instance.exists()).toBe(true);

            const input = instance.get('input')
                , action = validationManager.addAction.mock.calls[0]?.[0];

            await expect(action?.checkValidity()).resolves.toBe(ValidationResult.ERRORED);
            expect(validationReporter.start).toBeCalled();
            expect(validationReporter.failed).toBeCalledWith(Violation.REVALIDATE_INVALID);
            expect(input.attributes('aria-invalid')).toBe('true');
            expect(input.attributes('aria-errormessage')).toBe(`${shareId}_errormessage`);
        });

        it('revalidate exception', async () => {
            const revalidateFun = vitest.fn(() => Promise.reject())
                , instance = mount(Password as any, {
                props: {
                    modelValue: 'text',
                    required: true,
                    revalidate: revalidateFun
                }
            });
            expect(instance.exists()).toBe(true);

            const input = instance.get('input')
                , action = validationManager.addAction.mock.calls[0]?.[0];
            await expect(action?.checkValidity()).resolves.toBe(ValidationResult.ERRORED);
            expect(validationReporter.start).toBeCalled();
            expect(validationReporter.failed).toBeCalledWith(Violation.REVALIDATE_INVALID);
            expect(input.attributes('aria-invalid')).toBe('true');
            expect(input.attributes('aria-errormessage')).toBe(`${shareId}_errormessage`);
        });
    });

    it('focus on the input element', async () => {
        const onFocus = vitest.fn()
            , instance = mount(Password as any, { attrs: { focus: onFocus } });
        expect(instance.exists()).toBe(true);

        const action = validationManager.addAction.mock.calls[0]?.[0];

        await action?.focus();
        expect(onFocus).toBeCalled();
    });
});

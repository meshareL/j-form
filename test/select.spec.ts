import { describe, it, beforeAll, afterAll, afterEach, expect, vitest } from 'vitest';
import { enableAutoUnmount, shallowMount, mount, config } from '@vue/test-utils';
import { readonly, ref } from 'vue';
import {
    fetchShareIdKey,
    ShareIdProvider,
    inheritedRequiredKey,
    inheritedNovalidateKey,
    validationManagerKey,
    ValidationResult,
    validationStatusReporterKey
} from '../src/key';
import type { ValidationManager } from '../src/key';
import { Violation } from '../src/support';
import Select from '../src/component/select/select';
import type { SelectChildren } from '../src/component/select/select';

enableAutoUnmount(afterEach);

describe('Select component', () => {
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
    };

    beforeAll(() => {
        config.global.provide = {
            [fetchShareIdKey as symbol]: { fetch: () => shareId, provider: ShareIdProvider.FORM_GROUP },
            [validationManagerKey as symbol]: validationManager,
            [validationStatusReporterKey as symbol]: validationStatusReporter
        };
    });

    afterAll(() => {
        config.global.provide = defaultConfigProvide
    });

    it('create component', () => {
        const instance = shallowMount(Select as any);
        expect(instance.exists()).toBe(true);
        expect(instance.classes('j-form-select')).toBe(true);
        expect(instance.attributes('id')).toBe(shareId);
        expect(validationManager.addAction).toBeCalled();
    });

    it('unmount component', () => {
        const instance = shallowMount(Select as any);
        expect(instance.exists()).toBe(true);

        instance.unmount();
        expect(validationManager.removeAction).toBeCalled();
    });

    it('children and the default slot exist at the same time, children are used', () => {
        const instance = mount(Select as any, {
            props: { children: [ { value: '0', text: '0' } ] },
            slots: { default: () => 'slot' }
        });
        expect(instance.exists()).toBe(true);
        expect(instance.findAll('option').length).toBe(1);
    });

    it('when no children parameter is passed in, the default slot is rendered', () => {
        const instance = shallowMount(Select as any, { slots: { default: () => 'text' } });
        expect(instance.exists()).toBe(true);
        expect(instance.text()).toBe('text');
    });

    describe('optional v-model directive', () => {
        it('use directive, string', async () => {
            const instance = mount(Select as any, {
                props: {
                    modelValue: '',
                    'onUpdate:modelValue': (value: string) => instance.setProps({ modelValue: value }),
                    children: [ { value: '0', text: '0' } ]
                }
            });
            expect(instance.exists()).toBe(true);

            await instance.get('select').setValue('0');
            expect(instance.props('modelValue')).toBe('0');
        });

        it('use directive, array', async () => {
            const instance = mount(Select as any, {
                props: {
                    modelValue: [],
                    'onUpdate:modelValue': (value: string[]) => instance.setProps({ modelValue: value }),
                    multiple: { minimum: 1, maximum: 10 },
                    children: [ { value: '0' }, { value: '1' } ]
                }
            });
            expect(instance.exists()).toBe(true);

            await instance.get('select').setValue([ '0', '1' ]);
            expect(instance.props('modelValue')).toEqual(expect.arrayContaining([ '0', '1' ]));
        });

        it('unused directive', async () => {
            const instance = mount(Select as any, {
                props: { children: [ { value: '0' }, { value: '1' } ] }
            });
            expect(instance.exists()).toBe(true);

            const select = instance.get('select');
            await select.setValue('0');

            const selectedList = Array.from(select.element.selectedOptions).map(option => option.value);
            expect(selectedList).toEqual(expect.arrayContaining([ '0' ]));
        });
    });

    describe('prop', () => {
        it('size', async () => {
            const instance = shallowMount(Select as any, { props: { size: 'small' } });
            expect(instance.exists()).toBe(true);

            expect(instance.classes('select-sm')).toBe(true);
            expect(instance.classes('select-lg')).toBe(false);

            await instance.setProps({ size: 'medium' });
            expect(instance.classes('select-sm')).toBe(false);
            expect(instance.classes('select-lg')).toBe(false);

            await instance.setProps({ size: 'large' });
            expect(instance.classes('select-sm')).toBe(false);
            expect(instance.classes('select-lg')).toBe(true);
        });

        it('required', async () => {
            const instance = shallowMount(Select as any, { props: { required: true } });
            expect(instance.exists()).toBe(true);
            expect(instance.attributes('required')).not.toBeUndefined();

            await instance.setProps({ required: false });
            expect(instance.attributes('required')).toBeUndefined();
        });

        it('multiple', async () => {
            const instance = shallowMount(Select as any);
            expect(instance.exists()).toBe(true);
            expect(instance.attributes('multiple')).toBeUndefined();

            await instance.setProps({ multiple: { minimum: 1, maximum: 2 } });
            expect(instance.attributes('multiple')).not.toBeUndefined();
        });

        it('placeholder', async () => {
            const instance = mount(Select as any);
            expect(instance.exists()).toBe(true);
            expect(instance.find('option[disabled]').exists()).toBe(false);

            await instance.setProps({ placeholder: 'text' });

            const element = instance.find('option[disabled]');
            expect(element.exists()).toBe(true);
            expect(element.text()).toBe('text');
        });

        it('children', async () => {
            const children: SelectChildren = [
                { value: '0', text: '0' },
                { value: '1', text: '1' }
            ]
                , instance = mount(Select as any, { props: { children } });
            expect(instance.exists()).toBe(true);

            expect(instance.findAll('optgroup').length).toBe(0);
            expect(instance.findAll('option').length).toBe(2);

            const children1: SelectChildren = [
                {
                    label: 'A',
                    children: [
                        { value: 'a-0', text: 'a-0' },
                        { value: 'a-1', text: 'a-1' }
                    ]
                },
                {
                    label: 'B',
                    children: [
                        { value: 'b-0', text: 'b-0' },
                        { value: 'b-1', text: 'b-1' }
                    ]
                }
            ];

            await instance.setProps({ children: children1 });
            expect(instance.findAll('optgroup').length).toBe(2);
            expect(instance.findAll('option').length).toBe(4);

            const children2: SelectChildren =  [
                { value: '0', text: '0' },
                {
                    label: 'A',
                    children: [
                        { value: 'a-0', text: 'a-0' },
                        { value: 'a-1', text: 'a-1' }
                    ]
                }
            ];
            await instance.setProps({ children: children2 });
            expect(instance.findAll('optgroup').length).toBe(1);
            expect(instance.findAll('option').length).toBe(3);
        });
    });

    describe('validation', () => {
        it('single select validation passed', async () => {
            const instance = mount(Select as any, {
                props: {
                    required: true,
                    children: [ { value: '0', selected: true }, { value: '1' } ]
                }
            });
            expect(instance.exists()).toBe(true);

            const action = validationManager.addAction.mock.calls[0]?.[0];
            expect(await action?.checkValidity()).toBe(ValidationResult.SUCCEED);
            expect(validationStatusReporter.start).toBeCalled();
            expect(validationStatusReporter.passed).toBeCalled();
        });

        it.skip('single select validation failed', async () => {
            const instance = mount(Select as any, {
                props: {
                    required: true,
                    children: [ { value: '0' }, { value: '1' } ]
                }
            });
            expect(instance.exists()).toBe(true);

            const action = validationManager.addAction.mock.calls[0]?.[0];
            await expect(action?.checkValidity()).resolves.toBe(ValidationResult.ERRORED);
            expect(validationStatusReporter.start).toBeCalled();
            expect(validationStatusReporter.failed).toBeCalledWith(Violation.VALUE_MISSING);
        });

        it('multiple select, validation passed', async () => {
            const instance = mount(Select as any, {
                props: {
                    required: true,
                    multiple: { minimum: 1, maximum: 10 },
                    children: [ { value: '0', selected: true }, { value: '1' } ]
                }
            });
            expect(instance.exists()).toBe(true);

            const action = validationManager.addAction.mock.calls[0]?.[0];
            await expect(action?.checkValidity()).resolves.toBe(ValidationResult.SUCCEED);
            expect(validationStatusReporter.start).toBeCalled();
            expect(validationStatusReporter.passed).toBeCalled();
        });

        it('multiple select, validation failed, minimum', async () => {
            const instance = mount(Select as any, {
                props: {
                    required: true,
                    multiple: { minimum: 1, maximum: 10 },
                    children: [ { value: '0' } ]
                }
            });
            expect(instance.exists()).toBe(true);

            const action = validationManager.addAction.mock.calls[0]?.[0];
            await expect(action?.checkValidity()).resolves.toBe(ValidationResult.ERRORED);
            expect(validationStatusReporter.start).toBeCalled();
            expect(validationStatusReporter.failed).toBeCalledWith(Violation.RANGE_UNDERFLOW);
        });

        it('multiple select, validation failed, maximum', async () => {
            const instance = mount(Select as any, {
                props: {
                    required: true,
                    multiple: { minimum: 1, maximum: 2 },
                    children: [
                        { value: '0', selected: true },
                        { value: '1', selected: true },
                        { value: '2', selected: true }
                    ]
                }
            });
            expect(instance.exists()).toBe(true);

            const action = validationManager.addAction.mock.calls[0]?.[0];
            await expect(action?.checkValidity()).resolves.toBe(ValidationResult.ERRORED);
            expect(validationStatusReporter.start).toBeCalled();
            expect(validationStatusReporter.failed).toBeCalledWith(Violation.RANGE_OVERFLOW);
        });
    });

    it('parent novalidate', async () => {
        const instance = shallowMount(Select as any, {
            props: { novalidate: false },
            global: { provide: { [inheritedNovalidateKey as symbol]: readonly(ref(true)) } }
        });
        expect(instance.exists()).toBe(true);

        const action = validationManager.addAction.mock.calls[0]?.[0];
        await expect(action?.checkValidity()).resolves.toBe(ValidationResult.DISABLED);
    });

    it('parent required', async () => {
        const required = ref(true)
            , instance = shallowMount(Select as any, {
            props: { required: false },
            global: { provide: { [inheritedRequiredKey as symbol]: readonly(required) } }
        });
        expect(instance.exists()).toBe(true);
        expect(instance.attributes('required')).not.toBeUndefined();

        required.value = false;
        await instance.setProps({ required: true });
        expect(instance.attributes('required')).toBeUndefined();
    });

    it('focus the oneself', async () => {
        const onFocus = vitest.fn()
            , instance = shallowMount(Select as any, { attrs: { focus: onFocus } });
        expect(instance.exists()).toBe(true);

        const action = validationManager.addAction.mock.calls[0]?.[0];
        await action?.focus();

        expect(onFocus).toBeCalled();
    });
});

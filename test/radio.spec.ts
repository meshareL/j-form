import { describe, it, afterEach, expect, vitest, beforeAll, afterAll } from 'vitest';
import { readonly, ref } from 'vue';
import { shallowMount, enableAutoUnmount, config } from '@vue/test-utils';
import {
    fetchShareIdKey,
    validationManagerKey,
    delegateValidationKey,
    inheritedNameKey,
    ShareIdProvider,
    ValidationResult
} from '../src/key';
import type { ElementAction } from '../src/key';
import Radio from '../src/component/radio/radio';

enableAutoUnmount(afterEach);

describe('Radio component', () => {
    const defaultConfigProvide = config.global.provide
        , shareId = 'abcdef'
        , addAction = vitest.fn()
        , removeAction = vitest.fn();

    beforeAll(() => {
        config.global.provide = {
            [fetchShareIdKey as symbol]: { fetch: () => shareId, provider: ShareIdProvider.RADIO_GROUP },
            [validationManagerKey as symbol]: { addAction: addAction, removeAction: removeAction }
        };
    });

    afterAll(() => {
        config.global.provide = defaultConfigProvide
    });

    it('create component', () => {
        const instance = shallowMount(Radio as any, { props: { value: 'one' } });
        expect(addAction).toBeCalled();
        expect(instance.exists()).toBe(true);
        expect(instance.attributes('type')).toBe('radio');
        expect(instance.attributes('value')).toBe('one');
        expect(instance.attributes('id')).toBe(shareId);
    });

    it('unmount component', () => {
        const instance = shallowMount(Radio as any, { props: { value: 'one' } });
        expect(instance.exists()).toBe(true);

        instance.unmount();
        expect(removeAction).toBeCalled();
    });

    describe('optional v-model directive', () => {
        it('use directive', async () => {
            const instance = shallowMount(Radio as any, {
                props: {
                    value: 'one',
                    modelValue: undefined,
                    'onUpdate:modelValue': (value: string) => instance.setProps({ modelValue: value })
                }
            });

            expect(instance.exists()).toBe(true);

            await instance.get('input').setValue(true);
            expect(instance.props('modelValue')).toBe('one');
        });

        it('unused directive', async () => {
            const instance = shallowMount(Radio as any, { props: { value: 'one' } });
            expect(instance.exists()).toBe(true);

            const input = instance.get('input');
            await input.setValue(true);

            expect(input.element.checked).toBe(true);
        });
    });

    describe('component prop', () => {
        it('required prop', async () => {
            const instance = shallowMount(Radio as any, {
                props: { value: 'one', required: true }
            });

            expect(instance.exists()).toBe(true);
            expect(instance.attributes('required')).not.toBeUndefined();

            await instance.setProps({ required: false });
            expect(instance.attributes('required')).toBeUndefined();
        });

        it('disabled prop', async () => {
            const instance = shallowMount(Radio as any, {
                props: { value: 'one', disabled: true }
            });

            expect(instance.exists()).toBe(true);
            expect(instance.attributes('disabled')).not.toBeUndefined();

            await instance.setProps({ disabled: false });
            expect(instance.attributes('disabled')).toBeUndefined();
        });

        it('name prop', async () => {
            const instance = shallowMount(Radio as any, {
                props: { value: 'one', name: 'ball' }
            });

            expect(instance.exists()).toBe(true);
            expect(instance.attributes('name')).toBe('ball');

            await instance.setProps({ name: 'ball1' });
            expect(instance.attributes('name')).toBe('ball1');
        });

        it('value prop', async () => {
            const instance = shallowMount(Radio as any, { props: { value: 'one' } });

            expect(instance.exists()).toBe(true);
            expect(instance.attributes('value')).toBe('one');

            await instance.setProps({ value: 'two' });
            expect(instance.attributes('value')).toBe('two');
        });

        it('default checked', async () => {
            const instance = shallowMount(Radio as any, {
                props: { value: 'one', defaultChecked: true }
            });
            expect(instance.exists()).toBe(true);

            const input = instance.get('input');
            expect(input.element.checked).toBe(true);

            await instance.setProps({ defaultChecked: false });
            expect(input.element.checked).toBe(true);
        });
    });

    it("the 'name' provided by the parent component is preferred", () => {
        const instance = shallowMount(Radio as any, {
            props: { value: 'one', name: '1' },
            global: { provide: { [inheritedNameKey as symbol]: readonly(ref('10')) } }
        });
        expect(instance.exists()).toBe(true);
        expect(instance.attributes('name')).toBe('10');
    });

    it('validation', async () => {
        const instance = shallowMount(Radio as any, { props: { value: 'one' } });
        expect(instance.exists()).toBe(true);

        const action = addAction.mock.calls[0][0] as ElementAction;
        expect(await action.checkValidity()).toBe(ValidationResult.ERRORED);

        (instance.element as HTMLInputElement).checked = true;
        expect(await action.checkValidity()).toBe(ValidationResult.SUCCEED);
    });

    it('notify the parent component for validation', async () => {
        const notify = vitest.fn()
            , instance = shallowMount(Radio as any, {
            props: { value: 'one' },
            global: { provide: { [delegateValidationKey as symbol]: notify } }
        });
        expect(instance.exists()).toBe(true);

        const input = instance.get('input');
        await input.setValue(true);

        expect(notify).toBeCalled();
    });
});

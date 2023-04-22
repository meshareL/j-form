import { describe, it, expect, vitest, afterEach } from 'vitest';
import { inject, h as createElement, ref } from 'vue';
import type { FunctionalComponent } from 'vue';
import { mount, enableAutoUnmount, flushPromises } from '@vue/test-utils';
import Form from '../src/component/form';
import { inheritedNovalidateKey, validationManagerKey, ValidationResult } from '../src/key';

const validationPassedChild: FunctionalComponent<{ id?: number }> = (props) => {
    const id = String(props.id ?? 1)
        , manager = inject(validationManagerKey);

    manager?.addAction({
        checkValidity: () => Promise.resolve(ValidationResult.SUCCEED),
        focus: () => Promise.resolve(),
        isSuitableFocus: () => true
    }, id);
    return createElement('input', { id });
}
    , validationFailedChild: FunctionalComponent<{ id?: number }> = (props, context) => {
    const inputRef = ref<HTMLInputElement | null>(null)
        , id = String(props.id ?? 2)
        , manager = inject(validationManagerKey);

    manager?.addAction({
        checkValidity: () => Promise.resolve(ValidationResult.ERRORED),
        focus: () => {
            if (!(inputRef.value instanceof HTMLInputElement)) return Promise.reject();
            inputRef.value.focus();
            return Promise.resolve();
        },
        isSuitableFocus: () => true
    }, id);
    return createElement('input', { ref: inputRef, id, 'aria-invalid': 'true', ...context.attrs });
};
validationFailedChild.inheritAttrs = false;

enableAutoUnmount(afterEach);

describe('Form Component', () => {
    it('create', () => {
        const child: FunctionalComponent = () => {
            expect(inject(inheritedNovalidateKey)?.value).toBe(true);

            const manager = inject(validationManagerKey);
            expect(manager?.addAction).toBeInstanceOf(Function);
            expect(manager?.removeAction).toBeInstanceOf(Function);

            return 'Child';
        };

        const instance = mount(Form as any, {
            props: { novalidate: true, size: 'small' },
            slots: { default: () => createElement(child) }
        });
        expect(instance.exists()).toBe(true);
        expect(instance.classes('j-form')).toBe(true);
    });

    it('default slot', () => {
        const instance = mount(Form as any, {
            slots: { default: () => 'text' }
        });

        expect(instance.exists()).toBe(true);
        expect(instance.text()).toBe('text');
    });

    it('when validation passes, the submit event is triggered', async () => {
        const instance = mount(Form as any, {
            slots: { default: () => createElement(validationPassedChild) }
        });
        expect(instance.exists()).toBe(true);

        await instance.trigger('submit');
        expect(instance.emitted('submit')).toHaveLength(1);
        expect(instance.emitted('submit')?.[0]?.[0]).toBeInstanceOf(Event);
    });

    it('when validation fails, the submit event it not triggered', async () => {
        const instance = mount(Form as any, {
            slots: { default: () => createElement(validationFailedChild) }
        });
        expect(instance.exists()).toBe(true);

        await instance.trigger('submit');
        expect(instance.emitted('submit')).toBeUndefined();
    });

    it('when validation exception occurs, the submit event it not triggered', async () => {
        const child = () => {
            const manager = inject(validationManagerKey);
            manager?.addAction({
                checkValidity: () => Promise.reject(),
                focus: () => Promise.reject(),
                isSuitableFocus: () => false
            }, '0');
            return 'Child';
        }
            , instance = mount(Form as any, {
            slots: { default: () => createElement(child) }
        });
        expect(instance.exists()).toBe(true);

        await instance.trigger('submit');
        expect(instance.emitted('submit')).toBeUndefined();
    });

    it('focus on the first error field when validation fails', async () => {
        const onFocus = vitest.fn()
            , instance = mount(Form as any, {
            slots: { default: () => [
                    createElement(validationPassedChild, { id: 1 }),
                    createElement(validationFailedChild, { id: 2, focus: onFocus }),
                    createElement(validationFailedChild, { id: 3 })
                ] }
        });
        expect(instance.exists()).toBe(true);

        await instance.trigger('submit');
        await flushPromises();
        expect(onFocus).toBeCalled();
    });

    it('if novalidate is true, the submit event is triggered directly', async () => {
        const checkValidity = vitest.fn<[], Promise<ValidationResult>>()
            , child = () => {
            const reporter = inject(validationManagerKey);
            reporter?.addAction({
                checkValidity,
                focus: () => Promise.reject(),
                isSuitableFocus: () => false
            }, '0');
            return 'Child';
        }
            , instance = mount(Form as any, {
            props: { novalidate: true },
            slots: { default: () => createElement(child) }
        });
        expect(instance.exists()).toBe(true);

        await instance.trigger('submit');
        expect(instance.emitted('submit')).toHaveLength(1);
        expect(instance.emitted('submit')?.[0]?.[0]).toBeInstanceOf(Event);
    });
});

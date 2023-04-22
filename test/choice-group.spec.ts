import { describe, it, afterEach, expect } from 'vitest';
import { enableAutoUnmount, shallowMount, mount } from '@vue/test-utils';
import { h as createElement, inject } from 'vue';
import type { FunctionalComponent } from 'vue';
import { fetchShareIdKey, ShareIdProvider } from '../src/key';
import ChoiceGroup from '../src/component/choice-group';

enableAutoUnmount(afterEach);

describe('ChoiceGroup component', () => {
    it('create component', () => {
        const instance = shallowMount(ChoiceGroup as any);
        expect(instance.exists()).toBe(true);
        expect(instance.classes('choice-group')).toBe(true);
    });

    it('default slot', () => {
        const instance = shallowMount(ChoiceGroup as any, {
            slots: { default: () => 'text' }
        });

        expect(instance.exists()).toBe(true);
        expect(instance.text()).toBe('text');
    });

    it('ChoiceGroup components should provide dependencies for subcomponents', () => {
        const child: FunctionalComponent = () => {
            const fetchShareId = inject(fetchShareIdKey, null);
            expect(fetchShareId?.fetch()).toBe('0');
            expect(fetchShareId?.provider).toBe(ShareIdProvider.CHOICE_GROUP);
            return 'Child';
        }
            , instance = mount(ChoiceGroup as any, {
            slots: { default: () => createElement(child) },
            global: { provide: { [fetchShareIdKey as symbol]: { fetch: () => '0', provider: ShareIdProvider.FORM_GROUP } } }
        });

        expect(instance.exists()).toBe(true);
    });
});

import { describe, it, afterEach, expect } from 'vitest';
import { enableAutoUnmount, shallowMount } from '@vue/test-utils';
import Summary from '../src/component/summary';

enableAutoUnmount(afterEach);

describe('Summary component', () => {
    it('create component', () => {
        const instance = shallowMount(Summary);
        expect(instance.exists()).toBe(true);
        expect(instance.classes('summary')).toBe(true);
    });

    it('default slot', () => {
        const instance = shallowMount(Summary, {
            slots: { default: () => 'text' }
        });

        expect(instance.exists()).toBe(true);
        expect(instance.text()).toBe('text');
    });
});

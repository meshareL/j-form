import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: [ '**/test/**/*.spec.[jt]s' ],
        environment: 'jsdom',
        clearMocks: true,
        mockReset: true,
        restoreMocks: true,
        reporters: 'basic',
        cache: { dir: 'node_modules/.cache/.vitest' },
        coverage: {
            enabled: true,
            include: [
                'src/component/form.ts',
                'src/component/form-group.ts',
                'src/component/label.ts',
                'src/component/caption.ts',
                'src/component/summary.ts',
                'src/component/masthead.ts',
                'src/component/choice-group.ts',
                'src/component/literal/text-input.ts',
                'src/component/literal/password.ts',
                'src/component/literal/textarea.ts',
                'src/component/radio/radio.ts',
                'src/component/radio/radio-group.ts',
                'src/component/checkbox/checkbox.ts',
                'src/component/checkbox/checkbox-group.ts',
                'src/component/select/select.ts'
            ]
        }
    }
});

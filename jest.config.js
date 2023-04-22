/** @type {import('jest').Config} */
module.exports = {
    clearMocks: true,
    resetMocks: true,
    resetModules: true,
    restoreMocks: true,
    cacheDirectory: 'node_modules/.cache/jest',
    collectCoverage: true,
    collectCoverageFrom: [
        'src/component/form.ts',
        'src/component/form-group.ts',
        'src/component/label.ts',
        'src/component/caption.ts',
        'src/component/summary.ts',
        'src/component/masthead.ts',
        'src/component/choice-group.ts',
        'src/component/literal/text-input.ts',
        'src/component/literal/password.ts',
        'src/component/radio/radio.ts',
        'src/component/radio/radio-group.ts',
        'src/component/checkbox/checkbox.ts',
        'src/component/checkbox/checkbox-group.ts',
        'src/component/select/select.ts'
    ],
    testEnvironment: 'jsdom',
    testEnvironmentOptions: {
        customExportConditions: [ 'node', 'node-addons' ]
    },
    testMatch: [ '**/test/**/*.spec.[jt]s' ]
};

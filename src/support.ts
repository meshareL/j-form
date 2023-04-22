type ValidSize = 'small' | 'medium' | 'large';

const validSizes = [ 'small', 'medium', 'large' ];

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Constraint_validation#validation-related_attributes
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ValidityState
 */
const enum Violation {
    BAD_INPUT,
    PATTERN_MISMATCH,
    RANGE_OVERFLOW,
    RANGE_UNDERFLOW,
    STEP_MISMATCH,
    TOO_LONG,
    TOO_SHORT,
    TYPE_MISMATCH,
    VALUE_MISSING,
    /**
     * 这是一个自定义的错误
     *
     * 当用户自定义二次验证 (例如检查用户名是否已注册) 未通过时, 抛出此错误
     */
    REVALIDATE_INVALID
}

const enum ComponentStatus {
    INITIALIZED,
    SILENCED,
    VALIDATION_STARTED,
    VALIDATION_EXCEPTION,
    VALIDATION_SUCCEED,
    VALIDATION_ERRORED
}

export { validSizes, Violation, ComponentStatus };
export type { ValidSize };

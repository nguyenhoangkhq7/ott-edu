package scoring_feedback.validators;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * Validator Implementation cho @ValidScoreRange
 * Kiểm tra score >= 0 (kiểm tra maxScore được làm ở service layer)
 */
public class ScoreRangeValidator implements ConstraintValidator<ValidScoreRange, Double> {

    @Override
    public void initialize(ValidScoreRange annotation) {
    }

    @Override
    public boolean isValid(Double score, ConstraintValidatorContext context) {
        if (score == null) {
            return false; // Score không được null (đã có @NotNull)
        }

        // Kiểm tra score >= 0
        if (score < 0) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate("Score không được âm")
                    .addConstraintViolation();
            return false;
        }

        return true;
    }
}

package scoring_feedback.validators;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

/**
 * Custom annotation để validate score nằm trong khoảng [0, maxScore]
 */
@Target({ ElementType.FIELD, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = ScoreRangeValidator.class)
@Documented
public @interface ValidScoreRange {

    String message() default "Score phải nằm trong khoảng từ 0 đến điểm tối đa của bài tập";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}

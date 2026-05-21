'use client';

import React from 'react';
import { useFieldArray, UseFormRegister, Control, FieldErrors, useWatch, UseFormSetValue } from 'react-hook-form';
import { CreateAssignmentFormData } from '@/shared/types/assignment';

interface QuizQuestionBuilderProps {
  control: Control<CreateAssignmentFormData>;
  register: UseFormRegister<CreateAssignmentFormData>;
  errors: FieldErrors<CreateAssignmentFormData>;
  setValue?: UseFormSetValue<CreateAssignmentFormData>;
  onValidationChange?: (isValid: boolean) => void;
}

export default function QuizQuestionBuilder({
  control,
  register,
  errors,
  setValue,
  onValidationChange,
}: QuizQuestionBuilderProps) {
  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control,
    name: 'questions',
  });

  // Watch all questions to validate them
  const questions = useWatch({ control, name: 'questions' });

  // Validate that each question has at least one correct answer
  React.useEffect(() => {
    if (!questions || questions.length === 0) {
      onValidationChange?.(true);
      return;
    }

    const allQuestionsValid = questions.every((question) => {
      if (!question.options || question.options.length === 0) return false;
      return question.options.some((opt) => opt.isCorrect === true);
    });

    onValidationChange?.(allQuestionsValid);
  }, [questions, onValidationChange]);

  const addQuestion = () => {
    appendQuestion({
      content: '',
      type: 'SINGLE_CHOICE',
      points: 1,
      displayOrder: questionFields.length + 1,
      options: [
        { content: '', isCorrect: false, displayOrder: 1 },
        { content: '', isCorrect: false, displayOrder: 2 },
      ],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Câu hỏi cho bài kiểm tra</h3>
          <p className="mt-1 text-xs text-slate-500">Mỗi câu hỏi phải có ít nhất một đáp án đúng</p>
        </div>
      </div>

      {questionFields.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-slate-300 rounded-lg">
          <svg className="w-12 h-12 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-slate-500 text-sm">Chưa có câu hỏi. Nhấp &quot;Thêm câu hỏi&quot; để bắt đầu.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questionFields.map((question, qIndex) => (
            <QuestionCard
              key={question.id}
              questionIndex={qIndex}
              register={register}
              errors={errors}
              control={control}
              setValue={setValue}
              onRemove={() => removeQuestion(qIndex)}
            />
          ))}
        </div>
      )}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={addQuestion}
          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm câu hỏi
        </button>
      </div>
    </div>
  );
}

interface QuestionCardProps {
  questionIndex: number;
  register: UseFormRegister<CreateAssignmentFormData>;
  errors: FieldErrors<CreateAssignmentFormData>;
  control: Control<CreateAssignmentFormData>;
  setValue?: UseFormSetValue<CreateAssignmentFormData>;
  onRemove: () => void;
}

function QuestionCard({
  questionIndex,
  register,
  errors,
  control,
  setValue,
  onRemove,
}: QuestionCardProps) {
  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
    control,
    name: `questions.${questionIndex}.options` as const,
  });

  // Watch the question type to determine if radio or checkbox
  const questionType = useWatch({
    control,
    name: `questions.${questionIndex}.type` as const,
  });

  // Watch all options to validate
  const options = useWatch({
    control,
    name: `questions.${questionIndex}.options` as const,
  });

  const isSingleChoice = questionType === 'SINGLE_CHOICE';
  const hasCorrectAnswer = options?.some((opt) => opt?.isCorrect === true);

  const addOption = () => {
    appendOption({
      content: '',
      isCorrect: false,
      displayOrder: optionFields.length + 1,
    });
  };

  const handleOptionCorrectChange = (optionIndex: number, newValue: boolean) => {
    if (!setValue) return;

    if (isSingleChoice) {
      // For single choice: unmark all others
      optionFields.forEach((_, idx) => {
        setValue(
          `questions.${questionIndex}.options.${idx}.isCorrect` as const,
          idx === optionIndex
        );
      });
    } else {
      // For multiple choice: toggle this option
      setValue(
        `questions.${questionIndex}.options.${optionIndex}.isCorrect` as const,
        newValue
      );
    }
  };

  return (
    <div className="border border-slate-200 rounded-lg p-5 bg-white space-y-4">
      {/* Question Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-3">
          {/* Question Content */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">
              Nội dung câu hỏi
            </label>
            <textarea
              {...register(`questions.${questionIndex}.content` as const, {
                required: 'Nhập nội dung câu hỏi',
              })}
              placeholder="Nhập câu hỏi của bạn..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.questions?.[questionIndex]?.content && (
              <p className="mt-1 text-xs text-red-600">{errors.questions[questionIndex]?.content?.message}</p>
            )}
          </div>

          {/* Type & Points */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">Loại câu hỏi</label>
              <select
                {...register(`questions.${questionIndex}.type` as const)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="SINGLE_CHOICE">Trắc nghiệm đơn (1 đáp án)</option>
                <option value="MULTI_CHOICE">Trắc nghiệm đa (nhiều đáp án)</option>
                <option value="TRUE_FALSE">Đúng/Sai</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">Điểm</label>
              <input
                type="number"
                {...register(`questions.${questionIndex}.points` as const, {
                  required: 'Nhập số điểm',
                  min: { value: 1, message: 'Phải >= 1' },
                })}
                min={1}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-500 focus:outline-none"
              />
              {errors.questions?.[questionIndex]?.points && (
                <p className="mt-1 text-xs text-red-600">{errors.questions[questionIndex]?.points?.message}</p>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-slate-900">
                  Chọn đáp án {isSingleChoice ? '(Chọn 1)' : '(Chọn ≥1)'}
                </label>
                {!hasCorrectAnswer && (
                  <p className="mt-1 text-xs text-red-600 font-medium">⚠️ Phải chọn ít nhất 1 đáp án đúng</p>
                )}
              </div>
              <button
                type="button"
                onClick={addOption}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Thêm lựa chọn
              </button>
            </div>

            <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
              {optionFields.map((option, oIndex) => {
                // Use watched value for isCorrect so it updates immediately after setValue()
                const isCorrect = options?.[oIndex]?.isCorrect === true;

                return (
                  <div
                    key={option.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isCorrect
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-white border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Correct Answer Toggle - Radio for single, Checkbox for multi */}
                    {isSingleChoice ? (
                      <input
                        type="radio"
                        name={`correct_${questionIndex}`}
                        checked={isCorrect}
                        onChange={() => handleOptionCorrectChange(oIndex, true)}
                        className="w-5 h-5 text-green-600 focus:ring-green-500 cursor-pointer"
                      />
                    ) : (
                      <input
                        type="checkbox"
                        checked={isCorrect}
                        onChange={(e) => handleOptionCorrectChange(oIndex, e.target.checked)}
                        className="w-5 h-5 text-green-600 focus:ring-green-500 cursor-pointer rounded"
                      />
                    )}

                    {/* Hidden input registered with react-hook-form - kept for form submission */}
                    <input
                      type="hidden"
                      tabIndex={-1}
                      {...register(`questions.${questionIndex}.options.${oIndex}.isCorrect` as const)}
                    />

                    {/* Option Content */}
                    <input
                      type="text"
                      {...register(`questions.${questionIndex}.options.${oIndex}.content` as const, {
                        required: 'Nhập lựa chọn',
                      })}
                      placeholder={`Lựa chọn ${oIndex + 1}`}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:border-blue-500 focus:outline-none"
                    />

                    {/* Correct Badge */}
                    {isCorrect && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Đúng
                      </div>
                    )}

                    {/* Remove Button */}
                    {optionFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeOption(oIndex)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Remove Question Button */}
        <button
          type="button"
          onClick={onRemove}
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

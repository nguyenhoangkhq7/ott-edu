'use client';

import React, { useState, useRef, useCallback } from 'react';
import { getAccessToken } from '@/services/api/token-store';
import { QuestionFormData, OptionFormData } from '@/shared/types/assignment';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Shape emitted by the backend partial_result event.
 * options: ["A. Virtual teams", "B. Outsourcing", ...]
 */
interface AiGeneratedQuestion {
  question: string;
  options: string[]; // "A. text", "B. text", ...
  correctAnswer: string; // "A" | "B" | "C" | "D"
  explanation?: string;
}

type GenerationPhase =
  | 'idle'
  | 'uploading'
  | 'ready'
  | 'generating'
  | 'completed'
  | 'error';

interface TerminalLine {
  id: number;
  text: string;
  type: 'info' | 'success' | 'progress' | 'warn' | 'error';
}

interface AiQuizGeneratorProps {
  /** Called when the user clicks "Dùng câu hỏi này" with fully-mapped questions */
  onQuestionsReady: (questions: QuestionFormData[]) => void;
  teamId: number;
  /** Total score of the assignment — used to auto-calculate points per question */
  totalScore?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AI_BASE_URL = ''; // Proxied via Next.js rewrite: /api/ai/* → http://ai-service:8080/api/ai/*
const DEFAULT_QUESTION_COUNT = 15;

// ─── Helper: parse "A. some text" → label + text ────────────────────────────

function parseOption(raw: string): { label: string; text: string } {
  const match = raw.match(/^([A-D])\.\s*(.+)/);
  if (match) return { label: match[1], text: match[2].trim() };
  return { label: raw.charAt(0).toUpperCase(), text: raw };
}

// ─── Helper: map AI questions → QuestionFormData ──────────────────────────────

function mapAiToFormData(
  questions: AiGeneratedQuestion[],
  totalScore?: number
): QuestionFormData[] {
  // Auto-distribute score evenly; round to 2 decimal places, min 1
  const pointsEach =
    totalScore && questions.length > 0
      ? Math.max(1, Math.round((totalScore / questions.length) * 100) / 100)
      : 1;

  return questions.map((q, qIdx) => {
    const options: OptionFormData[] = q.options.map((rawOpt, oIdx) => {
      const { label, text } = parseOption(rawOpt);
      return {
        content: text,
        isCorrect: label === q.correctAnswer,
        displayOrder: oIdx + 1,
      };
    });

    return {
      content: q.question,
      type: 'SINGLE_CHOICE',
      points: pointsEach,
      displayOrder: qIdx + 1,
      options,
    };
  });
}

// ─── Sub-component: Terminal UI ───────────────────────────────────────────────

function TerminalBlock({ lines }: { lines: TerminalLine[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const colorClass = (type: TerminalLine['type']) => {
    switch (type) {
      case 'success': return 'text-emerald-400';
      case 'progress': return 'text-sky-300';
      case 'warn': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-slate-300';
    }
  };

  return (
    <div className="mt-4 rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
      {/* Terminal chrome bar */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 border-b border-slate-700">
        <span className="w-3 h-3 rounded-full bg-red-500" />
        <span className="w-3 h-3 rounded-full bg-yellow-500" />
        <span className="w-3 h-3 rounded-full bg-emerald-500" />
        <span className="ml-3 text-xs text-slate-400 font-mono">ai-quiz-generator — stream output</span>
      </div>
      {/* Terminal body */}
      <div className="bg-slate-900 font-mono text-sm p-4 h-56 overflow-y-auto space-y-0.5">
        {lines.map((line) => (
          <p key={line.id} className={`leading-relaxed ${colorClass(line.type)}`}>
            <span className="text-slate-600 select-none mr-2">›</span>
            {line.text}
          </p>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ─── Sub-component: Editable Question Card ────────────────────────────────────

interface EditableQuestionCardProps {
  question: AiGeneratedQuestion;
  index: number;
  onChange: (updated: AiGeneratedQuestion) => void;
  onDelete: () => void;
}

function EditableQuestionCard({ question, index, onChange, onDelete }: EditableQuestionCardProps) {
  const handleTextChange = (text: string) => onChange({ ...question, question: text });

  const handleOptionTextChange = (optIdx: number, newText: string) => {
    const label = parseOption(question.options[optIdx]).label;
    const updated = question.options.map((o, i) =>
      i === optIdx ? `${label}. ${newText}` : o
    );
    onChange({ ...question, options: updated });
  };

  const handleCorrectChange = (label: string) =>
    onChange({ ...question, correctAnswer: label });

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow">
            {index + 1}
          </span>
          <textarea
            value={question.question}
            onChange={(e) => handleTextChange(e.target.value)}
            rows={2}
            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-800 resize-none focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all"
            placeholder="Nội dung câu hỏi..."
          />
        </div>
        <button
          type="button"
          onClick={onDelete}
          title="Xóa câu hỏi"
          className="flex-shrink-0 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Options */}
      <div className="space-y-2 pl-9">
        {question.options.map((rawOpt, oIdx) => {
          const { label, text } = parseOption(rawOpt);
          const isCorrect = question.correctAnswer === label;
          return (
            <div
              key={label}
              className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${isCorrect
                  ? 'bg-emerald-50 border-emerald-300'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
            >
              <button
                type="button"
                onClick={() => handleCorrectChange(label)}
                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isCorrect
                    ? 'bg-emerald-500 border-emerald-500 shadow-sm'
                    : 'border-slate-300 hover:border-emerald-400'
                  }`}
              >
                {isCorrect && (
                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd" />
                  </svg>
                )}
              </button>
              <span className={`flex-shrink-0 text-xs font-bold w-5 ${isCorrect ? 'text-emerald-700' : 'text-slate-500'}`}>
                {label}
              </span>
              <input
                type="text"
                value={text}
                onChange={(e) => handleOptionTextChange(oIdx, e.target.value)}
                className={`flex-1 text-sm px-2 py-1 rounded border bg-white focus:outline-none focus:ring-1 transition-all ${isCorrect
                    ? 'border-emerald-300 focus:ring-emerald-300 text-emerald-800 font-medium'
                    : 'border-slate-200 focus:ring-violet-300 text-slate-700'
                  }`}
                placeholder={`Đáp án ${label}...`}
              />
              {isCorrect && (
                <span className="flex-shrink-0 text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                  ✓ Đúng
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AiQuizGenerator({ onQuestionsReady, totalScore }: AiQuizGeneratorProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [phase, setPhase] = useState<GenerationPhase>('idle');
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [questions, setQuestions] = useState<AiGeneratedQuestion[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // ── Improvement 1: dynamic question count ──
  const [questionCount, setQuestionCount] = useState(DEFAULT_QUESTION_COUNT);
  const lineIdRef = useRef(0);

  const addLine = useCallback((text: string, type: TerminalLine['type'] = 'info') => {
    setTerminalLines((prev) => [
      ...prev,
      { id: lineIdRef.current++, text, type },
    ]);
  }, []);

  // ── Upload document ──────────────────────────────────────────────────────────

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhase('uploading');
    setDocumentId(null);
    setUploadedFileName(file.name);
    setSaveError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = getAccessToken();
      const res = await fetch(`${AI_BASE_URL}/api/ai/documents/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Upload thất bại (${res.status}): ${errText}`);
      }

      const json = await res.json();
      // Accept { documentId } or { data: { documentId } } envelope
      const docId: string = json?.documentId ?? json?.data?.documentId;
      if (!docId) throw new Error('Phản hồi từ server không chứa documentId');

      setDocumentId(docId);
      setPhase('ready');
    } catch (err: unknown) {
      console.error('[AI Upload]', err);
      setPhase('error');
      setSaveError((err as Error).message ?? 'Upload thất bại. Thử lại.');
    } finally {
      // Reset input so the same file can be re-selected
      e.target.value = '';
    }
  };

  // ── Stream generation via fetch + ReadableStream ─────────────────────────────

  const handleGenerate = async () => {
    if (!documentId) return;

    setPhase('generating');
    setTerminalLines([]);
    setQuestions([]);
    setSaveError(null);

    // ── Improvement 3: log filename, not raw UUID; use dynamic count ──
    addLine(`[${new Date().toLocaleTimeString()}] Bắt đầu kết nối tới AI service...`, 'info');
    addLine(`documentName: ${uploadedFileName ?? documentId}`, 'info');
    addLine(`Yêu cầu tạo ${questionCount} câu hỏi trắc nghiệm...`, 'progress');

    const accumulated: AiGeneratedQuestion[] = [];

    try {
      const token = getAccessToken();
      const res = await fetch(`${AI_BASE_URL}/api/ai/documents/generate-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          documentId,
          questionCount,
          questionType: 'MULTIPLE_CHOICE',
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Lỗi từ AI (${res.status}): ${errText}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE protocol: split on double-newline boundaries
        const parts = buffer.split('\n\n');
        // Keep the last (potentially incomplete) chunk in the buffer
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          const eventMatch = part.match(/^event:\s*(.+)$/m);
          const dataMatch = part.match(/^data:\s*(.+)$/m);

          const eventType = eventMatch?.[1]?.trim() ?? 'message';
          const dataRaw = dataMatch?.[1]?.trim() ?? '';

          if (!dataRaw) continue;

          let payload: Record<string, unknown>;
          try {
            payload = JSON.parse(dataRaw);
          } catch {
            // Plain-text SSE data (rare)
            addLine(dataRaw, 'info');
            continue;
          }

          switch (eventType) {
            case 'progress': {
              const msg = String(payload.message ?? payload.status ?? JSON.stringify(payload));
              addLine(msg, 'progress');
              break;
            }
            case 'partial_result': {
              // Backend emits: { documentId, questionType, questions: MultipleChoiceQuestion[] }
              // where each question = { question, options: string[], correctAnswer, explanation }
              const batch = (payload as { questions?: AiGeneratedQuestion[] }).questions;
              if (Array.isArray(batch) && batch.length > 0) {
                for (const q of batch) {
                  if (q?.question && Array.isArray(q.options)) {
                    accumulated.push(q);
                    addLine(
                      `✓ Câu ${accumulated.length}: "${q.question.slice(0, 60)}${q.question.length > 60 ? '…' : ''}"`,
                      'success'
                    );
                  }
                }
                setQuestions([...accumulated]);
              }
              break;
            }
            case 'completed': {
              const msg = String(payload.message ?? 'Hoàn tất!');
              addLine(`[DONE] ${msg}`, 'success');
              addLine(`Tổng cộng ${accumulated.length} câu hỏi đã được tạo.`, 'success');
              setPhase('completed');
              break;
            }
            case 'error': {
              const errMsg = String(payload.message ?? payload.error ?? 'Lỗi không xác định');
              addLine(`[ERROR] ${errMsg}`, 'error');
              setPhase('error');
              break;
            }
            default: {
              // Fallback: show raw data as info
              const msg = String(payload.message ?? payload.status ?? dataRaw);
              addLine(msg, 'info');
            }
          }
        }
      }

      // If stream ended without a 'completed' event, still mark done
      if (accumulated.length > 0 && phase !== 'completed') {
        setPhase('completed');
        addLine(`Stream kết thúc. ${accumulated.length} câu hỏi sẵn sàng.`, 'success');
      }
    } catch (err: unknown) {
      console.error('[AI Generate]', err);
      const msg = (err as Error).message ?? 'Lỗi kết nối stream';
      addLine(`[FATAL] ${msg}`, 'error');
      setPhase('error');
      setSaveError(msg);
    }
  };

  // ── Save: map AI questions → QuestionFormData and pass to parent ─────────────

  const handleSaveQuestions = async () => {
    if (questions.length === 0) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      // ── Improvement 4: pass totalScore so points are auto-calculated ──
      const mapped = mapAiToFormData(questions, totalScore);
      onQuestionsReady(mapped);
    } catch (err: unknown) {
      setSaveError((err as Error).message ?? 'Lỗi khi xử lý câu hỏi');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Reset ─────────────────────────────────────────────────────────────────────

  const handleReset = () => {
    setPhase('idle');
    setDocumentId(null);
    setUploadedFileName(null);
    setTerminalLines([]);
    setQuestions([]);
    setSaveError(null);
    setQuestionCount(DEFAULT_QUESTION_COUNT);
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-xl overflow-hidden border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50 shadow-sm">
      {/* ── Toggle Header ─────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setIsEnabled((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-violet-50 transition-colors group"
      >
        <div className="flex items-center gap-3">
          {/* Sparkle icon */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md group-hover:shadow-violet-200 transition-shadow">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l1.09 3.26L16.5 6l-3.41 1.74L12 11l-1.09-3.26L7.5 6l3.41-1.74L12 2zM5.5 12l.73 2.18L8.5 15l-2.27 1.18L5.5 18l-.73-2.18L2.5 15l2.27-1.18L5.5 12zM18.5 12l.73 2.18L21.5 15l-2.27 1.18L18.5 18l-.73-2.18L15.5 15l2.27-1.18L18.5 12z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              ✨ Tạo bài tập trắc nghiệm tự động với AI
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Tải lên tài liệu → AI tự động sinh câu hỏi trắc nghiệm
            </p>
          </div>
        </div>

        {/* Toggle pill */}
        <div
          className={`relative w-11 h-6 rounded-full transition-colors duration-300 flex-shrink-0 ${isEnabled ? 'bg-gradient-to-r from-violet-500 to-indigo-600' : 'bg-slate-200'
            }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${isEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
          />
        </div>
      </button>

      {/* ── Expandable Body ────────────────────────────────────────────────────── */}
      {isEnabled && (
        <div className="px-5 pb-6 pt-2 space-y-5 border-t border-violet-100">

          {/* ── Step 1: Upload document ────────────────────────────────────────── */}
          {(phase === 'idle' || phase === 'uploading' || phase === 'error') && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                Bước 1 — Tải lên tài liệu học liệu
              </label>
              <label
                className={`flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all ${phase === 'uploading'
                    ? 'border-violet-300 bg-violet-50 opacity-75 pointer-events-none'
                    : 'border-slate-300 hover:border-violet-400 hover:bg-violet-50'
                  }`}
              >
                <input
                  type="file"
                  className="hidden"
                  disabled={phase === 'uploading'}
                  accept=".pdf,.doc,.docx,.txt,.pptx"
                  onChange={handleFileUpload}
                />
                {phase === 'uploading' ? (
                  <>
                    <svg className="w-8 h-8 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-sm font-medium text-violet-600">Đang tải lên...</p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-700">
                        Kéo thả hoặc <span className="text-violet-600 underline">nhấp để chọn tệp</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">PDF, DOCX, PPTX, TXT (tối đa 50MB)</p>
                    </div>
                  </>
                )}
              </label>

              {phase === 'error' && saveError && (
                <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd" />
                  </svg>
                  {saveError}
                </p>
              )}
            </div>
          )}

          {/* ── Step 2: Generate button + terminal ────────────────────────────── */}
          {(phase === 'ready' || phase === 'generating' || phase === 'completed') && (
            <div>
              {/* Uploaded file badge */}
              {uploadedFileName && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-emerald-700 font-medium truncate">{uploadedFileName}</span>
                  {phase === 'ready' && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="ml-auto text-xs text-slate-500 hover:text-slate-700 underline"
                    >
                      Đổi tệp
                    </button>
                  )}
                </div>
              )}

              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                Bước 2 — Tạo câu hỏi với AI
              </label>

              {/* ── Improvement 1: dynamic question count input ── */}
              {phase === 'ready' && (
                <div className="flex items-center gap-3 mb-3">
                  <label className="text-xs font-medium text-slate-600 whitespace-nowrap">Số câu hỏi:</label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setQuestionCount((n) => Math.max(1, n - 1))}
                      className="w-7 h-7 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-violet-50 hover:border-violet-400 font-bold text-base leading-none transition-colors flex items-center justify-center"
                    >−</button>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={questionCount}
                      onChange={(e) => {
                        const v = Math.min(50, Math.max(1, Number(e.target.value) || 1));
                        setQuestionCount(v);
                      }}
                      className="w-14 text-center px-2 py-1 rounded-lg border border-slate-300 text-sm font-semibold text-slate-800 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => setQuestionCount((n) => Math.min(50, n + 1))}
                      className="w-7 h-7 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-violet-50 hover:border-violet-400 font-bold text-base leading-none transition-colors flex items-center justify-center"
                    >+</button>
                  </div>
                  {totalScore && (
                    <span className="ml-auto text-xs text-slate-400">
                      ≈ <span className="font-semibold text-slate-600">{(totalScore / questionCount).toFixed(1)}</span> điểm/câu
                    </span>
                  )}
                </div>
              )}

              {phase === 'ready' && (
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md hover:shadow-violet-200 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l1.09 3.26L16.5 6l-3.41 1.74L12 11l-1.09-3.26L7.5 6l3.41-1.74L12 2z" />
                  </svg>
                  Tạo {questionCount} câu trắc nghiệm
                </button>
              )}

              {/* ── Improvement 2: horizontal progress bar ── */}
              {phase === 'generating' && (() => {
                const pct = Math.min(100, Math.round((questions.length / questionCount) * 100));
                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-violet-700">
                        AI đang tạo câu hỏi...
                      </span>
                      <span className="text-xs font-semibold text-violet-600 tabular-nums">
                        {questions.length}/{questionCount}
                      </span>
                    </div>
                    <div className="relative h-2.5 w-full rounded-full bg-violet-100 overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500 ease-out"
                        style={{ width: `${pct}%` }}
                      />
                      {/* shimmer overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.5s_infinite] bg-[length:200%_100%]" />
                    </div>
                    <p className="text-xs text-slate-400 text-right">{pct}% hoàn thành</p>
                  </div>
                );
              })()}

              {/* Terminal */}
              {terminalLines.length > 0 && <TerminalBlock lines={terminalLines} />}
            </div>
          )}

          {/* ── Step 3: Editable questions form ───────────────────────────────── */}
          {phase === 'completed' && questions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Bước 3 — Chỉnh sửa &amp; xác nhận câu hỏi ({questions.length})
                </label>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-slate-500 hover:text-slate-700 underline"
                >
                  Tạo lại
                </button>
              </div>

              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
                {questions.map((q, idx) => (
                  <EditableQuestionCard
                    key={idx}
                    question={q}
                    index={idx}
                    onChange={(updated) =>
                      setQuestions((prev) => prev.map((item, i) => (i === idx ? updated : item)))
                    }
                    onDelete={() =>
                      setQuestions((prev) => prev.filter((_, i) => i !== idx))
                    }
                  />
                ))}
              </div>

              {saveError && (
                <p className="text-xs text-red-600 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd" />
                  </svg>
                  {saveError}
                </p>
              )}

              <button
                type="button"
                onClick={handleSaveQuestions}
                disabled={isSaving || questions.length === 0}
                className="w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-md hover:shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M5 13l4 4L19 7" />
                    </svg>
                    Dùng {questions.length} câu hỏi này cho bài tập
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

package fit.iuh.modules.document.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Component
public class SemanticChunker {

    private final int minChunkSize;
    private final int maxChunkSize;

    /**
     * Pattern to detect semantic boundary markers:
     * - Numbered headings: "1.", "1.2", "I.", "II."
     * - Vietnamese section markers: "Chương", "Phần", "Bài", "Mục"
     * - Slide markers: "--- Slide"
     * - Horizontal rules: "---"
     * - Bullet points at start of new section
     */
    private static final Pattern SECTION_BOUNDARY = Pattern.compile(
            "^(?:#+\\s|\\d+\\.\\s|[IVXLC]+\\.\\s|Chương\\s|Phần\\s|Bài\\s|Mục\\s|---\\s*Slide|---\\s*$)",
            Pattern.MULTILINE
    );

    public SemanticChunker(
            @Value("${app.ai.chunking.min-chunk-size:300}") int minChunkSize,
            @Value("${app.ai.chunking.max-chunk-size:500}") int maxChunkSize) {
        this.minChunkSize = minChunkSize;
        this.maxChunkSize = maxChunkSize;
    }

    /**
     * Semantic chunking algorithm:
     *
     * 1. Split text into paragraphs (by double newline)
     * 2. Iterate paragraphs sequentially:
     *    a. Count words in current chunk being built
     *    b. If adding paragraph keeps total <= maxChunkSize → append
     *    c. If adding paragraph exceeds maxChunkSize:
     *       - If current chunk >= minChunkSize → finalize chunk, start new
     *       - If current chunk < minChunkSize → append anyway (avoid tiny chunks)
     *    d. SPECIAL: If paragraph starts a new section (heading/boundary)
     *       AND current chunk >= 150 words → finalize chunk early
     *       to preserve semantic coherence
     * 3. Final chunk: if < 100 words → merge into previous chunk
     */
    public List<String> chunk(String text) {
        if (text == null || text.isBlank()) {
            return List.of();
        }

        String[] paragraphs = text.split("\n\n+");
        List<String> chunks = new ArrayList<>();
        StringBuilder currentChunk = new StringBuilder();
        int currentWordCount = 0;

        for (String paragraph : paragraphs) {
            String trimmed = paragraph.strip();
            if (trimmed.isEmpty()) {
                continue;
            }

            int paragraphWordCount = countWords(trimmed);
            boolean isSectionBoundary = SECTION_BOUNDARY.matcher(trimmed).find();

            // Special condition: new section detected, finalize early if enough content
            if (isSectionBoundary && currentWordCount >= 150 && currentChunk.length() > 0) {
                chunks.add(currentChunk.toString().strip());
                currentChunk = new StringBuilder();
                currentWordCount = 0;
            }

            int projectedTotal = currentWordCount + paragraphWordCount;

            if (projectedTotal > maxChunkSize) {
                // Current chunk is big enough → finalize and start new
                if (currentWordCount >= minChunkSize && currentChunk.length() > 0) {
                    chunks.add(currentChunk.toString().strip());
                    currentChunk = new StringBuilder();
                    currentWordCount = 0;
                }
                // If paragraph itself exceeds maxChunkSize, force-split it
                if (paragraphWordCount > maxChunkSize) {
                    List<String> subChunks = forceSplitLargeParagraph(trimmed);
                    // Add all sub-chunks except the last (which becomes the new current)
                    for (int i = 0; i < subChunks.size() - 1; i++) {
                        chunks.add(subChunks.get(i));
                    }
                    String lastSub = subChunks.get(subChunks.size() - 1);
                    currentChunk.append(lastSub);
                    currentWordCount = countWords(lastSub);
                    continue;
                }
            }

            // Append paragraph to current chunk
            if (currentChunk.length() > 0) {
                currentChunk.append("\n\n");
            }
            currentChunk.append(trimmed);
            currentWordCount += paragraphWordCount;
        }

        // Flush remaining content
        if (currentChunk.length() > 0) {
            String remaining = currentChunk.toString().strip();
            if (!remaining.isEmpty()) {
                // If final chunk is too small, merge with previous
                if (countWords(remaining) < 100 && !chunks.isEmpty()) {
                    String lastChunk = chunks.remove(chunks.size() - 1);
                    chunks.add(lastChunk + "\n\n" + remaining);
                } else {
                    chunks.add(remaining);
                }
            }
        }

        return chunks;
    }

    /**
     * Force-split a single large paragraph by sentences.
     * Used when one paragraph exceeds maxChunkSize words.
     */
    private List<String> forceSplitLargeParagraph(String paragraph) {
        // Split by sentence-ending punctuation followed by space
        String[] sentences = paragraph.split("(?<=[.!?。])\\s+");
        List<String> result = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        int wordCount = 0;

        for (String sentence : sentences) {
            int sentenceWords = countWords(sentence);
            if (wordCount + sentenceWords > maxChunkSize && wordCount >= minChunkSize) {
                result.add(current.toString().strip());
                current = new StringBuilder();
                wordCount = 0;
            }
            if (current.length() > 0) {
                current.append(" ");
            }
            current.append(sentence);
            wordCount += sentenceWords;
        }

        if (current.length() > 0) {
            result.add(current.toString().strip());
        }

        return result.isEmpty() ? List.of(paragraph) : result;
    }

    private int countWords(String text) {
        if (text == null || text.isBlank()) return 0;
        return text.strip().split("\\s+").length;
    }
}

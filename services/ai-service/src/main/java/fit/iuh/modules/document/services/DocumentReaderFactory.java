package fit.iuh.modules.document.services;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xslf.usermodel.XMLSlideShow;
import org.apache.poi.xslf.usermodel.XSLFShape;
import org.apache.poi.xslf.usermodel.XSLFSlide;
import org.apache.poi.xslf.usermodel.XSLFTextShape;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.regex.Pattern;

@Component
public class DocumentReaderFactory {

    /**
     * Regex: Match single \n NOT preceded or followed by another \n.
     * This catches spurious line breaks injected by PDFBox at physical line endings.
     *
     * (?<!\n) = NOT preceded by \n
     * \n     = exactly one newline
     * (?!\n)  = NOT followed by \n
     */
    private static final Pattern SPURIOUS_NEWLINE = Pattern.compile("(?<!\\n)\\n(?!\\n)");

    /** Normalize 3+ consecutive newlines down to exactly 2 (one paragraph break). */
    private static final Pattern EXCESSIVE_BLANKS = Pattern.compile("\\n{3,}");

    // ── Public API ──

    public String extractText(MultipartFile file) throws IOException {
        String filename = file.getOriginalFilename();
        if (filename == null) {
            throw new IllegalArgumentException("Filename is required");
        }

        String lower = filename.toLowerCase();
        try (InputStream is = file.getInputStream()) {
            if (lower.endsWith(".pdf")) {
                return extractFromPdf(is);
            } else if (lower.endsWith(".docx")) {
                return extractFromDocx(is);
            } else if (lower.endsWith(".pptx")) {
                return extractFromPptx(is);
            } else {
                throw new IllegalArgumentException(
                        "Unsupported file format. Only .pdf, .docx, .pptx are allowed.");
            }
        }
    }

    // ── PDF: Extract + Preprocess ──

    private String extractFromPdf(InputStream is) throws IOException {
        try (PDDocument doc = Loader.loadPDF(is.readAllBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            String rawText = stripper.getText(doc);
            return preprocessPdfText(rawText);
        }
    }

    /**
     * PDF text preprocessing pipeline:
     * 1. Normalize line endings (\r\n → \n)
     * 2. Replace spurious single \n (mid-sentence breaks) with space
     * 3. Collapse 3+ consecutive newlines into exactly 2
     * 4. Strip trailing whitespace per line
     */
    String preprocessPdfText(String rawText) {
        String text = rawText.replace("\r\n", "\n");

        // Replace single newlines (mid-sentence) with space
        text = SPURIOUS_NEWLINE.matcher(text).replaceAll(" ");

        // Collapse excessive blank lines
        text = EXCESSIVE_BLANKS.matcher(text).replaceAll("\n\n");

        // Strip trailing spaces per line
        text = text.lines()
                .map(String::stripTrailing)
                .reduce((a, b) -> a + "\n" + b)
                .orElse("");

        return text.strip();
    }

    // ── DOCX: Paragraph-based extraction ──

    private String extractFromDocx(InputStream is) throws IOException {
        try (XWPFDocument doc = new XWPFDocument(is)) {
            StringBuilder sb = new StringBuilder();
            for (XWPFParagraph para : doc.getParagraphs()) {
                String text = para.getText().strip();
                if (!text.isEmpty()) {
                    sb.append(text).append("\n\n");
                }
            }
            return sb.toString().strip();
        }
    }

    // ── PPTX: Slide-based extraction ──

    private String extractFromPptx(InputStream is) throws IOException {
        try (XMLSlideShow pptx = new XMLSlideShow(is)) {
            StringBuilder sb = new StringBuilder();
            int slideNum = 0;
            for (XSLFSlide slide : pptx.getSlides()) {
                slideNum++;
                sb.append("--- Slide ").append(slideNum).append(" ---\n\n");
                for (XSLFShape shape : slide.getShapes()) {
                    if (shape instanceof XSLFTextShape textShape) {
                        String text = textShape.getText().strip();
                        if (!text.isEmpty()) {
                            sb.append(text).append("\n\n");
                        }
                    }
                }
            }
            return sb.toString().strip();
        }
    }
}

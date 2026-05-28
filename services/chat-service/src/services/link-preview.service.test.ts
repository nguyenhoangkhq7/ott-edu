import { LinkPreviewService } from "./link-preview.service.ts";

describe("LinkPreviewService", () => {
  describe("extractFirstUrl", () => {
    it("should return null for empty text or non-string inputs", () => {
      expect(LinkPreviewService.extractFirstUrl("")).toBeNull();
      expect(LinkPreviewService.extractFirstUrl(null as any)).toBeNull();
      expect(LinkPreviewService.extractFirstUrl(undefined as any)).toBeNull();
    });

    it("should return null when no URL is present in the text", () => {
      expect(LinkPreviewService.extractFirstUrl("Hello world, this is a plain message.")).toBeNull();
      expect(LinkPreviewService.extractFirstUrl("google.com without protocol")).toBeNull();
    });

    it("should extract http and https URLs correctly", () => {
      expect(LinkPreviewService.extractFirstUrl("Check out http://example.com")).toBe("http://example.com");
      expect(LinkPreviewService.extractFirstUrl("Go to https://google.com for info")).toBe("https://google.com");
    });

    it("should extract the first URL when multiple URLs are present", () => {
      const text = "Visit https://first.com and also http://second.org";
      expect(LinkPreviewService.extractFirstUrl(text)).toBe("https://first.com");
    });

    it("should extract complex URLs with paths, query params and hashes", () => {
      const url = "https://www.example.co.uk:8080/path/to/page?query=1&name=test#hash-tag";
      const text = `Please click here: ${url} to verify.`;
      expect(LinkPreviewService.extractFirstUrl(text)).toBe(url);
    });
  });

  describe("processMessageForLinkPreview", () => {
    it("should return null immediately if no URL is in the content", async () => {
      const result = await LinkPreviewService.processMessageForLinkPreview("Hello world");
      expect(result).toBeNull();
    });
  });
});

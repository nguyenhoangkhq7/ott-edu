import { getLinkPreview } from "link-preview-js";
import type { LinkPreview } from "../model/Message.ts";

/**
 * Link Preview Service
 * Dùng để phát hiện URL trong tin nhắn, crawl metadata từ trang web
 * và lưu vào database
 */
export class LinkPreviewService {
  /**
   * Regex để phát hiện URL trong text
   * Support HTTP, HTTPS, và các domain phổ biến
   */
  private static readonly URL_REGEX =
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;

  /**
   * Phát hiện URL đầu tiên trong text
   * @param text - Nội dung tin nhắn
   * @returns URL nếu tìm thấy, null nếu không tìm thấy
   */
  static extractFirstUrl(text: string): string | null {
    if (!text || typeof text !== "string") {
      return null;
    }

    const match = text.match(this.URL_REGEX);
    if (match && match.length > 0) {
      return match[0];
    }
    return null;
  }

  /**
   * Fetch metadata từ URL
   * Xử lý lỗi an toàn: nếu URL chết hoặc lỗi, trả về null
   * @param url - URL cần crawl
   * @returns Link preview data hoặc null nếu lỗi
   */
  static async fetchLinkPreview(url: string): Promise<LinkPreview | null> {
    try {
      // Validate URL format
      if (!this.isValidUrl(url)) {
        console.warn(`Invalid URL format: ${url}`);
        return null;
      }

      // Fetch metadata từ URL
      // Thêm timeout để tránh gây blocking quá lâu
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Link preview fetch timeout")), 5000),
      );

      const previewData = await Promise.race([
        getLinkPreview(url),
        timeoutPromise,
      ]);

      // Xử lý response từ library
      // link-preview-js trả về: { url, title, description, images[], favicons[], ... }
      const preview: LinkPreview = {
        url: url,
        title: (previewData as any)?.title || null,
        description: (previewData as any)?.description || null,
        // Lấy ảnh đầu tiên từ mảng images, hoặc fallback sang favicon
        image:
          (previewData as any)?.images?.[0] ||
          (previewData as any)?.favicons?.[0] ||
          null,
      };

      return preview;
    } catch (error) {
      // Log error nhưng không crash app
      console.error(`Error fetching link preview for ${url}:`, error);
      return null;
    }
  }

  /**
   * Xử lý link preview từ tin nhắn
   * - Phát hiện URL
   * - Crawl metadata
   * - Trả về link preview data
   * Nếu không tìm thấy URL hoặc lỗi xảy ra, trả về null (vẫn cho phép lưu message bình thường)
   * @param content - Nội dung tin nhắn
   * @returns Link preview data hoặc null
   */
  static async processMessageForLinkPreview(
    content: string,
  ): Promise<LinkPreview | null> {
    try {
      // Phát hiện URL trong text
      const url = this.extractFirstUrl(content);
      if (!url) {
        return null;
      }

      // Fetch metadata từ URL
      const linkPreview = await this.fetchLinkPreview(url);
      return linkPreview;
    } catch (error) {
      // Xử lý error mượt mà: không crash app
      console.error("Error processing link preview:", error);
      return null;
    }
  }

  /**
   * Validate URL format cơ bản
   * @param url - URL cần validate
   * @returns true nếu URL hợp lệ
   */
  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

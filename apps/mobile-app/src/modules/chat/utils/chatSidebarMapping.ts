/**
 * Chat Sidebar Data Mapping Utilities (Mobile App)
 * Extracts media, files, and links from chat messages and maps to UI types
 */

import { ApiMessage } from '../types';

export interface MediaItemUI {
  url: string;
  fileName: string;
  messageId: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
}

export interface FileItemUI {
  url: string;
  fileName: string;
  fileType: string;
  sizeBytes: number;
  messageId: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
}

export interface LinkItemUI {
  url: string;
  title?: string;
  description?: string;
  domain?: string;
  messageId: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
}

/**
 * Extract media items (images/videos) from messages
 * Looks for image/video attachments or media URLs in message content
 */
export function extractMediaItems(messages: ApiMessage[]): MediaItemUI[] {
  const mediaItems: MediaItemUI[] = [];
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv', '.m4v'];

  messages.forEach((msg) => {
    if (!msg.attachments?.length) return;

    msg.attachments.forEach((attachment) => {
      const fileExt = attachment.fileName.toLowerCase().substring(
        attachment.fileName.lastIndexOf('.')
      );
      
      // Check if it's an image or video
      if ([...imageExtensions, ...videoExtensions].includes(fileExt)) {
        mediaItems.push({
          url: attachment.url,
          fileName: attachment.fileName,
          messageId: msg._id,
          senderId: msg.senderId,
          senderName: msg.senderId, // Will be populated from user context
          timestamp: new Date(msg.createdAt),
        });
      }
    });
  });

  return mediaItems;
}

/**
 * Extract file items from messages
 * Looks for non-media attachments (documents, archives, etc.)
 */
export function extractFileItems(messages: ApiMessage[]): FileItemUI[] {
  const fileItems: FileItemUI[] = [];
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv', '.m4v'];

  messages.forEach((msg) => {
    if (!msg.attachments?.length) return;

    msg.attachments.forEach((attachment) => {
      const fileExt = attachment.fileName.toLowerCase().substring(
        attachment.fileName.lastIndexOf('.')
      );
      
      // Exclude media files - only keep documents, archives, etc.
      if (![...imageExtensions, ...videoExtensions].includes(fileExt)) {
        fileItems.push({
          url: attachment.url,
          fileName: attachment.fileName,
          fileType: attachment.fileType || 'application/octet-stream',
          sizeBytes: 0, // Backend doesn't provide size in current API
          messageId: msg._id,
          senderId: msg.senderId,
          senderName: msg.senderId, // Will be populated from user context
          timestamp: new Date(msg.createdAt),
        });
      }
    });
  });

  return fileItems;
}

/**
 * Extract link items from messages
 * Looks for URLs in message content or linkPreview field
 */
export function extractLinkItems(messages: ApiMessage[]): LinkItemUI[] {
  const linkItems: LinkItemUI[] = [];
  
  // URL regex to match http/https links (robust pattern)
  const urlRegex = /https?:\/\/[^\s<>"\]\)]+/gi;

  messages.forEach((msg) => {
    // Priority 1: Use linkPreview if available (server-scraped metadata)
    if (msg.linkPreview?.url) {
      linkItems.push({
        url: msg.linkPreview.url,
        title: msg.linkPreview.title,
        description: msg.linkPreview.description,
        domain: extractDomain(msg.linkPreview.url),
        messageId: msg._id,
        senderId: msg.senderId,
        senderName: msg.senderId, // Will be populated from user context
        timestamp: new Date(msg.createdAt),
      });
    } else if (msg.content) {
      // Priority 2: Extract URLs from message content
      const matches = msg.content.matchAll(urlRegex);
      const seenUrls = new Set<string>();

      for (const match of matches) {
        const url = match[0];
        // Avoid duplicates
        if (!seenUrls.has(url)) {
          seenUrls.add(url);
          linkItems.push({
            url,
            title: undefined,
            description: undefined,
            domain: extractDomain(url),
            messageId: msg._id,
            senderId: msg.senderId,
            senderName: msg.senderId, // Will be populated from user context
            timestamp: new Date(msg.createdAt),
          });
        }
      }
    }
  });

  return linkItems;
}

/**
 * Extract domain from URL
 * @example extractDomain('https://www.google.com/search') → 'google.com'
 */
export function extractDomain(urlString: string): string {
  try {
    const url = new URL(urlString);
    return url.hostname.replace('www.', '');
  } catch {
    return urlString;
  }
}

/**
 * Populate sender names from participant data
 * Maps senderId to actual user names from conversation participants
 */
export function populateSenderNames<T extends { senderId: string; senderName: string }>(
  items: T[],
  participants: Array<{ _id: string; fullName: string }>
): T[] {
  return items.map((item) => {
    const participant = participants.find((p) => p._id === item.senderId);
    return {
      ...item,
      senderName: participant?.fullName || item.senderId,
    };
  });
}

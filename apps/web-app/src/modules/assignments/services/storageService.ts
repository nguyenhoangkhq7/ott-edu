/**
 * Storage Service Abstraction
 * Allows easy switching between Docker volumes, S3, etc.
 */

export interface DraftAssignment {
  id: string;
  teamId: number;
  title: string;
  description: string;
  assignmentType: 'QUIZ' | 'ESSAY';
  maxPoints: number;
  dueDate: string;
  dueTime: string;
  attachementIds: number[];
  createdAt: string;
  updatedAt: string;
}

export interface IStorageService {
  // Draft operations
  saveDraft(draft: DraftAssignment): Promise<string>; // returns draft ID
  loadDraft(draftId: string): Promise<DraftAssignment | null>;
  deleteDraft(draftId: string): Promise<void>;
  listDrafts(teamId: number): Promise<DraftAssignment[]>;

  // File operations
  uploadFile(file: File, draftId: string): Promise<{ fileId: number; filename: string; url: string }>;
  deleteFile(fileId: number, draftId: string): Promise<void>;
  getFileUrl(fileId: number): string;
}

/**
 * Default implementation using Backend API
 * Backend stores files in Docker volumes
 */
export class ApiStorageService implements IStorageService {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api') {
    this.baseUrl = baseUrl;
  }

  async saveDraft(draft: DraftAssignment): Promise<string> {
    const response = await fetch(`${this.baseUrl}/assignments/drafts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
      credentials: 'include',
    });

    if (!response.ok) throw new Error(`Failed to save draft: ${response.statusText}`);

    const data = await response.json();
    return data.id;
  }

  async loadDraft(draftId: string): Promise<DraftAssignment | null> {
    const response = await fetch(`${this.baseUrl}/assignments/drafts/${draftId}`, {
      credentials: 'include',
    });

    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Failed to load draft: ${response.statusText}`);

    return response.json();
  }

  async deleteDraft(draftId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/assignments/drafts/${draftId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) throw new Error(`Failed to delete draft: ${response.statusText}`);
  }

  async listDrafts(teamId: number): Promise<DraftAssignment[]> {
    const response = await fetch(`${this.baseUrl}/assignments/drafts?teamId=${teamId}`, {
      credentials: 'include',
    });

    if (!response.ok) throw new Error(`Failed to list drafts: ${response.statusText}`);

    const data = await response.json();
    return data.drafts || [];
  }

  async uploadFile(file: File, draftId: string): Promise<{ fileId: number; filename: string; url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('draftId', draftId);

    const response = await fetch(`${this.baseUrl}/assignments/drafts/${draftId}/files`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) throw new Error(`Failed to upload file: ${response.statusText}`);

    return response.json();
  }

  async deleteFile(fileId: number, draftId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/assignments/drafts/${draftId}/files/${fileId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) throw new Error(`Failed to delete file: ${response.statusText}`);
  }

  getFileUrl(fileId: number): string {
    return `${this.baseUrl}/files/${fileId}`;
  }
}

// Singleton instance
let storageService: IStorageService | null = null;

export function getStorageService(): IStorageService {
  if (!storageService) {
    storageService = new ApiStorageService();
  }
  return storageService;
}

export function setStorageService(service: IStorageService): void {
  storageService = service;
}

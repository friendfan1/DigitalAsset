export interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'idle' | 'validating' | 'uploading' | 'success' | 'error';
  preview?: string;
  error?: string;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export interface UploadOptions {
  encrypt: boolean;
  metadata: {
    description: string;
    category: string;
    tags: string[];
  };
} 
export const uploadConfig = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ],
  imagePreviewTypes: ['image/jpeg', 'image/png', 'image/gif'],
  pdfPreviewTypes: ['application/pdf'],
  maxFileNameLength: 100,
  // 上传状态
  uploadStatus: {
    IDLE: 'idle',
    VALIDATING: 'validating',
    UPLOADING: 'uploading',
    SUCCESS: 'success',
    ERROR: 'error'
  }
}; 
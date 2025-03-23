export const uploadConfig = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    // 添加音频格式
    'audio/mpeg',
    'audio/ogg',
    'audio/wav',
    'audio/x-m4a',
    'audio/webm',
    // 添加视频格式
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-msvideo'
  ],
  imagePreviewTypes: ['image/jpeg', 'image/png', 'image/gif'],
  pdfPreviewTypes: ['application/pdf'],
  // 新增视频预览类型
  videoPreviewTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'],
  // 新增音频预览类型
  audioPreviewTypes: ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/x-m4a', 'audio/webm'],
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
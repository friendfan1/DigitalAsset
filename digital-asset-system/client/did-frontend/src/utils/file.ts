import { uploadConfig } from '@/config/upload.config';
import type { FileValidationResult } from '@/types/upload';

export const fileUtils = {
  validateFile(file: File): FileValidationResult {
    // 检查文件大小
    if (file.size > uploadConfig.maxFileSize) {
      return {
        isValid: false,
        error: `文件大小不能超过 ${uploadConfig.maxFileSize / 1024 / 1024}MB`
      };
    }

    // 检查文件类型
    if (!uploadConfig.allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: '不支持的文件类型'
      };
    }

    // 检查文件名长度
    if (file.name.length > uploadConfig.maxFileNameLength) {
      return {
        isValid: false,
        error: `文件名不能超过 ${uploadConfig.maxFileNameLength} 个字符`
      };
    }

    return { isValid: true };
  },

  async generatePreview(file: File): Promise<string> {
    if (uploadConfig.imagePreviewTypes.includes(file.type)) {
      return URL.createObjectURL(file);
    }
    
    // 如果是 PDF，返回一个 PDF 图标的 base64
    if (uploadConfig.pdfPreviewTypes.includes(file.type)) {
      return 'data:image/svg+xml;base64,...'; // PDF 图标的 base64
    }

    // 其他文件类型返回默认文件图标
    return 'data:image/svg+xml;base64,...'; // 默认文件图标的 base64
  },

  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  },

  getFileExtension(filename: string): string {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
  }
}; 
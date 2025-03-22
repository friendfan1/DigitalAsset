import { fileUtils } from './file';
import type { UploadOptions } from '@/types/upload';

export const validateUploadOptions = (options: UploadOptions): boolean => {
  if (options.metadata) {
    // 验证描述长度
    if (options.metadata.description && options.metadata.description.length > 500) {
      return false;
    }
    
    // 验证分类
    if (options.metadata.category && options.metadata.category.length > 50) {
      return false;
    }
    
    // 验证标签
    if (options.metadata.tags) {
      if (options.metadata.tags.length > 10) return false;
      if (options.metadata.tags.some(tag => tag.length > 20)) return false;
    }
  }
  
  return true;
};

import { DataScopeError } from '../errors'

export function mapFsWriteError(error: unknown, filePath: string): never {
  const code =
    error && typeof error === 'object' && 'code' in error ? String((error as { code: unknown }).code) : ''

  if (code === 'ENOSPC') {
    throw new DataScopeError('FILE_DISK_FULL', `磁盘空间不足，无法写入: ${filePath}`, { path: filePath })
  }
  if (code === 'EACCES' || code === 'EPERM') {
    throw new DataScopeError('FILE_PERMISSION', `没有权限写入: ${filePath}`, { path: filePath })
  }
  if (code === 'ENOENT') {
    throw new DataScopeError('FILE_NOT_FOUND', `路径不存在: ${filePath}`, { path: filePath })
  }
  if (code === 'ENOTDIR' || code === 'EISDIR') {
    throw new DataScopeError('VALIDATION_ERROR', `导出路径无效: ${filePath}`, { path: filePath })
  }

  const message = error instanceof Error ? error.message : '写入文件失败'
  throw new DataScopeError('UNKNOWN', `导出失败: ${message}`, { path: filePath })
}

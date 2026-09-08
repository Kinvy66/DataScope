export interface AppInfo {
  name: string
  version: string
  electron: string
  chrome: string
  node: string
  platform: 'win32' | 'darwin' | 'linux' | string
  userDataPath: string
}

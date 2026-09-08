export const IpcChannel = {
  AppGetInfo: 'app:getInfo',
  AppCloseRequested: 'app:closeRequested',
  AppConfirmClose: 'app:confirmClose',
  AppCancelClose: 'app:cancelClose',

  SettingsGet: 'settings:get',
  SettingsSet: 'settings:set',

  LogWrite: 'log:write',
  LogQuery: 'log:query',

  DialogOpenDirectory: 'dialog:openDirectory',
  DialogOpenFile: 'dialog:openFile',
  DialogSaveFile: 'dialog:saveFile',

  ProjectCreate: 'project:create',
  ProjectOpen: 'project:open',
  ProjectSave: 'project:save',
  ProjectSaveAs: 'project:saveAs',
  ProjectClose: 'project:close',
  ProjectGetCurrent: 'project:getCurrent',
  ProjectGetRecent: 'project:getRecent',
  ProjectClearRecent: 'project:clearRecent',
  ProjectUpdate: 'project:update',

  DatasetImport: 'dataset:import',
  DatasetList: 'dataset:list',
  DatasetGetInfo: 'dataset:getInfo',
  DatasetGetStatistics: 'dataset:getStatistics',
  DatasetGetViewport: 'dataset:getViewport',
  DatasetRename: 'dataset:rename',
  DatasetRemove: 'dataset:remove',
  DatasetAnalyze: 'dataset:analyze',
  DatasetAnalyzeSpectrum: 'dataset:analyzeSpectrum',
  DatasetGenerate: 'dataset:generate',
  DatasetAddMarker: 'dataset:addMarker',
  DatasetUpdateMarker: 'dataset:updateMarker',
  DatasetRemoveMarker: 'dataset:removeMarker'
} as const

export type IpcChannelName = (typeof IpcChannel)[keyof typeof IpcChannel]

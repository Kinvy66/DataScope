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
  DatasetFilter: 'dataset:filter',
  DatasetGenerate: 'dataset:generate',
  DatasetAddMarker: 'dataset:addMarker',
  DatasetUpdateMarker: 'dataset:updateMarker',
  DatasetRemoveMarker: 'dataset:removeMarker',

  LiveGetStatus: 'live:getStatus',
  LiveConfigure: 'live:configure',
  LiveCommand: 'live:command',
  LiveGetViewport: 'live:getViewport',
  LiveCapture: 'live:capture',
  LiveStatusChanged: 'live:statusChanged',

  TaskList: 'task:list',
  TaskGet: 'task:get',
  TaskCommand: 'task:command',
  TaskClearFinished: 'task:clearFinished',
  TaskUpdated: 'task:updated'
} as const

export type IpcChannelName = (typeof IpcChannel)[keyof typeof IpcChannel]

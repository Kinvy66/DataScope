import type { FilterKind } from '../types/filter'
import type { WaveformKind } from '../types/generator'
import type { DaqCommand, DaqState } from '../types/live'
import type { MarkerType } from '../types/dataset'
import type { TaskCommand, TaskKind, TaskStatus } from '../types/task'

const pair = (zh: string, en: string): { 'zh-CN': string; 'en-US': string } => ({
  'zh-CN': zh,
  'en-US': en
})

export const messages = {
  'common.close': pair('关闭', 'Close'),
  'common.cancel': pair('取消', 'Cancel'),
  'common.ok': pair('确定', 'OK'),
  'common.save': pair('保存', 'Save'),
  'common.discard': pair('不保存', 'Don\'t save'),
  'common.delete': pair('删除', 'Delete'),
  'common.browse': pair('浏览', 'Browse'),
  'common.create': pair('创建', 'Create'),
  'common.open': pair('打开', 'Open'),
  'common.refresh': pair('刷新', 'Refresh'),
  'common.all': pair('全部', 'All'),
  'common.goData': pair('前往数据浏览', 'Go to Data Browser'),
  'common.selectAllChannels': pair('全选通道', 'Select all channels'),
  'common.fullRange': pair('全范围', 'Full range'),
  'common.help': pair('说明', 'Notes'),
  'common.name': pair('名称', 'Name'),
  'common.description': pair('描述', 'Description'),
  'common.path': pair('路径', 'Path'),
  'common.type': pair('类型', 'Type'),
  'common.color': pair('颜色', 'Color'),
  'common.channel': pair('通道', 'Channel'),
  'common.channels': pair('通道', 'Channels'),
  'common.sampleIndex': pair('采样点', 'Sample'),
  'common.relativeTime': pair('相对时间', 'Elapsed'),
  'common.note': pair('备注', 'Note'),
  'common.startIndex': pair('起始采样点', 'Start sample'),
  'common.endIndex': pair('结束采样点', 'End sample'),
  'common.sampleRate': pair('采样率 (Hz)', 'Sample rate (Hz)'),
  'common.channelCount': pair('通道数', 'Channels'),
  'common.frequency': pair('频率 (Hz)', 'Frequency (Hz)'),
  'common.amplitude': pair('幅度', 'Amplitude'),
  'common.offset': pair('偏置', 'Offset'),
  'common.noise': pair('噪声水平', 'Noise level'),
  'common.format': pair('格式', 'Format'),
  'common.unknownError': pair('未知错误', 'Unknown error'),
  'common.noProject': pair('未打开工程', 'No project'),

  'nav.title': pair('导航', 'Navigation'),
  'nav.dashboard': pair('工作台', 'Dashboard'),
  'nav.data': pair('数据浏览', 'Data Browser'),
  'nav.live': pair('实时监视', 'Live Monitor'),
  'nav.signal': pair('信号分析', 'Signal Analysis'),
  'nav.spectrum': pair('频谱分析', 'Spectrum'),
  'nav.markers': pair('Marker 管理', 'Markers'),
  'nav.generator': pair('数据发生器', 'Generator'),
  'nav.export': pair('数据导出', 'Export'),
  'nav.tasks': pair('任务管理', 'Tasks'),
  'nav.logs': pair('日志查看', 'Logs'),
  'nav.projectSettings': pair('工程设置', 'Project'),
  'nav.appSettings': pair('应用设置', 'Application'),
  'nav.hint.dashboard': pair('Dashboard', '工作台'),
  'nav.hint.data': pair('Data Browser', '数据浏览'),
  'nav.hint.live': pair('Live Monitor', '实时监视'),
  'nav.hint.signal': pair('Signal Analysis', '信号分析'),
  'nav.hint.spectrum': pair('Spectrum', '频谱分析'),
  'nav.hint.markers': pair('Markers', 'Marker 管理'),
  'nav.hint.generator': pair('Generator', '数据发生器'),
  'nav.hint.export': pair('Export', '数据导出'),
  'nav.hint.tasks': pair('Tasks', '任务管理'),
  'nav.hint.logs': pair('Logs', '日志查看'),
  'nav.hint.project': pair('Project', '工程设置'),
  'nav.hint.app': pair('Application', '应用设置'),

  'toolbar.newProject': pair('新建工程', 'New project'),
  'toolbar.open': pair('打开', 'Open'),
  'toolbar.save': pair('保存', 'Save'),
  'toolbar.saveAs': pair('另存为', 'Save as'),
  'toolbar.closeProject': pair('关闭工程', 'Close project'),
  'toolbar.import': pair('导入数据', 'Import data'),
  'toolbar.lightTheme': pair('浅色主题', 'Light theme'),
  'toolbar.darkTheme': pair('深色主题', 'Dark theme'),

  'status.unsaved': pair('未保存', 'Unsaved'),
  'status.ready': pair('就绪', 'Ready'),
  'status.project': pair('工程：{name}', 'Project: {name}'),
  'status.daq': pair('DAQ：{state}', 'DAQ: {state}'),
  'status.taskIdle': pair('任务：空闲', 'Tasks: idle'),
  'status.taskRunning': pair('任务：{count} 运行中', 'Tasks: {count} running'),
  'status.taskPaused': pair('任务：{count} 已暂停', 'Tasks: {count} paused'),
  'status.taskMixed': pair('任务：{running} 运行 / {paused} 暂停', 'Tasks: {running} running / {paused} paused'),
  'status.taskActive': pair('任务：{count} 进行中', 'Tasks: {count} in progress'),
  'status.themeDark': pair('深色', 'Dark'),
  'status.themeLight': pair('浅色', 'Light'),

  'unsaved.body': pair('当前工程包含未保存的修改，请选择如何处理。', 'This project has unsaved changes. Choose how to continue.'),
  'unsaved.projectTitle': pair('工程有未保存的修改', 'Unsaved project changes'),
  'unsaved.windowTitle': pair('关闭窗口前保存工程？', 'Save the project before closing?'),

  'dialog.chooseDirectory': pair('选择目录', 'Choose folder'),
  'dialog.chooseFile': pair('选择文件', 'Choose file'),
  'dialog.saveFile': pair('保存文件', 'Save file'),
  'dialog.openProject': pair('打开工程', 'Open project'),
  'dialog.saveAsDirectory': pair('选择另存为目录', 'Choose Save As folder'),
  'dialog.importTitle': pair('导入数据', 'Import data'),
  'dialog.chooseProjectLocation': pair('选择工程位置', 'Choose project location'),
  'dialog.filterData': pair('数据文件', 'Data files'),

  'newProject.kicker': pair('Project', 'Project'),
  'newProject.title': pair('新建工程', 'New project'),
  'newProject.location': pair('位置', 'Location'),
  'newProject.locationPlaceholder': pair('选择保存目录', 'Choose a folder'),

  'error.needProjectImport': pair('请先新建或打开工程，再导入数据', 'Create or open a project before importing data'),
  'error.needProjectGenerate': pair('请先新建或打开工程，再生成数据', 'Create or open a project before generating data'),
  'error.needProjectCapture': pair('请先新建或打开工程，再把实时数据写入工程', 'Create or open a project before capturing live data'),
  'error.needDataset': pair('请先导入并选择一个数据集', 'Import and select a dataset first'),
  'error.needChannels': pair('请至少选择一个通道', 'Select at least one channel'),
  'error.needSelectedDataset': pair('请先选择一个数据集', 'Select a dataset first'),

  'settings.kicker': pair('Application Settings', 'Application Settings'),
  'settings.title': pair('应用设置', 'Application settings'),
  'settings.desc': pair(
    '配置语言、主题、自动保存、数据默认值和波形视口缓存。渲染进程不直接访问 Node.js API。',
    'Language, theme, autosave, data defaults, and waveform viewport cache. The renderer does not use Node.js APIs directly.'
  ),
  'settings.language': pair('界面语言', 'Language'),
  'settings.languageZh': pair('中文', 'Chinese'),
  'settings.languageEn': pair('English', 'English'),
  'settings.theme': pair('主题', 'Theme'),
  'settings.themeDark': pair('深色', 'Dark'),
  'settings.themeLight': pair('浅色', 'Light'),
  'settings.logLevel': pair('日志级别', 'Log level'),
  'settings.autosave': pair('自动保存', 'Autosave'),
  'settings.autosaveOff': pair('关闭', 'Off'),
  'settings.autosaveSeconds': pair('{n} 秒', '{n} seconds'),
  'settings.defaultSampleRate': pair('默认采样率 (Hz)', 'Default sample rate (Hz)'),
  'settings.defaultChannelCount': pair('默认通道数', 'Default channel count'),
  'settings.defaultExportFormat': pair('默认导出格式', 'Default export format'),
  'settings.viewportCache': pair('波形视口缓存', 'Waveform viewport cache'),
  'settings.viewportCacheOff': pair('关闭', 'Off'),
  'settings.viewportCacheEntries': pair('{n} 条', '{n} entries'),
  'settings.app': pair('应用', 'App'),
  'settings.electron': pair('Electron', 'Electron'),
  'settings.chrome': pair('Chrome', 'Chrome'),
  'settings.node': pair('Node', 'Node'),
  'settings.platform': pair('平台', 'Platform'),
  'settings.notes': pair(
    '自动保存只写入已打开且有未保存修改的工程。默认采样率用于新建工程；默认通道数和采样率会填入发生器与 Virtual DAQ 表单；默认格式用于导出页。视口缓存记住最近的降采样结果，换数据集或关闭工程时清空。',
    'Autosave writes an open dirty project. Default sample rate is used for new projects. Channel count and sample rate seed the generator and Virtual DAQ forms. Default format seeds the export page. Viewport cache stores recent min/max buckets and clears when datasets change or the project closes.'
  ),

  'projectSettings.kicker': pair('Project Settings', 'Project Settings'),
  'projectSettings.title': pair('工程设置', 'Project settings'),
  'projectSettings.desc': pair(
    '编辑当前工程的名称、描述和默认采样率。修改后需要保存工程。',
    'Edit the project name, description, and sample rate. Save the project to persist changes.'
  ),
  'projectSettings.path': pair('路径：{path}', 'Path: {path}'),
  'projectSettings.save': pair('保存工程', 'Save project'),
  'projectSettings.empty': pair('当前没有打开的工程。', 'No project is open.'),

  'dashboard.kicker': pair('Dashboard', 'Dashboard'),
  'dashboard.title': pair('工作台', 'Dashboard'),
  'dashboard.desc': pair(
    '管理工程、导入时序数据，并进入多通道波形工作区。',
    'Manage projects, import time-series data, and open the waveform workspace.'
  ),
  'dashboard.noProject': pair('没有打开的工程', 'No project open'),
  'dashboard.emptyHint': pair(
    '新建或打开一个工程以开始。工程目录包含 project.json、data、exports、analysis 和 logs。',
    'Create or open a project to start. A project folder contains project.json, data, exports, analysis, and logs.'
  ),
  'dashboard.openProject': pair('打开工程', 'Open project'),
  'dashboard.datasets': pair('数据集', 'Datasets'),
  'dashboard.datasetCount': pair('{count} 个已导入文件', '{count} imported files'),
  'dashboard.currentDataset': pair('当前：{name} · {channels} ch · {samples} samples', 'Current: {name} · {channels} ch · {samples} samples'),
  'dashboard.recent': pair('最近工程', 'Recent projects'),
  'dashboard.clearRecent': pair('清除历史', 'Clear history'),
  'dashboard.noRecent': pair('暂无最近工程。', 'No recent projects.'),
  'dashboard.timestamps': pair('创建于 {created} · 修改于 {modified}', 'Created {created} · Modified {modified}'),

  'data.kicker': pair('Data Browser', 'Data Browser'),
  'data.title': pair('数据浏览', 'Data Browser'),
  'data.desc': pair(
    '查看已导入数据集、通道信息和 Marker，并在下方打开波形工作区。',
    'Inspect imported datasets, channels, and markers, and open the waveform workspace below.'
  ),
  'data.needProject': pair('请先新建或打开工程，然后导入 CSV / TXT / JSON / DSB 数据。', 'Create or open a project, then import CSV / TXT / JSON / DSB data.'),
  'data.fileList': pair('文件列表', 'Files'),
  'data.import': pair('导入', 'Import'),
  'data.searchPlaceholder': pair('搜索名称、通道或格式', 'Search name, channel, or format'),
  'data.empty': pair('还没有导入数据。', 'No datasets imported yet.'),
  'data.noMatch': pair('没有匹配的数据集。', 'No matching datasets.'),
  'data.info': pair('数据集信息', 'Dataset info'),
  'data.sampleRate': pair('采样率', 'Sample rate'),
  'data.channelCount': pair('通道数', 'Channels'),
  'data.sampleCount': pair('采样点数', 'Samples'),
  'data.duration': pair('时长', 'Duration'),
  'data.startTime': pair('起始时间', 'Start time'),
  'data.source': pair('来源', 'Source'),
  'data.importedAt': pair('导入时间', 'Imported'),
  'data.saveName': pair('保存名称', 'Save name'),
  'data.rename': pair('重命名', 'Rename'),
  'data.export': pair('导出', 'Export'),
  'data.channelList': pair('通道列表', 'Channels'),
  'data.unit': pair('单位', 'Unit'),
  'data.noMarkers': pair(
    '当前数据集没有 Marker。可在波形工具栏从 Cursor A 添加，或打开 Marker 管理页。',
    'This dataset has no markers. Add one from Cursor A in the waveform toolbar, or open Marker Manager.'
  ),
  'data.openMarkers': pair('打开 Marker 管理', 'Open Marker Manager'),
  'data.stats': pair('统计', 'Statistics'),
  'data.deleteTitle': pair('删除数据集', 'Delete dataset'),
  'data.deleteMessage': pair(
    '确定删除数据集「{name}」？工程中的副本文件也会被删除，此操作不可撤销。',
    'Delete dataset "{name}"? The copied file in the project will also be removed. This cannot be undone.'
  ),

  'wave.zoomIn': pair('放大', 'Zoom in'),
  'wave.zoomOut': pair('缩小', 'Zoom out'),
  'wave.lanes': pair('通道显示', 'Visible lanes'),
  'wave.clearCursors': pair('清除 Cursor', 'Clear cursors'),
  'wave.addMarker': pair('从 Cursor A 添加 Marker', 'Add marker at Cursor A'),
  'wave.moveUp': pair('上移', 'Move up'),
  'wave.moveDown': pair('下移', 'Move down'),
  'wave.hint': pair('滚轮缩放，Shift+拖动平移，点击放置 Cursor。', 'Scroll to zoom, Shift+drag to pan, click to place a cursor.'),
  'wave.noMarkers': pair('还没有 Marker。', 'No markers yet.'),

  'signal.kicker': pair('Signal Analysis', 'Signal Analysis'),
  'signal.title': pair('信号分析', 'Signal analysis'),
  'signal.desc': pair(
    '对选定通道计算时域统计，或应用去直流 / 低通 / 高通 / 带通 / 陷波，滤波结果保存为新的数据集。',
    'Compute time-domain statistics, or apply DC-remove / low-pass / high-pass / band-pass / notch filters. Filter output is saved as a new dataset.'
  ),
  'signal.needProject': pair('请先新建或打开工程，并导入数据集后再进行分析。', 'Create or open a project and import a dataset before analysis.'),
  'signal.noDataset': pair('当前工程还没有可分析的数据集。', 'This project has no dataset to analyze.'),
  'signal.channels': pair('分析通道', 'Channels'),
  'signal.running': pair('分析中…', 'Analyzing…'),
  'signal.run': pair('运行分析', 'Run analysis'),
  'signal.filter': pair('数字滤波', 'Digital filter'),
  'signal.cutoff': pair('截止频率 (Hz)', 'Cutoff (Hz)'),
  'signal.lowHz': pair('下限频率 (Hz)', 'Low (Hz)'),
  'signal.highHz': pair('上限频率 (Hz)', 'High (Hz)'),
  'signal.notchHz': pair('陷波频率 (Hz)', 'Notch (Hz)'),
  'signal.q': pair('品质因数 Q', 'Quality factor Q'),
  'signal.nyquist': pair('奈奎斯特 {value} Hz', 'Nyquist {value} Hz'),
  'signal.filterHint': pair(
    '二阶 Butterworth（陷波为 IIR notch）。未勾选的通道原样复制。结果写入工程 data 目录。',
    'Second-order Butterworth (IIR notch for notch). Unchecked channels are copied as-is. Output is written to the project data folder.'
  ),
  'signal.filtering': pair('滤波中…', 'Filtering…'),
  'signal.applyFilter': pair('应用滤波并保存', 'Apply filter and save'),
  'signal.results': pair('分析结果', 'Results'),
  'signal.computed': pair('计算于 {time} · {samples} samples · {duration}', 'Computed {time} · {samples} samples · {duration}'),
  'signal.written': pair('已写入 {path}', 'Wrote {path}'),
  'signal.empty': pair(
    '选择通道和区间后点击“运行分析”。结果会保存到工程的 analysis 目录。',
    'Select channels and a range, then click Run analysis. Results are saved under analysis/ in the project.'
  ),
  'signal.filterResult': pair('滤波结果', 'Filter result'),
  'signal.filterCreated': pair(
    '已生成数据集 {name} · {channels} ch · {samples} samples',
    'Created dataset {name} · {channels} ch · {samples} samples'
  ),
  'signal.openData': pair('打开数据浏览', 'Open Data Browser'),
  'signal.toSpectrum': pair('去频谱验证', 'Verify in Spectrum'),

  'spectrum.kicker': pair('Spectrum Analysis', 'Spectrum Analysis'),
  'spectrum.title': pair('频谱分析', 'Spectrum analysis'),
  'spectrum.desc': pair(
    '对选定通道做 FFT，显示频率轴、幅度谱、功率谱和峰值频率。',
    'Run FFT on selected channels and show frequency axis, magnitude, power, and peak frequency.'
  ),
  'spectrum.needProject': pair('请先新建或打开工程，并导入数据集后再进行频谱分析。', 'Create or open a project and import a dataset before spectrum analysis.'),
  'spectrum.noDataset': pair('当前工程还没有可分析的数据集。', 'This project has no dataset to analyze.'),
  'spectrum.fftSize': pair('FFT 点数', 'FFT size'),
  'spectrum.window': pair('窗函数', 'Window'),
  'spectrum.running': pair('分析中…', 'Analyzing…'),
  'spectrum.run': pair('运行 FFT', 'Run FFT'),
  'spectrum.plot': pair('频谱', 'Spectrum'),
  'spectrum.show': pair('显示', 'Display'),
  'spectrum.magnitude': pair('幅度谱', 'Magnitude'),
  'spectrum.power': pair('功率谱', 'Power'),
  'spectrum.plotChannel': pair('绘图通道', 'Plot channel'),
  'spectrum.meta': pair(
    '计算于 {time} · FFT {size} · Δf {df} Hz · Nyquist {nyquist} Hz',
    'Computed {time} · FFT {size} · Δf {df} Hz · Nyquist {nyquist} Hz'
  ),
  'spectrum.peakFrequency': pair('峰值频率', 'Peak frequency'),
  'spectrum.peakMagnitude': pair('峰值幅度', 'Peak magnitude'),
  'spectrum.peakPower': pair('峰值功率', 'Peak power'),
  'spectrum.usedSamples': pair('使用点数', 'Used samples'),
  'spectrum.empty': pair(
    '选择通道、FFT 点数和窗函数后点击“运行 FFT”。结果会保存到工程的 analysis 目录。',
    'Select channels, FFT size, and window, then click Run FFT. Results are saved under analysis/ in the project.'
  ),

  'marker.kicker': pair('Marker Manager', 'Marker Manager'),
  'marker.title': pair('Marker 管理', 'Marker manager'),
  'marker.desc': pair(
    '为当前数据集添加、编辑、删除 Marker，并跳转到波形对应位置。保存工程后重新打开仍然保留。',
    'Add, edit, or delete markers on the current dataset and jump to them on the waveform. They persist after you save the project.'
  ),
  'marker.needProject': pair('请先新建或打开工程，并导入数据集后再管理 Marker。', 'Create or open a project and import a dataset before managing markers.'),
  'marker.noDataset': pair('当前工程还没有数据集。', 'This project has no dataset yet.'),
  'marker.edit': pair('编辑 {name}', 'Edit {name}'),
  'marker.addTitle': pair('添加 Marker', 'Add marker'),
  'marker.elapsed': pair('相对时间 (s)', 'Elapsed (s)'),
  'marker.channelOptional': pair('关联通道（可选）', 'Linked channel (optional)'),
  'marker.allChannels': pair('全部通道', 'All channels'),
  'marker.add': pair('添加', 'Add'),
  'marker.save': pair('保存修改', 'Save changes'),
  'marker.jump': pair('跳转到波形', 'Jump to waveform'),
  'marker.clearForm': pair('清空表单', 'Clear form'),
  'marker.list': pair('Marker 列表', 'Markers'),
  'marker.empty': pair(
    '还没有 Marker。填写左侧表单后点击「添加」，或在波形页用 Cursor A 一键添加。',
    'No markers yet. Fill the form and click Add, or add from Cursor A on the waveform page.'
  ),
  'marker.deleteTitle': pair('删除 Marker', 'Delete marker'),
  'marker.deleteMessage': pair('确定删除 Marker「{name}」？', 'Delete marker "{name}"?'),

  'generator.kicker': pair('Data Generator', 'Data Generator'),
  'generator.title': pair('数据发生器', 'Data generator'),
  'generator.desc': pair(
    '生成正弦、方波、三角波、直流、噪声或多频信号，并写入当前工程的 data 目录。',
    'Generate sine, square, triangle, DC, noise, or multi-tone signals into the current project data folder.'
  ),
  'generator.needProject': pair('请先新建或打开工程，再生成测试数据。', 'Create or open a project before generating data.'),
  'generator.datasetName': pair('数据集名称', 'Dataset name'),
  'generator.kind': pair('波形类型', 'Waveform'),
  'generator.duration': pair('时长 (s)', 'Duration (s)'),
  'generator.preview': pair(
    '将生成 {channels} 通道 × {samples} 点',
    'Will generate {channels} channels × {samples} samples'
  ),
  'generator.nyquist': pair('奈奎斯特 {value} Hz', 'Nyquist {value} Hz'),
  'generator.busy': pair('生成中…', 'Generating…'),
  'generator.run': pair('生成并加入工程', 'Generate and add to project'),
  'generator.viewData': pair('查看数据浏览', 'Open Data Browser'),
  'generator.help1': pair('各通道使用相同波形，相位按通道均匀错开，便于在波形页区分。', 'Each channel uses the same waveform with evenly spaced phase so traces are easy to tell apart.'),
  'generator.help2': pair('多频叠加为基频 + 2 倍频 + 3 倍频。', 'Multi-tone is the fundamental plus 2× and 3× harmonics.'),
  'generator.help3': pair('生成结果保存为 JSON，可重新打开工程后继续使用。', 'Output is saved as JSON and reloads when you reopen the project.'),
  'generator.help4': pair('单通道最多 1,000,000 点，最多 32 通道。频率必须低于采样率的一半。', 'At most 1,000,000 samples per channel and 32 channels. Frequency must be below Nyquist.'),
  'generator.help5': pair('生成后可到波形、信号分析、频谱分析中验证。', 'Verify afterwards on the waveform, signal analysis, and spectrum pages.'),

  'live.kicker': pair('Live Monitor', 'Live Monitor'),
  'live.title': pair('实时监视', 'Live monitor'),
  'live.desc': pair(
    'Virtual DAQ 在进程内组包、校验并写入环形缓冲，不依赖真实采集卡。传输方式为回环，不是 TCP/UDP 网口。',
    'Virtual DAQ packs, checks, and writes a ring buffer in-process. This is loopback, not a real DAQ card or TCP/UDP port.'
  ),
  'live.state': pair('状态：{state}', 'State: {state}'),
  'live.loopback': pair('回环', 'Loopback'),
  'live.deviceName': pair('设备名称', 'Device name'),
  'live.buffer': pair('缓冲点数', 'Buffer samples'),
  'live.packet': pair('每包点数', 'Samples per packet'),
  'live.waveform': pair('波形', 'Waveform'),
  'live.captureName': pair('写入工程名称', 'Capture name'),
  'live.capture': pair('将缓冲写入工程', 'Write buffer to project'),
  'live.needProject': pair('写入工程需要先打开工程。', 'Open a project before capturing to disk.'),
  'live.openData': pair('打开数据浏览', 'Open Data Browser'),
  'live.elapsed': pair('运行时间', 'Elapsed'),
  'live.packets': pair('数据包', 'Packets'),
  'live.dropped': pair('丢包（序号缺口）', 'Dropped (sequence gaps)'),
  'live.invalid': pair('无效包', 'Invalid packets'),
  'live.overflow': pair('覆盖旧点', 'Overwritten samples'),

  'export.kicker': pair('Export', 'Export'),
  'export.title': pair('数据导出', 'Data export'),
  'export.desc': pair(
    '将当前数据集导出为 CSV / TXT / JSON / DSB，写入工程的 exports 目录。导出走任务系统，可暂停或取消。',
    'Export the current dataset as CSV / TXT / JSON / DSB into the project exports folder. Export runs as a task and can be paused or cancelled.'
  ),
  'export.needProject': pair('请先新建或打开工程，并导入数据集后再导出。', 'Create or open a project and import a dataset before exporting.'),
  'export.noDataset': pair('当前工程还没有可导出的数据集。', 'This project has no dataset to export.'),
  'export.fileName': pair('文件名（不含扩展名）', 'File name (without extension)'),
  'export.channels': pair('导出通道', 'Channels'),
  'export.busy': pair('导出中…', 'Exporting…'),
  'export.run': pair('导出到 exports/', 'Export to exports/'),
  'export.help1': pair('CSV / TXT 表头为 timestamp,通道名...，可再导入。', 'CSV / TXT headers are timestamp,channel,... and can be imported again.'),
  'export.help2': pair(
    'TXT 使用制表符分隔；JSON 为行主序 [timestamp, ch1, ...]，避免与通道主序混淆。',
    'TXT is tab-separated. JSON is row-major [timestamp, ch1, ...] so it is not mistaken for channel-major data.'
  ),
  'export.help3': pair('文件写入当前工程 exports/，重名会自动加序号。', 'Files go to the current project exports/ folder. Duplicate names get a numeric suffix.'),
  'export.help4': pair('磁盘满、没有权限或路径无效会显示错误，不会假装成功。', 'Disk full, permission, or invalid path errors are shown; export does not pretend to succeed.'),
  'export.help5': pair(
    'DSB 是 DataScope 私有二进制（魔数 DSB1、小端 Float64、CRC32），可再导入。',
    'DSB is the DataScope private binary format (magic DSB1, little-endian float64, CRC32) and can be imported again.'
  ),
  'export.last': pair('最近一次导出', 'Last export'),

  'task.kicker': pair('Task Manager', 'Task Manager'),
  'task.title': pair('任务管理', 'Task manager'),
  'task.desc': pair(
    '导入、生成、滤波、时域分析、频谱分析和导出会进入后台任务。可在检查点暂停、继续、取消或失败后重试。进度按通道或读写步骤协作更新。',
    'Import, generate, filter, time-domain, spectrum, and export run as background tasks. Pause, resume, cancel, or retry at checkpoints. Progress updates per channel or I/O step.'
  ),
  'task.allStatus': pair('全部状态', 'All statuses'),
  'task.clearFinished': pair('清除已结束', 'Clear finished'),
  'task.colTask': pair('任务', 'Task'),
  'task.colKind': pair('类型', 'Kind'),
  'task.colStatus': pair('状态', 'Status'),
  'task.colProgress': pair('进度', 'Progress'),
  'task.colDuration': pair('耗时', 'Duration'),
  'task.colStarted': pair('开始时间', 'Started'),
  'task.colMessage': pair('说明', 'Message'),
  'task.colActions': pair('操作', 'Actions'),
  'task.emptyFilter': pair('没有符合筛选条件的任务。', 'No tasks match this filter.'),
  'task.empty': pair('还没有任务。导入、生成、滤波、分析或导出后会显示在这里。', 'No tasks yet. Import, generate, filter, analyze, or export to see them here.'),

  'log.kicker': pair('Logs', 'Logs'),
  'log.title': pair('日志查看', 'Logs'),
  'log.desc': pair(
    '查看主进程与渲染进程记录的 DEBUG / INFO / WARNING / ERROR 日志。',
    'Inspect DEBUG / INFO / WARNING / ERROR logs from the main and renderer processes.'
  ),
  'log.allLevels': pair('全部级别', 'All levels'),
  'log.search': pair('搜索日志', 'Search logs'),
  'log.time': pair('时间', 'Time'),
  'log.level': pair('级别', 'Level'),
  'log.source': pair('来源', 'Source'),
  'log.message': pair('消息', 'Message'),
  'log.empty': pair('暂无日志。', 'No log entries.'),

  'phase.placeholder': pair(
    '此模块页面框架已就绪，具体业务将在对应开发阶段实现。',
    'This page shell is ready. The feature lands in its own development stage.'
  ),

  'waveform.sine': pair('正弦波', 'Sine'),
  'waveform.square': pair('方波', 'Square'),
  'waveform.triangle': pair('三角波', 'Triangle'),
  'waveform.dc': pair('直流', 'DC'),
  'waveform.noise': pair('随机噪声', 'Noise'),
  'waveform.multiFrequency': pair('多频叠加', 'Multi-tone'),

  'daq.state.disconnected': pair('未连接', 'Disconnected'),
  'daq.state.connected': pair('已连接', 'Connected'),
  'daq.state.ready': pair('就绪', 'Ready'),
  'daq.state.running': pair('采集中', 'Running'),
  'daq.state.paused': pair('已暂停', 'Paused'),
  'daq.state.stopped': pair('已停止', 'Stopped'),
  'daq.state.error': pair('错误', 'Error'),

  'daq.command.connect': pair('连接', 'Connect'),
  'daq.command.arm': pair('准备', 'Arm'),
  'daq.command.start': pair('开始', 'Start'),
  'daq.command.pause': pair('暂停', 'Pause'),
  'daq.command.resume': pair('继续', 'Resume'),
  'daq.command.stop': pair('停止', 'Stop'),
  'daq.command.disconnect': pair('断开', 'Disconnect'),
  'daq.command.reset': pair('复位', 'Reset'),

  'task.status.pending': pair('等待', 'Pending'),
  'task.status.running': pair('运行中', 'Running'),
  'task.status.paused': pair('已暂停', 'Paused'),
  'task.status.completed': pair('已完成', 'Completed'),
  'task.status.failed': pair('失败', 'Failed'),
  'task.status.cancelled': pair('已取消', 'Cancelled'),

  'task.kind.import': pair('导入', 'Import'),
  'task.kind.generate': pair('生成', 'Generate'),
  'task.kind.filter': pair('滤波', 'Filter'),
  'task.kind.analyze': pair('时域分析', 'Time-domain'),
  'task.kind.spectrum': pair('频谱分析', 'Spectrum'),
  'task.kind.export': pair('导出', 'Export'),

  'task.command.pause': pair('暂停', 'Pause'),
  'task.command.resume': pair('继续', 'Resume'),
  'task.command.cancel': pair('取消', 'Cancel'),
  'task.command.retry': pair('重试', 'Retry'),

  'marker.type.event': pair('事件', 'Event'),
  'marker.type.peak': pair('峰值', 'Peak'),
  'marker.type.interval': pair('区间', 'Interval'),
  'marker.type.custom': pair('自定义', 'Custom'),

  'filter.kind.dcRemove': pair('去直流', 'DC remove'),
  'filter.kind.lowpass': pair('低通', 'Low-pass'),
  'filter.kind.highpass': pair('高通', 'High-pass'),
  'filter.kind.bandpass': pair('带通', 'Band-pass'),
  'filter.kind.notch': pair('陷波', 'Notch')
} as const

export type MessageKey = keyof typeof messages

export const WAVEFORM_MESSAGE_KEYS: Record<WaveformKind, MessageKey> = {
  sine: 'waveform.sine',
  square: 'waveform.square',
  triangle: 'waveform.triangle',
  dc: 'waveform.dc',
  noise: 'waveform.noise',
  'multi-frequency': 'waveform.multiFrequency'
}

export const DAQ_STATE_MESSAGE_KEYS: Record<DaqState, MessageKey> = {
  disconnected: 'daq.state.disconnected',
  connected: 'daq.state.connected',
  ready: 'daq.state.ready',
  running: 'daq.state.running',
  paused: 'daq.state.paused',
  stopped: 'daq.state.stopped',
  error: 'daq.state.error'
}

export const DAQ_COMMAND_MESSAGE_KEYS: Record<DaqCommand, MessageKey> = {
  connect: 'daq.command.connect',
  arm: 'daq.command.arm',
  start: 'daq.command.start',
  pause: 'daq.command.pause',
  resume: 'daq.command.resume',
  stop: 'daq.command.stop',
  disconnect: 'daq.command.disconnect',
  reset: 'daq.command.reset'
}

export const TASK_STATUS_MESSAGE_KEYS: Record<TaskStatus, MessageKey> = {
  pending: 'task.status.pending',
  running: 'task.status.running',
  paused: 'task.status.paused',
  completed: 'task.status.completed',
  failed: 'task.status.failed',
  cancelled: 'task.status.cancelled'
}

export const TASK_KIND_MESSAGE_KEYS: Record<TaskKind, MessageKey> = {
  import: 'task.kind.import',
  generate: 'task.kind.generate',
  filter: 'task.kind.filter',
  analyze: 'task.kind.analyze',
  spectrum: 'task.kind.spectrum',
  export: 'task.kind.export'
}

export const TASK_COMMAND_MESSAGE_KEYS: Record<TaskCommand, MessageKey> = {
  pause: 'task.command.pause',
  resume: 'task.command.resume',
  cancel: 'task.command.cancel',
  retry: 'task.command.retry'
}

export const MARKER_TYPE_MESSAGE_KEYS: Record<MarkerType, MessageKey> = {
  event: 'marker.type.event',
  peak: 'marker.type.peak',
  interval: 'marker.type.interval',
  custom: 'marker.type.custom'
}

export const FILTER_KIND_MESSAGE_KEYS: Record<FilterKind, MessageKey> = {
  'dc-remove': 'filter.kind.dcRemove',
  lowpass: 'filter.kind.lowpass',
  highpass: 'filter.kind.highpass',
  bandpass: 'filter.kind.bandpass',
  notch: 'filter.kind.notch'
}

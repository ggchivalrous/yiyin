import { streamMap } from './base';
import { logType, oneDay } from './const';
import { EOutPutMode } from './interface';
export const config = {};
export const task = {
    id: null,
    interval: 0,
};
let init = false;
export const setLoggerConfig = (opts) => {
    if (init)
        return;
    init = true;
    Object.assign(config, getDefConfig(opts));
    const minLogType = logType.findIndex((level) => level === config.level);
    config.exportType = logType.filter((v, i) => i >= minLogType);
    if (config.task.run) {
        task.interval = config.task.interval;
        task.id = setInterval(logFileToDone, config.task.interval);
    }
};
export const getDefConfig = (opts = {}) => {
    const mode = (typeof opts.exportMode === 'string' ? opts.exportMode : config.exportMode) || 'CONSOLE';
    return {
        system: opts.system || config.system || 'default',
        namespace: opts.namespace || config.namespace || '-',
        path: opts.path || config.path || './logs',
        pattern: opts.pattern || config.pattern || '{TIME} [{LEVEL}] [{NAME}] ',
        timeFormat: opts.timeFormat || config.timeFormat || 'yyyy-MM-dd hh:mm:ss',
        recordSecond: opts.recordSecond || config.recordSecond || oneDay,
        level: opts.level || config.level || logType[0],
        logDir: config.logDir || 'log',
        errDir: config.errDir || 'err',
        exportMode: mode,
        exportType: config.exportType || [],
        outputMode: opts.outputMode || config.outputMode || EOutPutMode.text,
        task: {
            run: config.task?.run || opts.task?.run || false,
            interval: config.task?.interval || opts.task?.interval || 30000,
        },
    };
};
export const isInit = () => init;
export const logFileToDone = () => {
    const now = Date.now();
    for (const [, streamInfo] of streamMap) {
        if (streamInfo.switchTs <= now) {
            if (streamInfo.errWriter)
                streamInfo.errWriter.close();
            if (streamInfo.infoWriter)
                streamInfo.infoWriter.close();
            streamInfo.errWriter = null;
            streamInfo.infoWriter = null;
        }
    }
};
//# sourceMappingURL=config.js.map
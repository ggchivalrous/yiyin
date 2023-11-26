"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logFileToDone = exports.isInit = exports.getDefConfig = exports.setLoggerConfig = exports.task = exports.config = void 0;
const base_1 = require("./base");
const const_1 = require("./const");
const interface_1 = require("./interface");
exports.config = {};
exports.task = {
    id: null,
    interval: 0,
};
let init = false;
const setLoggerConfig = (opts) => {
    if (init)
        return;
    init = true;
    Object.assign(exports.config, (0, exports.getDefConfig)(opts));
    const minLogType = const_1.logType.findIndex((level) => level === exports.config.level);
    exports.config.exportType = const_1.logType.filter((v, i) => i >= minLogType);
    if (exports.config.task.run) {
        exports.task.interval = exports.config.task.interval;
        exports.task.id = setInterval(exports.logFileToDone, exports.config.task.interval);
    }
};
exports.setLoggerConfig = setLoggerConfig;
const getDefConfig = (opts = {}) => {
    const mode = (typeof opts.exportMode === 'string' ? opts.exportMode : exports.config.exportMode) || 'CONSOLE';
    return {
        system: opts.system || exports.config.system || 'default',
        namespace: opts.namespace || exports.config.namespace || '-',
        path: opts.path || exports.config.path || './logs',
        pattern: opts.pattern || exports.config.pattern || '{TIME} [{LEVEL}] [{NAME}] ',
        timeFormat: opts.timeFormat || exports.config.timeFormat || 'yyyy-MM-dd hh:mm:ss',
        recordSecond: opts.recordSecond || exports.config.recordSecond || const_1.oneDay,
        level: opts.level || exports.config.level || const_1.logType[0],
        logDir: exports.config.logDir || 'log',
        errDir: exports.config.errDir || 'err',
        exportMode: mode,
        exportType: exports.config.exportType || [],
        outputMode: opts.outputMode || exports.config.outputMode || interface_1.EOutPutMode.text,
        task: {
            run: exports.config.task?.run || opts.task?.run || false,
            interval: exports.config.task?.interval || opts.task?.interval || 30000,
        },
    };
};
exports.getDefConfig = getDefConfig;
const isInit = () => init;
exports.isInit = isInit;
const logFileToDone = () => {
    const now = Date.now();
    for (const [, streamInfo] of base_1.streamMap) {
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
exports.logFileToDone = logFileToDone;
//# sourceMappingURL=config.js.map
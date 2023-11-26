"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Base = exports.streamMap = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = require("path");
const util_1 = __importDefault(require("util"));
const config_1 = require("../src/config");
const const_1 = require("../src/const");
const interface_1 = require("./interface");
const utils_1 = require("./utils");
exports.streamMap = new Map();
class Base {
    namespace = '';
    config;
    closing = false;
    constructor(namespace, opts) {
        this.config = (0, config_1.getDefConfig)({ ...(opts || {}), namespace });
        this.namespace = this.config.namespace;
        if (opts?.pathName) {
            this.config.pathName = opts.pathName;
        }
    }
    log(type, msg, opts) {
        if (!(0, config_1.isInit)()) {
            throw new Error('日志未初始化，请先使用 setLoggerConfig 初始化日志配置');
        }
        if (this.config.exportType.includes(type)) {
            const isErrType = const_1.errType.includes(type);
            let log;
            let stream;
            if (this.closing || interface_1.EExportModel[this.config.exportMode] !== interface_1.EExportModel.FILE) {
                // eslint-disable-next-line no-console
                log = isErrType ? console.error : console.log;
            }
            if (!this.closing && interface_1.EExportModel[this.config.exportMode] > interface_1.EExportModel.CONSOLE) {
                const _stream = this.getStream(isErrType);
                if (_stream) {
                    stream = _stream;
                }
            }
            let writeHandle;
            switch (this.config.outputMode) {
                case 'json':
                    writeHandle = this.json.bind(this);
                    break;
                default:
                    writeHandle = this.text.bind(this);
            }
            if (log) {
                log(writeHandle(type, true, msg, opts));
            }
            if (stream) {
                stream.write(`${writeHandle(type, false, msg, opts)}\n`);
            }
        }
        return this;
    }
    getStream(isErrType) {
        const streamInfo = exports.streamMap.get(this.config.pathName || 'default') || {};
        let stream = isErrType ? streamInfo.errWriter : streamInfo.infoWriter;
        if (!streamInfo.switchTs || streamInfo.switchTs <= Date.now()) {
            streamInfo.switchTs = Date.now() + this.config.recordSecond * 1e3;
            if (stream) {
                stream.end();
                stream.close();
            }
            stream = null;
        }
        if (!stream) {
            const _streamInfo = this.createStream(isErrType);
            if (!_streamInfo)
                return false;
            if (isErrType) {
                streamInfo.errWriter = _streamInfo.stream;
                streamInfo.errCloseing = _streamInfo.closeing;
            }
            else {
                streamInfo.infoWriter = _streamInfo.stream;
                streamInfo.logCloseing = _streamInfo.closeing;
            }
            stream = _streamInfo.stream;
            exports.streamMap.set(this.config.pathName || 'default', streamInfo);
        }
        return stream;
    }
    createStream(isErrType) {
        const path = (0, path_1.join)(this.config.path, this.config.pathName || '', isErrType ? this.config.errDir : this.config.logDir);
        const stream = this.createLogStream(path);
        if (!stream) {
            return false;
        }
        const closeing = new Promise((resolve) => {
            stream.once('close', () => {
                this.tmpToLog(stream);
                resolve();
            });
        });
        return { stream, closeing };
    }
    createLogStream(path) {
        try {
            if (!path) {
                return false;
            }
            const file = (0, path_1.join)(path, `${(0, utils_1.formatDate)('yyyy-MM-dd_hh_mm_ss')}.tmp`);
            fs_1.default.mkdirSync(path, { recursive: true });
            const stream = fs_1.default.createWriteStream(file, { flags: 'a' });
            stream.on('error', (e) => {
                // eslint-disable-next-line no-console
                console.log(`${this.namespace} 日志文件流出错: `, e);
            });
            return stream;
        }
        catch (e) {
            // eslint-disable-next-line no-console
            console.log(`${this.namespace} 创建日志文件流失败！`, e);
        }
        return false;
    }
    json(level, useColor = true, msg, opts) {
        return JSON.stringify({
            system: this.config.system,
            namespace: this.namespace,
            time: (0, utils_1.formatDate)(this.config.timeFormat),
            level: useColor ? this.formatColor(level, level) : level,
            content: util_1.default.format(msg, ...opts),
        });
    }
    text(level, useColor = true, msg, opts) {
        return this.config.pattern
            .replace('{TIME}', (0, utils_1.formatDate)(this.config.timeFormat))
            .replace('{LEVEL}', useColor ? this.formatColor(level, level) : level)
            .replace('{NAME}', this.namespace)
            .replace(/\s\[\]/ig, '') + util_1.default.format(msg, ...opts);
    }
    formatColor(type, str) {
        let color;
        switch (type) {
            case interface_1.LOG_TYPE.DEBUG:
                return str;
            case interface_1.LOG_TYPE.INFO:
                color = 32;
                break;
            case interface_1.LOG_TYPE.ERROR:
            case interface_1.LOG_TYPE.FATAL:
                color = 31;
                break;
            case interface_1.LOG_TYPE.WARN:
                color = 33;
                break;
            default:
        }
        return `\x1b[${color}m${str}\x1b[39m`;
    }
    tmpToLog(stream) {
        try {
            const path = stream.path.toString();
            const parseInfo = (0, path_1.parse)(path);
            if (fs_1.default.existsSync(path)) {
                fs_1.default.renameSync(path, (0, path_1.join)(parseInfo.dir, `${parseInfo.name}.log`));
            }
        }
        catch (e) {
            // ignore
        }
    }
}
exports.Base = Base;
//# sourceMappingURL=base.js.map
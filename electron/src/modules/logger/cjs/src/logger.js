"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.instances = void 0;
const interface_1 = require("./interface");
const base_1 = require("./base");
exports.instances = new Map();
class Logger extends base_1.Base {
    constructor(namespace, opts) {
        super(namespace, opts);
        // 是否存在相同名称的Logger实例
        const logger = exports.instances.get(this.namespace);
        if (logger) {
            // eslint-disable-next-line no-constructor-return
            return logger;
        }
        exports.instances.set(this.namespace, this);
    }
    debug(message, ...opts) {
        return this.log(interface_1.LOG_TYPE.DEBUG, message, opts);
    }
    error(message, ...opts) {
        return this.log(interface_1.LOG_TYPE.ERROR, message, opts);
    }
    info(message, ...opts) {
        return this.log(interface_1.LOG_TYPE.INFO, message, opts);
    }
    warn(message, ...opts) {
        return this.log(interface_1.LOG_TYPE.WARN, message, opts);
    }
    fatal(message, ...opts) {
        return this.log(interface_1.LOG_TYPE.FATAL, message, opts);
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map
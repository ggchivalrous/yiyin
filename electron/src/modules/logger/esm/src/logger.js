import { LOG_TYPE } from './interface';
import { Base } from './base';
export const instances = new Map();
export class Logger extends Base {
    constructor(namespace, opts) {
        super(namespace, opts);
        // 是否存在相同名称的Logger实例
        const logger = instances.get(this.namespace);
        if (logger) {
            // eslint-disable-next-line no-constructor-return
            return logger;
        }
        instances.set(this.namespace, this);
    }
    debug(message, ...opts) {
        return this.log(LOG_TYPE.DEBUG, message, opts);
    }
    error(message, ...opts) {
        return this.log(LOG_TYPE.ERROR, message, opts);
    }
    info(message, ...opts) {
        return this.log(LOG_TYPE.INFO, message, opts);
    }
    warn(message, ...opts) {
        return this.log(LOG_TYPE.WARN, message, opts);
    }
    fatal(message, ...opts) {
        return this.log(LOG_TYPE.FATAL, message, opts);
    }
}
//# sourceMappingURL=logger.js.map
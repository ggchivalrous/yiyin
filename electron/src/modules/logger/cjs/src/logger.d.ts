import { LoggerOptions } from './interface';
import { Base } from './base';
export declare const instances: Map<string, Logger>;
export declare class Logger extends Base {
    constructor(namespace?: string, opts?: LoggerOptions);
    debug(message?: any, ...opts: any[]): this;
    error(message?: any, ...opts: any[]): this;
    info(message?: any, ...opts: any[]): this;
    warn(message?: any, ...opts: any[]): this;
    fatal(message?: any, ...opts: any[]): this;
}

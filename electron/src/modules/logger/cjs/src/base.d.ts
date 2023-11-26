/// <reference types="node" />
import fs from 'fs';
import { LOG_TYPE, LoggerConfig, LoggerOptions } from './interface';
interface StreamInfo {
    switchTs: number;
    errWriter: fs.WriteStream;
    infoWriter: fs.WriteStream;
    errCloseing: Promise<void>;
    logCloseing: Promise<void>;
}
export declare const streamMap: Map<string, Partial<StreamInfo>>;
export declare class Base {
    namespace: string;
    readonly config: LoggerConfig;
    private closing;
    constructor(namespace?: string, opts?: LoggerOptions);
    protected log(type: LOG_TYPE, msg: any, opts: any[]): this;
    private getStream;
    private createStream;
    private createLogStream;
    private json;
    private text;
    private formatColor;
    private tmpToLog;
}
export {};

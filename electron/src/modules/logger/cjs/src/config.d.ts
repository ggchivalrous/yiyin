/// <reference types="node" />
import { Config, Options } from './interface';
export declare const config: Partial<Config>;
export declare const task: {
    id: NodeJS.Timer;
    interval: number;
};
export declare const setLoggerConfig: (opts?: Options) => void;
export declare const getDefConfig: (opts?: Options) => Config;
export declare const isInit: () => boolean;
export declare const logFileToDone: () => void;

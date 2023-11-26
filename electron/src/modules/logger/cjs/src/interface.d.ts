export declare enum LOG_TYPE {
    DEBUG = "DEBUG",
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR",
    FATAL = "FATAL",
    OFF = "OFF"
}
export declare enum EOutPutMode {
    json = "json",
    text = "text"
}
export declare type TLOG_TYPE = keyof typeof LOG_TYPE;
export declare type OutPutMode = keyof typeof EOutPutMode;
export declare enum EExportModel {
    CONSOLE = 0,
    FILE = 1,
    CONSOLE_FILE = 2
}
export declare type TExportModel = keyof typeof EExportModel;
export interface IOptions {
    namespace: string;
    /**
     * 日志输出目录
     */
    path: string;
    /**
     * 日志信息前缀格式
     * @default '{TIME} [{LEVEL}] [{NAME}] '
     */
    pattern: string;
    /**
     * 时间格式 y M d h m s q季度 S毫秒
     * @default 'yyyy-MM-dd hh:mm:ss'
     */
    timeFormat: string;
    /**
     * 日志文件更换间隔(秒)
     */
    recordSecond: number;
    /**
     * 日志输出最小等级
     */
    level: TLOG_TYPE;
    /**
     * 输出模式
     */
    exportMode: TExportModel;
    /**
     * 输出内容模式
     */
    outputMode: OutPutMode;
    /**
     * 指定使用日志的系统名
     */
    system: string;
    task?: {
        /**
         * 开启日志检查任务
         *
         * 不开启时没有日志输出时文件可能超时间不处理成done
         *
         * 只会在setLoggerConfig时生效
         */
        run: boolean;
        /**
         * 任务执行间隔
         * @default - 30000
         */
        interval?: number;
    };
}
export declare type Options = Partial<IOptions>;
export interface Config extends IOptions {
    logDir?: string;
    errDir?: string;
    exportType?: TLOG_TYPE[];
}
export interface LoggerConfig extends Readonly<Config> {
    /** 日志输出文件夹名称 */
    pathName?: string;
}
export interface LoggerOptions extends Options {
    /** 日志输出文件夹名称 */
    pathName?: string;
}
export interface WriteHandle {
    (level: LOG_TYPE, useColor: boolean, msg: any, opts: any[]): string;
}

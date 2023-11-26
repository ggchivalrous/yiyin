/* eslint-disable no-shadow */
export var LOG_TYPE;
(function (LOG_TYPE) {
    LOG_TYPE["DEBUG"] = "DEBUG";
    LOG_TYPE["INFO"] = "INFO";
    LOG_TYPE["WARN"] = "WARN";
    LOG_TYPE["ERROR"] = "ERROR";
    LOG_TYPE["FATAL"] = "FATAL";
    LOG_TYPE["OFF"] = "OFF";
})(LOG_TYPE || (LOG_TYPE = {}));
export var EOutPutMode;
(function (EOutPutMode) {
    EOutPutMode["json"] = "json";
    EOutPutMode["text"] = "text";
})(EOutPutMode || (EOutPutMode = {}));
// eslint-disable-next-line no-shadow
export var EExportModel;
(function (EExportModel) {
    EExportModel[EExportModel["CONSOLE"] = 0] = "CONSOLE";
    EExportModel[EExportModel["FILE"] = 1] = "FILE";
    EExportModel[EExportModel["CONSOLE_FILE"] = 2] = "CONSOLE_FILE";
})(EExportModel || (EExportModel = {}));
//# sourceMappingURL=interface.js.map
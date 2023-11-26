"use strict";
/* eslint-disable no-shadow */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EExportModel = exports.EOutPutMode = exports.LOG_TYPE = void 0;
var LOG_TYPE;
(function (LOG_TYPE) {
    LOG_TYPE["DEBUG"] = "DEBUG";
    LOG_TYPE["INFO"] = "INFO";
    LOG_TYPE["WARN"] = "WARN";
    LOG_TYPE["ERROR"] = "ERROR";
    LOG_TYPE["FATAL"] = "FATAL";
    LOG_TYPE["OFF"] = "OFF";
})(LOG_TYPE = exports.LOG_TYPE || (exports.LOG_TYPE = {}));
var EOutPutMode;
(function (EOutPutMode) {
    EOutPutMode["json"] = "json";
    EOutPutMode["text"] = "text";
})(EOutPutMode = exports.EOutPutMode || (exports.EOutPutMode = {}));
// eslint-disable-next-line no-shadow
var EExportModel;
(function (EExportModel) {
    EExportModel[EExportModel["CONSOLE"] = 0] = "CONSOLE";
    EExportModel[EExportModel["FILE"] = 1] = "FILE";
    EExportModel[EExportModel["CONSOLE_FILE"] = 2] = "CONSOLE_FILE";
})(EExportModel = exports.EExportModel || (exports.EExportModel = {}));
//# sourceMappingURL=interface.js.map
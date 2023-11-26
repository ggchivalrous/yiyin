"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeAllLogger = exports.Logger = exports.setLoggerConfig = void 0;
const base_1 = require("./src/base");
const config_1 = require("./src/config");
var config_2 = require("./src/config");
Object.defineProperty(exports, "setLoggerConfig", { enumerable: true, get: function () { return config_2.setLoggerConfig; } });
var logger_1 = require("./src/logger");
Object.defineProperty(exports, "Logger", { enumerable: true, get: function () { return logger_1.Logger; } });
const closeAllLogger = async () => {
    if (config_1.task.id)
        clearInterval(config_1.task.id);
    for (const [, ins] of base_1.streamMap) {
        try {
            if (ins.errWriter) {
                ins.errWriter.end();
                ins.errWriter.close();
                await ins.errCloseing;
            }
            if (ins.infoWriter) {
                ins.infoWriter.end();
                ins.infoWriter.close();
                await ins.logCloseing;
            }
        }
        catch {
            // ignore
        }
    }
};
exports.closeAllLogger = closeAllLogger;
//# sourceMappingURL=index.js.map
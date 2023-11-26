import { streamMap } from './src/base';
import { task } from './src/config';
export { setLoggerConfig } from './src/config';
export { Logger } from './src/logger';
export const closeAllLogger = async () => {
    if (task.id)
        clearInterval(task.id);
    for (const [, ins] of streamMap) {
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
//# sourceMappingURL=index.js.map
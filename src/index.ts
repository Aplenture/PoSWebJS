/**
 * Aplenture/PoSWebJS
 * https://github.com/Aplenture/PoSWebJS
 * Copyright (c) 2023 Aplenture
 * License https://github.com/Aplenture/PoSWebJS/blob/main/LICENSE
 */

import * as FrontendJS from "frontendjs";
import { RootViewController } from "./controllers/rootViewController";

(async function () {
    const config = await new FrontendJS.JSONRequest('/config.json')
        .send()
        .catch(() => console.warn('/config.json is missing or invalid') as any || undefined)

    await FrontendJS.Client.init(new RootViewController(), config);
})();
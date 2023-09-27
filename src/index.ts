/**
 * Aplenture/<my_app_name>
 * https://github.com/Aplenture/<my_app_name>
 * Copyright (c) 2023 Aplenture
 * License https://github.com/Aplenture/<my_app_name>/blob/main/LICENSE
 */

import * as FrontendJS from "frontendjs";
import { RootViewController } from "./controllers";

(async function () {
    const config = await new FrontendJS.JSONRequest('/config.json')
        .send()
        .catch(() => console.warn('/config.json is missing or invalid') as any || undefined)

    await FrontendJS.Client.init(new RootViewController(), config);
})();
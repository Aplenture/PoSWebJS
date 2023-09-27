/**
 * Aplenture/<my_app_name>
 * https://github.com/Aplenture/<my_app_name>
 * Copyright (c) 2023 Aplenture
 * License https://github.com/Aplenture/<my_app_name>/blob/main/LICENSE
 */

import * as FrontendJS from "frontendjs";

export class IndexViewController extends FrontendJS.ViewController {
    constructor(...classes: string[]) {
        super(...classes, 'index-view-controller');
    }

    public async load(): Promise<void> {
        const label = new FrontendJS.Label('hello-world-label');

        label.text = 'hello world!';

        this.view.appendChild(label);

        await super.load();
    }
}
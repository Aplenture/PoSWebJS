/**
 * Aplenture/PoSWebJS
 * https://github.com/Aplenture/PoSWebJS
 * Copyright (c) 2023 Aplenture
 * License https://github.com/Aplenture/PoSWebJS/blob/main/LICENSE
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
/**
 * Aplenture/<my_app_name>
 * https://github.com/Aplenture/<my_app_name>
 * Copyright (c) 2023 Aplenture
 * License https://github.com/Aplenture/<my_app_name>/blob/main/LICENSE
 */

import * as FrontendJS from "frontendjs";
import { IndexViewController } from "./indexViewController";

export class RootViewController extends FrontendJS.ViewController {
    public readonly account = new FrontendJS.Account.Account();
    public readonly server = new FrontendJS.Server('my_fancy_server', this.account);

    constructor(...classes: string[]) {
        super(...classes, 'root-view-controller');
    }

    public async prepare(preparer: FrontendJS.ClientPreparer): Promise<void> {
        await this.server.prepare(preparer);
        await super.prepare(preparer);
    }

    public async init(): Promise<void> {
        await this.server.init();

        // unload previous route
        FrontendJS.Router.onRouteChanged.on(() => super.unload(), { listener: this });
        FrontendJS.Router.onRouteChanged.on(() => this.removeAllChildren(), { listener: this });

        // add all routes
        FrontendJS.Router.addRoute('index', () => this.appendChild(new IndexViewController()), { listener: this });
        // FrontendJS.Router.addRoute('my_route_name', () => this.appendChild(new MyRouteViewController()), { listener: this });

        // reload changed route
        FrontendJS.Router.onRouteChanged.on(() => super.load(), { listener: this });

        await super.init();
    }

    public async load(): Promise<void> {
        await this.server.load();
        await super.load();
    }

    public async unload(): Promise<void> {
        await this.server.unload();
        await super.unload();
    }

    public async start(): Promise<void> {
        await this.server.start();
        await super.start();

        if (!this.account.hasAccess)
            await FrontendJS.Client.popupViewController.pushViewController(new FrontendJS.Account.LoginViewController(this.account));
    }
}
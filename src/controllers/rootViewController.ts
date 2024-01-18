/**
 * Aplenture/PoSWebJS
 * https://github.com/Aplenture/PoSWebJS
 * Copyright (c) 2023 Aplenture
 * License https://github.com/Aplenture/PoSWebJS/blob/main/LICENSE
 */

import * as CoreJS from "corejs";
import * as FrontendJS from "frontendjs";
import { AccessViewController } from "./accessViewController";
import { MainViewController } from "./mainViewController";
import { AdminViewController } from "./adminViewController";
import { SettingsViewController } from "./settingsViewController";
import { Balance } from "../models/balance";
import { Customer } from "../models/customer";
import { Finance } from "../models/finance";
import { Order } from "../models/order";
import { OrderProduct } from "../models/orderProduct";
import { Product } from "../models/product";
import { Label } from "../models/label";

export class RootViewController extends FrontendJS.ViewController {
    public readonly contentViewController = new FrontendJS.ViewController('root-content-view-controller');
    public readonly loadingViewController = new FrontendJS.LoadingViewController('root-loading-view-controller');

    public readonly settingsButton = new FrontendJS.Button('settings-button');

    public readonly account = new FrontendJS.Account.Account();
    public readonly server = new FrontendJS.Server('pos',
        this.account,
        Balance,
        Customer,
        Finance,
        Order,
        OrderProduct,
        Product,
        Label
    );

    constructor(...classes: string[]) {
        super(...classes, 'root-view-controller');

        this.settingsButton.type = FrontendJS.ButtonType.Settings;
        this.settingsButton.isTextHidden = true;
        this.settingsButton.onClick.on(() => FrontendJS.Router.changeRoute(SettingsViewController.route));
    }

    public async prepare(preparer: FrontendJS.ClientPreparer): Promise<void> {
        preparer.add(new CoreJS.NumberParameter("discount", "default product discount", 30));

        await this.server.prepare(preparer);
        await super.prepare(preparer);
    }

    public async init(): Promise<void> {
        await this.server.init();

        // unload previous route
        FrontendJS.Router.onRouteChanged.on(() => this.contentViewController.unload(), { listener: this });
        FrontendJS.Router.onRouteChanged.on(() => this.contentViewController.removeAllChildren(), { listener: this });

        // add all routes
        FrontendJS.Router.addRoute(AccessViewController.route, () => this.onAccessRoute(), { listener: this });
        FrontendJS.Router.addRoute(MainViewController.route, () => this.onMainRoute(), { listener: this });
        FrontendJS.Router.addRoute(AdminViewController.route, () => this.onAdminRoute(), { listener: this });
        FrontendJS.Router.addRoute(SettingsViewController.route, () => this.onSettingsRoute(), { listener: this });

        // reload changed route
        FrontendJS.Router.onRouteChanged.on(() => this.contentViewController.load(), { listener: this });

        this.account.onAccessChanged.on(access => {
            if (!access && FrontendJS.Router.route.name != AccessViewController.route)
                return FrontendJS.Router.changeRoute(AccessViewController.route);

            if (access && FrontendJS.Router.route.name == AccessViewController.route)
                if (access.hasRights(1 << 0))
                    return FrontendJS.Router.changeRoute(AdminViewController.route);
                else
                    return FrontendJS.Router.changeRoute(MainViewController.route);
        });

        this.server.onRequestingStart.on(() => this.loadingViewController.play());
        this.server.onRequestingDone.on(() => this.loadingViewController.stop());

        this.appendChild(this.contentViewController);
        this.appendChild(this.loadingViewController);

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
            FrontendJS.Router.changeRoute(AccessViewController.route);
    }

    private onAccessRoute() {
        if (!this.account.access)
            return this.contentViewController.appendChild(new AccessViewController(this.account));

        if (this.account.access.hasRights(1 << 0))
            return FrontendJS.Router.changeRoute(AdminViewController.route);

        return FrontendJS.Router.changeRoute(MainViewController.route);
    }

    private onMainRoute() {
        if (!this.account.access)
            return FrontendJS.Router.changeRoute(AccessViewController.route);

        const viewController = new MainViewController(this.account);
        viewController.titleBar.rightView.appendChild(this.settingsButton);
        this.contentViewController.appendChild(viewController);
    }

    private onAdminRoute() {
        if (!this.account.access)
            return FrontendJS.Router.changeRoute(AccessViewController.route);

        const viewController = new AdminViewController();
        viewController.titleBar.rightView.appendChild(this.settingsButton);
        this.contentViewController.appendChild(viewController);
    }

    private onSettingsRoute() {
        if (!this.account.access)
            return FrontendJS.Router.changeRoute(AccessViewController.route);

        const viewController = new SettingsViewController(this.account);
        this.contentViewController.appendChild(viewController);
    }
}
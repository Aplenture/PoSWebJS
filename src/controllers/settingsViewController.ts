/**
 * Aplenture/PoSWebJS
 * https://github.com/Aplenture/PoSWebJS
 * Copyright (c) 2023 Aplenture
 * License https://github.com/Aplenture/PoSWebJS/blob/main/LICENSE
 */

import * as FrontendJS from "frontendjs";
import { AccessesViewController, CurrentAccessViewController, LogoutViewController, PasswordViewController } from "frontendjs/dist/account";

export class SettingsViewController extends FrontendJS.BodyViewController {
    public static readonly route = 'settings';

    public readonly menuViewController = new FrontendJS.MenuViewController();

    public readonly backButton = new FrontendJS.Button('back-button');

    constructor(public readonly account: FrontendJS.Account.Account, ...classes: string[]) {
        super(...classes, 'settings-view-controller');

        this.titleBar.titleLabel.isHidden = true;
        this.footerBar.isHidden = true;

        this.backButton.type = FrontendJS.ButtonType.Back;
        this.backButton.onClick.on(() => FrontendJS.Router.back());

        this.menuViewController.titleBar = this.titleBar;
        this.menuViewController.footerBar = this.footerBar;

        this.titleBar.leftView.appendChild(this.backButton);

        this.appendChild(this.menuViewController);

        if (this.account.hasRights(1 << 0)) {
            this.menuViewController.appendChild(new AccessesViewController(this.account, new FrontendJS.Account.AccessViewController(this.account)));
            this.menuViewController.appendChild(new PasswordViewController(this.account));
            this.menuViewController.appendChild(new LogoutViewController(this.account));
        } else {
            this.menuViewController.appendChild(new CurrentAccessViewController(this.account));
        }
    }
} 
/**
 * Aplenture/PoSWebJS
 * https://github.com/Aplenture/PoSWebJS
 * Copyright (c) 2023 Aplenture
 * License https://github.com/Aplenture/PoSWebJS/blob/main/LICENSE
 */

import * as FrontendJS from "frontendjs";

export class AccessViewController extends FrontendJS.MenuViewController {
    public static readonly route = 'login';

    public readonly loginViewController: FrontendJS.Account.LoginViewController;
    public readonly apiViewController: FrontendJS.Account.CurrentAccessViewController;

    constructor(account: FrontendJS.Account.Account, ...classes: string[]) {
        super(...classes, 'access-view-controller');

        this.loginViewController = new FrontendJS.Account.LoginViewController(account);
        this.apiViewController = new FrontendJS.Account.CurrentAccessViewController(account);

        this.appendChild(this.loginViewController);
        this.appendChild(this.apiViewController);
    }
}
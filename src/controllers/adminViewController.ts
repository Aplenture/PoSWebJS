/**
 * Aplenture/PoSWebJS
 * https://github.com/Aplenture/PoSWebJS
 * Copyright (c) 2023 Aplenture
 * License https://github.com/Aplenture/PoSWebJS/blob/main/LICENSE
 */

import * as FrontendJS from "frontendjs";
import { CustomersTableViewController } from "./customersTableViewController";
import { ProductsTableViewController } from "./productsTableViewController";
import { PaymentMethod } from "../enums/paymentMethod";

export class AdminViewController extends FrontendJS.BodyViewController {
    public static readonly route = 'admin';

    public readonly menuViewController = new FrontendJS.MenuViewController();

    public readonly membersTableViewController = new CustomersTableViewController();
    public readonly guestsTableViewController = new CustomersTableViewController();
    public readonly productsTableViewController = new ProductsTableViewController();

    constructor(...classes: string[]) {
        super(...classes, 'admin-view-controller');

        this.title = '#_title_admin';
        this.titleBar.titleLabel.isHidden = true;

        this.appendChild(this.menuViewController);

        this.menuViewController.titleBar = this.titleBar;
        this.menuViewController.footerBar = this.footerBar;

        this.membersTableViewController.paymentMethods = PaymentMethod.Balance;
        this.membersTableViewController.title = '#_title_members';
        this.membersTableViewController.tableViewController.titleLabel.text = '#_title_members';
        
        this.guestsTableViewController.paymentMethods = PaymentMethod.Cash;
        this.guestsTableViewController.title = '#_title_guests';
        this.guestsTableViewController.tableViewController.titleLabel.text = '#_title_guests';

        this.menuViewController.appendChild(this.membersTableViewController);
        this.menuViewController.appendChild(this.guestsTableViewController);
        this.menuViewController.appendChild(this.productsTableViewController);
    }
} 
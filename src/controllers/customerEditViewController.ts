/**
 * Aplenture/PoSWebJS
 * https://github.com/Aplenture/PoSWebJS
 * Copyright (c) 2023 Aplenture
 * License https://github.com/Aplenture/PoSWebJS/blob/main/LICENSE
 */

import * as CoreJS from "corejs";
import * as FrontendJS from "frontendjs";
import { Customer } from "../models/customer";

export class CustomerEditViewController extends FrontendJS.BodyViewController {
    public readonly onCreated = new CoreJS.Event<CustomerEditViewController, Customer>('CustomerEditViewController.onCreated');
    public readonly onUpdated = new CoreJS.Event<CustomerEditViewController, Customer>('CustomerEditViewController.onUpdated');

    public readonly nameTextField = new FrontendJS.TextField('name-text-field');

    public readonly createButton = new FrontendJS.Button('create-button');
    public readonly updateButton = new FrontendJS.Button('update-button');

    public paymentMethods: number;

    private _customer: Customer = null;

    constructor(...classes: string[]) {
        super(...classes, 'create-customer-view-controller');

        this.nameTextField.title = '#_title_name';
        this.nameTextField.onEnterKey.on(() => this.onEnterKey());

        this.createButton.text = '#_title_create';
        this.createButton.onClick.on(() => this.create());

        this.updateButton.text = '#_title_update';
        this.updateButton.onClick.on(() => this.update());

        this.contentView.appendChild(this.nameTextField);

        this.footerBar.appendChild(this.createButton);
        this.footerBar.appendChild(this.updateButton);
    }

    public get customer(): Customer { return this._customer; }
    public set customer(value: Customer) {
        this._customer = value;

        this.updateButton.isHidden = !value;
        this.createButton.isVisible = !value;
    }

    public async load(): Promise<void> {
        this.titleBar.titleLabel.text = this.customer
            ? this.customer.toString()
            : '#_title_create_customer';

        if (this.customer) {
            this.nameTextField.value = this.customer.firstname;
        }

        await super.load();
    }

    public async unload(): Promise<void> {
        this.nameTextField.value = '';

        await super.unload();
    }

    public focus() {
        this.nameTextField.focus();
    }

    public async create(): Promise<Customer | void> {
        const name = this.nameTextField.value;

        if (!name)
            return await FrontendJS.Client.popupViewController.pushMessage('#_error_missing_customer_name', '#_title_create_customer')
                .then(() => this.nameTextField.focus());

        this.customer = await Customer.add(name, this.paymentMethods);

        FrontendJS.Client.notificationViewController.pushNotification({ text: '#_notification_customer_created' });

        this.onCreated.emit(this, this.customer);

        return this.customer;
    }

    public async update(): Promise<boolean> {
        if (!await Customer.edit(this.customer.id, this.nameTextField.value))
            return false;

        FrontendJS.Client.notificationViewController.pushNotification({ text: '#_notification_customer_updated' });

        this.onUpdated.emit(this, this.customer);

        return true;
    }

    private onEnterKey() {
        if (this.customer)
            this.update();
        else
            this.create();
    }
}
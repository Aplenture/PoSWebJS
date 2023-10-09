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

    public readonly firstnameTextField = new FrontendJS.TextField('firstname-text-field');
    public readonly lastnameTextField = new FrontendJS.TextField('lastname-text-field');

    public readonly createButton = new FrontendJS.Button('create-button');
    public readonly updateButton = new FrontendJS.Button('update-button');

    public paymentMethods: number;

    private _customer: Customer = null;

    constructor(...classes: string[]) {
        super(...classes, 'create-customer-view-controller');

        this.firstnameTextField.title = '#_title_firstname';
        this.firstnameTextField.onEnterKey.on(() => this.onEnterKey());

        this.lastnameTextField.title = '#_title_lastname';
        this.lastnameTextField.onEnterKey.on(() => this.onEnterKey());

        this.createButton.text = '#_title_create';
        this.createButton.onClick.on(() => this.create());

        this.updateButton.text = '#_title_update';
        this.updateButton.onClick.on(() => this.update());

        this.contentView.appendChild(this.firstnameTextField);
        this.contentView.appendChild(this.lastnameTextField);

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
            this.firstnameTextField.value = this.customer.firstname;
            this.lastnameTextField.value = this.customer.lastname;
        }

        await super.load();
    }

    public async unload(): Promise<void> {
        this.firstnameTextField.value = '';
        this.lastnameTextField.value = '';

        await super.unload();
    }

    public focus() {
        this.firstnameTextField.focus();
    }

    public async create(): Promise<Customer | void> {
        const firstname = this.firstnameTextField.value;

        if (!firstname)
            return await FrontendJS.Client.popupViewController.pushMessage('#_error_missing_customer_firstname', '#_title_create_customer')
                .then(() => this.firstnameTextField.focus());

        const lastname = this.lastnameTextField.value;

        // if (!lastname)
        //     return await FrontendJS.Client.popupViewController.pushMessage('#_error_missing_customer_lastname', '#_title_create_customer')
        //         .then(() => this.lastnameTextField.focus());

        this.customer = await Customer.add({
            firstname,
            lastname,
            paymentmethods: this.paymentMethods
        });

        FrontendJS.Client.notificationViewController.pushNotification({ text: '#_notification_customer_created' });

        this.onCreated.emit(this, this.customer);

        return this.customer;
    }

    public async update(): Promise<boolean> {
        const result = await Customer.edit({
            customer: this.customer.id,
            firstname: this.firstnameTextField.value,
            lastname: this.lastnameTextField.value
        });

        if (!result)
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
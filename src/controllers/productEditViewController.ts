/**
 * Aplenture/PoSWebJS
 * https://github.com/Aplenture/PoSWebJS
 * Copyright (c) 2023 Aplenture
 * License https://github.com/Aplenture/PoSWebJS/blob/main/LICENSE
 */

import * as CoreJS from "corejs";
import * as FrontendJS from "frontendjs";
import { Product } from "../models/product";

export class ProductEditViewController extends FrontendJS.BodyViewController {
    public readonly onCreated = new CoreJS.Event<ProductEditViewController, Product>('ProductEditViewController.onCreated');
    public readonly onUpdated = new CoreJS.Event<ProductEditViewController, Product>('ProductEditViewController.onUpdated');

    public readonly nameTextField = new FrontendJS.TextField('name-text-field');
    public readonly priceTextField = new FrontendJS.TextField('price-text-field');

    public readonly createButton = new FrontendJS.Button('create-button');
    public readonly updateButton = new FrontendJS.Button('update-button');

    private _product: Product = null;

    constructor(...classes: string[]) {
        super(...classes, 'create-product-view-controller');

        this.nameTextField.title = '#_title_name';
        this.nameTextField.onEnterKey.on(() => this.onEnterKey());

        this.priceTextField.type = FrontendJS.TextFieldType.Currency;
        this.priceTextField.title = '#_title_price';
        this.priceTextField.onEnterKey.on(() => this.onEnterKey());

        this.createButton.text = '#_title_create';
        this.createButton.onClick.on(() => this.create());

        this.updateButton.text = '#_title_update';
        this.updateButton.onClick.on(() => this.update());

        this.contentView.appendChild(this.nameTextField);
        this.contentView.appendChild(this.priceTextField);

        this.footerBar.appendChild(this.createButton);
        this.footerBar.appendChild(this.updateButton);
    }

    public get product(): Product { return this._product; }
    public set product(value: Product) {
        this._product = value;

        this.updateButton.isHidden = !value;
        this.createButton.isVisible = !value;
    }

    public async load(): Promise<void> {
        this.titleBar.titleLabel.text = this.product
            ? this.product.name
            : '#_title_create_product';

        if (this.product) {
            this.nameTextField.value = this.product.name;
            this.priceTextField.value = this.product.price.toString();
        }

        await super.load();
    }

    public async unload(): Promise<void> {
        this.nameTextField.value = '';
        this.priceTextField.value = '';

        await super.unload();
    }

    public focus() {
        this.nameTextField.focus();
    }

    public async create(): Promise<Product | void> {
        const name = this.nameTextField.value;

        if (!name)
            return await FrontendJS.Client.popupViewController.pushMessage('#_error_missing_product_name', '#_title_create_product')
                .then(() => this.nameTextField.focus());

        const price = this.priceTextField.numberValue;

        if (!price)
            return await FrontendJS.Client.popupViewController.pushMessage('#_error_missing_product_price', '#_title_create_product')
                .then(() => this.priceTextField.focus());

        this.product = await Product.add(name, price);

        FrontendJS.Client.notificationViewController.pushNotification({ text: '#_notification_product_created' });

        this.onCreated.emit(this, this.product);

        return this.product;
    }

    public async update(): Promise<boolean> {
        const data = {
            name: this.nameTextField.value,
            price: this.priceTextField.numberValue
        };

        if (!await Product.edit(this.product.id, data))
            return false;

        FrontendJS.Client.notificationViewController.pushNotification({ text: '#_notification_product_updated' });

        this.onUpdated.emit(this, this.product);

        return true;
    }

    private onEnterKey() {
        if (this.product)
            this.update();
        else
            this.create();
    }
}
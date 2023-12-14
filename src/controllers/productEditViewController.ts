/**
 * Aplenture/PoSWebJS
 * https://github.com/Aplenture/PoSWebJS
 * Copyright (c) 2023 Aplenture
 * License https://github.com/Aplenture/PoSWebJS/blob/main/LICENSE
 */

import * as CoreJS from "corejs";
import * as FrontendJS from "frontendjs";
import { Product } from "../models/product";
import { Label } from "../models/label";
import { LabelType } from "../enums/labelType";

export class ProductEditViewController extends FrontendJS.BodyViewController {
    public readonly onCreated = new CoreJS.Event<ProductEditViewController, Product>('ProductEditViewController.onCreated');
    public readonly onUpdated = new CoreJS.Event<ProductEditViewController, Product>('ProductEditViewController.onUpdated');

    public readonly nameTextField = new FrontendJS.TextField('name-text-field');
    public readonly priceTextField = new FrontendJS.TextField('price-text-field');
    public readonly categoryDropbox = new FrontendJS.Dropbox('category-dropbox');
    public readonly priorityTextField = new FrontendJS.TextField('priority-text-field');
    public readonly startTextField = new FrontendJS.TextField('start-text-field');
    public readonly endTextField = new FrontendJS.TextField('end-text-field');

    public readonly startSwitch = new FrontendJS.Switch('start-switch');
    public readonly endSwitch = new FrontendJS.Switch('end-switch');

    public readonly createButton = new FrontendJS.Button('create-button');
    public readonly updateButton = new FrontendJS.Button('update-button');

    private _product: Product = null;
    private _categories: Label[] = [];

    constructor(...classes: string[]) {
        super(...classes, 'create-product-view-controller');

        this.nameTextField.title = '#_title_name';
        this.nameTextField.onEnterKey.on(() => this.onEnterKey());

        this.priceTextField.type = FrontendJS.TextFieldType.Currency;
        this.priceTextField.title = '#_title_price';
        this.priceTextField.onEnterKey.on(() => this.onEnterKey());

        this.categoryDropbox.title = '#_title_category';
        this.categoryDropbox.onEnterKey.on(() => this.onEnterKey());

        this.priorityTextField.type = FrontendJS.TextFieldType.Number;
        this.priorityTextField.title = '#_title_priority';
        this.priorityTextField.onEnterKey.on(() => this.onEnterKey());

        this.startSwitch.title = '#_title_start';
        this.startSwitch.value = false;
        this.startSwitch.onChange.on(value => this.startTextField.isVisible = value);
        this.startSwitch.onChange.on(() => this.startTextField.dateValue = (this.product && this.product.start && new Date(this.product.start)) || CoreJS.calcDate());

        this.startTextField.type = FrontendJS.TextFieldType.Date;
        this.startTextField.title = '#_title_start';
        this.startTextField.isVisible = false;
        this.startTextField.onEnterKey.on(() => this.onEnterKey());

        this.endSwitch.title = '#_title_end';
        this.endSwitch.value = false;
        this.endSwitch.onChange.on(value => this.endTextField.isVisible = value);
        this.endSwitch.onChange.on(() => this.endTextField.dateValue = (this.product && this.product.end && new Date(this.product.end)) || CoreJS.addDate({ days: 6 }));

        this.endTextField.type = FrontendJS.TextFieldType.Date;
        this.endTextField.title = '#_title_end';
        this.endTextField.isVisible = false;
        this.endTextField.onEnterKey.on(() => this.onEnterKey());

        this.createButton.text = '#_title_create';
        this.createButton.onClick.on(() => this.create());

        this.updateButton.text = '#_title_update';
        this.updateButton.onClick.on(() => this.update());

        this.contentView.appendChild(this.nameTextField);
        this.contentView.appendChild(this.priceTextField);
        this.contentView.appendChild(this.categoryDropbox);
        this.contentView.appendChild(this.priorityTextField);
        this.contentView.appendChild(this.startSwitch);
        this.contentView.appendChild(this.startTextField);
        this.contentView.appendChild(this.endSwitch);
        this.contentView.appendChild(this.endTextField);

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
        this._categories = await Label.getAll(LabelType.Default, LabelType.ProductCategory);

        this.categoryDropbox.options = this._categories.map(data => data.name);
        this.categoryDropbox.selectedIndex = -1;

        this.titleBar.titleLabel.text = this.product
            ? this.product.name
            : '#_title_create_product';

        if (this.product) {
            this.nameTextField.value = this.product.name;
            this.priceTextField.numberValue = this.product.price;
            this.categoryDropbox.selectedIndex = this._categories.findIndex(data => data.id == this.product.category);
            this.priorityTextField.numberValue = this.product.priority;
            this.startSwitch.value = !!this.product.start;
            this.startTextField.isVisible = !!this.product.start;
            this.startTextField.dateValue = new Date(this.product.start);
            this.endSwitch.value = !!this.product.end;
            this.endTextField.isVisible = !!this.product.end;
            this.endTextField.dateValue = new Date(this.product.end);
        }

        await super.load();
    }

    public async unload(): Promise<void> {
        this.nameTextField.value = '';
        this.priceTextField.value = '';
        this.categoryDropbox.selectedIndex = -1;
        this.priorityTextField.value = '';
        this.startSwitch.value = false;
        this.startTextField.value = '';
        this.endSwitch.value = false;
        this.endTextField.value = '';

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

        const category = this._categories[this.categoryDropbox.selectedIndex];

        if (!category)
            return await FrontendJS.Client.popupViewController.pushMessage('#_error_missing_product_category', '#_title_create_product')
                .then(() => this.categoryDropbox.focus());

        const start = this.startSwitch.value ? this.startTextField.numberValue : null;
        const end = this.endSwitch.value ? this.endTextField.numberValue : null;

        this.product = await Product.add({
            name,
            price,
            category: category.id,
            priority: this.priorityTextField.numberValue,
            start: start,
            end: end
        });

        FrontendJS.Client.notificationViewController.pushNotification({ text: '#_notification_product_created' });

        this.onCreated.emit(this, this.product);

        return this.product;
    }

    public async update(): Promise<boolean> {
        const name = this.nameTextField.value;

        if (!name)
            return await FrontendJS.Client.popupViewController.pushMessage('#_error_missing_product_name', '#_title_create_product')
                .then(() => this.nameTextField.focus())
                .then(() => false);

        const price = this.priceTextField.numberValue;

        if (!price)
            return await FrontendJS.Client.popupViewController.pushMessage('#_error_missing_product_price', '#_title_create_product')
                .then(() => this.priceTextField.focus())
                .then(() => false);

        const category = this._categories[this.categoryDropbox.selectedIndex];

        if (!category)
            return await FrontendJS.Client.popupViewController.pushMessage('#_error_missing_product_category', '#_title_create_product')
                .then(() => this.categoryDropbox.focus())
                .then(() => false);

        const start = this.startSwitch.value ? this.startTextField.numberValue : null;
        const end = this.endSwitch.value ? this.endTextField.numberValue : null;

        const data = {
            name,
            price,
            category: category.id,
            priority: this.priorityTextField.numberValue,
            start,
            end
        };

        if (!await Product.edit(this.product.id, data))
            return false;

        FrontendJS.Client.notificationViewController.pushNotification({ text: '#_notification_product_updated' });

        this.onUpdated.emit(this, this.product);

        return true;
    }

    public selectCategoryByID(id: number) {
        this.categoryDropbox.selectedIndex = this._categories.findIndex(data => data.id == id);
    }

    private onEnterKey() {
        if (this.product)
            this.update();
        else
            this.create();
    }
}
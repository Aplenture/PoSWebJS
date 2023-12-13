/**
 * Aplenture/PoSWebJS
 * https://github.com/Aplenture/PoSWebJS
 * Copyright (c) 2023 Aplenture
 * License https://github.com/Aplenture/PoSWebJS/blob/main/LICENSE
 */

import * as CoreJS from "corejs";
import * as FrontendJS from "frontendjs";
import { ProductEditViewController } from "./productEditViewController";
import { Product } from "../models/product";
import { Label } from "../models/label";
import { LabelType } from "../enums/labelType";

export class ProductsTableViewController extends FrontendJS.ViewController implements FrontendJS.TableViewControllerDataSource {
    public readonly tableViewController = new FrontendJS.TableViewController();
    public readonly productViewController = new ProductEditViewController();

    public readonly addButton = new FrontendJS.Button('add-button');
    public readonly categoryDropbox = new FrontendJS.Dropbox('category-dropbox');
    public readonly dateTextField = new FrontendJS.TextField('date-text-field');

    private _products: readonly Product[] = [];
    private _categories: readonly Label[] = [];

    constructor(...classes: string[]) {
        super(...classes, 'products-table-view-controller');

        const filterView = new FrontendJS.View('filter-view', 'horizontal-view');

        this.title = '#_title_products'

        this.tableViewController.titleLabel.text = '#_title_products';
        this.tableViewController.dataSource = this;
        this.tableViewController.selectionMode = FrontendJS.TableSelectionMode.Clickable;
        this.tableViewController.onSelectedCell.on(cell => this.select(this._products[cell.index]));

        this.productViewController.onUpdated.on(() => this.load());
        this.productViewController.onUpdated.on(() => this.productViewController.removeFromParent());

        this.productViewController.onCreated.on(() => this.load());
        this.productViewController.onCreated.on(() => this.productViewController.removeFromParent());

        this.addButton.type = FrontendJS.ButtonType.Add;
        this.addButton.onClick.on(() => this.add());

        this.categoryDropbox.title = '#_title_category';
        this.categoryDropbox.onSelected.on(() => this.load());

        this.dateTextField.title = '#_title_date';
        this.dateTextField.type = FrontendJS.TextFieldType.Date;
        this.dateTextField.dateValue = CoreJS.calcDate();
        this.dateTextField.onChange.on(() => this.load());

        this.view.appendChild(filterView);

        this.appendChild(this.tableViewController);

        filterView.appendChild(this.dateTextField);
        filterView.appendChild(this.categoryDropbox);
    }

    public get selectedCategory(): number {
        if (!this._categories[this.categoryDropbox.selectedIndex])
            return 1;

        return this._categories[this.categoryDropbox.selectedIndex].id;
    }

    public async load(): Promise<void> {
        const selectedCategory = this.categoryDropbox.selectedIndex;

        this._categories = await Label.getAll(LabelType.ProductCategory);

        this.categoryDropbox.options = this._categories.map(data => data.name);
        this.categoryDropbox.selectedIndex = selectedCategory;

        this._products = await Product.get({ time: Number(this.dateTextField.dateValue), category: this.selectedCategory });

        this.titleBar.leftView.appendChild(this.addButton);

        await super.load();
    }

    public async unload(): Promise<void> {
        this.titleBar.leftView.removeChild(this.addButton);
        this.dateTextField.dateValue = CoreJS.calcDate();

        await super.unload();
    }

    public numberOfCells(sender: FrontendJS.TableViewController, category: number): number {
        return this._products.length;
    }

    public createHeader?(sender: FrontendJS.TableViewController): FrontendJS.View {
        return new Cell();
    }

    public createCell(sender: FrontendJS.TableViewController, category: number): FrontendJS.View {
        return new Cell();
    }

    public updateCell(sender: FrontendJS.TableViewController, cell: Cell, row: number, category: number): void {
        const product = this._products[row];

        cell.numberLabel.text = (row + 1).toString();
        cell.nameLabel.text = product.name;
        cell.priceLabel.text = CoreJS.formatCurrency(product.price);
    }

    public add(): Promise<void> {
        this.productViewController.product = null;

        return FrontendJS.Client.popupViewController.pushViewController(this.productViewController);
    }

    public select(product: Product): Promise<void> {
        this.productViewController.product = product;

        return FrontendJS.Client.popupViewController.pushViewController(this.productViewController);
    }
}

class Cell extends FrontendJS.View {
    public readonly numberLabel = new FrontendJS.Label('number-label');
    public readonly nameLabel = new FrontendJS.Label('name-label');
    public readonly priceLabel = new FrontendJS.Label('price-label');

    constructor(...classes: string[]) {
        super(...classes);

        this.numberLabel.text = '#';
        this.nameLabel.text = '#_title_name';
        this.priceLabel.text = '#_title_price';

        this.appendChild(this.numberLabel);
        this.appendChild(this.nameLabel);
        this.appendChild(this.priceLabel);
    }
}
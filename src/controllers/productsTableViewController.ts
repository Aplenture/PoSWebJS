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

export class ProductsTableViewController extends FrontendJS.ViewController implements FrontendJS.TableViewControllerDataSource {
    public readonly tableViewController = new FrontendJS.TableViewController();
    public readonly productViewController = new ProductEditViewController();

    public readonly addButton = new FrontendJS.Button('add-button');

    private products: readonly Product[] = [];

    constructor(...classes: string[]) {
        super(...classes, 'products-table-view-controller');

        this.title = '#_title_products'

        this.tableViewController.titleLabel.text = '#_title_products';
        this.tableViewController.dataSource = this;
        this.tableViewController.selectionMode = FrontendJS.TableSelectionMode.Clickable;
        this.tableViewController.onSelectedCell.on(cell => this.select(this.products[cell.index]));

        this.productViewController.onUpdated.on(() => this.load());
        this.productViewController.onUpdated.on(() => this.productViewController.removeFromParent());

        this.productViewController.onCreated.on(() => this.load());
        this.productViewController.onCreated.on(() => this.productViewController.removeFromParent());

        this.addButton.type = FrontendJS.ButtonType.Add;
        this.addButton.onClick.on(() => this.add());

        this.appendChild(this.tableViewController);
    }

    public async load(): Promise<void> {
        this.products = (await Product.get()).sort((a, b) => a.name.localeCompare(b.name));

        this.titleBar.leftView.appendChild(this.addButton);

        await super.load();
    }

    public async unload(): Promise<void> {
        this.titleBar.leftView.removeChild(this.addButton);

        await super.unload();
    }

    public numberOfCells(sender: FrontendJS.TableViewController, category: number): number {
        return this.products.length;
    }

    public createHeader?(sender: FrontendJS.TableViewController): FrontendJS.View {
        return new Cell();
    }

    public createCell(sender: FrontendJS.TableViewController, category: number): FrontendJS.View {
        return new Cell();
    }

    public updateCell(sender: FrontendJS.TableViewController, cell: Cell, row: number, category: number): void {
        const product = this.products[row];

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
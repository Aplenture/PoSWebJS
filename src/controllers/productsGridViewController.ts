/**
 * Aplenture/PoSWebJS
 * https://github.com/Aplenture/PoSWebJS
 * Copyright (c) 2023 Aplenture
 * License https://github.com/Aplenture/PoSWebJS/blob/main/LICENSE
 */

import * as CoreJS from "corejs";
import * as FrontendJS from "frontendjs";
import { Product } from "../models/product";
import { ProductEditViewController } from "./productEditViewController";
import { GridViewController } from "./gridViewController";

export class ProductsGridViewController extends GridViewController {
    public readonly onSelectedProduct = new CoreJS.Event<ProductsGridViewController, Product>('ProductsGridViewController.onSelectedProduct');

    public readonly productViewController = new ProductEditViewController();

    private products: readonly Product[] = [];

    constructor(...classes: string[]) {
        super(...classes, "products-grid-view-controller");

        this.gridViewController.onSelectedCell.on(cell => this.selectCell(cell.index));

        this.productViewController.priorityTextField.isVisible = false
        this.productViewController.startSwitch.isVisible = false;
        this.productViewController.endSwitch.isVisible = false;
        this.productViewController.onCreated.on(() => this.load());
        this.productViewController.onCreated.on(() => this.productViewController.removeFromParent());
    }

    public async load(): Promise<void> {
        this.products = await Product.get({ time: Number(CoreJS.calcDate()) });

        await super.load();
    }

    public async unload(): Promise<void> {
        await super.unload();
    }

    public focus(): void {
        super.focus();
    }

    public numberOfCells(sender: FrontendJS.GridViewController): number {
        return this.products.length + 1;
    }

    public createCell(sender: FrontendJS.GridViewController, index: number): FrontendJS.View {
        return new Cell();
    }

    public updateCell(sender: FrontendJS.GridViewController, cell: Cell, index: number): void {
        if (index == this.products.length)
            return;

        const product = this.products[index];

        cell.nameLabel.text = product.name;
        cell.priceLabel.text = CoreJS.formatCurrency(product.price);
    }

    public add(): Promise<void> {
        this.productViewController.product = null;
        this.productViewController.startSwitch.value = true;
        this.productViewController.startTextField.dateValue = CoreJS.calcDate();
        this.productViewController.endSwitch.value = true;
        this.productViewController.endTextField.dateValue = CoreJS.addDate({ days: 6 });

        return FrontendJS.Client.popupViewController.pushViewController(this.productViewController);
    }

    public selectCell(index: number) {
        if (index == this.products.length)
            this.add();
        else
            this.onSelectedProduct.emit(this, this.products[index]);
    }
}

class Cell extends FrontendJS.View {
    public readonly nameLabel = new FrontendJS.Label('name-label');
    public readonly priceLabel = new FrontendJS.Label('price-label');

    constructor(...classes: string[]) {
        super(...classes);

        this.nameLabel.text = 'name';
        this.priceLabel.text = 'price';

        this.appendChild(this.nameLabel);
        this.appendChild(this.priceLabel);
    }
}
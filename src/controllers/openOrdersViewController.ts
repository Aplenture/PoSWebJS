/**
 * Aplenture/PoSWebJS
 * https://github.com/Aplenture/PoSWebJS
 * Copyright (c) 2023 Aplenture
 * License https://github.com/Aplenture/PoSWebJS/blob/main/LICENSE
 */

import * as CoreJS from "corejs";
import * as FrontendJS from "frontendjs";
import { Customer } from "../models/customer";
import { Order } from "../models/order";
import { OrderProduct } from "../models/orderProduct";
import { Product } from "../models/product";
import { OrderState } from "../enums/orderState";

export class OpenOrdersViewController extends FrontendJS.BodyViewController implements FrontendJS.TableViewControllerDataSource {
    public readonly onProductSelected = new CoreJS.Event<OpenOrdersViewController, Product>('OpenOrdersViewController.onProductSelected');

    public readonly tableViewController = new FrontendJS.TableViewController();

    public readonly payButton = new FrontendJS.Button('pay-button');

    public customer: Customer;

    private products: readonly Product[] = [];
    private orderProducts: readonly OrderProduct[] = [];
    private sum = 0;

    constructor(...classes: string[]) {
        super(...classes, 'open-orders-view-controller');

        this.titleBar.isHidden = true;

        this.tableViewController.titleLabel.text = '#_title_open_orders';
        this.tableViewController.dataSource = this;
        this.tableViewController.selectionMode = FrontendJS.TableSelectionMode.Clickable;
        this.tableViewController.onSelectedCell.on(cell => cell.index < this.orderProducts.length && this.onProductSelected.emit(this, this.products.find(product => product.id == this.orderProducts[cell.index].product)));

        this.payButton.text = '#_title_pay';

        this.appendChild(this.tableViewController);

        this.footerBar.appendChild(this.payButton);
    }

    public async load() {
        const orders = await Order.get({
            customer: this.customer.id,
            state: OrderState.Open
        });

        this.products = await Product.get();
        this.orderProducts = orders.map(order => order.products).flat();
        this.sum = orders
            .map(data => data.invoice)
            .reduce((a, b) => a + b, 0);

        this.payButton.isDisabled = !orders.length;

        await super.load();
    }

    public numberOfCells(sender: FrontendJS.TableViewController, category: number): number {
        return this.orderProducts.length + 2;
    }

    public createHeader?(sender: FrontendJS.TableViewController): FrontendJS.View {
        const cell = new Cell();

        return cell;
    }

    public createCell(sender: FrontendJS.TableViewController, category: number): FrontendJS.View {
        const cell = new Cell();

        return cell;
    }

    public updateCell(sender: FrontendJS.TableViewController, cell: Cell, row: number, category: number): void {
        if (row < this.orderProducts.length) {
            const orderProduct = this.orderProducts[row];
            const product = this.products.find(product => product.id == orderProduct.product);

            cell.amountLabel.text = orderProduct.amount.toString();
            cell.productLabel.text = product.name;
            cell.priceLabel.text = CoreJS.formatCurrency(orderProduct.price);
            cell.sumLabel.text = CoreJS.formatCurrency(orderProduct.invoice);
        } else if (row > this.orderProducts.length) {
            cell.sumLabel.text = CoreJS.formatCurrency(this.sum);
        }
    }
}

class Cell extends FrontendJS.View {
    public readonly amountLabel = new FrontendJS.Label('amount-Label');
    public readonly productLabel = new FrontendJS.Label('product-label');
    public readonly priceLabel = new FrontendJS.Label('price-label');
    public readonly sumLabel = new FrontendJS.Label('sum-label');

    constructor(...classes: string[]) {
        super(...classes);

        this.amountLabel.text = '#_title_amount';
        this.productLabel.text = '#_title_product';
        this.priceLabel.text = '#_title_price';
        this.sumLabel.text = '#_title_sum';

        this.appendChild(this.productLabel);
        this.appendChild(this.priceLabel);
        this.appendChild(this.amountLabel);
        this.appendChild(this.sumLabel);
    }
}
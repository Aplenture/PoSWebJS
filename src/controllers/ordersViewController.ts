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
import { Product } from "../models/product";
import { OrderState } from "../enums/orderState";

interface Data {
    readonly product: Product;
    readonly name: string;
    readonly price: number;
    readonly amount: number;
    readonly sum: number;
}

export class OrdersViewController extends FrontendJS.BodyViewController implements FrontendJS.TableViewControllerDataSource {
    public readonly onProductSelected = new CoreJS.Event<OrdersViewController, Product>('OpenOrdersViewController.onProductSelected');

    public readonly tableViewController = new FrontendJS.TableViewController();

    public readonly payButton = new FrontendJS.Button('pay-button');

    public customer: Customer;
    public state: OrderState;
    public date: Date;

    private data: readonly Data[] = [];
    private sum = 0;

    constructor(...classes: string[]) {
        super(...classes, 'orders-view-controller');

        this.titleBar.isHidden = true;

        this.tableViewController.titleLabel.text = '#_title_orders';
        this.tableViewController.dataSource = this;
        this.tableViewController.selectionMode = FrontendJS.TableSelectionMode.Clickable;
        this.tableViewController.onSelectedCell.on(cell => cell.index < this.data.length && this.onProductSelected.emit(this, this.data[cell.index].product));

        this.payButton.text = '#_title_pay';

        this.appendChild(this.tableViewController);

        this.footerBar.appendChild(this.payButton);
    }

    public async load() {
        const products = await Product.get();
        const orders = await Order.get({
            customer: this.customer.id,
            state: this.state,
            start: this.date && Number(this.date)
        });

        const orderProducts = orders
            .map(order => order.products)
            .flat();

        this.data = orderProducts
            .filter((data, index, array) => index == array.findIndex(tmp => tmp.product == data.product && tmp.price == data.price))
            .map(data => {
                const product = products.find(product => product.id == data.product);
                const orders = orderProducts.filter(tmp => tmp.product == data.product && tmp.price == data.price);
                const amount = orders.reduce((a, b) => a + b.amount, 0);

                return {
                    product,
                    amount,
                    name: product.name,
                    price: product.price,
                    sum: data.price * amount
                }
            });

        this.sum = orders
            .map(data => data.invoice)
            .reduce((a, b) => a + b, 0);

        this.payButton.isDisabled = !orders.length;

        await super.load();
    }

    public numberOfCells(sender: FrontendJS.TableViewController, category: number): number {
        return this.data.length + 2;
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
        if (row < this.data.length) {
            const product = this.data[row];

            cell.amountLabel.text = product.amount.toString();
            cell.productLabel.text = product.name;
            cell.priceLabel.text = CoreJS.formatCurrency(product.price);
            cell.sumLabel.text = CoreJS.formatCurrency(product.sum);
        } else if (row > this.data.length) {
            cell.sumLabel.text = CoreJS.formatCurrency(this.sum);
        }
    }
}

class Cell extends FrontendJS.View {
    public readonly amountLabel = new FrontendJS.Label('amount-label');
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
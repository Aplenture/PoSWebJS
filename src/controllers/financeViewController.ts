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

export class FinanceViewController extends FrontendJS.ViewController implements FrontendJS.TableViewControllerDataSource {
    public readonly tableViewController = new FrontendJS.TableViewController();

    public customer: Customer;
    public timeFrame: CoreJS.TimeFrame;

    private orders: readonly Order[] = [];
    private products: readonly Product[] = [];
    private orderProducts: readonly OrderProduct[] = [];
    private sum = 0;

    constructor(...classes: string[]) {
        super(...classes, 'invoices-view-controller');

        this.tableViewController.titleLabel.text = '#_title_invoices';
        this.tableViewController.dataSource = this;

        this.appendChild(this.tableViewController);
    }

    public async load() {
        this.products = await Product.get();
        this.orders = await Order.get({
            customer: this.customer.id,
            timeframe: this.timeFrame
        });

        this.orderProducts = this.orders.map(order => order.products).flat();
        this.sum = this.orders
            .map(data => data.invoice)
            .reduce((a, b) => a + b, 0);

        await super.load();
    }

    public numberOfCells(sender: FrontendJS.TableViewController, category: number): number {
        return this.orderProducts.length + 2;
    }

    public createHeader?(sender: FrontendJS.TableViewController): FrontendJS.View {
        const cell = new Cell();

        cell.dateLabel.isVisible = this.timeFrame != CoreJS.TimeFrame.Day;

        return cell;
    }

    public createCell(sender: FrontendJS.TableViewController, category: number): FrontendJS.View {
        const cell = new Cell();

        cell.dateLabel.isVisible = this.timeFrame != CoreJS.TimeFrame.Day;

        return cell;
    }

    public updateCell(sender: FrontendJS.TableViewController, cell: Cell, row: number, category: number): void {
        if (row < this.orderProducts.length) {
            const orderProduct = this.orderProducts[row];
            const product = this.products.find(product => product.id == orderProduct.product);
            const order = this.orders.find(order => order.id == orderProduct.order);

            cell.dateLabel.text = new Date(order.updated).toLocaleDateString();
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
    public readonly dateLabel = new FrontendJS.Label('date-label');
    public readonly amountLabel = new FrontendJS.Label('count-label');
    public readonly productLabel = new FrontendJS.Label('product-label');
    public readonly priceLabel = new FrontendJS.Label('price-label');
    public readonly sumLabel = new FrontendJS.Label('sum-label');

    constructor(...classes: string[]) {
        super(...classes);

        this.dateLabel.text = '#_title_date';
        this.amountLabel.text = '#_title_amount';
        this.productLabel.text = '#_title_product';
        this.priceLabel.text = '#_title_price';
        this.sumLabel.text = '#_title_sum';

        this.appendChild(this.dateLabel);
        this.appendChild(this.productLabel);
        this.appendChild(this.priceLabel);
        this.appendChild(this.amountLabel);
        this.appendChild(this.sumLabel);
    }
}
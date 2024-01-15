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
    public readonly correctButton = new FrontendJS.Button('correct-button');
    public readonly monthDropbox = new FrontendJS.Dropbox('month-dropbox-view');

    public customer: Customer;
    public state: OrderState;

    private _openOrders: readonly Order[] = [];
    private _closedOrders: readonly Order[] = [];
    private _data: readonly Data[] = [];
    private _sum = 0;

    constructor(...classes: string[]) {
        super(...classes, 'orders-view-controller');

        this.titleBar.isHidden = true;

        this.tableViewController.titleLabel.text = '#_title_orders';
        this.tableViewController.dataSource = this;
        this.tableViewController.selectionMode = FrontendJS.TableSelectionMode.Clickable;
        this.tableViewController.onSelectedCell.on(cell => cell.index < this._data.length && this.onProductSelected.emit(this, this._data[cell.index].product));

        this.payButton.text = '#_title_pay';
        this.correctButton.text = '#_title_pay_correct';

        this.monthDropbox.onSelected.on(() => this.load());

        this.appendChild(this.tableViewController);

        this.footerBar.appendChild(this.monthDropbox);
        this.footerBar.appendChild(this.correctButton);
        this.footerBar.appendChild(this.payButton);
    }

    public get openOrders(): readonly Order[] { return this._openOrders; }
    public get closedOrders(): readonly Order[] { return this._closedOrders; }

    public async load() {
        const selectedMonth = this.monthDropbox.selectedIndex;
        const firstDayOfMonth = CoreJS.calcDate({ monthDay: 1 });

        this.monthDropbox.options = Array.from(Array(12).keys()).map(index => {
            const date = CoreJS.reduceDate({ date: firstDayOfMonth, months: index });

            return date.toLocaleString(CoreJS.Localization.language, {
                month: 'long',
                year: 'numeric'
            });
        });
        this.monthDropbox.selectedIndex = selectedMonth;

        const start = Number(CoreJS.reduceDate({ date: firstDayOfMonth, months: selectedMonth }));
        const end = Number(CoreJS.reduceDate({ date: firstDayOfMonth, months: selectedMonth - 1 })) - 1;

        const products = await Product.get();
        const allOrders = await Order.get({
            customer: this.customer.id,
            start,
            end
        });

        if (!allOrders.some(order => order.state === OrderState.Open))
            await Order.getOpen(this.customer.id)
                .then(orders => console.log(orders, orders.length && allOrders.push(...orders)));

        const stateOrders = this.state
            ? allOrders.filter(order => order.state == this.state)
            : allOrders;

        this._openOrders = allOrders.filter(order => order.state == OrderState.Open);
        this._closedOrders = allOrders.filter(order => order.state == OrderState.Closed);

        const orderProducts = stateOrders
            .map(order => order.products)
            .flat();

        this._data = orderProducts
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

        this._sum = stateOrders
            .map(data => data.invoice)
            .reduce((a, b) => a + b, 0);

        this.payButton.isDisabled = !this.openOrders.length;
        this.correctButton.isDisabled = !this.closedOrders.length;

        await super.load();
    }

    public async unload(): Promise<void> {
        this.monthDropbox.selectedIndex = 0;

        await super.unload();
    }

    public numberOfCells(sender: FrontendJS.TableViewController, category: number): number {
        return this._data.length + 2;
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
        if (row < this._data.length) {
            const product = this._data[row];

            cell.amountLabel.text = product.amount.toString();
            cell.productLabel.text = product.name;
            cell.priceLabel.text = CoreJS.formatCurrency(product.price);
            cell.sumLabel.text = CoreJS.formatCurrency(product.sum);
        } else if (row > this._data.length) {
            cell.sumLabel.text = CoreJS.formatCurrency(this._sum);
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
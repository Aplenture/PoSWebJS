/**
 * Aplenture/PoSWebJS
 * https://github.com/Aplenture/PoSWebJS
 * Copyright (c) 2023 Aplenture
 * License https://github.com/Aplenture/PoSWebJS/blob/main/LICENSE
 */

import * as CoreJS from "corejs";
import * as FrontendJS from "frontendjs";
import { Customer } from "../models/customer";
import { Finance } from "../models/finance";
import { PaymentMethod } from "../enums/paymentMethod";

interface Data {
    readonly value: number;
    readonly customer?: number;
}

export class TurnoverViewController extends FrontendJS.ViewController implements FrontendJS.TableViewControllerDataSource {
    public readonly tableViewController = new FrontendJS.TableViewController();

    private customers: readonly Customer[] = [];
    private finances: readonly Data[] = [];
    private sum = 0;

    constructor(...classes: string[]) {
        super(...classes, 'turnover-view-controller');

        this.title = '#_title_turnover';

        this.tableViewController.titleLabel.text = '#_title_turnover';
        this.tableViewController.dataSource = this;

        this.appendChild(this.tableViewController);
    }

    public async load() {
        const firstDayOfMonth = Number(CoreJS.calcDate({ monthDay: 1 }));
        const finances: Data[] = await Finance.get({
            start: firstDayOfMonth
        });

        this.customers = (await Customer.get({ paymentmethods: PaymentMethod.Balance }))
            .sort((a, b) => a.toString().localeCompare(b.toString()));

        const customerFinances: Data[] = this.customers
            .map(customer => finances.find(data => data.customer == customer.id))
            .filter(data => !!data);

        const additionalFinances: Data = finances
            .filter(data => !this.customers.some(customer => customer.id == data.customer))
            .reduce((a, b) => ({
                value: Math.abs(a.value) + Math.abs(b.value)
            }));

        this.finances = customerFinances
            .concat(additionalFinances);

        this.sum = this.finances
            .map(data => Math.abs(data.value))
            .reduce((a, b) => a + b, 0);

        await super.load();
    }

    public numberOfCells(sender: FrontendJS.TableViewController, category: number): number {
        return this.finances.length + 2;
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
        if (row < this.finances.length) {
            const data = this.finances[row];
            const customer = this.customers.find(customer => customer.id == data.customer);

            cell.customerLabel.text = customer && customer.toString() || '#_unknown_customer';
            cell.valueLabel.text = CoreJS.formatCurrency(Math.abs(data.value));
        } else if (row > this.finances.length) {
            cell.valueLabel.text = CoreJS.formatCurrency(this.sum);
        }
    }
}

class Cell extends FrontendJS.View {
    public readonly customerLabel = new FrontendJS.Label('customer-label');
    public readonly valueLabel = new FrontendJS.Label('value-label');

    constructor(...classes: string[]) {
        super(...classes);

        this.customerLabel.text = '#_title_customer';
        this.valueLabel.text = '#_title_value';

        this.valueLabel.type = FrontendJS.LabelType.Balance;

        this.appendChild(this.customerLabel);
        this.appendChild(this.valueLabel);
    }
}
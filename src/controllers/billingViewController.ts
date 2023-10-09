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

export class BillingViewController extends FrontendJS.BodyViewController implements FrontendJS.TableViewControllerDataSource {
    public readonly tableViewController = new FrontendJS.TableViewController();

    public readonly payButton = new FrontendJS.Button('pay-button');

    public customer: Customer;

    private finances: readonly Finance[] = [];
    private sum = 0;

    constructor(...classes: string[]) {
        super(...classes, 'billing-view-controller');

        this.titleBar.isVisible = false;

        this.tableViewController.titleLabel.text = '#_title_billing';
        this.tableViewController.dataSource = this;

        this.payButton.text = '#_title_pay';

        this.appendChild(this.tableViewController);

        this.footerBar.appendChild(this.payButton);
    }

    public async load() {
        const yesterday = Number(CoreJS.reduceDate({ days: 1 }));

        this.finances = await Finance.get({
            customer: this.customer.id,
            start: yesterday
        });

        this.sum = this.finances
            .map(data => data.value)
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

            cell.dateLabel.text = new Date(data.timestamp).toLocaleDateString();
            cell.typeLabel.text = '#_billing_' + data.data;
            cell.valueLabel.text = CoreJS.formatCurrency(data.value);
        } else if (row > this.finances.length) {
            cell.valueLabel.text = CoreJS.formatCurrency(this.sum);
        }
    }
}

class Cell extends FrontendJS.View {
    public readonly dateLabel = new FrontendJS.Label('date-label');
    public readonly typeLabel = new FrontendJS.Label('type-label');
    public readonly valueLabel = new FrontendJS.Label('value-label');

    constructor(...classes: string[]) {
        super(...classes);

        this.dateLabel.text = '#_title_date';
        this.typeLabel.text = '#_title_type';
        this.valueLabel.text = '#_title_value';

        this.appendChild(this.dateLabel);
        this.appendChild(this.typeLabel);
        this.appendChild(this.valueLabel);
    }
}
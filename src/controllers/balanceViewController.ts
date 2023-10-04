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

export class BalanceViewController extends FrontendJS.ViewController implements FrontendJS.TableViewControllerDataSource {
    public readonly tableViewController = new FrontendJS.TableViewController();

    public customer: Customer;

    private finances: readonly Finance[] = [];

    constructor(...classes: string[]) {
        super(...classes, 'balance-view-controller');

        this.tableViewController.titleLabel.text = '#_title_balance';
        this.tableViewController.dataSource = this;

        this.appendChild(this.tableViewController);
    }

    public async load() {
        this.finances = await Finance.get({
            customer: this.customer.id,
            start: Number(CoreJS.calcDate())
        });

        await super.load();
    }

    public numberOfCells(sender: FrontendJS.TableViewController, category: number): number {
        return this.finances.length;
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
        const data = this.finances[row];

        cell.dateLabel.text = new Date(data.timestamp).toLocaleDateString();
        cell.typeLabel.text = data.type;
        cell.valueLabel.text = CoreJS.formatCurrency(data.value);
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
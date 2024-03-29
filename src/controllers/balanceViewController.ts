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

export class BalanceViewController extends FrontendJS.BodyViewController implements FrontendJS.TableViewControllerDataSource {
    public readonly tableViewController = new FrontendJS.TableViewController();

    public readonly monthDropbox = new FrontendJS.Dropbox('month-dropbox-view');

    public customer: Customer;

    private finances: readonly Finance[] = [];
    private sum = 0;

    constructor(...classes: string[]) {
        super(...classes, 'balance-view-controller');

        this.titleBar.isHidden = true;
        
        this.tableViewController.titleLabel.text = '#_title_balance';
        this.tableViewController.dataSource = this;

        this.appendChild(this.tableViewController);

        this.monthDropbox.onSelected.on(() => this.load());

        this.footerBar.appendChild(this.monthDropbox);
    }

    public async load() {
        const selectedMonth = this.monthDropbox.selectedIndex;
        const firstDayOfMonth = CoreJS.calcDate({ monthDay: 1 });

        const start = Number(CoreJS.reduceDate({ date: firstDayOfMonth, months: selectedMonth }));
        const end = Number(CoreJS.reduceDate({ date: firstDayOfMonth, months: selectedMonth - 1 })) - 1;

        const finances = await Finance.getFinances({
            customer: this.customer.id,
            start,
            end
        });

        this.monthDropbox.options = Array.from(Array(12).keys()).map(index => {
            const date = CoreJS.reduceDate({ date: firstDayOfMonth, months: index });

            return date.toLocaleString(CoreJS.Localization.language, {
                month: 'long',
                year: 'numeric'
            });
        });
        this.monthDropbox.selectedIndex = selectedMonth;

        this.finances = finances
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .sort((a, b) => a.timestamp - b.timestamp);

        this.sum = this.finances
            .map(data => data.value * data.type)
            .reduce((a, b) => a + b, 0);

        await super.load();
    }

    public async unload(): Promise<void> {
        this.monthDropbox.selectedIndex = 0;

        await super.unload();
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
            cell.typeLabel.text = '#_balance_' + data.data;
            cell.valueLabel.text = CoreJS.formatCurrency(data.value * data.type);
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

        this.valueLabel.type = FrontendJS.LabelType.Balance;

        this.appendChild(this.dateLabel);
        this.appendChild(this.typeLabel);
        this.appendChild(this.valueLabel);
    }
}
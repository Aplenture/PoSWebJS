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
import { DepositViewController } from "./depositViewController";
import { Balance } from "../models/balance";

interface Data {
    readonly customer: Customer;
    readonly finance: Finance;
}

export class TransfersViewController extends FrontendJS.BodyViewController implements FrontendJS.TableViewControllerDataSource {
    public readonly tableViewController = new FrontendJS.TableViewController();

    public readonly monthDropbox = new FrontendJS.Dropbox('month-dropbox-view');
    public readonly downloadButton = new FrontendJS.Button('download-button-view');
    public readonly detailViewController = new DepositViewController('detail-view-controller');

    private _data: Data[] = [];
    private _selectedIndex: number = null;

    constructor(...classes: string[]) {
        super(...classes, 'transfers-view-controller');

        this.title = '#_title_transfers';
        this.titleBar.titleLabel.isHidden = true;

        this.tableViewController.titleLabel.text = '#_title_transfers';
        this.tableViewController.dataSource = this;
        this.tableViewController.selectionMode = FrontendJS.TableSelectionMode.Clickable;
        this.tableViewController.onSelectedCell.on(cell => this.selectedIndex = cell.index);

        this.monthDropbox.onSelected.on(() => this.load());

        this.downloadButton.type = FrontendJS.ButtonType.Download;
        this.downloadButton.onClick.on(() => this.download());

        this.detailViewController.autoReset = false;
        this.detailViewController.onUnloaded.on(() => this.selectedIndex = null);
        this.detailViewController.onEnter.on(() => this.detailViewController.removeFromParent());
        this.detailViewController.onEnter.on(() => FrontendJS.Client.popupViewController.pushMessage('Changing transfer properties is not currently implemented.', 'Not implemented'));

        this.detailViewController.cancelButton.type = FrontendJS.ButtonType.Delete;
        this.detailViewController.cancelButton.onClick.on(() => this.removeAtIndex(this._selectedIndex));

        this.titleBar.leftView.appendChild(this.monthDropbox);
        this.titleBar.rightView.appendChild(this.downloadButton);

        this.appendChild(this.tableViewController);
    }

    public get selectedIndex(): number | null { return this._selectedIndex; }
    public set selectedIndex(value: number | null) {
        if (value < 0 || this._data.length <= value)
            throw new Error(`selected index '${value}' is out of bounds [0, ${this._data.length - 1}]`);

        this._selectedIndex = value;

        if (undefined == value)
            return;

        const data = this._data[value];

        this.detailViewController.customerLabel.text = data.customer.toString();
        this.detailViewController.titleBar.title = CoreJS.Localization.translate(data.finance.data);
        this.detailViewController.amountTextField.value = CoreJS.formatCurrency(Math.abs(data.finance.value));
        this.detailViewController.dateTextField.dateValue = new Date(data.finance.timestamp);

        FrontendJS.Client.popupViewController.pushViewController(this.detailViewController);
    }

    public async load() {
        const firstDayOfMonth = CoreJS.calcDate({ monthDay: 1 });
        const selectedMonth = this.monthDropbox.selectedIndex;
        const start = Number(CoreJS.reduceDate({ date: firstDayOfMonth, months: selectedMonth }));
        const end = Number(CoreJS.reduceDate({ date: firstDayOfMonth, months: selectedMonth - 1 })) - 1;

        this.monthDropbox.options = Array.from(Array(12).keys()).map(index => {
            const date = CoreJS.reduceDate({ date: firstDayOfMonth, months: index });

            return date.toLocaleString(CoreJS.Localization.language, {
                month: 'long',
                year: 'numeric'
            });
        });
        this.monthDropbox.selectedIndex = selectedMonth;

        const [customers, finances] = await Promise.all([
            Customer.get({ paymentmethods: PaymentMethod.Balance }),
            Finance.getTransfers({ start, end })
        ]);

        this._data = finances.map(finance => ({
            customer: customers.find(customer => customer.id == finance.customer),
            finance
        }));

        await super.load();
    }

    public async unload() {
        this.monthDropbox.selectedIndex = 0;
        this._data = [];

        await super.unload();
    }

    public numberOfCells(sender: FrontendJS.TableViewController, category: number): number {
        return this._data.length;
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
        const data = this._data[row];

        cell.dateLabel.text = new Date(data.finance.timestamp).toLocaleDateString();
        cell.customerLabel.text = data.customer.toString();
        cell.typeLabel.text = CoreJS.Localization.translate(data.finance.data);
        cell.amountLabel.text = CoreJS.formatCurrency(Math.abs(data.finance.value));
    }

    public download() {
        const firstDayOfMonth = CoreJS.calcDate({ monthDay: 1 });
        const selectedDate = CoreJS.reduceDate({ date: firstDayOfMonth, months: this.monthDropbox.selectedIndex });
        const formatDate = CoreJS.formatDate(selectedDate).slice(0, -3);
        const filename = `${CoreJS.Localization.translate('#_title_turnover')}-${formatDate}`;
        const parser = new CoreJS.CSVParser(filename);

        parser.add([
            CoreJS.Localization.translate('#_title_date'),
            CoreJS.Localization.translate('#_title_customer'),
            CoreJS.Localization.translate('#_title_type'),
            CoreJS.Localization.translate('#_title_amount')
        ]);

        parser.add(...this._data.map(data => [
            new Date(data.finance.timestamp).toLocaleDateString(),
            data.customer.toString(),
            CoreJS.Localization.translate(data.finance.data),
            CoreJS.formatCurrency(Math.abs(data.finance.value))
        ]));

        FrontendJS.download(parser);
    }

    public async removeAtIndex(index: number): Promise<void> {
        const data = this._data[index];

        if (!(await FrontendJS.Client.popupViewController.queryBoolean('#_query_text_transfer_undo', '#_query_title_transfer_undo')))
            return;

        await Balance.undoTransfer(data.finance.id);
    }
}

class Cell extends FrontendJS.View {
    public readonly dateLabel = new FrontendJS.Label('date-label');
    public readonly customerLabel = new FrontendJS.Label('customer-label');
    public readonly amountLabel = new FrontendJS.Label('amount-label');
    public readonly typeLabel = new FrontendJS.Label('type-label');

    constructor(...classes: string[]) {
        super(...classes);

        this.dateLabel.text = '#_title_date';
        this.customerLabel.text = '#_title_customer';
        this.amountLabel.text = '#_title_amount';
        this.typeLabel.text = '#_title_type';

        this.amountLabel.type = FrontendJS.LabelType.Balance;

        this.appendChild(this.dateLabel);
        this.appendChild(this.customerLabel);
        this.appendChild(this.typeLabel);
        this.appendChild(this.amountLabel);
    }
}
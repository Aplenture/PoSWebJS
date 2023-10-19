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
import { BalanceEvent } from "../enums/balanceEvent";
import { Balance } from "../models/balance";
import { BalanceResolution } from "../enums/balanceResolution";

interface Data {
    readonly customer: string;
    readonly turnover: number;
    readonly deposit: number;
    readonly balance: number;
    readonly transfer: number;
}

export class TurnoverViewController extends FrontendJS.BodyViewController implements FrontendJS.TableViewControllerDataSource {
    public readonly tableViewController = new FrontendJS.TableViewController();

    public readonly monthDropbox = new FrontendJS.Dropbox('month-dropbox-view');
    public readonly downloadButton = new FrontendJS.Button('download-button-view');

    private data: Data[] = [];

    constructor(...classes: string[]) {
        super(...classes, 'turnover-view-controller');

        this.title = '#_title_turnover';
        this.titleBar.titleLabel.isHidden = true;

        this.tableViewController.titleLabel.text = '#_title_turnover';
        this.tableViewController.dataSource = this;

        this.monthDropbox.onSelected.on(() => this.reload());

        this.downloadButton.type = FrontendJS.ButtonType.Download;
        this.downloadButton.onClick.on(() => this.download());

        this.titleBar.leftView.appendChild(this.monthDropbox);
        this.titleBar.rightView.appendChild(this.downloadButton);

        this.appendChild(this.tableViewController);
    }

    public async load() {
        const firstDayOfMonth = CoreJS.calcDate({ monthDay: 1 });
        const selectedMonth = this.monthDropbox.selectedIndex;
        const previous = Number(CoreJS.reduceDate({ date: firstDayOfMonth, months: selectedMonth + 1 }));
        const start = Number(CoreJS.reduceDate({ date: firstDayOfMonth, months: selectedMonth }));
        const end = Number(CoreJS.reduceDate({ date: firstDayOfMonth, months: selectedMonth - 1 }));
        const sum = {
            customer: '',
            turnover: 0,
            deposit: 0,
            balance: 0,
            transfer: 0
        };

        this.monthDropbox.options = Array.from(Array(12).keys()).map(index => {
            const date = CoreJS.reduceDate({ date: firstDayOfMonth, months: index });

            return date.toLocaleString(CoreJS.Localization.language, {
                month: 'long',
                year: 'numeric'
            });
        });
        this.monthDropbox.selectedIndex = selectedMonth;

        let customers: Customer[];
        let balances: Balance[];
        let transfers: Balance[];
        let turnovers: Finance[];
        let deposits: Finance[];

        await Promise.all([
            Customer.get({ paymentmethods: PaymentMethod.Balance }).then(result => customers = result.sort((a, b) => a.toString().localeCompare(b.toString()))),
            Balance.getAll({ start, end: end - 1, resolution: BalanceResolution.Month }).then(result => balances = result),
            Balance.getAll({ start: previous, end: start - 1, resolution: BalanceResolution.Month }).then(result => transfers = result),
            Finance.get({
                data: [BalanceEvent.Invoice, BalanceEvent.Tip, BalanceEvent.UndoInvoice, BalanceEvent.UndoTip],
                start
            }).then(result => turnovers = result),
            Finance.get({
                data: [BalanceEvent.Deposit],
                start
            }).then(result => deposits = result)
        ]);

        this.data = customers.map(customer => {
            const turnover = turnovers.find(data => data.customer == customer.id);
            const deposit = deposits.find(data => data.customer == customer.id);
            const balance = balances.find(data => data.customer == customer.id);
            const transfer = transfers.find(data => data.customer == customer.id);

            return {
                customer: customer.toString(),
                turnover: Math.abs(turnover && turnover.value || 0),
                deposit: Math.abs(deposit && deposit.value || 0),
                balance: balance && balance.value || 0,
                transfer: transfer && transfer.value || 0
            };
        });

        // add guests and former members
        this.data.push({
            customer: CoreJS.Localization.translate('#_unknown_customer'),
            balance: balances
                .filter(data => !customers.some(customer => customer.id == data.customer))
                .map(data => data.value)
                .reduce((a, b) => Math.abs(a) + Math.abs(b), 0),
            turnover: turnovers
                .filter(data => !customers.some(customer => customer.id == data.customer))
                .map(data => data.value)
                .reduce((a, b) => Math.abs(a) + Math.abs(b), 0),
            deposit: deposits
                .filter(data => !customers.some(customer => customer.id == data.customer))
                .map(data => data.value)
                .reduce((a, b) => Math.abs(a) + Math.abs(b), 0),
            transfer: transfers
                .filter(data => !customers.some(customer => customer.id == data.customer))
                .map(data => data.value)
                .reduce((a, b) => Math.abs(a) + Math.abs(b), 0)
        });

        // sum all values
        this.data.forEach(data => {
            sum.turnover += data.turnover;
            sum.deposit += data.deposit;
            sum.balance += data.balance;
            sum.transfer += data.transfer;
        });

        // add sum
        this.data.push(sum);

        await super.load();
    }

    public numberOfCells(sender: FrontendJS.TableViewController, category: number): number {
        return this.data.length + 1;
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
        // skip penultimate line to delimit the sum (last line)
        const index = row < this.data.length - 1
            ? row
            : row < this.data.length
                ? -1
                : row - 1;

        const data = this.data[index];

        if (!data)
            return;

        cell.customerLabel.text = data.customer;
        cell.turnoverLabel.text = data.turnover && CoreJS.formatCurrency(data.turnover) || '';
        cell.depositLabel.text = data.deposit && CoreJS.formatCurrency(data.deposit) || '';
        cell.balanceLabel.text = data.balance && CoreJS.formatCurrency(data.balance) || '';
        cell.transferLabel.text = data.transfer && CoreJS.formatCurrency(data.transfer) || '';
    }

    public download() {
        const firstDayOfMonth = CoreJS.calcDate({ monthDay: 1 });
        const selectedDate = CoreJS.reduceDate({ date: firstDayOfMonth, months: this.monthDropbox.selectedIndex });
        const formatDate = CoreJS.formatDate(selectedDate).slice(0, -3);
        const filename = `${CoreJS.Localization.translate('#_title_turnover')}-${formatDate}`;
        const parser = new CoreJS.CSVParser(filename);

        parser.add([
            CoreJS.Localization.translate('#_title_customer'),
            CoreJS.Localization.translate('#_title_turnover'),
            CoreJS.Localization.translate('#_title_deposited'),
            CoreJS.Localization.translate('#_title_balance'),
            CoreJS.Localization.translate('#_title_transfer')
        ]);

        parser.add(...this.data.map(data => [
            data.customer,
            CoreJS.formatCurrency(data.turnover),
            CoreJS.formatCurrency(data.deposit),
            CoreJS.formatCurrency(data.balance),
            CoreJS.formatCurrency(data.transfer)
        ]));

        FrontendJS.download(parser);
    }
}

class Cell extends FrontendJS.View {
    public readonly customerLabel = new FrontendJS.Label('customer-label');
    public readonly turnoverLabel = new FrontendJS.Label('turnover-label');
    public readonly depositLabel = new FrontendJS.Label('deposit-label');
    public readonly balanceLabel = new FrontendJS.Label('balance-label');
    public readonly transferLabel = new FrontendJS.Label('transfer-label');

    constructor(...classes: string[]) {
        super(...classes);

        this.customerLabel.text = '#_title_customer';
        this.turnoverLabel.text = '#_title_turnover';
        this.depositLabel.text = '#_title_deposited';
        this.balanceLabel.text = '#_title_balance';
        this.transferLabel.text = '#_title_transfer';

        this.turnoverLabel.type = FrontendJS.LabelType.Balance;
        this.depositLabel.type = FrontendJS.LabelType.Balance;
        this.balanceLabel.type = FrontendJS.LabelType.Balance;
        this.transferLabel.type = FrontendJS.LabelType.Balance;

        this.appendChild(this.customerLabel);
        this.appendChild(this.turnoverLabel);
        this.appendChild(this.depositLabel);
        this.appendChild(this.balanceLabel);
        this.appendChild(this.transferLabel);
    }
}
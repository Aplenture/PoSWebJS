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
import { TransactionLabel } from "../models/transactionLabel";
import { TransactionType } from "../enums/TransactionType";

interface Data {
    readonly customer: string;
    readonly turnover: number;
    readonly deposit: number;
    readonly withdraw: number;
    readonly balance: number;
    readonly transfer: number;
    readonly bonus: number;
}

export class TurnoverViewController extends FrontendJS.BodyViewController implements FrontendJS.TableViewControllerDataSource {
    public readonly tableViewController = new FrontendJS.TableViewController();

    public readonly monthDropbox = new FrontendJS.Dropbox('month-dropbox-view');
    public readonly customerDropbox = new FrontendJS.Dropbox('customer-dropbox-view');

    public readonly downloadButton = new FrontendJS.Button('download-button-view');
    public readonly deleteButton = new FrontendJS.Button('delete-button-view');

    private data: Data[] = [];

    constructor(...classes: string[]) {
        super(...classes, 'turnover-view-controller');

        this.title = '#_title_turnover';
        this.titleBar.titleLabel.isHidden = true;

        this.tableViewController.titleLabel.text = '#_title_turnover';
        this.tableViewController.dataSource = this;

        this.monthDropbox.onSelected.on(() => this.load());

        this.customerDropbox.onSelected.on(() => this.load());
        this.customerDropbox.onSelected.on(() => this.deleteButton.isVisible = 1 == this.customerDropbox.selectedIndex);
        this.customerDropbox.options = [
            '#_title_members',
            '#_title_guests'
        ];

        this.downloadButton.type = FrontendJS.ButtonType.Download;
        this.downloadButton.onClick.on(() => this.download());

        this.deleteButton.type = FrontendJS.ButtonType.Delete;
        this.deleteButton.onClick.on(() => this.delete());

        this.titleBar.leftView.appendChild(this.monthDropbox);
        this.titleBar.leftView.appendChild(this.customerDropbox);
        this.titleBar.rightView.appendChild(this.downloadButton);

        this.footerBar.appendChild(this.deleteButton);

        this.appendChild(this.tableViewController);
    }

    public get paymentMethod(): PaymentMethod {
        switch (this.customerDropbox.selectedIndex) {
            case 0: return PaymentMethod.Balance;
            case 1: return PaymentMethod.Cash;

            default: throw new Error(`unhandled customer type '${this.customerDropbox.options[this.customerDropbox.selectedIndex]}'`);
        }
    }

    public async load() {
        const depositLabels = await TransactionLabel.getAll(TransactionType.Deposit);
        const withdrawLabels = await TransactionLabel.getAll(TransactionType.Withdraw);

        const firstDayOfMonth = CoreJS.calcDate({ monthDay: 1 });
        const selectedMonth = this.monthDropbox.selectedIndex;
        const start = Number(CoreJS.reduceDate({ date: firstDayOfMonth, months: selectedMonth }));
        const end = Number(CoreJS.reduceDate({ date: firstDayOfMonth, months: selectedMonth - 1 })) - 1;
        const sum = {
            customer: '',
            turnover: 0,
            deposit: 0,
            withdraw: 0,
            balance: 0,
            transfer: 0,
            bonus: 0
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
        let withdraws: Finance[];
        let bonuses: any[] = [];

        await Promise.all([
            Customer.get({ paymentmethods: this.paymentMethod }).then(result => customers = result.sort((a, b) => a.toString().localeCompare(b.toString()))),
            Balance.getAll(end).then(result => balances = result),
            Balance.getAll(start - 1).then(result => transfers = result),
            Finance.getFinances({
                start,
                end,
                paymentmethod: this.paymentMethod,
                data: [BalanceEvent.Invoice, BalanceEvent.Tip, BalanceEvent.UndoInvoice, BalanceEvent.UndoTip]
            }).then(result => turnovers = result),
            Finance.getFinances({
                start,
                end,
                paymentmethod: this.paymentMethod,
                data: depositLabels
                    .map(data => data.name)
                    .concat(BalanceEvent.Deposit)
            }).then(result => deposits = result),
            Finance.getFinances({
                start,
                end,
                paymentmethod: this.paymentMethod,
                data: withdrawLabels
                    .map(data => data.name)
                    .concat(BalanceEvent.Withdraw)
            }).then(result => withdraws = result)
        ]);

        this.data = customers
            .filter(customer => customer.paymentMethods & this.paymentMethod)
            .map(customer => {
                const turnover = turnovers.find(data => data.customer == customer.id);
                const deposit = deposits.find(data => data.customer == customer.id);
                const withdraw = withdraws.find(data => data.customer == customer.id);
                const balance = balances.find(data => data.customer == customer.id);
                const transfer = transfers.find(data => data.customer == customer.id);
                const bonus = bonuses.find(data => data.customer == customer.id);

                return {
                    customer: customer.toString(),
                    turnover: Math.abs(turnover && turnover.value || 0),
                    deposit: Math.abs(deposit && deposit.value || 0),
                    withdraw: Math.abs(withdraw && withdraw.value || 0),
                    balance: balance && balance.value || 0,
                    transfer: transfer && transfer.value || 0,
                    bonus: bonus && bonus.value || 0
                };
            });

        const unknownBalance = balances
            .filter(data => (data.paymentMethod & this.paymentMethod) && !customers.some(customer => customer.id == data.customer))
            .map(data => data.value)
            .reduce((a, b) => Math.abs(a) + Math.abs(b), 0);

        const unknownTurnovers = turnovers
            .filter(data => (data.paymentMethod & this.paymentMethod) && !customers.some(customer => customer.id == data.customer))
            .map(data => data.value)
            .reduce((a, b) => Math.abs(a) + Math.abs(b), 0);

        const unknownDeposits = deposits
            .filter(data => (data.paymentMethod & this.paymentMethod) && !customers.some(customer => customer.id == data.customer))
            .map(data => data.value)
            .reduce((a, b) => Math.abs(a) + Math.abs(b), 0);

        const unknownWithdraws = withdraws
            .filter(data => (data.paymentMethod & this.paymentMethod) && !customers.some(customer => customer.id == data.customer))
            .map(data => data.value)
            .reduce((a, b) => Math.abs(a) + Math.abs(b), 0);

        const unknownTransfers = transfers
            .filter(data => (data.paymentMethod & this.paymentMethod) && !customers.some(customer => customer.id == data.customer))
            .map(data => data.value)
            .reduce((a, b) => Math.abs(a) + Math.abs(b), 0);

        const unknownBonuses = bonuses
            .filter(data => (data.paymentMethod & this.paymentMethod) && !customers.some(customer => customer.id == data.customer))
            .map(data => data.value)
            .reduce((a, b) => Math.abs(a) + Math.abs(b), 0);

        // add unknown customers
        // if exists
        if (0 < unknownBalance
            || 0 < unknownTurnovers
            || 0 < unknownDeposits
            || 0 < unknownWithdraws
            || 0 < unknownTransfers
            || 0 < unknownBonuses) {
            this.data.push({
                customer: CoreJS.Localization.translate('#_unknown_customer'),
                balance: unknownBalance,
                turnover: unknownTurnovers,
                deposit: unknownDeposits,
                withdraw: unknownWithdraws,
                transfer: unknownTransfers,
                bonus: unknownBonuses
            });
        }

        // sum all values
        this.data.forEach(data => {
            sum.turnover += data.turnover;
            sum.deposit += data.deposit;
            sum.withdraw += data.withdraw;
            sum.balance += data.balance;
            sum.transfer += data.transfer;
            sum.bonus += data.bonus;
        });

        // add sum
        this.data.push(sum);
        
        this.deleteButton.isVisible = 1 == this.customerDropbox.selectedIndex;

        await super.load();
    }

    public async unload() {
        this.monthDropbox.selectedIndex = 0;
        this.customerDropbox.selectedIndex = 0;

        await super.unload();
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
        cell.withdrawLabel.text = data.withdraw && CoreJS.formatCurrency(data.withdraw) || '';
        cell.balanceLabel.text = data.balance && CoreJS.formatCurrency(data.balance) || '';
        cell.transferLabel.text = data.transfer && CoreJS.formatCurrency(data.transfer) || '';
        cell.bonusLabel.text = data.bonus && CoreJS.formatCurrency(data.bonus) || '';
    }

    public download() {
        const firstDayOfMonth = CoreJS.calcDate({ monthDay: 1 });
        const selectedDate = CoreJS.reduceDate({ date: firstDayOfMonth, months: this.monthDropbox.selectedIndex });
        const formatDate = CoreJS.formatDate(selectedDate).slice(0, -3);
        const filename = `${CoreJS.Localization.translate('#_title_turnover')}-${formatDate}`;
        const parser = new CoreJS.CSVParser(filename);

        parser.add([
            CoreJS.Localization.translate('#_title_customer'),
            CoreJS.Localization.translate('#_title_transfer'),
            CoreJS.Localization.translate('#_title_deposited'),
            CoreJS.Localization.translate('#_title_withdrawn'),
            CoreJS.Localization.translate('#_title_turnover'),
            CoreJS.Localization.translate('#_title_balance'),
            CoreJS.Localization.translate('#_title_bonus')
        ]);

        parser.add(...this.data.map(data => [
            data.customer,
            CoreJS.formatCurrency(data.transfer),
            CoreJS.formatCurrency(data.deposit),
            CoreJS.formatCurrency(data.withdraw),
            CoreJS.formatCurrency(data.turnover),
            CoreJS.formatCurrency(data.balance),
            CoreJS.formatCurrency(data.bonus)
        ]));

        FrontendJS.download(parser);
    }

    public async delete(): Promise<void> {
        if (!await FrontendJS.Client.popupViewController.queryBoolean('#_query_text_remove_all_guests', '#_query_title_remove_all_guests'))
            return;

        await Customer.removeGuests();
        await this.load();
        await FrontendJS.Client.notificationViewController.pushNotification({
            text: '#_notification_guests_removed',
            title: '#_title_removing_guests'
        });
    }
}

class Cell extends FrontendJS.View {
    public readonly customerLabel = new FrontendJS.Label('customer-label');
    public readonly turnoverLabel = new FrontendJS.Label('turnover-label');
    public readonly depositLabel = new FrontendJS.Label('deposit-label');
    public readonly withdrawLabel = new FrontendJS.Label('withdraw-label');
    public readonly balanceLabel = new FrontendJS.Label('balance-label');
    public readonly transferLabel = new FrontendJS.Label('transfer-label');
    public readonly bonusLabel = new FrontendJS.Label('bonus-label');

    constructor(...classes: string[]) {
        super(...classes);

        this.customerLabel.text = '#_title_customer';
        this.turnoverLabel.text = '#_title_turnover';
        this.depositLabel.text = '#_title_deposited';
        this.withdrawLabel.text = '#_title_withdrawn';
        this.balanceLabel.text = '#_title_balance';
        this.transferLabel.text = '#_title_transfer';
        this.bonusLabel.text = '#_title_bonus';

        this.turnoverLabel.type = FrontendJS.LabelType.Balance;
        this.depositLabel.type = FrontendJS.LabelType.Balance;
        this.withdrawLabel.type = FrontendJS.LabelType.Balance;
        this.balanceLabel.type = FrontendJS.LabelType.Balance;
        this.transferLabel.type = FrontendJS.LabelType.Balance;
        this.bonusLabel.type = FrontendJS.LabelType.Balance;

        this.appendChild(this.customerLabel);
        this.appendChild(this.transferLabel);
        this.appendChild(this.depositLabel);
        this.appendChild(this.withdrawLabel);
        this.appendChild(this.turnoverLabel);
        this.appendChild(this.balanceLabel);
        this.appendChild(this.bonusLabel);
    }
}
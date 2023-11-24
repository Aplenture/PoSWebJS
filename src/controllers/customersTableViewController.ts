/**
 * Aplenture/PoSWebJS
 * https://github.com/Aplenture/PoSWebJS
 * Copyright (c) 2023 Aplenture
 * License https://github.com/Aplenture/PoSWebJS/blob/main/LICENSE
 */

import * as CoreJS from "corejs";
import * as FrontendJS from "frontendjs";
import { CustomerEditViewController } from "./customerEditViewController";
import { CustomerDetailsViewController } from "./customerDetailsViewController";
import { Customer } from "../models/customer";
import { Balance } from "../models/balance";
import { PaymentMethod } from "../enums/paymentMethod";
import { Order } from "../models/order";
import { OrderState } from "../enums/orderState";
import { DepostiViewController } from "./depositViewController";
import { TransactionLabel } from "../models/transactionLabel";
import { TransactionType } from "../enums/TransactionType";
import { BalanceEvent } from "../enums/balanceEvent";

export class CustomersTableViewController extends FrontendJS.ViewController implements FrontendJS.TableViewControllerDataSource {
    public readonly tableViewController = new FrontendJS.TableViewController();
    public readonly editViewController = new CustomerEditViewController();
    public readonly detailViewController = new CustomerDetailsViewController();
    public readonly depositViewController = new DepostiViewController();
    public readonly withdrawViewController = new DepostiViewController('withdraw-view-controller');

    public readonly addButton = new FrontendJS.Button('add-button');

    private customers: readonly Customer[] = [];
    private balances: Balance[] = [];
    private openOrders: readonly Order[] = [];

    constructor(...classes: string[]) {
        super(...classes, 'customers-table-view-controller');

        this.tableViewController.dataSource = this;
        this.tableViewController.selectionMode = FrontendJS.TableSelectionMode.Clickable;
        this.tableViewController.onSelectedCell.on(cell => this.select(this.customers[cell.index]));

        this.withdrawViewController.titleBar.titleLabel.text = '#_query_title_withdraw';

        this.addButton.type = FrontendJS.ButtonType.Add;
        this.addButton.onClick.on(() => this.add());

        this.editViewController.onUpdated.on(() => this.load());
        this.editViewController.onUpdated.on(() => this.detailViewController.load());
        this.editViewController.onUpdated.on(() => this.editViewController.removeFromParent());

        this.editViewController.onCreated.on(() => this.load());
        this.editViewController.onCreated.on(() => this.editViewController.removeFromParent());

        this.detailViewController.editButton.onClick.on(() => this.edit(this.detailViewController.customer));
        this.detailViewController.depositButton.onClick.on(() => FrontendJS.Client.popupViewController.pushViewController(this.depositViewController));
        this.detailViewController.withdrawButton.onClick.on(() => FrontendJS.Client.popupViewController.pushViewController(this.withdrawViewController));
        this.detailViewController.withdrawButton.onClick.on(async () => this.withdrawViewController.max = await Balance.get(this.detailViewController.customer.id));

        this.depositViewController.onEnter.on(() => {
            if (!this.depositViewController.amountTextField.numberValue)
                return FrontendJS.Client.popupViewController.pushMessage('#_error_deposit_zero', '#_title_deposit');

            this.deposit(this.detailViewController.customer, this.depositViewController.amountTextField.numberValue, this.depositViewController.dateTextField.dateValue);
            this.depositViewController.removeFromParent();
        });

        this.withdrawViewController.onEnter.on(() => {
            if (!this.withdrawViewController.amountTextField.numberValue)
                return FrontendJS.Client.popupViewController.pushMessage('#_error_withdraw_zero', '#_title_withdraw');

            this.withdraw(this.detailViewController.customer, this.withdrawViewController.amountTextField.numberValue, this.withdrawViewController.dateTextField.dateValue)
            this.withdrawViewController.removeFromParent()
        });

        this.appendChild(this.tableViewController);
    }

    public get paymentMethods(): number { return this.editViewController.paymentMethods; }
    public set paymentMethods(value: number) { this.editViewController.paymentMethods = value; }

    public get isBalanceAllowed(): boolean { return (this.paymentMethods & PaymentMethod.Balance) != 0; }

    public async load(): Promise<void> {
        this.depositViewController.labels = [BalanceEvent.Deposit as string].concat((await TransactionLabel.getAll(TransactionType.Deposit)).map(data => data.name));
        this.withdrawViewController.labels = [BalanceEvent.Withdraw as string].concat((await TransactionLabel.getAll(TransactionType.Withdraw)).map(data => data.name));
        this.openOrders = await Order.get({ state: OrderState.Open });
        this.balances = await Balance.getAll();
        this.customers = (await Customer.get({ paymentmethods: this.paymentMethods }))
            .sort((a, b) => a.toString().localeCompare(b.toString()));

        this.titleBar.leftView.appendChild(this.addButton);

        await super.load();
    }

    public async unload(): Promise<void> {
        this.titleBar.leftView.removeChild(this.addButton);

        await super.unload();
    }

    public numberOfCells(sender: FrontendJS.TableViewController, category: number): number {
        return this.customers.length;
    }

    public createHeader?(sender: FrontendJS.TableViewController): FrontendJS.View {
        const cell = new Cell();

        cell.balanceLabel.isVisible = this.isBalanceAllowed;
        return cell;
    }

    public createCell(sender: FrontendJS.TableViewController, category: number): FrontendJS.View {
        const cell = new Cell();

        cell.balanceLabel.isVisible = this.isBalanceAllowed;

        return cell;
    }

    public updateCell(sender: FrontendJS.TableViewController, cell: Cell, row: number, category: number): void {
        const customer = this.customers[row];
        const balanceData = this.balances.find(data => data.customer == customer.id);
        const openOrder = this.openOrders.find(data => data.customer == customer.id);

        const balance = (balanceData && balanceData.value || 0)
            - (openOrder && openOrder.invoice || 0);

        cell.numberLabel.text = (row + 1).toString();
        cell.nameLabel.text = customer.toString();
        cell.balanceLabel.text = CoreJS.formatCurrency(balance);

        if (this.detailViewController.customer && this.detailViewController.customer.id == customer.id)
            this.detailViewController.balanceLabel.text = CoreJS.formatCurrency(balance);
    }

    public add(): Promise<void> {
        this.editViewController.customer = null;

        return FrontendJS.Client.popupViewController.pushViewController(this.editViewController);
    }

    public select(customer: Customer): Promise<void> {
        this.detailViewController.customer = customer;

        return FrontendJS.Client.popupViewController.pushViewController(this.detailViewController);
    }

    public edit(customer: Customer): Promise<void> {
        this.editViewController.customer = customer;

        return FrontendJS.Client.popupViewController.pushViewController(this.editViewController);
    }

    public async deposit(customer: Customer, value: number, date?: Date): Promise<number> {
        if (!value)
            return null;

        const label = this.depositViewController.selectedLabel;

        const balance = await Balance.deposit({
            customer: customer.id,
            value,
            date,
            label
        });

        const balanceIndex = this.balances.findIndex(data => data.customer == balance.customer);

        if (-1 == balanceIndex)
            this.balances.push(balance);
        else
            this.balances[balanceIndex].value = balance.value;

        FrontendJS.Client.notificationViewController.pushNotification({ text: '#_notification_deposit_balance' });

        this.tableViewController.render();

        return value;
    }

    public async withdraw(customer: Customer, value: number, date?: Date): Promise<number> {
        if (!value)
            return null;

        const label = this.withdrawViewController.selectedLabel;

        const balance = await Balance.withdraw({
            customer: customer.id,
            value,
            date,
            label
        });

        const balanceIndex = this.balances.findIndex(data => data.customer == balance.customer);

        if (-1 == balanceIndex)
            this.balances.push(balance);
        else
            this.balances[balanceIndex].value = balance.value;

        FrontendJS.Client.notificationViewController.pushNotification({ text: '#_notification_withdraw_balance' });

        this.tableViewController.render();

        return value;
    }
}

class Cell extends FrontendJS.View {
    public readonly numberLabel = new FrontendJS.Label('number-label');
    public readonly nameLabel = new FrontendJS.Label('name-label');
    public readonly balanceLabel = new FrontendJS.Label('balance-label');

    constructor(...classes: string[]) {
        super(...classes);

        this.numberLabel.text = '#';
        this.nameLabel.text = '#_title_name';

        this.balanceLabel.type = FrontendJS.LabelType.Balance;
        this.balanceLabel.text = '#_title_balance';

        this.appendChild(this.numberLabel);
        this.appendChild(this.nameLabel);
        this.appendChild(this.balanceLabel);
    }
}
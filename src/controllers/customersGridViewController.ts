/**
 * Aplenture/PoSWebJS
 * https://github.com/Aplenture/PoSWebJS
 * Copyright (c) 2023 Aplenture
 * License https://github.com/Aplenture/PoSWebJS/blob/main/LICENSE
 */

import * as CoreJS from "corejs";
import * as FrontendJS from "frontendjs";
import { Customer } from "../models/customer";
import { CustomerEditViewController } from "./customerEditViewController";
import { GridViewController } from "./gridViewController";

export class CustomersGridViewController extends GridViewController {
    public readonly onSelectedCustomer = new CoreJS.Event<CustomersGridViewController, Customer>('CustomersGridViewController.onSelectedCustomer');

    public readonly editViewController = new CustomerEditViewController();

    public isAddAllowed = false;

    private customers: readonly Customer[] = [];

    constructor(...classes: string[]) {
        super(...classes, "customers-grid-view-controller");

        this.gridViewController.onSelectedCell.on(cell => this.select(cell.index));

        this.editViewController.onCreated.on(() => this.load());
        this.editViewController.onCreated.on(() => this.editViewController.removeFromParent());
    }

    public get paymentMethods(): number { return this.editViewController.paymentMethods; }
    public set paymentMethods(value: number) { this.editViewController.paymentMethods = value; }

    public async load(): Promise<void> {
        this.customers = (await Customer.get({ paymentmethods: this.paymentMethods })).sort((a, b) => a.toString().localeCompare(b.toString()));

        await super.load();
    }

    public async unload(): Promise<void> {
        await super.unload();
    }

    public focus(): void {
        super.focus();
    }

    public numberOfCells(sender: FrontendJS.GridViewController): number {
        return this.customers.length
            + (this.isAddAllowed ? 1 : 0);
    }

    public createCell(sender: FrontendJS.GridViewController, index: number): FrontendJS.View {
        return new Cell();
    }

    public updateCell(sender: FrontendJS.GridViewController, cell: Cell, index: number): void {
        if (index == this.customers.length)
            return;

        const customer = this.customers[index];

        cell.nameLabel.text = `${customer.firstname}\n${customer.lastname}`;
    }

    public add(): Promise<void> {
        this.editViewController.customer = null;

        return FrontendJS.Client.popupViewController.pushViewController(this.editViewController);
    }

    public select(index: number) {
        if (index == this.customers.length)
            this.add();
        else
            this.onSelectedCustomer.emit(this, this.customers[index]);
    }
}

class Cell extends FrontendJS.View {
    public readonly nameLabel = new FrontendJS.Label('name-label');

    constructor(...classes: string[]) {
        super(...classes);

        this.nameLabel.text = 'name';

        this.appendChild(this.nameLabel);
    }
}
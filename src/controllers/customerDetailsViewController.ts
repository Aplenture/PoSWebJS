/**
 * Aplenture/PoSWebJS
 * https://github.com/Aplenture/PoSWebJS
 * Copyright (c) 2023 Aplenture
 * License https://github.com/Aplenture/PoSWebJS/blob/main/LICENSE
 */

import * as CoreJS from "corejs";
import * as FrontendJS from "frontendjs";
import { Customer } from "../models/customer";
import { Balance } from "../models/balance";
import { PaymentMethod } from "../enums/paymentMethod";
import { Order } from "../models/order";
import { OrderState } from "../enums/orderState";

export class CustomerDetailsViewController extends FrontendJS.BodyViewController {
    public readonly balanceLabel = new FrontendJS.TitledLabel('balance-text-field');

    public readonly depositButton = new FrontendJS.Button('deposit-button');
    public readonly editButton = new FrontendJS.Button('edit-button');

    public customer: Customer = null;

    constructor(...classes: string[]) {
        super(...classes, 'create-customer-view-controller');

        this.depositButton.text = '#_title_deposit';
        this.editButton.text = '#_title_edit';

        this.balanceLabel.type = FrontendJS.TitledLabelType.Balance;
        this.balanceLabel.title = '#_title_balance';

        this.contentView.appendChild(this.balanceLabel);

        this.footerBar.appendChild(this.depositButton);
        this.footerBar.appendChild(this.editButton);
    }

    public async load(): Promise<void> {
        this.titleBar.titleLabel.text = this.customer.toString();

        if (this.customer.paymentMethods & PaymentMethod.Balance) {
            const openOrders = await Order.get({ customer: this.customer.id, state: OrderState.Open });

            const balance = await Balance.get(this.customer.id)
                - (openOrders && openOrders[0].invoice || 0);

            this.depositButton.isVisible = true;
            this.balanceLabel.isVisible = true;
            this.balanceLabel.text = CoreJS.formatCurrency(balance);
        } else {
            this.depositButton.isVisible = false;
            this.balanceLabel.isVisible = false;
            this.balanceLabel.text = "";
        }

        await super.load();
    }

    public async unload(): Promise<void> {
        this.balanceLabel.text = '';

        await super.unload();
    }
}
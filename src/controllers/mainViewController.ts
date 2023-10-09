/**
 * Aplenture/PoSWebJS
 * https://github.com/Aplenture/PoSWebJS
 * Copyright (c) 2023 Aplenture
 * License https://github.com/Aplenture/PoSWebJS/blob/main/LICENSE
 */

import * as CoreJS from "corejs";
import * as FrontendJS from "frontendjs";
import { CustomersGridViewController } from "./customersGridViewController";
import { ProductsGridViewController } from "./productsGridViewController";
import { PurchaseProductViewController } from "./purchaseProductViewController";
import { InvoicesViewController } from "./invoicesViewController";
import { Product } from "../models/product";
import { Customer } from "../models/customer";
import { PaymentMethod } from "../enums/paymentMethod";
import { Balance } from "../models/balance";
import { Order } from "../models/order";
import { OrderState } from "../enums/orderState";
import { OrderProduct } from "../models/orderProduct";
import { BalanceViewController } from "./balanceViewController";
import { BillingViewController } from "./billingViewController";

const KEY_RESET_DELAY = "resetDelay";

export class MainViewController extends FrontendJS.BodyViewController {
    public static readonly route = 'main';

    public readonly stackViewController = new FrontendJS.StackViewController();
    public readonly customerMenuViewController = new FrontendJS.MenuViewController('customer-menu-view-controller');
    public readonly productMenuViewController = new FrontendJS.MenuViewController('product-menu-view-controller');
    public readonly membersViewController = new CustomersGridViewController('members-grid-view-controller');
    public readonly guestsViewController = new CustomersGridViewController('guests-grid-view-controller');
    public readonly productsViewController = new ProductsGridViewController();
    public readonly purchaseViewController = new PurchaseProductViewController();
    public readonly todayViewController = new InvoicesViewController('today-invoices-view-controller');
    public readonly monthViewController = new InvoicesViewController('month-invoices-view-controller');
    public readonly balanceViewControlelr = new BalanceViewController();
    public readonly billingViewController = new BillingViewController();

    public readonly customerLabel = new FrontendJS.Label('customer-label');
    public readonly balanceLabel = new FrontendJS.Label('balance-label');

    public readonly backButton = new FrontendJS.Button('back-button');
    public readonly payButton = new FrontendJS.Button('pay-button');

    private readonly _resetTimeout = new CoreJS.Timeout(FrontendJS.Client.config.get(KEY_RESET_DELAY));

    private _selectedProduct: Product;
    private _order: Order;

    constructor(public readonly account: FrontendJS.Account.Account, ...classes: string[]) {
        super(...classes, "main-view-controller");

        const balanceView = new FrontendJS.View('balance-view');

        this.title = '#_title_main';
        this.footerBar.isVisible = false;

        this.stackViewController.onPush.on(() => (this.stackViewController.currentViewController as FrontendJS.MenuViewController).selectedIndex = 0);
        this.stackViewController.onPush.on(() => this.titleBar.titleLabel.text = (this.stackViewController.currentViewController as FrontendJS.MenuViewController).selectedViewController.title);
        this.stackViewController.onPush.on(() => this.backButton.isHidden = !this.stackViewController.count);

        this.stackViewController.onPop.on(() => (this.stackViewController.currentViewController as FrontendJS.MenuViewController).selectedIndex = 0);
        this.stackViewController.onPop.on(() => this.titleBar.titleLabel.text = (this.stackViewController.currentViewController as FrontendJS.MenuViewController).selectedViewController.title);
        this.stackViewController.onPop.on(() => this.backButton.isHidden = !this.stackViewController.count);
        this.stackViewController.onPop.on(() => this.customerMenuViewController.parent && (this.selectedCustomer = null));
        this.stackViewController.onPop.on(() => this.productsViewController.parent && (this.selectedProduct = null));

        this.customerMenuViewController.onSelected.on(() => this.titleBar.titleLabel.text = this.customerMenuViewController.selectedViewController.title);
        this.productMenuViewController.onSelected.on(() => this.titleBar.titleLabel.text = this.productMenuViewController.selectedViewController.title);

        this.membersViewController.paymentMethods = PaymentMethod.Balance;
        this.membersViewController.title = '#_title_select_member';
        this.membersViewController.onSelectedCustomer.on(customer => this.selectCustomer(customer));

        this.guestsViewController.paymentMethods = PaymentMethod.Cash;
        this.guestsViewController.isAddAllowed = true;
        this.guestsViewController.title = '#_title_select_guest';
        this.guestsViewController.onSelectedCustomer.on(customer => this.selectCustomer(customer));

        this.productsViewController.title = '#_title_select_product';
        this.productsViewController.onSelectedProduct.on(product => this.selectProduct(product));

        this.todayViewController.title = '#_title_today';
        this.todayViewController.today = true;
        this.todayViewController.onProductSelected.on(product => this.selectProduct(product));
        this.todayViewController.payButton.onClick.on(() => this.productMenuViewController.selectedViewController = this.billingViewController);
        this.todayViewController.payButton.onClick.on(() => this.pay());

        this.monthViewController.title = '#_title_month_this';
        this.monthViewController.today = false;
        this.monthViewController.footerBar.isVisible = false;
        this.monthViewController.onProductSelected.on(product => this.selectProduct(product));

        this.purchaseViewController.buyButton.onClick.on(() => this.buy(this.selectedProduct, this.selectedCustomer));
        this.purchaseViewController.undoButton.onClick.on(() => this.undoPurchase(this.selectedProduct, this.selectedCustomer));

        this.backButton.type = FrontendJS.ButtonType.Back;
        this.backButton.onClick.on(() => this.stackViewController.popViewController());

        this.payButton.text = '#_title_pay';
        this.payButton.onClick.on(() => this.productMenuViewController.selectedViewController = this.billingViewController);
        this.payButton.onClick.on(() => this.pay());

        this.billingViewController.payButton.onClick.on(() => this.pay());

        this.balanceLabel.type = FrontendJS.LabelType.Balance;

        this.titleBar.leftView.appendChild(this.backButton);

        balanceView.appendChild(this.customerLabel);
        balanceView.appendChild(this.balanceLabel);
        balanceView.appendChild(this.payButton);

        this.productsViewController.footerBar.appendChild(balanceView);
        this.productsViewController.footerBar.appendChild(this.productsViewController.downButton);

        this.appendChild(this.stackViewController);

        this.customerMenuViewController.appendChild(this.membersViewController, '#_title_members');
        this.customerMenuViewController.appendChild(this.guestsViewController, '#_title_guests');

        this.productMenuViewController.appendChild(this.productsViewController, '#_title_buy');
        this.productMenuViewController.appendChild(this.todayViewController);
        // this.productMenuViewController.appendChild(this.monthViewController, '#_title_month');
        this.productMenuViewController.appendChild(this.balanceViewControlelr, '#_title_balance');
        this.productMenuViewController.appendChild(this.billingViewController, '#_title_billing');
    }

    public get selectedCustomer(): Customer { return this.todayViewController.customer; }
    public set selectedCustomer(value: Customer) {
        this.todayViewController.customer = value;
        this.monthViewController.customer = value;
        this.balanceViewControlelr.customer = value;
        this.billingViewController.customer = value;
        this.balanceLabel.isHidden = !value;
        this.todayViewController.footerBar.isVisible = value && (value.paymentMethods & PaymentMethod.Cash) != 0;
        this.productMenuViewController.showViewController(this.monthViewController, value && (value.paymentMethods & PaymentMethod.Balance) != 0);
        this.productMenuViewController.showViewController(this.balanceViewControlelr, value && (value.paymentMethods & PaymentMethod.Balance) != 0);
        this.productMenuViewController.showViewController(this.billingViewController, value && (value.paymentMethods & PaymentMethod.Cash) != 0);

        if (value) {
            this.customerLabel.text = value.toString();
            this.payButton.isHidden = (value.paymentMethods & PaymentMethod.Cash) == 0;
            this.todayViewController.payButton.isHidden = (value.paymentMethods & PaymentMethod.Cash) == 0;
            this.billingViewController.payButton.isHidden = (value.paymentMethods & PaymentMethod.Cash) == 0;
        } else {
            this.customerLabel.text = '';
            this.balanceLabel.text = '';
            this.payButton.isHidden = true;
            this.todayViewController.payButton.isHidden = true;
            this.billingViewController.payButton.isHidden = true;
        }

        this.updateOrder();
    }

    public get selectedProduct(): Product { return this._selectedProduct; }
    public set selectedProduct(value: Product) { this._selectedProduct = value; }

    public get order(): Order { return this._order; }
    public set order(value: Order) {
        this._order = value;

        if (this.selectedCustomer)
            Balance.get(this.selectedCustomer.id).then(value => this.balance = value
                // reduce balance by invoice of open order
                - (this._order && this._order.invoice || 0)
            );
        else
            this.balance = 0;
    }

    public get balance(): number { return this.balanceLabel.numberValue; }
    public set balance(value: number) {
        this.balanceLabel.text = CoreJS.formatCurrency(value);
        this.payButton.isDisabled = value >= 0;
        this.todayViewController.payButton.isDisabled = value >= 0;
        this.billingViewController.payButton.isDisabled = value >= 0;
    }

    public async load(): Promise<void> {
        FrontendJS.Client.config.add(new CoreJS.NumberParameter(KEY_RESET_DELAY, "delay until app goes automatically back to customer selection after last user interaction", CoreJS.Milliseconds.Minute), key => this._resetTimeout.delay = FrontendJS.Client.config.get(key));

        FrontendJS.Client.onInteraction.on(() => this._resetTimeout.restart().then(async () => {
            while (FrontendJS.Client.popupViewController.stackViewController.currentViewController)
                await FrontendJS.Client.popupViewController.popViewController();

            while (this.stackViewController.count)
                await this.stackViewController.popViewController();
        }), { listener: this });

        this.stackViewController.removeAllChildren();
        this.stackViewController.pushViewController(this.customerMenuViewController);

        await super.load();

        this.selectedCustomer = null;
        this.selectedProduct = null;
    }

    public async unload(): Promise<void> {
        FrontendJS.Client.onInteraction.off({ listener: this });

        this._resetTimeout.stop();

        await super.unload();
    }

    public focus(): void {
        super.focus();
    }

    public async selectCustomer(customer: Customer): Promise<void> {
        this.selectedCustomer = customer;

        this.stackViewController.pushViewController(this.productMenuViewController);
    }

    public async selectProduct(product: Product): Promise<void> {
        const orderProduct = this._order
            ? this._order.products.find(tmp => tmp.product == product.id)
            : null;

        const amount = orderProduct && orderProduct.amount || 0;

        this.selectedProduct = product;

        this.purchaseViewController.titleBar.titleLabel.text = CoreJS.Localization.translate('#_title_product_name', { '$1': product.name });
        this.purchaseViewController.priceLabel.text = CoreJS.formatCurrency(product.price);
        this.purchaseViewController.updatePurchaseCount(amount);

        FrontendJS.Client.popupViewController.pushViewController(this.purchaseViewController);
    }

    public async buy(product: Product, customer: Customer): Promise<void> {
        if (!this._order)
            this._order = await Order.create(customer.id, customer.paymentMethods);

        const orderProduct = await OrderProduct.order(this._order.id, product.id);
        await this.updateOrder();

        this.purchaseViewController.updatePurchaseCount(orderProduct.amount);

        FrontendJS.Client.notificationViewController.pushNotification({
            text: '#_notification_product_purchased',
            title: CoreJS.Localization.translate('#_title_product_purchased', { product: product.name })
        });

        if (this.productMenuViewController.selectedViewController == this.todayViewController)
            this.productMenuViewController.selectedViewController.reload();

        if (this.productMenuViewController.selectedViewController == this.monthViewController)
            this.productMenuViewController.selectedViewController.reload();

        // attention, undefined needs to be ignored too
        if (false == await FrontendJS.Client.popupViewController.queryBoolean(CoreJS.Localization.translate("#_query_text_shopping_continue", { '$1': product.name }), "#_query_title_shopping_continue")) {
            this.purchaseViewController.removeFromParent();

            if (this.stackViewController.count)
                await this.stackViewController.popViewController();
        }
    }

    public async undoPurchase(product: Product, customer: Customer): Promise<void> {
        if (!await FrontendJS.Client.popupViewController.queryBoolean('#_query_text_undo_purchase', CoreJS.Localization.translate('#_title_undo_product', { product: product.name })))
            return;

        const orderProduct = await OrderProduct.update(this.order.id, product.id, {
            // reduce amount by one
            amount: - 1 + this.order.products.find(tmp => tmp.product == product.id && tmp.order == this.order.id).amount
        });

        await this.updateOrder();

        this.purchaseViewController.updatePurchaseCount(orderProduct.amount);

        FrontendJS.Client.notificationViewController.pushNotification({
            text: '#_notification_purchase_canceled',
            title: CoreJS.Localization.translate('#_title_product_canceled', { product: product.name })
        });

        if (this.productMenuViewController.selectedViewController == this.todayViewController)
            this.productMenuViewController.selectedViewController.reload();

        if (this.productMenuViewController.selectedViewController == this.monthViewController)
            this.productMenuViewController.selectedViewController.reload();
    }

    private async pay() {
        if (!this.selectedCustomer || (this.selectedCustomer.paymentMethods & PaymentMethod.Cash) == 0)
            throw new Error('selected customer is not a guest');

        const invoice = Math.abs(this.balance);

        const amount = await FrontendJS.Client.popupViewController.queryCurrency('#_query_text_pay_invoice', CoreJS.Localization.translate('#_query_title_pay_invoice', { '$1': CoreJS.formatCurrency(invoice) }));

        if (!amount)
            return;

        if (amount < invoice)
            return FrontendJS.Client.popupViewController.pushMessage('#_error_not_enough_payment', '#_error')
                .then(() => this.pay());

        const tip = amount - invoice;

        if (!(await FrontendJS.Client.popupViewController.queryBoolean(CoreJS.Localization.translate('#_query_text_tip_correct', { '$1': CoreJS.formatCurrency(tip) }), CoreJS.Localization.translate('#_query_title_tip_correct', { '$1': CoreJS.formatCurrency(tip) }))))
            return this.pay();

        await Order.close(this._order.id, PaymentMethod.Cash, amount);

        this.order = null;

        await this.billingViewController.reload();
    }

    private async updateOrder(): Promise<void> {
        if (!this.selectedCustomer)
            return this.order = null;

        const openOrders = await Order.get({ customer: this.selectedCustomer.id, state: OrderState.Open });

        this.order = openOrders[0] ?? null;
    }
}
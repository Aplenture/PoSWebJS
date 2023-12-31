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
import { OrdersViewController } from "./ordersViewController";
import { Product } from "../models/product";
import { Customer } from "../models/customer";
import { PaymentMethod } from "../enums/paymentMethod";
import { Balance } from "../models/balance";
import { Order } from "../models/order";
import { OrderState } from "../enums/orderState";
import { OrderProduct } from "../models/orderProduct";
import { BalanceViewController } from "./balanceViewController";
import { BillingViewController } from "./billingViewController";
import { CategoryGridViewController } from "./categoryGridViewController";

const KEY_RESET_DELAY = "resetDelay";

export class MainViewController extends FrontendJS.BodyViewController {
    public static readonly route = 'main';

    public readonly stackViewController = new FrontendJS.StackViewController();
    public readonly customerMenuViewController = new FrontendJS.MenuViewController('customer-menu-view-controller');
    public readonly productMenuViewController = new FrontendJS.MenuViewController('product-menu-view-controller');
    public readonly membersViewController = new CustomersGridViewController('members-grid-view-controller');
    public readonly guestsViewController = new CustomersGridViewController('guests-grid-view-controller');
    public readonly categoryViewController = new CategoryGridViewController();
    public readonly productsViewController = new ProductsGridViewController();
    public readonly purchaseViewController = new PurchaseProductViewController();
    public readonly openOrdersViewController = new OrdersViewController('open-orders-view-controller');
    public readonly monthOrdersViewController = new OrdersViewController('month-orders-view-controller');
    public readonly balanceViewControlelr = new BalanceViewController();
    public readonly billingViewController = new BillingViewController();

    public readonly customerLabel = new FrontendJS.Label('customer-label');
    public readonly balanceLabel = new FrontendJS.Label('balance-label');

    public readonly backButton = new FrontendJS.Button('back-button');
    public readonly payButton = new FrontendJS.Button('pay-button');

    private readonly _resetTimeout = new CoreJS.Timeout(FrontendJS.Client.config.get(KEY_RESET_DELAY));

    private _selectedProduct: Product;

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
        this.membersViewController.onSelected.on(customer => this.selectCustomer(customer));

        this.guestsViewController.paymentMethods = PaymentMethod.Cash;
        this.guestsViewController.isAddAllowed = true;
        this.guestsViewController.title = '#_title_select_guest';
        this.guestsViewController.onSelected.on(customer => this.selectCustomer(customer));

        this.categoryViewController.title = '#_title_select_category';
        this.categoryViewController.onSelected.on(label => this.productsViewController.category = label && label.id || null);
        this.categoryViewController.onSelected.on(() => this.productMenuViewController.selectedViewController = this.productsViewController);

        this.productsViewController.title = '#_title_select_product';
        this.productsViewController.onSelected.on(product => this.selectedProduct = product);
        this.productsViewController.onSelected.on(async product => {
            if (!await this.buy(product, this.selectedCustomer))
                return;

            // attention, undefined needs to be ignored too
            const done = true === await FrontendJS.Client.popupViewController.queryBoolean(CoreJS.Localization.translate("#_query_text_shopping_done", { '$1': product.name }), "#_query_title_shopping_done", FrontendJS.QueryBooleanType.DoneContinue);

            if (done) {
                this.purchaseViewController.removeFromParent();
                await this.reset();
            }
        });

        this.openOrdersViewController.state = OrderState.Open;
        this.openOrdersViewController.monthDropbox.isHidden = true;
        this.openOrdersViewController.tableViewController.titleLabel.text = '#_title_open_order';
        this.openOrdersViewController.onProductSelected.on(product => this.selectedProduct = product);
        this.openOrdersViewController.onProductSelected.on(product => this.displayPurchase(product));
        this.openOrdersViewController.payButton.onClick.on(() => this.productMenuViewController.selectedViewController = this.billingViewController);
        this.openOrdersViewController.payButton.onClick.on(() => this.pay());
        this.openOrdersViewController.correctButton.onClick.on(() => this.productMenuViewController.selectedViewController = this.billingViewController);
        this.openOrdersViewController.correctButton.onClick.on(() => this.correctPayment().then(result => result && this.pay()));

        this.monthOrdersViewController.tableViewController.titleLabel.text = '#_title_month';
        this.monthOrdersViewController.correctButton.isHidden = true;
        this.monthOrdersViewController.payButton.isHidden = true;
        this.monthOrdersViewController.onProductSelected.on(product => this.selectedProduct = product);
        this.monthOrdersViewController.onProductSelected.on(product => this.displayPurchase(product));
        this.monthOrdersViewController.payButton.onClick.on(() => this.productMenuViewController.selectedViewController = this.billingViewController);
        this.monthOrdersViewController.payButton.onClick.on(() => this.pay());
        this.monthOrdersViewController.correctButton.onClick.on(() => this.productMenuViewController.selectedViewController = this.billingViewController);
        this.monthOrdersViewController.correctButton.onClick.on(() => this.correctPayment().then(result => result && this.pay()));

        this.purchaseViewController.customerLabel.isVisible = false;
        this.purchaseViewController.productLabel.isVisible = false;
        this.purchaseViewController.buyButton.onClick.on(() => this.buy(this.selectedProduct, this.selectedCustomer));
        this.purchaseViewController.undoButton.onClick.on(() => this.undoPurchase(this.selectedProduct));

        this.backButton.type = FrontendJS.ButtonType.Back;
        this.backButton.onClick.on(async () => {
            this.backButton.isEnabled = false;
            await this.stackViewController.popViewController();
            this.backButton.isEnabled = true;
        });

        this.payButton.text = '#_title_pay';
        this.payButton.onClick.on(() => this.productMenuViewController.selectedViewController = this.billingViewController);
        this.payButton.onClick.on(() => this.pay());

        this.billingViewController.payButton.onClick.on(() => this.pay());
        this.billingViewController.correctButton.onClick.on(() => this.correctPayment().then(result => result && this.pay()));

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

        this.productMenuViewController.appendChild(this.categoryViewController, '#_title_categories');
        this.productMenuViewController.appendChild(this.productsViewController, '#_title_products');
        this.productMenuViewController.appendChild(this.openOrdersViewController, '#_title_order');
        this.productMenuViewController.appendChild(this.monthOrdersViewController, '#_title_month');
        this.productMenuViewController.appendChild(this.balanceViewControlelr, '#_title_balance');
        this.productMenuViewController.appendChild(this.billingViewController, '#_title_billing');
    }

    public get currentCustomersViewController(): CustomersGridViewController { return this.customerMenuViewController.selectedViewController as any; }

    public get canPayWithBalance(): boolean { return (this.selectedCustomer.paymentMethods & PaymentMethod.Balance) > 0; }
    public get canPayWithCash(): boolean { return (this.selectedCustomer.paymentMethods & PaymentMethod.Cash) > 0; }

    public get selectedCustomer(): Customer { return this.openOrdersViewController.customer; }
    public set selectedCustomer(value: Customer) {
        this.openOrdersViewController.customer = value;
        this.monthOrdersViewController.customer = value;
        this.balanceViewControlelr.customer = value;
        this.billingViewController.customer = value;
        this.balanceLabel.isHidden = !value;
        this.openOrdersViewController.footerBar.isVisible = value && this.canPayWithCash;
        // this.monthOrdersViewController.footerBar.isVisible = value && this.canPayWithCash;
        this.productMenuViewController.showViewController(this.balanceViewControlelr, value && this.canPayWithBalance);
        this.productMenuViewController.showViewController(this.billingViewController, value && this.canPayWithCash);

        if (value) {
            this.customerLabel.text = value.toString();
            this.productMenuViewController.showViewController(this.monthOrdersViewController, this.canPayWithBalance);
            this.payButton.isVisible = this.canPayWithCash;
            this.openOrdersViewController.payButton.isVisible = this.canPayWithCash;
            this.monthOrdersViewController.payButton.isVisible = this.canPayWithCash;
            this.billingViewController.payButton.isVisible = this.canPayWithCash;
        } else {
            this.customerLabel.text = '';
            this.balanceLabel.text = '';
            this.payButton.isHidden = true;
            // this.openOrdersViewController.payButton.isHidden = true;
            // this.openOrdersViewController.payButton.isHidden = true;
            this.billingViewController.payButton.isHidden = true;
        }
    }

    public get selectedProduct(): Product { return this._selectedProduct; }
    public set selectedProduct(value: Product) { this._selectedProduct = value; }

    public get openCustomerOrder(): Order { return this.openOrdersViewController.openOrders[0]; }
    public get closedCustomerOrder(): Order { return this.openOrdersViewController.closedOrders[this.openOrdersViewController.closedOrders.length - 1]; }

    public get balance(): number { return this.balanceLabel.numberValue; }
    public set balance(value: number) {
        if (this.selectedCustomer && this.canPayWithCash)
            value = Math.abs(value);

        this.balanceLabel.text = CoreJS.formatCurrency(value);
        this.payButton.isEnabled = value > 0;
        this.openOrdersViewController.payButton.isEnabled = value > 0;
        this.monthOrdersViewController.payButton.isEnabled = value > 0;
        this.billingViewController.payButton.isEnabled = value > 0;
    }

    public async load(): Promise<void> {
        FrontendJS.Client.config.add(new CoreJS.NumberParameter(KEY_RESET_DELAY, "delay until app goes automatically back to customer selection after last user interaction", CoreJS.Milliseconds.Minute), key => this._resetTimeout.delay = FrontendJS.Client.config.get(key));

        FrontendJS.Client.onInteraction.on(() => this._resetTimeout.restart().then(() => this.reset()), { listener: this });

        this.stackViewController.removeAllChildren();
        this.stackViewController.pushViewController(this.customerMenuViewController);

        await super.load();

        this.selectCustomer(null);
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

    public async reset() {
        while (FrontendJS.Client.popupViewController.stackViewController.currentViewController)
            await FrontendJS.Client.popupViewController.popViewController();

        while (this.stackViewController.count)
            await this.stackViewController.popViewController();
    }

    public async selectCustomer(customer: Customer): Promise<void> {
        this.selectedCustomer = customer;
        this.productsViewController.category = null;

        if (customer) await this.openOrdersViewController.load();
        await this.updateBalance();
        if (customer) await this.stackViewController.pushViewController(this.productMenuViewController);
    }

    public async displayPurchase(product: Product): Promise<void> {
        const openOrder = this.openCustomerOrder;
        const orderProduct = openOrder
            ? openOrder.products.find(tmp => tmp.product == product.id)
            : null;

        const amount = orderProduct && orderProduct.amount || 0;

        this.purchaseViewController.titleBar.titleLabel.text = CoreJS.Localization.translate('#_title_product_name', { '$1': product.name });
        this.purchaseViewController.priceLabel.text = CoreJS.formatCurrency(product.price);
        this.purchaseViewController.updatePurchaseCount(amount);

        FrontendJS.Client.popupViewController.pushViewController(this.purchaseViewController);
    }

    public async buy(product: Product, customer: Customer): Promise<boolean> {
        const amount = await FrontendJS.Client.popupViewController.queryNumber(CoreJS.Localization.translate('#_query_text_order_amount', { '$1': product.name }), '#_query_title_order_amount', {
            default: 1,
            min: 1
        });

        if (!amount)
            return false;

        const orderProduct = await OrderProduct.order({
            customer: customer.id,
            product: product.id,
            amount
        });

        await Promise.all([
            this.currentCustomersViewController.reload(),
            this.openOrdersViewController.reload()
        ]);

        this.updateBalance();
        this.purchaseViewController.updatePurchaseCount(orderProduct.amount);

        FrontendJS.Client.notificationViewController.pushNotification({
            text: '#_notification_product_purchased',
            title: CoreJS.Localization.translate('#_title_product_purchased', { product: product.name })
        });

        if (this.productMenuViewController.selectedViewController == this.openOrdersViewController)
            this.productMenuViewController.selectedViewController.reload();

        if (this.productMenuViewController.selectedViewController == this.monthOrdersViewController)
            this.productMenuViewController.selectedViewController.reload();

        return true;
    }

    public async undoPurchase(product: Product): Promise<boolean> {
        if (!await FrontendJS.Client.popupViewController.queryBoolean(CoreJS.Localization.translate('#_query_text_undo_purchase', { '$1': product.name }), CoreJS.Localization.translate('#_title_undo_product', { '$1': product.name })))
            return;

        const openOrder = this.openCustomerOrder;

        if (!openOrder)
            throw new Error('there is no open order from selected customer');

        const currentOrderProduct = openOrder.products.find(tmp => tmp.product == product.id && tmp.order == openOrder.id);

        if (!currentOrderProduct)
            throw new Error(`the order does not contain this product`);

        const decrease = await FrontendJS.Client.popupViewController.queryNumber(CoreJS.Localization.translate('#_query_text_undo_purchase_amount', { '$1': product.name }), '#_query_title_undo_purchase_amount', {
            default: 1,
            min: 1,
            max: currentOrderProduct.amount
        });

        if (!decrease)
            return false;

        const amount = currentOrderProduct.amount - decrease;

        await OrderProduct.update({
            customer: this.selectedCustomer.id,
            product: product.id,
            amount
        });

        await Promise.all([
            this.currentCustomersViewController.reload(),
            this.openOrdersViewController.reload()
        ]);

        this.updateBalance();
        this.purchaseViewController.updatePurchaseCount(amount);

        FrontendJS.Client.notificationViewController.pushNotification({
            text: '#_notification_purchase_canceled',
            title: CoreJS.Localization.translate('#_title_product_canceled', { product: product.name })
        });

        if (this.productMenuViewController.selectedViewController == this.openOrdersViewController)
            this.productMenuViewController.selectedViewController.reload();

        if (this.productMenuViewController.selectedViewController == this.monthOrdersViewController)
            this.productMenuViewController.selectedViewController.reload();

        return true;
    }

    private async pay(): Promise<boolean> {
        if (!this.selectedCustomer || !this.canPayWithCash)
            throw new Error('selected customer is not a guest');

        const openOrder = this.openCustomerOrder;

        if (!openOrder)
            throw new Error('there is no open order from selected customer');

        const invoice = Math.abs(this.balance);

        const amount = await FrontendJS.Client.popupViewController.queryCurrency('#_query_text_pay_invoice', CoreJS.Localization.translate('#_query_title_pay_invoice', { '$1': CoreJS.formatCurrency(invoice) }));

        if (!amount)
            return false;

        if (amount < invoice)
            return FrontendJS.Client.popupViewController.pushMessage('#_error_not_enough_payment', '#_error')
                .then(() => this.pay());

        const tip = amount - invoice;

        if (!(await FrontendJS.Client.popupViewController.queryBoolean(CoreJS.Localization.translate('#_query_text_tip_correct', { '$1': CoreJS.formatCurrency(tip) }), CoreJS.Localization.translate('#_query_title_tip_correct', { '$1': CoreJS.formatCurrency(tip) }))))
            return this.pay();

        await Order.close(openOrder.id, PaymentMethod.Cash, amount);

        await Promise.all([
            this.currentCustomersViewController.reload(),
            this.openOrdersViewController.reload(),
            this.billingViewController.reload()
        ]);

        this.updateBalance();

        return true;
    }

    private async correctPayment(): Promise<boolean> {
        if (!this.selectedCustomer || !this.canPayWithCash)
            throw new Error('selected customer is not a guest');

        const closedOrder = this.closedCustomerOrder;

        if (!closedOrder)
            throw new Error('there is no closed order from selected customer');

        if (!(await FrontendJS.Client.popupViewController.queryBoolean('#_query_text_payment_correct', '#_query_title_payment_correct')))
            return false;

        await Order.reopen(closedOrder.id);

        await Promise.all([
            this.currentCustomersViewController.reload(),
            this.openOrdersViewController.reload(),
            this.billingViewController.reload()
        ]);

        this.updateBalance();

        return true;
    }

    private async updateBalance(): Promise<any> {
        if (!this.selectedCustomer)
            return this.balance = 0;

        const openOrder = this.openCustomerOrder;

        this.balance = await Balance.get(this.selectedCustomer.id)
            // reduce balance by open order invoice
            - (openOrder && openOrder.invoice || 0);
    }
}
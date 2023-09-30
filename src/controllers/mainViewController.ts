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
import { FinanceViewController } from "./financeViewController";
import { Product } from "../models/product";
import { Customer } from "../models/customer";
import { PaymentMethod } from "../enums/paymentMethod";
import { Balance } from "../models/balance";
import { Order } from "../models/order";
import { OrderState } from "../enums/orderState";
import { OrderProduct } from "../models/orderProduct";

export class MainViewController extends FrontendJS.BodyViewController {
    public static readonly route = 'main';

    public readonly stackViewController = new FrontendJS.StackViewController();
    public readonly customerMenuViewController = new FrontendJS.MenuViewController('customer-menu-view-controller');
    public readonly productMenuViewController = new FrontendJS.MenuViewController('product-menu-view-controller');
    public readonly membersViewController = new CustomersGridViewController('members-grid-view-controller');
    public readonly guestsViewController = new CustomersGridViewController('guests-grid-view-controller');
    public readonly productsViewController = new ProductsGridViewController();
    public readonly purchaseViewController = new PurchaseProductViewController();
    public readonly todayViewController = new FinanceViewController('today-invoices-view-controller');
    public readonly monthViewController = new FinanceViewController('month-invoices-view-controller');

    public readonly customerLabel = new FrontendJS.Label('customer-label');
    public readonly balanceLabel = new FrontendJS.Label('balance-label');

    public readonly backButton = new FrontendJS.Button('back-button');
    public readonly payButton = new FrontendJS.Button('pay-button');
    public readonly previousButton = new FrontendJS.Button('previous-button');
    public readonly nextButton = new FrontendJS.Button('next-button');

    private _selectedProduct: Product;
    private _order: Order;

    constructor(public readonly account: FrontendJS.Account.Account, ...classes: string[]) {
        super(...classes, "main-view-controller");

        const balanceView = new FrontendJS.View('balance-view');

        this.title = '#_title_main';

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
        this.todayViewController.timeFrame = CoreJS.TimeFrame.Day;

        this.monthViewController.title = '#_title_month_this';
        this.monthViewController.timeFrame = CoreJS.TimeFrame.Month;

        this.purchaseViewController.buyButton.onClick.on(() => this.buy(this.selectedProduct, this.selectedCustomer));
        this.purchaseViewController.undoButton.onClick.on(() => this.undoPurchase(this.selectedProduct, this.selectedCustomer));

        this.backButton.type = FrontendJS.ButtonType.Back;
        this.backButton.onClick.on(() => this.stackViewController.popViewController());

        this.payButton.text = '#_title_pay';
        this.payButton.onClick.on(() => this.pay());

        this.previousButton.text = '#_title_previous';
        this.previousButton.onClick.on(() => this.previous());

        this.nextButton.text = '#_title_next';
        this.nextButton.onClick.on(() => this.next());

        this.balanceLabel.type = FrontendJS.LabelType.Balance;

        this.titleBar.leftView.appendChild(this.backButton);

        balanceView.appendChild(this.customerLabel);
        balanceView.appendChild(this.balanceLabel);
        balanceView.appendChild(this.payButton);

        this.footerBar.appendChild(this.previousButton);
        this.footerBar.appendChild(balanceView);
        this.footerBar.appendChild(this.nextButton);

        this.appendChild(this.stackViewController);

        this.customerMenuViewController.appendChild(this.membersViewController, '#_title_members');
        this.customerMenuViewController.appendChild(this.guestsViewController, '#_title_guests');

        this.productMenuViewController.appendChild(this.productsViewController, '#_title_buy');
        this.productMenuViewController.appendChild(this.todayViewController);
        this.productMenuViewController.appendChild(this.monthViewController, '#_title_month');
    }

    public get selectedCustomer(): Customer { return this.todayViewController.customer; }
    public set selectedCustomer(value: Customer) {
        this.todayViewController.customer = value;
        this.monthViewController.customer = value;
        this.balanceLabel.isHidden = !value;
        this.previousButton.isVisible = !value;
        this.nextButton.isVisible = !value;
        this.previousButton.isEnabled = false;
        this.nextButton.isEnabled = true;

        if (value) {
            this.customerLabel.text = value.toString();
            this.payButton.isHidden = (value.paymentMethods & PaymentMethod.Cash) == 0;
        } else {
            this.customerLabel.text = '';
            this.balanceLabel.text = '';
            this.payButton.isHidden = true;
        }

        this.updateOrder();
    }

    public get selectedProduct(): Product { return this._selectedProduct; }
    public set selectedProduct(value: Product) { this._selectedProduct = value; }

    public get order(): Order { return this._order; }
    public set order(value: Order) {
        this._order = value;

        if (this.selectedCustomer)
            Balance.get(this.selectedCustomer.id).then(value => this.balance = this._order
                // reduce balance by invoice of open order
                ? value - this._order.invoice
                : value
            );
        else
            this.balance = 0;
    }

    public get balance(): number { return this.balanceLabel.numberValue; }
    public set balance(value: number) {
        this.balanceLabel.text = CoreJS.formatCurrency(value);
        this.payButton.isDisabled = value >= 0;
    }

    public async load(): Promise<void> {
        this.stackViewController.removeAllChildren();
        this.stackViewController.pushViewController(this.customerMenuViewController);

        this.selectedCustomer = null;
        this.selectedProduct = null;

        await super.load();
    }

    public async unload(): Promise<void> {
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

        this.purchaseViewController.titleBar.titleLabel.text = CoreJS.Localization.translate('#_title_order_product', { product: product.name });
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
    }

    private async pay() {
        if (!this.selectedCustomer || (this.selectedCustomer.paymentMethods & PaymentMethod.Cash) == 0)
            throw new Error('selected customer is not a guest');

        const amount = await FrontendJS.Client.popupViewController.queryCurrency('#_query_text_pay_invoice', CoreJS.Localization.translate('#_query_title_pay_invoice', { '$1': CoreJS.formatCurrency(this.balance) }));

        if (!amount)
            return;

        if (amount < this.balance)
            return FrontendJS.Client.popupViewController.pushMessage('#_error_not_enough_payment', '#_error')
                .then(() => this.pay());

        await Order.close(this._order.id, PaymentMethod.Cash, amount);

        this.order = null;
    }

    private previous() {
        if (this.customerMenuViewController.selectedViewController == this.membersViewController) {
            this.previousButton.isDisabled = this.membersViewController.scrollVertical(-1);
            this.nextButton.isEnabled = true;
        } else {
            this.previousButton.isDisabled = this.guestsViewController.scrollVertical(-1);
            this.nextButton.isEnabled = true;
        }
    }
    
    private next() {
        if (this.customerMenuViewController.selectedViewController == this.membersViewController) {
            this.previousButton.isEnabled = true;
            this.nextButton.isDisabled = this.membersViewController.scrollVertical();
        } else {
            this.previousButton.isEnabled = true;
            this.nextButton.isDisabled = this.guestsViewController.scrollVertical();
        }
    }

    private async updateOrder(): Promise<void> {
        if (!this.selectedCustomer)
            return this.order = null;

        const openOrders = await Order.get({ customer: this.selectedCustomer.id, state: OrderState.Open });

        this.order = openOrders[0] ?? null;
    }
}
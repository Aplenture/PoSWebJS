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
import { OpenOrdersViewController } from "./openOrdersViewController";
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
    public readonly customersMenuViewController = new FrontendJS.MenuViewController('customer-menu-view-controller');
    public readonly mainMenuViewController = new FrontendJS.MenuViewController('main-menu-view-controller');
    public readonly membersMenuViewController = new FrontendJS.MenuViewController('members-menu-view-controller');
    public readonly guestsMenuViewController = new FrontendJS.MenuViewController('guests-menu-view-controller');
    public readonly customerMembersViewController = new CustomersGridViewController('customer-members-grid-view-controller');
    public readonly customerGuestsViewController = new CustomersGridViewController('customer-guests-grid-view-controller');
    public readonly mainMembersViewController = new CustomersGridViewController('main-members-grid-view-controller');
    public readonly mainGuestsViewController = new CustomersGridViewController('main-guests-grid-view-controller');
    public readonly mainProductsViewController = new ProductsGridViewController();
    public readonly mainPurchaseViewController = new PurchaseProductViewController('main-purchase-product-view-controller');
    public readonly membersOpenOrdersPurchaseViewController = new PurchaseProductViewController('members-open-orders-purchase-product-view-controller');
    public readonly guestsOpenOrdersPurchaseViewController = new PurchaseProductViewController('guests-open-orders-purchase-product-view-controller');
    public readonly membersOpenOrdersViewController = new OpenOrdersViewController('members-open-orders-view-controller');
    public readonly guestsOpenOrdersViewController = new OpenOrdersViewController('guests-open-orders-view-controller');
    public readonly membersBalanceViewControlelr = new BalanceViewController();
    public readonly guestsBillingViewController = new BillingViewController();

    public readonly backButton = new FrontendJS.Button('back-button');

    private readonly _resetTimeout = new CoreJS.Timeout(FrontendJS.Client.config.get(KEY_RESET_DELAY));

    private _selectedProduct: Product;
    private _order: Order;
    private _balance: number;
    private _displayingContinueQuery = false;

    constructor(public readonly account: FrontendJS.Account.Account, ...classes: string[]) {
        super(...classes, "main-view-controller");

        this.title = '#_title_main';
        this.footerBar.isVisible = false;

        this.stackViewController.onPush.on(() => (this.stackViewController.currentViewController as FrontendJS.MenuViewController).selectedIndex = 0);
        this.stackViewController.onPush.on(() => this.titleBar.titleLabel.text = (this.stackViewController.currentViewController as FrontendJS.MenuViewController).selectedViewController.title);
        this.stackViewController.onPush.on(() => this.backButton.isHidden = !this.stackViewController.count);

        this.stackViewController.onPop.on(() => (this.stackViewController.currentViewController as FrontendJS.MenuViewController).selectedIndex = 0);
        this.stackViewController.onPop.on(() => this.titleBar.titleLabel.text = (this.stackViewController.currentViewController as FrontendJS.MenuViewController).selectedViewController.title);
        this.stackViewController.onPop.on(() => this.backButton.isHidden = !this.stackViewController.count);
        this.stackViewController.onPop.on(() => this.customersMenuViewController.parent && (this.selectedCustomer = null));
        this.stackViewController.onPop.on(() => this.mainMenuViewController.parent && (this.selectedProduct = null));

        this.customersMenuViewController.onSelected.on(() => this.titleBar.titleLabel.text = this.customersMenuViewController.selectedViewController.title);
        this.mainMenuViewController.onSelected.on(() => this.titleBar.titleLabel.text = this.mainMenuViewController.selectedViewController.title);
        this.membersMenuViewController.onSelected.on(() => this.titleBar.titleLabel.text = this.membersMenuViewController.selectedViewController.title);
        this.guestsMenuViewController.onSelected.on(() => this.titleBar.titleLabel.text = this.guestsMenuViewController.selectedViewController.title);

        this.customerMembersViewController.paymentMethods = PaymentMethod.Balance;
        this.customerMembersViewController.title = '#_title_select_member';
        this.customerMembersViewController.onSelectedCustomer.on(customer => this.selectedCustomer = customer);
        this.customerMembersViewController.onSelectedCustomer.on(customer => this.displayPurchase(this.mainPurchaseViewController, this.selectedProduct, customer));

        this.customerGuestsViewController.paymentMethods = PaymentMethod.Cash;
        this.customerGuestsViewController.isAddAllowed = true;
        this.customerGuestsViewController.title = '#_title_select_guest';
        this.customerGuestsViewController.onSelectedCustomer.on(customer => this.selectedCustomer = customer);
        this.customerGuestsViewController.onSelectedCustomer.on(customer => this.displayPurchase(this.mainPurchaseViewController, this.selectedProduct, customer));

        this.mainMembersViewController.paymentMethods = PaymentMethod.Balance;
        this.mainMembersViewController.title = '#_title_select_member';
        this.mainMembersViewController.onSelectedCustomer.on(customer => this.selectedCustomer = customer);
        this.mainMembersViewController.onSelectedCustomer.on(() => this.stackViewController.pushViewController(this.membersMenuViewController));

        this.mainGuestsViewController.paymentMethods = PaymentMethod.Cash;
        this.mainGuestsViewController.isAddAllowed = true;
        this.mainGuestsViewController.title = '#_title_select_guest';
        this.mainGuestsViewController.onSelectedCustomer.on(customer => this.selectedCustomer = customer);
        this.mainGuestsViewController.onSelectedCustomer.on(() => this.stackViewController.pushViewController(this.guestsMenuViewController));

        this.mainProductsViewController.title = '#_title_select_product';
        this.mainProductsViewController.onSelectedProduct.on(product => this.selectedProduct = product);
        this.mainProductsViewController.onSelectedProduct.on(() => this.stackViewController.pushViewController(this.customersMenuViewController));

        this.membersOpenOrdersViewController.footerBar.isHidden = true;
        this.membersOpenOrdersViewController.onProductSelected.on(product => this.selectedProduct = product);
        this.membersOpenOrdersViewController.onProductSelected.on(product => this.displayPurchase(this.membersOpenOrdersPurchaseViewController, product, this.selectedCustomer));

        this.guestsOpenOrdersViewController.onProductSelected.on(product => this.selectedProduct = product);
        this.guestsOpenOrdersViewController.onProductSelected.on(product => this.displayPurchase(this.guestsOpenOrdersPurchaseViewController, product, this.selectedCustomer));
        this.guestsOpenOrdersViewController.payButton.onClick.on(() => this.guestsMenuViewController.selectedViewController = this.guestsBillingViewController);
        this.guestsOpenOrdersViewController.payButton.onClick.on(() => this.pay());

        this.mainPurchaseViewController.titleBar.isHidden = true;
        this.mainPurchaseViewController.buyButton.onClick.on(() => this.buy(this.selectedProduct, this.selectedCustomer).then(result => result && this.reset()));
        this.mainPurchaseViewController.undoButton.onClick.on(() => this.undoPurchase(this.selectedProduct, this.selectedCustomer).then(result => result && this.reset()));

        this.membersOpenOrdersPurchaseViewController.titleBar.isHidden = true;
        this.membersOpenOrdersPurchaseViewController.buyButton.onClick.on(async () => {
            await this.buy(this.selectedProduct, this.selectedCustomer);
            this.membersOpenOrdersPurchaseViewController.removeFromParent();
            await this.membersOpenOrdersViewController.reload();
        });
        this.membersOpenOrdersPurchaseViewController.undoButton.onClick.on(async () => {
            await this.undoPurchase(this.selectedProduct, this.selectedCustomer);
            this.membersOpenOrdersPurchaseViewController.removeFromParent();
            await this.membersOpenOrdersViewController.reload();
        });

        this.guestsOpenOrdersPurchaseViewController.titleBar.isHidden = true;
        this.guestsOpenOrdersPurchaseViewController.buyButton.onClick.on(async () => {
            await this.buy(this.selectedProduct, this.selectedCustomer);
            this.guestsOpenOrdersPurchaseViewController.removeFromParent();
            await this.guestsOpenOrdersViewController.reload();
        });
        this.guestsOpenOrdersPurchaseViewController.undoButton.onClick.on(async () => {
            await this.undoPurchase(this.selectedProduct, this.selectedCustomer);
            this.guestsOpenOrdersPurchaseViewController.removeFromParent();
            await this.guestsOpenOrdersViewController.reload();
        });

        this.backButton.type = FrontendJS.ButtonType.Back;
        this.backButton.onClick.on(() => this.stackViewController.count && this.stackViewController.popViewController());

        this.guestsBillingViewController.payButton.onClick.on(() => this.pay());

        this.titleBar.leftView.appendChild(this.backButton);

        this.mainProductsViewController.footerBar.appendChild(this.mainProductsViewController.downButton);

        this.appendChild(this.stackViewController);

        this.customersMenuViewController.appendChild(this.customerMembersViewController, '#_title_members');
        this.customersMenuViewController.appendChild(this.customerGuestsViewController, '#_title_guests');

        this.mainMenuViewController.appendChild(this.mainProductsViewController, '#_title_buy');
        this.mainMenuViewController.appendChild(this.mainMembersViewController, '#_title_members');
        this.mainMenuViewController.appendChild(this.mainGuestsViewController, '#_title_guests');

        this.membersMenuViewController.appendChild(this.membersOpenOrdersViewController, '#_title_order');
        this.membersMenuViewController.appendChild(this.membersBalanceViewControlelr, '#_title_balance');

        this.guestsMenuViewController.appendChild(this.guestsOpenOrdersViewController, '#_title_order');
        this.guestsMenuViewController.appendChild(this.guestsBillingViewController, '#_title_billing');
    }

    public get selectedCustomer(): Customer { return this.guestsOpenOrdersViewController.customer; }
    public set selectedCustomer(value: Customer) {
        this.membersOpenOrdersViewController.customer = value;
        this.guestsOpenOrdersViewController.customer = value;
        this.membersBalanceViewControlelr.customer = value;
        this.guestsBillingViewController.customer = value;
    }

    public get selectedProduct(): Product { return this._selectedProduct; }
    public set selectedProduct(value: Product) { this._selectedProduct = value; }

    public get order(): Order { return this._order; }
    public set order(value: Order) {
        this._order = value;

        if (this.selectedCustomer)
            Balance.get(this.selectedCustomer.id).then(value => this._balance = value
                // reduce balance by invoice of open order
                - (this._order && this._order.invoice || 0)
            );
        else
            this._balance = 0;
    }

    public get balance(): number { return this._balance; }

    public async load(): Promise<void> {
        FrontendJS.Client.config.add(new CoreJS.NumberParameter(KEY_RESET_DELAY, "delay until app goes automatically back to customer selection after last user interaction", CoreJS.Milliseconds.Minute), key => this._resetTimeout.delay = FrontendJS.Client.config.get(key));

        FrontendJS.Client.onInteraction.on(async () => {
            await this._resetTimeout.restart();

            // skip when continue query is shown already
            if (this._displayingContinueQuery)
                return;

            // skip when stack is empty
            if (!this.stackViewController.count)
                return;

            // this._displayingContinueQuery = true;

            // // attention, undefined needs to be ignored too
            // const shouldContinue = true === await FrontendJS.Client.popupViewController.queryBoolean("#_query_text_shopping_continue", "#_query_title_shopping_continue");

            // this._displayingContinueQuery = false;

            // if (shouldContinue)
            //     return;

            this.reset();
        }, { listener: this });

        this.stackViewController.removeAllChildren();
        this.stackViewController.pushViewController(this.mainMenuViewController);

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

    public async reset() {
        while (FrontendJS.Client.popupViewController.stackViewController.currentViewController)
            await FrontendJS.Client.popupViewController.popViewController();

        while (this.stackViewController.count)
            await this.stackViewController.popViewController();

        this.selectedCustomer = null;
        this.selectedProduct = null;
    }

    public async displayPurchase(controller: PurchaseProductViewController, product: Product, customer: Customer): Promise<void> {
        await this.updateOrder();

        const orderProduct = this._order
            ? this._order.products.find(tmp => tmp.product == product.id)
            : null;

        const amount = orderProduct && orderProduct.amount || 0;

        controller.titleBar.titleLabel.text = CoreJS.Localization.translate('#_title_product_name', { '$1': product.name });
        controller.customerLabel.text = customer.toString();
        controller.productLabel.text = product.name;
        controller.priceLabel.text = CoreJS.formatCurrency(product.price);
        controller.updatePurchaseCount(amount);

        FrontendJS.Client.popupViewController.pushViewController(controller);
    }

    public async buy(product: Product, customer: Customer): Promise<boolean> {
        if (!this._order)
            this._order = await Order.create(customer.id, customer.paymentMethods);

        const amount = await FrontendJS.Client.popupViewController.queryNumber(CoreJS.Localization.translate('#_query_text_order_amount', { '$1': product.name }), '#_query_title_order_amount', 1);

        if (!amount)
            return false;

        const orderProduct = await OrderProduct.order(this._order.id, product.id, {
            amount
        });

        await this.updateOrder();

        this.mainPurchaseViewController.updatePurchaseCount(orderProduct.amount);
        this.membersOpenOrdersPurchaseViewController.updatePurchaseCount(orderProduct.amount);
        this.guestsOpenOrdersPurchaseViewController.updatePurchaseCount(orderProduct.amount);

        FrontendJS.Client.notificationViewController.pushNotification({
            text: '#_notification_product_purchased',
            title: CoreJS.Localization.translate('#_title_product_purchased', { product: product.name })
        });

        return true;
    }

    public async undoPurchase(product: Product, customer: Customer): Promise<boolean> {
        if (!await FrontendJS.Client.popupViewController.queryBoolean('#_query_text_undo_purchase', CoreJS.Localization.translate('#_title_undo_product', { product: product.name })))
            return false;

        const amount = await FrontendJS.Client.popupViewController.queryNumber(CoreJS.Localization.translate('#_query_text_undo_purchase_amount', { '$1': product.name }), '#_query_title_undo_purchase_amount', 1);

        if (!amount)
            return false;

        const orderProduct = await OrderProduct.update(this.order.id, product.id, {
            // reduce amount by input
            amount: - amount + this.order.products.find(tmp => tmp.product == product.id && tmp.order == this.order.id).amount
        });

        await this.updateOrder();

        this.mainPurchaseViewController.updatePurchaseCount(orderProduct.amount);
        this.membersOpenOrdersPurchaseViewController.updatePurchaseCount(orderProduct.amount);
        this.guestsOpenOrdersPurchaseViewController.updatePurchaseCount(orderProduct.amount);

        FrontendJS.Client.notificationViewController.pushNotification({
            text: '#_notification_purchase_canceled',
            title: CoreJS.Localization.translate('#_title_product_canceled', { product: product.name })
        });

        return true;
    }

    private async pay(): Promise<boolean> {
        if (!this.selectedCustomer || (this.selectedCustomer.paymentMethods & PaymentMethod.Cash) == 0)
            throw new Error('selected customer is not a guest');

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

        await Order.close(this._order.id, PaymentMethod.Cash, amount);

        this.order = null;

        await this.guestsBillingViewController.reload();

        return true;
    }

    private async updateOrder(): Promise<void> {
        if (!this.selectedCustomer)
            return this.order = null;

        const openOrders = await Order.get({ customer: this.selectedCustomer.id, state: OrderState.Open });

        this.order = openOrders[0] ?? null;
    }
}
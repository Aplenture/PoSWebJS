/**
 * Aplenture/PoSWebJS
 * https://github.com/Aplenture/PoSWebJS
 * Copyright (c) 2023 Aplenture
 * License https://github.com/Aplenture/PoSWebJS/blob/main/LICENSE
 */

import * as FrontendJS from "frontendjs";
import { OrderState } from "../enums/orderState";
import { PaymentMethod } from "../enums/paymentMethod";
import { OrderProduct } from "./orderProduct";

const ROUTE_CREATE = "createOrder";
const ROUTE_CLOSE = "closeOrder";
const ROUTE_REOPEN = "reopenOrder";
const ROUTE_DELETE = "deleteOrder";
const ROUTE_GET = "getOrders";

interface GetOptions {
    readonly customer?: number;
    readonly start?: number;
    readonly end?: number;
    readonly state?: OrderState;
}

export class Order {
    private static _server: FrontendJS.Server;

    constructor(
        public readonly id: number,
        public readonly account: number,
        public updated: number,
        public state: OrderState,
        public readonly customer: number,
        public paymentMethod: PaymentMethod,
        public tip: number,
        public readonly products: OrderProduct[] = []
    ) { }

    public get invoice(): number { return this.products.map(product => product.invoice).reduce((a, b) => a + b, 0) };

    public static async prepare(preparer: FrontendJS.ServerPreparer): Promise<void> {
        preparer.addRoute(ROUTE_CREATE);
        preparer.addRoute(ROUTE_CLOSE);
        preparer.addRoute(ROUTE_REOPEN);
        preparer.addRoute(ROUTE_DELETE);
        preparer.addRoute(ROUTE_GET);
    }

    public static async init(server: FrontendJS.Server): Promise<void> {
        this._server = server;
    }

    public static async load() { }
    public static async unload() { }
    public static async start() { }

    public static create(customer: number, paymentmethod?: PaymentMethod): Promise<Order> {
        return this._server.requestJSON(ROUTE_CREATE, { customer, paymentmethod }).then(data => new Order(
            data.id,
            data.account,
            data.updated,
            data.state,
            data.customer,
            data.paymentMethod,
            data.tip
        ));
    }

    public static close(order: number, paymentmethod: PaymentMethod, amount: number): Promise<Order> {
        return this._server.requestJSON(ROUTE_CLOSE, { order, paymentmethod, amount }).then(data => new Order(
            data.id,
            data.account,
            data.updated,
            data.state,
            data.customer,
            data.paymentMethod,
            data.tip
        ));
    }

    public static reopen(order: number): Promise<Order> {
        return this._server.requestJSON(ROUTE_REOPEN, { order }).then(data => new Order(
            data.id,
            data.account,
            data.updated,
            data.state,
            data.customer,
            data.paymentMethod,
            data.tip
        ));
    }

    public static delete(order: number): Promise<boolean> {
        return this._server.requestBool(ROUTE_DELETE, { order });
    }

    public static get(args?: GetOptions): Promise<Order[]> {
        return this._server.requestJSON(ROUTE_GET, args).then(data => data.map(data => new Order(
            data.id,
            data.account,
            data.updated,
            data.state,
            data.customer,
            data.paymentMethod,
            data.tip,
            data.products.map(data => new OrderProduct(
                data.order,
                data.product,
                data.price,
                data.amount
            )),
        )));
    }
}
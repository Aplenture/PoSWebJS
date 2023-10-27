/**
 * Aplenture/PoSWebJS
 * https://github.com/Aplenture/PoSWebJS
 * Copyright (c) 2023 Aplenture
 * License https://github.com/Aplenture/PoSWebJS/blob/main/LICENSE
 */

import * as FrontendJS from "frontendjs";

const ROUTE_CANCEL = "cancelOrderProduct";
const ROUTE_ORDER = "orderProduct";
const ROUTE_UPDATE = "updateOrder";

interface OrderOptions {
    readonly customer: number;
    readonly product: number;
    readonly amount?: number;
    readonly discount?: number;
}

export class OrderProduct {
    private static _server: FrontendJS.Server;

    constructor(
        public readonly order: number,
        public readonly product: number,
        public price: number,
        public amount: number
    ) { }

    public get invoice(): number { return this.price * this.amount; }

    public static async prepare(preparer: FrontendJS.ServerPreparer): Promise<void> {
        preparer.addRoute(ROUTE_CANCEL);
        preparer.addRoute(ROUTE_ORDER);
        preparer.addRoute(ROUTE_UPDATE);
    }

    public static async init(server: FrontendJS.Server): Promise<void> {
        this._server = server;
    }

    public static async load() { }
    public static async unload() { }
    public static async start() { }

    public static cancel(order: number, product: number): Promise<boolean> {
        return this._server.requestBool(ROUTE_CANCEL, { order, product });
    }

    public static order(options: OrderOptions): Promise<OrderProduct> {
        return this._server.requestJSON(ROUTE_ORDER, options).then(data => new OrderProduct(
            data.order,
            data.product,
            data.price,
            data.amount
        ));
    }

    public static update(options: OrderOptions): Promise<boolean> {
        return this._server.requestBool(ROUTE_UPDATE, options);
    }
}
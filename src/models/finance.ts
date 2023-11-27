/**
 * Aplenture/PoSWebJS
 * https://github.com/Aplenture/PoSWebJS
 * Copyright (c) 2023 Aplenture
 * License https://github.com/Aplenture/PoSWebJS/blob/main/LICENSE
 */

import * as FrontendJS from "frontendjs";
import { PaymentMethod } from "../enums/paymentMethod";

const ROUTE_GET_FINANCES = 'getFinances';
const ROUTE_GET_TRANSFERS = 'getTransfers';

interface GetOptions {
    readonly customer?: number;
    readonly start?: number;
    readonly end?: number;
    readonly data?: readonly string[];
}

export class Finance {
    private static _server: FrontendJS.Server;

    constructor(
        public readonly id: number | undefined,
        public readonly timestamp: number,
        public readonly type: number,
        public readonly customer: number,
        public readonly order: number,
        public readonly paymentMethod: PaymentMethod,
        public readonly value: number,
        public readonly data: string
    ) { }

    public static async prepare(preparer: FrontendJS.ServerPreparer): Promise<void> {
        preparer.addRoute(ROUTE_GET_FINANCES);
        preparer.addRoute(ROUTE_GET_TRANSFERS);
    }

    public static async init(server: FrontendJS.Server): Promise<void> {
        this._server = server;
    }

    public static async load() { }
    public static async unload() { }
    public static async start() { }

    public static getFinances(options?: GetOptions): Promise<Finance[]> {
        return this._server.requestJSON(ROUTE_GET_FINANCES, options).then(data => data.map(data => new Finance(
            data.id,
            data.timestamp,
            data.type,
            data.customer,
            data.order,
            data.paymentMethod,
            data.value,
            data.data
        )));
    }

    public static getTransfers(options?: GetOptions): Promise<Finance[]> {
        return this._server.requestJSON(ROUTE_GET_TRANSFERS, options).then(data => data.map(data => new Finance(
            data.id,
            data.timestamp,
            data.type,
            data.customer,
            data.order,
            data.paymentMethod,
            data.value,
            data.data
        )));
    }
}
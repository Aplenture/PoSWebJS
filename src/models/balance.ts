/**
 * Aplenture/PoSWebJS
 * https://github.com/Aplenture/PoSWebJS
 * Copyright (c) 2023 Aplenture
 * License https://github.com/Aplenture/PoSWebJS/blob/main/LICENSE
 */

import * as FrontendJS from "frontendjs";
import { PaymentMethod } from "../enums/paymentMethod";

const ROUTE_DEPOSIT = 'depositBalance';
const ROUTE_WITHDRAW = 'withdrawBalance';
const ROUTE_GET = 'getBalance';

interface GetOptions {
    readonly customer: number;
    readonly start?: number;
    readonly end?: number;
    readonly resolution?: number;
}

interface GetAllOptions {
    readonly start?: number;
    readonly end?: number;
    readonly resolution?: number;
}

export class Balance {
    private static _server: FrontendJS.Server;

    constructor(
        public readonly timestamp: number,
        public readonly account: number,
        public readonly customer: number,
        public readonly paymentMethod: PaymentMethod,
        public value: number
    ) { }

    public static async prepare(preparer: FrontendJS.ServerPreparer): Promise<void> {
        preparer.addRoute(ROUTE_DEPOSIT);
        preparer.addRoute(ROUTE_WITHDRAW);
        preparer.addRoute(ROUTE_GET);
    }

    public static async init(server: FrontendJS.Server): Promise<void> {
        this._server = server;
    }

    public static async load() { }
    public static async unload() { }
    public static async start() { }

    public static deposit(customer: number, value: number): Promise<Balance> {
        return this._server.requestJSON(ROUTE_DEPOSIT, { customer, value }).then(data => new Balance(
            data.timestamp,
            data.account,
            data.customer,
            data.paymentMethod,
            data.value
        ));
    }

    public static withdraw(customer: number, value: number): Promise<Balance> {
        return this._server.requestJSON(ROUTE_WITHDRAW, { customer, value }).then(data => new Balance(
            data.timestamp,
            data.account,
            data.customer,
            data.paymentMethod,
            data.value
        ));
    }

    public static get(options: GetOptions): Promise<number> {
        return this._server.requestNumber(ROUTE_GET, options);
    }

    public static getAll(options: GetAllOptions = {}): Promise<Balance[]> {
        return this._server.requestJSON(ROUTE_GET, options).then(data => data.map(data => new Balance(
            data.timestamp,
            data.account,
            data.customer,
            data.paymentMethod,
            data.value
        )));
    }
}
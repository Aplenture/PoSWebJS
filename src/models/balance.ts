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
const ROUTE_UNDO_TRANSFER = 'undoTransfer';

interface TransferOpitons {
    readonly customer: number;
    readonly value: number;
    readonly date?: Date;
    readonly label?: string;
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
        preparer.addRoute(ROUTE_UNDO_TRANSFER);
    }

    public static async init(server: FrontendJS.Server): Promise<void> {
        this._server = server;
    }

    public static async load() { }
    public static async unload() { }
    public static async start() { }

    public static deposit(options: TransferOpitons): Promise<Balance> {
        return this._server.requestJSON(ROUTE_DEPOSIT, options).then(data => new Balance(
            data.timestamp,
            data.account,
            data.customer,
            data.paymentMethod,
            data.value
        ));
    }

    public static withdraw(options: TransferOpitons): Promise<Balance> {
        return this._server.requestJSON(ROUTE_WITHDRAW, options).then(data => new Balance(
            data.timestamp,
            data.account,
            data.customer,
            data.paymentMethod,
            data.value
        ));
    }

    public static get(customer: number, time?: number): Promise<number> {
        return this._server.requestNumber(ROUTE_GET, { customer, time });
    }

    public static getAll(time?: number): Promise<Balance[]> {
        return this._server.requestJSON(ROUTE_GET, { time }).then(data => data.map(data => new Balance(
            data.timestamp,
            data.account,
            data.customer,
            data.paymentMethod,
            data.value
        )));
    }

    public static undoTransfer(id: number): Promise<Balance> {
        return this._server.requestJSON(ROUTE_UNDO_TRANSFER, { id }).then(data => new Balance(
            data.timestamp,
            data.account,
            data.customer,
            data.paymentMethod,
            data.value
        ));
    }
}
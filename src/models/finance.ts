/**
 * Aplenture/PoSWebJS
 * https://github.com/Aplenture/PoSWebJS
 * Copyright (c) 2023 Aplenture
 * License https://github.com/Aplenture/PoSWebJS/blob/main/LICENSE
 */

import * as FrontendJS from "frontendjs";
import { PaymentMethod } from "../enums/paymentMethod";
import { EventType } from "../enums/eventType";

const ROUTE_GET = 'getFinances';

interface GetOptions {
    readonly customer?: number;
    readonly start?: number;
}

export class Finance {
    private static _server: FrontendJS.Server;

    constructor(
        public readonly id: number,
        public readonly timestamp: number,
        public readonly type: EventType,
        public readonly account: number,
        public readonly customer: number,
        public readonly paymentMethod: PaymentMethod,
        public readonly order: number,
        public readonly value: number,
        public readonly data: string
    ) { }

    public static async prepare(preparer: FrontendJS.ServerPreparer): Promise<void> {
        preparer.addRoute(ROUTE_GET);
    }

    public static async init(server: FrontendJS.Server): Promise<void> {
        this._server = server;
    }

    public static async load() { }
    public static async unload() { }
    public static async start() { }

    public static get(options?: GetOptions): Promise<Finance[]> {
        return this._server.requestJSON(ROUTE_GET, options).then(data => data.map(data => new Finance(
            data.id,
            data.timestamp,
            data.type,
            data.account,
            data.customer,
            data.paymentMethod,
            data.order,
            data.value,
            data.data
        )));
    }
}
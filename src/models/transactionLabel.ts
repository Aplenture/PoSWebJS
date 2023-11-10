/**
 * Aplenture/PoSWebJS
 * https://github.com/Aplenture/PoSWebJS
 * Copyright (c) 2023 Aplenture
 * License https://github.com/Aplenture/PoSWebJS/blob/main/LICENSE
 */

import * as FrontendJS from "frontendjs";
import { TransactionType } from "../enums/TransactionType";

const ROUTE_CREATE = 'createTransactionLabel';
const ROUTE_GET = 'getTransactionLabels';

export class TransactionLabel {
    private static _server: FrontendJS.Server;

    constructor(
        public readonly id: number,
        public readonly account: number,
        public readonly type: TransactionType,
        public readonly name: string
    ) { }

    public static async prepare(preparer: FrontendJS.ServerPreparer): Promise<void> {
        preparer.addRoute(ROUTE_CREATE);
        preparer.addRoute(ROUTE_GET);
    }

    public static async init(server: FrontendJS.Server): Promise<void> {
        this._server = server;
    }

    public static async load() { }
    public static async unload() { }
    public static async start() { }

    public static getAll(type?: TransactionType): Promise<TransactionLabel[]> {
        return this._server.requestJSON(ROUTE_GET, { type }).then(data => data.map(data => new TransactionLabel(
            data.id,
            data.account,
            data.type,
            data.name
        )));
    }

    public static add(type: TransactionType, name: string): Promise<TransactionLabel> {
        return this._server.requestJSON(ROUTE_CREATE, { type, name }).then(data => new TransactionLabel(
            data.id,
            data.account,
            data.type,
            data.name
        ));
    }

    public toString(): string {
        return this.name;
    }
}
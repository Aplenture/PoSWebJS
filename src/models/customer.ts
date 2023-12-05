/**
 * Aplenture/PoSWebJS
 * https://github.com/Aplenture/PoSWebJS
 * Copyright (c) 2023 Aplenture
 * License https://github.com/Aplenture/PoSWebJS/blob/main/LICENSE
 */

import * as FrontendJS from "frontendjs";

const ROUTE_ADD = 'addCustomer';
const ROUTE_EDIT = 'editCustomer';
const ROUTE_GET = 'getCustomers';
const ROUTE_REMOVE_CUSTOMER = 'removeCustomer';
const ROUTE_REMOVE_GUESTS = 'removeGuests';

interface AddOptions {
    readonly firstname: string;
    readonly lastname?: string;
    readonly paymentmethods?: number;
}

interface GetOptions {
    readonly firstID?: number;
    readonly lastID?: number;
    readonly paymentmethods?: number;
}

interface EditOptions {
    readonly customer: number;
    readonly firstname?: string;
    readonly lastname?: string;
}

export class Customer {
    private static _server: FrontendJS.Server;

    constructor(
        public readonly id: number,
        public readonly account: number,
        public readonly created: number,
        public firstname: string,
        public lastname: string,
        public nickname: string,
        public readonly paymentMethods: number
    ) { }

    public static async prepare(preparer: FrontendJS.ServerPreparer): Promise<void> {
        preparer.addRoute(ROUTE_ADD);
        preparer.addRoute(ROUTE_EDIT);
        preparer.addRoute(ROUTE_GET);
        preparer.addRoute(ROUTE_REMOVE_CUSTOMER);
    }

    public static async init(server: FrontendJS.Server): Promise<void> {
        this._server = server;
    }

    public static async load() { }
    public static async unload() { }
    public static async start() { }

    public static get(options?: GetOptions): Promise<Customer[]> {
        return this._server.requestJSON(ROUTE_GET, options).then(data => data.map(data => new Customer(
            data.id,
            data.account,
            data.created,
            data.firstname,
            data.lastname,
            data.nickname,
            data.paymentMethods
        )));
    }

    public static add(options: AddOptions): Promise<Customer> {
        return this._server.requestJSON(ROUTE_ADD, options).then(data => new Customer(
            data.id,
            data.account,
            data.created,
            data.firstname,
            data.lastname,
            data.nickname,
            data.paymentMethods
        ));
    }

    public static removeCustomer(customer: number): Promise<boolean> {
        return this._server.requestBool(ROUTE_REMOVE_CUSTOMER, { customer });
    }

    public static removeGuests(): Promise<boolean> {
        return this._server.requestBool(ROUTE_REMOVE_GUESTS);
    }

    public static edit(options: EditOptions): Promise<boolean> {
        return this._server.requestBool(ROUTE_EDIT, options);
    }

    public toString(): string {
        return this.nickname
            ? `${this.firstname} '${this.nickname}' ${this.lastname}`
            : `${this.firstname} ${this.lastname}`;
    }
}
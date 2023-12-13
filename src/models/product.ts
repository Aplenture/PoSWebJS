/**
 * Aplenture/PoSWebJS
 * https://github.com/Aplenture/PoSWebJS
 * Copyright (c) 2023 Aplenture
 * License https://github.com/Aplenture/PoSWebJS/blob/main/LICENSE
 */

import * as FrontendJS from "frontendjs";

const ROUTE_ADD = "addProduct";
const ROUTE_EDIT = "editProduct";
const ROUTE_GET = "getProducts";
const ROUTE_REMOVE = "removeProduct";

interface AddOptions {
    readonly name: string;
    readonly price: number;
    readonly category: number;
    readonly discount?: number;
    readonly priority?: number;
    readonly start?: number;
    readonly end?: number;
}

interface EditOptions {
    readonly name?: string;
    readonly price?: number;
    readonly discount?: number;
    readonly category?: number;
    readonly priority?: number;
    readonly start?: number;
    readonly end?: number;
}

interface GetOptions {
    readonly firstID?: number;
    readonly lastID?: number;
    readonly time?: number;
    readonly category?: number;
}

export class Product {
    private static _server: FrontendJS.Server;

    constructor(
        public readonly id: number,
        public readonly account: number,
        public readonly created: number,
        public name: string,
        public price: number,
        public discount: number,
        public category: number,
        public priority: number,
        public start: number,
        public end: number
    ) { }

    public static async prepare(preparer: FrontendJS.ServerPreparer): Promise<void> {
        preparer.addRoute(ROUTE_ADD);
        preparer.addRoute(ROUTE_EDIT);
        preparer.addRoute(ROUTE_GET);
        preparer.addRoute(ROUTE_REMOVE);
    }

    public static async init(server: FrontendJS.Server): Promise<void> {
        this._server = server;
    }

    public static async load() { }
    public static async unload() { }
    public static async start() { }

    public static get(options?: GetOptions): Promise<Product[]> {
        return this._server.requestJSON(ROUTE_GET, options).then(data => data.map(data => new Product(
            data.id,
            data.account,
            data.created,
            data.name,
            data.price,
            data.discount,
            data.category,
            data.priority,
            data.start,
            data.end
        ))
            .sort((a, b) => a.name.localeCompare(b.name))
            .sort((a, b) => b.priority - a.priority)
        );
    }

    public static add(data: AddOptions): Promise<Product> {
        return this._server.requestJSON(ROUTE_ADD, data).then(data => new Product(
            data.id,
            data.account,
            data.created,
            data.name,
            data.price,
            data.discount,
            data.category,
            data.priority,
            data.start,
            data.end
        ));
    }

    public static remove(product: number): Promise<boolean> {
        return this._server.requestBool(ROUTE_REMOVE, { product });
    }

    public static edit(product: number, options?: EditOptions): Promise<boolean> {
        return this._server.requestBool(ROUTE_EDIT, Object.assign({ product }, options));
    }

    public toString(): string {
        return this.name;
    }
}
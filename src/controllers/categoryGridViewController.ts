/**
 * Aplenture/PoSWebJS
 * https://github.com/Aplenture/PoSWebJS
 * Copyright (c) 2023 Aplenture
 * License https://github.com/Aplenture/PoSWebJS/blob/main/LICENSE
 */

import * as CoreJS from "corejs";
import * as FrontendJS from "frontendjs";
import { GridViewController } from "./gridViewController";
import { Label } from "../models/label";
import { LabelType } from "../enums/labelType";

export class CategoryGridViewController extends GridViewController {
    public readonly onSelected = new CoreJS.Event<CategoryGridViewController, Label | null>('CategoryGridViewController.onSelected');

    private _data: Label[] = [];

    constructor(...classes: string[]) {
        super(...classes, "category-grid-view-controller");

        this.gridViewController.onSelectedCell.on(cell => this.onSelected.emit(this, this._data[cell.index]));
    }

    public async load(): Promise<void> {
        this._data = await Label.getAll(LabelType.ProductCategory);

        await super.load();
    }

    public numberOfCells(sender: FrontendJS.GridViewController): number {
        return this._data.length;
    }

    public createCell(sender: FrontendJS.GridViewController, index: number): FrontendJS.View {
        return new Cell();
    }

    public updateCell(sender: FrontendJS.GridViewController, cell: Cell, index: number): void {
        const data = this._data[index];

        cell.nameLabel.text = data.name;
    }
}

class Cell extends FrontendJS.View {
    public readonly nameLabel = new FrontendJS.Label('name-label');

    constructor(...classes: string[]) {
        super(...classes);

        this.appendChild(this.nameLabel);
    }
}
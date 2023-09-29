/**
 * Aplenture/PoSWebJS
 * https://github.com/Aplenture/PoSWebJS
 * Copyright (c) 2023 Aplenture
 * License https://github.com/Aplenture/PoSWebJS/blob/main/LICENSE
 */

import * as FrontendJS from "frontendjs";

export class PurchaseProductViewController extends FrontendJS.BodyViewController {
    public readonly priceLabel = new FrontendJS.TitledLabel('price-label');
    public readonly countLabel = new FrontendJS.TitledLabel('count-label');

    public readonly buyButton = new FrontendJS.Button('buy-button');
    public readonly undoButton = new FrontendJS.Button('undo-button');

    constructor(...classes: string[]) {
        super(...classes, 'purchase-product-view-controller');

        this.priceLabel.title = '#_title_price';
        this.countLabel.title = '#_title_count_purchases';
        this.buyButton.text = '#_title_buy';

        this.undoButton.type = FrontendJS.ButtonType.Cancel;
        this.undoButton.text = '#_title_undo_purchase';

        this.contentView.appendChild(this.priceLabel);
        this.contentView.appendChild(this.countLabel);

        this.footerBar.appendChild(this.undoButton);
        this.footerBar.appendChild(this.buyButton);
    }

    public updatePurchaseCount(value: number) {
        this.countLabel.text = value.toString();
        this.undoButton.isDisabled = !value;
    }
}
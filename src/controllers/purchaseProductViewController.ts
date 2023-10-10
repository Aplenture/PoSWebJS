/**
 * Aplenture/PoSWebJS
 * https://github.com/Aplenture/PoSWebJS
 * Copyright (c) 2023 Aplenture
 * License https://github.com/Aplenture/PoSWebJS/blob/main/LICENSE
 */

import * as FrontendJS from "frontendjs";

export class PurchaseProductViewController extends FrontendJS.BodyViewController {
    public readonly customerLabel = new FrontendJS.TitledLabel('customer-label');
    public readonly productLabel = new FrontendJS.TitledLabel('product-label');
    public readonly priceLabel = new FrontendJS.TitledLabel('price-label');
    public readonly amountLabel = new FrontendJS.TitledLabel('amount-Label');

    public readonly buyButton = new FrontendJS.Button('buy-button');
    public readonly undoButton = new FrontendJS.Button('undo-button');

    constructor(...classes: string[]) {
        super(...classes, 'purchase-product-view-controller');

        this.customerLabel.title = '#_title_customer';
        this.productLabel.title = '#_title_product';
        this.priceLabel.title = '#_title_price';
        this.amountLabel.title = '#_title_count_purchases';

        this.buyButton.text = '#_title_buy';

        this.undoButton.type = FrontendJS.ButtonType.Cancel;
        this.undoButton.text = '#_title_undo_purchase';

        this.contentView.appendChild(this.customerLabel);
        this.contentView.appendChild(this.productLabel);
        this.contentView.appendChild(this.priceLabel);
        this.contentView.appendChild(this.amountLabel);

        this.footerBar.appendChild(this.undoButton);
        this.footerBar.appendChild(this.buyButton);
    }

    public updatePurchaseCount(value: number) {
        this.amountLabel.text = value.toString();
        this.undoButton.isDisabled = !value;
    }
}
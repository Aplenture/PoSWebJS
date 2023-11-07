/**
 * Aplenture/PoSWebJS
 * https://github.com/Aplenture/PoSWebJS
 * Copyright (c) 2023 Aplenture
 * License https://github.com/Aplenture/PoSWebJS/blob/main/LICENSE
 */

import * as CoreJS from "corejs";
import * as FrontendJS from "frontendjs";

export class DepostiViewController extends FrontendJS.BodyViewController {
    public readonly amountTextField = new FrontendJS.TextField('amount-text-field');
    public readonly dateTextField = new FrontendJS.TextField('date-text-field');

    public readonly okButton = new FrontendJS.Button('ok-button');
    public readonly cancelButton = new FrontendJS.Button('cancel-button');
    public readonly maxButton = new FrontendJS.Button('max-button');

    private _max = 0;

    constructor(...classes: string[]) {
        super(...classes, 'deposit-view-controller');

        this.titleBar.titleLabel.text = '#_query_title_deposit';

        this.amountTextField.type = FrontendJS.TextFieldType.Currency;
        this.amountTextField.title = '#_title_amount_deposit';
        this.amountTextField.index = 1;
        this.amountTextField.onEnterKey.on(() => this.dateTextField.focus());
        this.amountTextField.onEscapeKey.on(() => this.cancelButton.click());
        this.amountTextField.onChange.on(() => this.amountTextField.numberValue = CoreJS.Math.clamp(this.amountTextField.numberValue, 0, this.max || Number.MAX_SAFE_INTEGER));

        this.dateTextField.type = FrontendJS.TextFieldType.Date;
        this.dateTextField.title = '#_title_date';
        this.dateTextField.index = 2;
        this.dateTextField.onEnterKey.on(() => this.okButton.click());
        this.dateTextField.onEscapeKey.on(() => this.cancelButton.click());

        this.okButton.type = FrontendJS.ButtonType.Done;
        this.okButton.text = '#_ok';
        this.okButton.index = 1;

        this.cancelButton.type = FrontendJS.ButtonType.Cancel;
        this.cancelButton.index = 2;
        this.cancelButton.onClick.on(() => this.removeFromParent());

        this.maxButton.text = '#_title_all';
        this.maxButton.index = 3;
        this.maxButton.isVisible = false;
        this.maxButton.onClick.on(() => this.amountTextField.numberValue = this.max);
        this.maxButton.onClick.on(() => this.amountTextField.selectRange());

        this.contentView.appendChild(this.amountTextField);
        this.contentView.appendChild(this.dateTextField);

        this.footerBar.appendChild(this.maxButton);
        this.footerBar.appendChild(this.cancelButton);
        this.footerBar.appendChild(this.okButton);
    }

    public get max(): number { return this._max; }
    public set max(value: number) {
        value = Math.max(0, value);

        this._max = value;

        this.maxButton.isHidden = !value;
        this.amountTextField.numberValue = value;
        this.amountTextField.selectRange();
    }

    public async load(): Promise<void> {
        this.amountTextField.numberValue = 0;
        this.dateTextField.dateValue = new Date();
        this.amountTextField.selectRange();

        await super.load();
    }

    public focus() {
        this.amountTextField.focus();
    }
}
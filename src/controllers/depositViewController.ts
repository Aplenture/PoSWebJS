/**
 * Aplenture/PoSWebJS
 * https://github.com/Aplenture/PoSWebJS
 * Copyright (c) 2023 Aplenture
 * License https://github.com/Aplenture/PoSWebJS/blob/main/LICENSE
 */

import * as CoreJS from "corejs";
import * as FrontendJS from "frontendjs";

export class DepositViewController extends FrontendJS.BodyViewController {
    public readonly onEnter = new CoreJS.Event<DepositViewController, void>("DepostiViewController.onEnter");

    public readonly customerLabel = new FrontendJS.TitledLabel('customer-label');
    public readonly amountTextField = new FrontendJS.TextField('amount-text-field');
    public readonly dateTextField = new FrontendJS.TextField('date-text-field');
    public readonly labelDropbox = new FrontendJS.Dropbox('label-dropbox');

    public readonly okButton = new FrontendJS.Button('ok-button');
    public readonly cancelButton = new FrontendJS.Button('cancel-button');
    public readonly maxButton = new FrontendJS.Button('max-button');

    public autoReset = true;

    private _max = 0;

    constructor(...classes: string[]) {
        super(...classes, 'deposit-view-controller');

        this.titleBar.titleLabel.text = '#_query_title_deposit';

        this.customerLabel.title = '#_title_customer';

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

        this.labelDropbox.isHidden = true;
        this.labelDropbox.title = '#_title_deposit_label';

        this.okButton.type = FrontendJS.ButtonType.Done;
        this.okButton.text = '#_ok';
        this.okButton.index = 1;
        this.okButton.onClick.on(() => this.enter());

        this.cancelButton.type = FrontendJS.ButtonType.Cancel;
        this.cancelButton.index = 2;

        this.maxButton.text = '#_title_all';
        this.maxButton.index = 3;
        this.maxButton.isVisible = false;
        this.maxButton.onClick.on(() => this.amountTextField.numberValue = this.max);
        this.maxButton.onClick.on(() => this.amountTextField.selectRange());

        this.contentView.appendChild(this.customerLabel);
        this.contentView.appendChild(this.amountTextField);
        this.contentView.appendChild(this.dateTextField);
        this.contentView.appendChild(this.labelDropbox);

        this.footerBar.appendChild(this.maxButton);
        this.footerBar.appendChild(this.cancelButton);
        this.footerBar.appendChild(this.okButton);
    }

    public get selectedLabel(): number { return this.labelDropbox.selectedIndex; }

    public get labels(): readonly string[] { return this.labelDropbox.options; }
    public set labels(value: readonly string[]) {
        this.labelDropbox.options = value;
        this.labelDropbox.isHidden = !value.length;
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
        if (this.autoReset) {
            this.dateTextField.dateValue = new Date();
            this.labelDropbox.selectedIndex = -1;
            this.amountTextField.numberValue = 0;
        }

        await super.load();
    }

    public focus() {
        this.amountTextField.focus();
        this.amountTextField.selectRange();
    }

    public enter() {
        if (0 > this.labelDropbox.selectedIndex) {
            FrontendJS.Client.popupViewController.pushMessage("#_error_missing_transaction_label", "#_query_title_deposit");
            return this.labelDropbox.focus();
        }

        this.onEnter.emit(this);
    }
}
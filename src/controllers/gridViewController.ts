/**
 * Aplenture/PoSWebJS
 * https://github.com/Aplenture/PoSWebJS
 * Copyright (c) 2023 Aplenture
 * License https://github.com/Aplenture/PoSWebJS/blob/main/LICENSE
 */

import * as FrontendJS from "frontendjs";

export abstract class GridViewController extends FrontendJS.BodyViewController implements FrontendJS.GridViewControllerDataSource {
    public readonly gridViewController = new FrontendJS.GridViewController();

    public readonly backButton = new FrontendJS.Button('back-button');
    public readonly nextButton = new FrontendJS.Button('next-button');

    constructor(...classes: string[]) {
        super(...classes, "grid-view-controller");

        this.titleBar.isVisible = false;

        this.gridViewController.gridView.onScrolled.on(() => this.nextButton.isEnabled = this.gridViewController.canScrollBottom);
        this.gridViewController.gridView.onScrolled.on(() => this.backButton.isEnabled = this.gridViewController.canScrollTop);

        this.gridViewController.selectionMode = FrontendJS.TableSelectionMode.Clickable;
        this.gridViewController.dataSource = this;
        this.gridViewController.titleLabel.isHidden = true;

        this.backButton.text = '#_back';
        this.backButton.onClick.on(() => this.gridViewController.scrollVertical(-1));

        this.nextButton.text = '#_title_next';
        this.nextButton.onClick.on(() => this.gridViewController.scrollVertical());

        this.footerBar.appendChild(this.backButton);
        this.footerBar.appendChild(this.nextButton);

        this.appendChild(this.gridViewController);
    }

    public async load(): Promise<void> {
        await super.load();

        this.nextButton.isEnabled = this.gridViewController.canScrollBottom;
        this.backButton.isEnabled = this.gridViewController.canScrollTop;
    }

    public abstract numberOfCells(sender: FrontendJS.GridViewController): number;
    public abstract createCell(sender: FrontendJS.GridViewController, index: number): FrontendJS.View ;
    public abstract updateCell(sender: FrontendJS.GridViewController, cell: FrontendJS.View, index: number): void;
}
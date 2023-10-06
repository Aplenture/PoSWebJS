/**
 * Aplenture/PoSWebJS
 * https://github.com/Aplenture/PoSWebJS
 * Copyright (c) 2023 Aplenture
 * License https://github.com/Aplenture/PoSWebJS/blob/main/LICENSE
 */

import * as FrontendJS from "frontendjs";

export abstract class GridViewController extends FrontendJS.BodyViewController implements FrontendJS.GridViewControllerDataSource {
    public readonly gridViewController = new FrontendJS.GridViewController();

    public readonly upButton = new FrontendJS.Button('up-button');
    public readonly downButton = new FrontendJS.Button('down-button');

    constructor(...classes: string[]) {
        super(...classes, "grid-view-controller");

        this.titleBar.isVisible = false;

        this.gridViewController.selectionMode = FrontendJS.TableSelectionMode.Clickable;
        this.gridViewController.dataSource = this;
        this.gridViewController.titleLabel.isHidden = true;

        this.upButton.text = '#_title_scroll_up';
        this.upButton.onClick.on(() => this.gridViewController.scrollVertical(-1));

        this.downButton.text = '#_title_scroll_down';
        this.downButton.onClick.on(() => this.gridViewController.scrollVertical());

        this.footerBar.appendChild(this.upButton);
        this.footerBar.appendChild(this.downButton);

        this.appendChild(this.gridViewController);
    }

    public async load(): Promise<void> {
        await super.load();
        
        this.downButton.isEnabled = this.gridViewController.canScrollBottom;
        this.upButton.isEnabled = this.gridViewController.canScrollTop;

        this.gridViewController.gridView.onScrolled.on(() => this.downButton.isEnabled = this.gridViewController.canScrollBottom, { listener: this });
        this.gridViewController.gridView.onScrolled.on(() => this.upButton.isEnabled = this.gridViewController.canScrollTop, { listener: this });

        FrontendJS.Client.onResize.on(() => this.downButton.isEnabled = this.gridViewController.canScrollBottom, { listener: this });
        FrontendJS.Client.onResize.on(() => this.upButton.isEnabled = this.gridViewController.canScrollTop, { listener: this });
    }

    public async unload(): Promise<void> {
        this.gridViewController.gridView.onScrolled.off({ listener: this });
        FrontendJS.Client.onResize.off({ listener: this });

        await super.unload();
    }

    public abstract numberOfCells(sender: FrontendJS.GridViewController): number;
    public abstract createCell(sender: FrontendJS.GridViewController, index: number): FrontendJS.View;
    public abstract updateCell(sender: FrontendJS.GridViewController, cell: FrontendJS.View, index: number): void;
}
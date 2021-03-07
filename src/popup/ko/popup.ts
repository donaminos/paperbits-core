import * as ko from "knockout";
import template from "./popup.html";
import { Component, RuntimeComponent } from "@paperbits/common/ko/decorators";
import { StyleModel } from "@paperbits/common/styles";
import { EventManager } from "@paperbits/common/events";
import { PopupConfig } from "../popupConfig";

@RuntimeComponent({
    selector: "paperbits-popup"
})
@Component({
    selector: "paperbits-popup",
    template: template
})
export class Popup {
    public readonly templateName: ko.Observable<string>;
    public readonly isOpen: ko.Observable<boolean>;
    public trigger: HTMLElement;

    constructor(private readonly eventManager: EventManager) {
        this.templateName = ko.observable("mypopup");
        this.isOpen = ko.observable(false);
        this.eventManager.addEventListener("onPopupRequested", this.showPopup.bind(this));
        this.eventManager.addEventListener("onDismissRequested", this.dismissPopup.bind(this));

        // Experimenting:
        document.addEventListener("mouseenter", this.onMouseEnter.bind(this), true);
        document.addEventListener("mouseleave", this.onMouseLeave.bind(this), true);
    }

    private async onMouseEnter(event: MouseEvent): Promise<void> {
        const target: any = event.target;

        if (target.tagName !== "IMG") {
            return;
        }

        this.trigger = target;
        this.showPopup(null);
    }

    private async onMouseLeave(event: MouseEvent): Promise<void> {
        const target: any = event.target;

        if (target.tagName !== "IMG") {
            return;
        }

        if (target !== this.trigger ) {
            return;
        }

       
        this.trigger = null;
        this.dismissPopup();
    }

    private async showPopup(popupConfig: PopupConfig): Promise<void> {
        this.isOpen(true);
    }

    public dismissPopup(): void {
        this.isOpen(false);
        console.log("Dismiss");
    }
}
import { IContextCommandSet, View, ViewManager } from "@paperbits/common/ui";
import { DragSession } from "@paperbits/common/ui/draggables";
import { WidgetContext } from "@paperbits/common/editing";
import { CarouselItemModel, CarouselModel } from "./carouselModel";
import { RowModel } from "../row/rowModel";
import { EventManager } from "@paperbits/common/events";
import { BlockType } from "@paperbits/common/blocks";
import { WidgetModel } from "@paperbits/common/widgets";
import { SectionModel } from "../section";


export class CarouselHandlers {
    constructor(
        private readonly viewManager: ViewManager,
        private readonly eventManager: EventManager
    ) { }

    public getContextualEditor(context: WidgetContext): IContextCommandSet {
        const carouselContextualEditor: IContextCommandSet = {
            color: "#2b87da",
            hoverCommands: [{
                position: context.half,
                tooltip: "Add carousel",
                color: "#2b87da",
                component: {
                    name: "grid-layout-selector",
                    params: {
                        onSelect: (carousel: CarouselModel) => {
                            const carouselHalf = context.half;

                            let index = context.parentModel.widgets.indexOf(context.model);

                            if (carouselHalf === "bottom") {
                                index++;
                            }

                            context.parentModel.widgets.splice(index, 0, carousel);
                            context.parentBinding.applyChanges();

                            this.viewManager.clearContextualEditors();
                            this.eventManager.dispatchEvent("onContentUpdate");
                        }
                    }
                }
            }],
            deleteCommand: {
                tooltip: "Delete carousel",
                color: "#2b87da",
                callback: () => {
                    context.parentModel.widgets.remove(context.model);
                    context.parentBinding.applyChanges();
                    this.viewManager.clearContextualEditors();
                    this.eventManager.dispatchEvent("onContentUpdate");
                }
            },
            selectCommands: [{
                tooltip: "Add slide",
                iconClass: "paperbits-circle-add",
                position: "top right",
                color: "#2b87da",
                callback: () => {
                    context.model["carouselItems"].push(new CarouselItemModel());
                    context.parentBinding.applyChanges();
                    this.viewManager.clearContextualEditors();
                    this.eventManager.dispatchEvent("onContentUpdate");
                }
            },
            {
                tooltip: "Edit carousel",
                iconClass: "paperbits-edit-72",
                position: "top right",
                color: "#2b87da",
                callback: () => this.viewManager.openWidgetEditor(context.binding)
            }]
        };


        return carouselContextualEditor;
    }
}
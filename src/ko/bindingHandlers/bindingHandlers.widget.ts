﻿import * as ko from "knockout";
import { IWidgetBinding } from "@paperbits/common/editing";

import * as ReactDOM from "react-dom";
import { createElement } from "react";
import { TheBinding } from "../../binding";


export interface UiComponentBinder {
    init(element: HTMLElement, binding: TheBinding): void;
    dispose(): void;
}

export class KnockoutUiComponentBinder implements UiComponentBinder {
    public init(element: HTMLElement, binding: TheBinding): void {
        //
    }

    public dispose(): void {
        //
    }
}

export class ReactUiComponentBinder implements UiComponentBinder {
    public init(element: HTMLElement, binding: TheBinding): void {
        const reactElement = createElement(binding.viewModelClass, {} /* model? */);
        const viewModelInstance = ReactDOM.render(reactElement, element);
        binding.viewModelInstance = viewModelInstance;
    }

    public dispose(): void {
        //
    }
}

const makeArray = (arrayLikeObject) => {
    const result = [];
    for (let i = 0, j = arrayLikeObject.length; i < j; i++) {
        result.push(arrayLikeObject[i]);
    }
    return result;
};

const cloneNodes = (nodesArray, shouldCleanNodes) => {
    const newNodesArray = [];

    for (let i = 0, j = nodesArray.length; i < j; i++) {
        const clonedNode = nodesArray[i].cloneNode(true);
        newNodesArray.push(shouldCleanNodes ? ko.cleanNode(clonedNode) : clonedNode);
    }
    return newNodesArray;
};

const cloneTemplateIntoElement = (componentDefinition: any, element: any): HTMLElement => {
    const template = componentDefinition["template"];

    if (!template) {
        return element;
    }

    const clonedNodesArray = cloneNodes(template, false);
    ko.virtualElements.setDomNodeChildren(element, clonedNodesArray);
    return element;
};



export class WidgetBindingHandler {
    public constructor() {
        let componentLoadingOperationUniqueId = 0;

        ko.bindingHandlers["widget"] = {
            init(element: any, valueAccessor: any, ignored1: any, ignored2: any, bindingContext: ko.BindingContext): any {
                const componentViewModel = ko.utils.unwrapObservable(valueAccessor());

                if (!componentViewModel) {
                    return;
                }

                if (componentViewModel instanceof TheBinding) {
                    const theBinding = <TheBinding>componentViewModel;

                    let binder: UiComponentBinder;

                    switch (theBinding.framework) {
                        case "knockout":
                            binder = new KnockoutUiComponentBinder();
                            break;
                        case "react":
                            binder = new ReactUiComponentBinder();
                            break;
                    }

                    binder.init(element, theBinding);
                    return;
                }


                let registration = Reflect.getMetadata("paperbits-component", componentViewModel.constructor);

                if (!registration) {
                    // throw new Error(`Could not find component registration for view model: ${componentViewModel}`);

                    registration = Reflect.getMetadata("paperbits-component", componentViewModel.type);
                }

                const componentName = registration.name;




                let currentViewModel;
                let currentLoadingOperationId;

                const disposeAssociatedComponentViewModel = () => {
                    const currentViewModelDispose = currentViewModel && currentViewModel["dispose"];

                    if (currentViewModel) {
                        const binding = currentViewModel["widgetBinding"];

                        if (binding && binding.onDispose) {
                            binding.onDispose();
                        }
                    }

                    if (typeof currentViewModelDispose === "function") {
                        currentViewModelDispose.call(currentViewModel);
                    }
                    currentViewModel = null;
                    // Any in-flight loading operation is no longer relevant, so make sure we ignore its completion
                    currentLoadingOperationId = null;
                };
                const originalChildNodes = makeArray(ko.virtualElements.childNodes(element));

                ko.utils.domNodeDisposal.addDisposeCallback(element, disposeAssociatedComponentViewModel);

                ko.computed(() => {
                    const componentViewModel = ko.utils.unwrapObservable(valueAccessor());

                    if (!componentViewModel) {
                        return;
                    }

                    const loadingOperationId = currentLoadingOperationId = ++componentLoadingOperationUniqueId;
                    const binding: IWidgetBinding<any> = componentViewModel["widgetBinding"];

                    if (binding && binding.onCreate) {
                        binding.onCreate();
                    }

                    ko.components.get(componentName, componentDefinition => {
                        // If this is not the current load operation for this element, ignore it.
                        if (currentLoadingOperationId !== loadingOperationId) {
                            return;
                        }

                        // Clean up previous state
                        disposeAssociatedComponentViewModel();

                        // Instantiate and bind new component. Implicitly this cleans any old DOM nodes.
                        if (!componentDefinition) {
                            throw new Error(`Unknown component "${componentName}".`);
                        }
                        const root = cloneTemplateIntoElement(componentDefinition, element);

                        const childBindingContext = bindingContext["createChildContext"](componentViewModel, /* dataItemAlias */ undefined, ctx => {
                            ctx["$component"] = componentViewModel;
                            ctx["$componentTemplateNodes"] = originalChildNodes;
                        });

                        currentViewModel = componentViewModel;
                        ko.applyBindingsToDescendants(childBindingContext, root);

                        let nonVirtualElement = element;

                        if (nonVirtualElement.nodeName === "#comment") {
                            do {
                                nonVirtualElement = nonVirtualElement.nextSibling;
                            }
                            while (nonVirtualElement !== null && nonVirtualElement.nodeName === "#comment");
                        }

                        if (nonVirtualElement) {
                            nonVirtualElement["attachedViewModel"] = componentViewModel;

                            const binding: IWidgetBinding<any> = componentViewModel["widgetBinding"];

                            if (binding?.draggable) {
                                ko.applyBindingsToNode(nonVirtualElement, { draggable: {} }, null);
                            }
                        }
                    });
                }, null, { disposeWhenNodeIsRemoved: element });

                return { controlsDescendantBindings: false };
            }
        };

        ko.virtualElements.allowedBindings["widget"] = true;
        ko.virtualElements.allowedBindings["widgetKnockout"] = true;
    }
}
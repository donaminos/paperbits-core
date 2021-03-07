import { IInjectorModule, IInjector } from "@paperbits/common/injection";
import { Popup } from "./ko/popup";


export class PopupModule implements IInjectorModule {
    public register(injector: IInjector): void {
        injector.bind("popup", Popup);
    }
}
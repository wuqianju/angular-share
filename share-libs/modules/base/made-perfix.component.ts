import { Input, SimpleChanges } from "@angular/core";
import { UtilChanges } from "share-libs/utils";

/**前置tip组件的构成类 */
export class MadePerfix {
    @Input() inPerText: string;
    @Input() inPerWidth: string;
    /**前置tip文字 */
    public _perText: string;
    /**前置宽度 */
    public _perWidth: string;
    ngPerfixChange(changes: SimpleChanges) {
        if (UtilChanges(changes, 'inPerText')) {
            this._perText = this.inPerText
        }
        if (UtilChanges(changes, 'inPerWidth')) {
            this._perWidth = this.inPerWidth
        }
    }
}
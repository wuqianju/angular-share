import { CdkOverlayOrigin } from "@angular/cdk/overlay";
import { Component, ElementRef, EventEmitter, Input, Output, SimpleChanges, ViewChild } from "@angular/core";
import { UtilArraySetKeyValue, UtilArraySetKeyValueByValue } from "share-libs/src/utils";
import { SelectAddConfig, SelectAddOption } from "../share-select.model";

@Component({
    selector: 'share-select-add',
    templateUrl: './share-select-add.component.html',
    styleUrls: ['./share-select-add.component.less']
})
export class ShareSelectAdd {
    constructor(private el: ElementRef) { this.nativeEl = this.el.nativeElement }
    @Input() inConfig: SelectAddConfig;
    @Input() inOptions: SelectAddOption[] = [{ key: '', value: '焊接A' }, { key: '', value: '焊接B' }, { key: '', value: '焊接X' }, { key: '', value: '焊接C' }];
    @Input() modelOptions: SelectAddOption[];
    @Output() modelOptionsChange: EventEmitter<any> = new EventEmitter();
    @ViewChild(CdkOverlayOrigin, { static: true }) cdkOverlayOrigin: CdkOverlayOrigin;
    cdkConnectedOverlayWidth: number | string;
    nativeEl: HTMLElement;
    optionsOpen: boolean = false;
    /**添加的选项 */
    addOptions: SelectAddOption[] = [];
    /**选中的选项（emit） */
    checkOptions: SelectAddOption[];
    /**选项 */
    options: SelectAddOption[];
    /**配置 */
    /**多选框 */
    _ifCheck: boolean = true;
    /**多选*/
    _ifMulti: boolean = true;
    /**至少选择一个 */
    _leastOne: boolean = false;
    /**默认勾选*/
    _defualt: boolean = true;
    /**能否添加选项 */
    _ifAdd: boolean = true;
    /**无数据提示语 */
    _placeholder: string = "请选择";
    ngOnChanges(changes: SimpleChanges): void {
        if (changes.inOptions) {
            this.options = this.inOptions;
        }
        if (changes.inConfig && this.inConfig) {
            this.setConfig()
        }
        if (changes.modelOptions && this.modelOptions) {
            this.checkOptions = this.modelOptions;
            this.setCheckByModel();
        }
    }

    ngOnInit(): void {
        this.options = this.inOptions;
        this.setOpenWidth();
    }

    setConfig() {
        this._ifCheck = this.notUndefined(this.inConfig.ifCheck, this._ifCheck);
        this._ifMulti = this.notUndefined(this.inConfig.ifMulti, this._ifMulti);
        this._defualt = this.notUndefined(this.inConfig.defualt, this._defualt);
        this._leastOne = this.notUndefined(this.inConfig.leastOne, this._leastOne);
        this._ifAdd = this.notUndefined(this.inConfig.ifAdd, this._ifAdd);
        this._placeholder = this.notUndefined(this.inConfig.placeholder, this._placeholder);
    }

    notUndefined<T>(value: T, data: T): T {
        return value === undefined || value === null ? data : value;
    }

    setOpenWidth() {
        if (this.inConfig && this.inConfig.openWidth) {
            this.cdkConnectedOverlayWidth = this.inConfig.openWidth;
        } else {
            this.nativeEl = this.nativeEl.querySelector('.share-select-add')
            let rect = this.nativeEl.getBoundingClientRect();
            this.cdkConnectedOverlayWidth = rect.width;
        }
    }

    onOptionCheck(flag: boolean, option) {
        option._check = flag;
    }

    onAddOption() {
        let flag = this.addOptions.every(e => e.value !== undefined && e.value !== '' && e.value !== null)
        if (flag) {
            this.addOptions.push({ key: '', value: '' })
        }
    }

    /**设置勾选通过选中对象 */
    setCheckByModel(modelOptions: SelectAddOption[] = this.modelOptions) {
        this.addOptions = [];
        this.clearAllCheck();
        modelOptions.forEach(e => {
            this.options.map(option => {
                if (option.key && e.key == option.key || option.value && e.value == option.value) {
                    option._check = true;
                }
            })
        })
    }

    /**清空所有勾选 */
    clearAllCheck() {
        UtilArraySetKeyValue(this.options, '_check', false);
    }

    /**取消 */
    onBtnClick(flag: boolean = false) {
        this.closeOpenNode();
        if (flag) { this.setCheckByModel(); return };
        let checkOptions = this.checkOptions = [];
        this.options.push(...this.addOptions);
        this.options.forEach(e => {
            if (e._check == true) {
                checkOptions.push(e)
            }
        })
        this.setCheckByModel(checkOptions);
        this.modelOptions = checkOptions;
        this.modelOptionsChange.emit(checkOptions)
    }

    openOptions() {
        this.optionsOpen = true;
    }

    closeOpenNode() {
        this.optionsOpen = false;
    }
}
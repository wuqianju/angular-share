import { ElementRef, EventEmitter, Input, Output, SimpleChanges } from "@angular/core";
import { Subject } from "rxjs";
import { throttleTime } from "rxjs/internal/operators/throttleTime";
import { HttpSearch, HttpResult } from "share-libs/models";
import { HttpService } from "share-libs/services/http-base.service";
import { UtilChanges, UtilChangesNoFirst } from "share-libs/utils";
import { ModalChange } from "../open-modals/modal-select-item/modal-select-item.component";
import { PaginationPage } from "../pagination/share-pagination.model";
import { ClassTableName, TableItem, TableSelect } from "./share-table.model";
/**表格基础逻辑类 */
export abstract class TableBase {
  constructor(private http: HttpService, private el: ElementRef) {
    this.nativeEl = this.el.nativeElement;
    this.timeoutCtr.asObservable().pipe(
      throttleTime(200)
    ).subscribe(() => {
      setTimeout(() => {
        let height = this.nativeEl.querySelector('table').clientHeight;
        console.log('throttleTime', height, this.tableHeight)
        if (height !== this.tableHeight || !this.tableHeightMax || !this.tableWidthMax) {
          this.tableHeight = height;
          this.setTableWidth();
        }
      }, 0);
    })
  }
  /**后台url路径 */
  @Input() inApiUrl: string = [][0];
  /**后台异步获取数据时是否开启遮罩  默认true*/
  @Input() inLoading: boolean = true;
  /**后台异步获取数据时搜索条件 */
  @Input() inSearchObj: HttpSearch;
  /**表头配置  TableItem*/
  @Input() inItems: TableItem[] = [];
  /**表格数据的唯一标识key  默认id*/
  @Input() inUuid: string = "id";
  /**非后台获取时传入的表格数据 */
  @Input() inAllDatas: any[] = [];
  /**已经选中的表格数据 */
  @Input() inSelectedDatas: Array<any> = [];
  /**禁止改动选择状态的数据 */
  @Input() inDisableDatas: Array<any> = [];
  /**表格样式  "border" | "simple-border" | "background-color"*/
  @Input() inClassNames: ClassTableName[] = ["border", "background-color"];
  /**是否分页 */
  @Input() inIfPage: boolean;
  /**是否过滤表头 */
  @Input() inIfFilter: boolean = true;
  /**分页器条数选择 */
  @Input() inRecordOptions: number[] = [15, 20, 30, 50];
  /**表格搜索条件对象（引用地址改变会重新查询） */
  searchItem: HttpSearch = new HttpSearch();
  /**表格高度 (用于延时调用计算表格高度是否变化出现滚动条需重新设置各项的宽度)*/
  tableHeight: number
  /**表格的最大宽度（类名为table的节点决定） */
  tableWidthMax: number;
  /**表格的最大高度（类名为table的节点决定） */
  tableHeightMax: number;
  /**原始数据（没有修正添加字段的）*/
  private _datas: any[] = [];
  /**当前页面显示的表格数据 */
  public tableDatas: any[] = [];
  /**所有选中的表格数据 */
  private tableSelectedDatas: any[] = [];
  /**所有选中的数据的唯一标识集合 */
  private tableSelectedUuids: Array<string> = [];
  /**禁用数据的唯一标识集合 */
  private tableDisableUuids: Array<string> = [];
  /**分页器序号需要 */
  public page: PaginationPage = {};
  /**本地Element */
  nativeEl: HTMLElement;
  /**查询加载动画 */
  loadingFlag: boolean = false;
  /** */
  timeoutCtr: Subject<any> = new Subject()
  @Output() onSelectChange: EventEmitter<TableSelect> = new EventEmitter();
  @Output() onCurDataChange: EventEmitter<any[]> = new EventEmitter();

  ngOnChanges(changes: SimpleChanges): void {
    /**传入选中数据*/
    if (changes.inSelectedDatas) {
      /**根据用户传入选中设置选中数据（如果当前table数据之后了没有就采用用户传入的数据） */
      this.tableSelectedDatas = this.inSelectedDatas.map(e => this.tableDatas.find(data => data[this.inUuid] == e[this.inUuid]) || e)
      this.setTableSelectedUuidsByDatas();
    }
    /**传入禁用数据*/
    if (changes.inDisableDatas) {
      this.setTableDisableUuidsByDatas();
    }
    /**用户自己传入表格数据非后台查询*/
    if (UtilChanges(changes, 'inAllDatas') && !this.inApiUrl) {
      /**避免undefined */
      this.inAllDatas = this.inAllDatas || [];
      this.page.recordCount = this.inAllDatas.length;
      this.page = Object.assign({}, this.page);
      if (UtilChangesNoFirst(changes, 'inAllDatas')) {
        this.getList();
      }
    }
    /**查询条数需要是分页器存在的*/
    if (changes.inRecordOptions && this.inRecordOptions) {
      this.searchItem.pageRecord = this.inRecordOptions[0] || 15;
    }
    /**查询条件改变 */
    if (UtilChangesNoFirst(changes, 'inSearchObj') && this.inSearchObj) {
      this.searchItem = Object.assign({
        pageRecord: this.searchItem.pageRecord,
        currentPage: 1,
        ifPage: this.searchItem.ifPage
      }, this.inSearchObj);
      this.getList();
    }
    if (UtilChangesNoFirst(changes, 'inApiUrl') && this.inApiUrl) {
      this.getList()
    }
    this.superChanges(changes)
  }

  ngOnInit(): void {
    this.getList();
    this.superInitAfter();
  }

  ngAfterViewInit(): void {
    let el = this.nativeEl.querySelector('.table');
    this.tableHeightMax = el.clientHeight;
    this.tableWidthMax = el.clientWidth;
  }

  /**获取表格数据（异步和同步） */
  getList() {
    this.superGetListBefor();
    this.inIfPage = this.searchItem.ifPage = this.inIfPage ?? this.searchItem.ifPage ?? true;
    if (this.inApiUrl) {
      if (this.inLoading) this.loadingFlag = true;
      this.getDatasByHttp()
    } else {
      if (this.inIfPage) {
        let page = this.page,
          pageRecord = page.pageRecord = page.pageRecord ?? this.inRecordOptions[0],
          cur = page.currentPage = page.currentPage ?? 1;
        this.searchItem.pageRecord = pageRecord;
        this.searchItem.currentPage = cur;
        this._datas = this.inAllDatas.slice((cur - 1) * pageRecord, cur * pageRecord);
      } else {
        this._datas = this.inAllDatas
      }
      this.getListAfter();
    }
  }

  /**获取网络数据 */
  getDatasByHttp() {
    this.http.post(this.inApiUrl, this.searchItem).subscribe((res: HttpResult) => {
      this.loadingFlag = false;
      if (res.rlt == 0) {
        this.page = res.datas;
        this._datas = res.datas && res.datas.result || [];
      } else {
        this._datas = []
      }
      this.getListAfter();
    })
  }

  /**获取表格数据后的处理 */
  getListAfter() {
    /**确保弹出的数据干净 */
    this.tableDatas = this._datas.map(e => Object.assign({}, e));
    this.onCurDataChange.emit(this._datas);
    this.tableSelectedDatas = this.tableSelectedDatas.map(e => this._datas.find(data => data[this.inUuid] == e[this.inUuid]) || e);
    this.superGetListAfter();
  }
  /**基类ngOnChange后调用 */
  superChanges(changes: SimpleChanges) { }
  /**基类ngOnInit后调用 */
  superInitAfter() { }
  /**基类获取数据前调用 */
  superGetListBefor() { }
  /**查找、翻页、调整单页数据量以及初始加载数据都会调用 , 获得数据后表格需要在渲染数据后在进行宽高设置，需要设置延时 */
  superGetListAfter() {
    /**获取的高度或者宽度需要在数据渲染后进行，故设置此延时 */
    this.tableHeight = this.nativeEl.querySelector('table').clientHeight;
    this.setTableWidth();
  };

  /**设置选中的唯一识别UUID数组 */
  setTableSelectedUuidsByDatas() {
    this.tableSelectedUuids = this.tableSelectedDatas.map(e => e[this.inUuid])
  }

  /**设置禁用的唯一识别UUID数组 */
  setTableDisableUuidsByDatas() {
    this.tableDisableUuids = this.inDisableDatas.map(e => e[this.inUuid])
  }

  /**表头点击事件 */
  onCheckThead(flag, datas = this._datas, thead = this.inItems) {
    let changeDatas = []
    datas.forEach((e) => { if (!this.getDataDisableStatus(e)) { this.onCheckedData(flag, e, changeDatas) } });
    this.onSelectChange.emit(new TableSelect(flag, changeDatas, this.tableSelectedDatas, this.tableSelectedUuids))
  }

  /**数据点击事件 */
  onCheckedData(flag, data, changeDatas: any[] = undefined) {
    if (!changeDatas) {
      data = this._datas.find(e => e[this.inUuid] === data[this.inUuid])
    }
    if (flag) {
      /**已经被选中，不用再添加 */
      if (this.tableSelectedUuids.includes(data[this.inUuid])) return;
      this.tableSelectedUuids.push(data[this.inUuid]);
      this.tableSelectedDatas.push(data);
    } else {
      this.tableSelectedUuids = this.tableSelectedUuids.filter(e => e != data[this.inUuid]);
      this.tableSelectedDatas = this.tableSelectedDatas.filter(e => e[this.inUuid] != data[this.inUuid]);
    }
    /**表头点击事件会将本次改变选中状态的数据进行存储 */
    changeDatas && changeDatas.push(data);
    /**表头点击由表头点击事件进行emit弹出 */
    if (!changeDatas) {
      this.onSelectChange.emit(new TableSelect(flag, [data], this.tableSelectedDatas, this.tableSelectedUuids))
    }
  }

  /**翻页器改变（当前页，每页数据量） */
  onPageChange(page: PaginationPage) {
    let currentPage = page.currentPage, pageRecord = page.pageRecord;
    if (this.searchItem.currentPage == currentPage && this.searchItem.pageRecord == pageRecord) return;
    Object.assign(this.searchItem, { currentPage, pageRecord });
    this.getList();
  }

  /** 表头显示列有改变 */
  onChangeItemFilter(item: ModalChange) {
    let changeItems = item.changeItems;
    for (let i = 0, len = changeItems.length; i < len; i++) {
      const _item = changeItems[i];
      this.inItems.forEach(e => {
        if (e.key == _item.key) {
          e.ifShow = _item._checked;
        }
      })
    }
    /**如果恰巧该变项导致表格高度变化，需采用settimeout延时 */
    this.setTableWidth()
  }

  /**表格宽度设置*/
  setTableWidth() {
    /**如果恰巧导致表格高度出现或消失滚动条，需采用settimeout延时 */
    this.timeoutCtr.next();
    /**表格实际高度可能超高 */
    let tableHeight = this.tableHeight, tableMaxHeight = this.tableHeightMax, tableWidth = this.tableWidthMax,
      /**所有需要显示的列的宽度*/
      allWith = 0,
      /*需要计算的宽度（未设置固定宽的） */
      calcWidth = 0;
    if (!tableMaxHeight || !tableWidth) return;
    console.log('计算：', tableHeight, tableMaxHeight, tableWidth)
    this.inItems.forEach(e => {
      if (e.ifShow !== false) {
        allWith += (e.widthFix || e.width || e.widthMin || 60);
        if (e.styckyLeft || e.widthFix) return;
        calcWidth += (e.width || e.widthMin || 60);
      }
    })
    console.log('tableHeight:', tableHeight, 'tableMaxHeight:', tableMaxHeight, 'tableWidth:', tableWidth);
    /**-侧边滚动条宽度 */
    if (tableHeight > tableMaxHeight) tableWidth -= 6;
    /**页面表格宽度小于设置的表格项目总宽度 */
    if (tableWidth <= allWith) {
      this.inItems.forEach(e => e._width = e.widthFix || e.width || e.widthMin || 60);
      /**页面表格宽度大于设置的表格项目总宽度 */
    } else if (tableWidth > allWith) {
      /**多余需分配的宽度 */
      let extraWidth = tableWidth - (allWith - calcWidth), len = this.inItems.length - 1;
      Promise.resolve().then(res => {
        /**需要计算的总宽度（未设置固定宽的）*/
        let cWidth = calcWidth;
        this.inItems.forEach((e, i) => {
          /**不显示，隐藏掉 */
          if (e.ifShow === false) { e._width = 0; return }
          /**表项设置的宽度 */
          let eWhidth = e.widthFix || e.width || e.widthMin || 60;
          /**判断顺序极为重要 */
          if (e.styckyLeft || e.widthFix) {
            /**固定宽度*/
            e._width = eWhidth;
          } else if (i === len) {
            /**最后余下的宽度 */
            e._width = extraWidth;
          } else {
            /**计算占比多少剩余宽度 */
            e._width = (extraWidth * eWhidth / cWidth) | 0;
            cWidth -= eWhidth;
            extraWidth -= e._width;
          }
        })
        /**如果上面各种宽度出现错误的计算，由于样式问题表头宽度固定但body宽度依旧自适应，导致边框线错位， */
        // this.tableWidth = this.inItems.map(e => e._width).reduce((a, b) => a + b)
      })
    };
  }

  //以下选框状态方案待优化
  headMix(datas = this.tableDatas): boolean {
    let flag = datas.some(e => this.tableSelectedUuids.includes(e[this.inUuid]))
    return flag;
  }

  /**表头选款是否勾选 */
  headAllSelect(datas = this.tableDatas): boolean {
    /**当前页在选中数组中能查找到或者在禁用数组中可以查找到，且当前页数据量大于0 */
    let flag = datas.every(e => this.tableSelectedUuids.includes(e[this.inUuid]) || this.tableDisableUuids.includes(e[this.inUuid])) && datas.length > 0;
    return flag;
  }

  /**数据是否勾选 */
  getDataCheckStatus(data): boolean {
    let flag = this.tableSelectedUuids.includes(data[this.inUuid])
    return flag;
  }

  /**数据是否禁用 */
  getDataDisableStatus(data): boolean {
    let flag = this.tableDisableUuids.includes(data[this.inUuid])
    return flag;
  }
}
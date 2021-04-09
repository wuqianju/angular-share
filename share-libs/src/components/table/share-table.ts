import { ElementRef, EventEmitter, Input, Output, SimpleChanges } from "@angular/core";
import { ShareBaseSearch, ShareResult } from "share-libs/src/models";
import { ShareBaseHttpService } from "share-libs/src/services";
import { PaginationPage } from "../pagination/share-pagination.model";
import { SharePage, TableClassName, TableItem, TableSelect } from "./share-table.model";

export class TableBase {
  constructor(private http: ShareBaseHttpService, private el: ElementRef) {
    this.nativeEl = this.el.nativeElement
  }
  /**后台url路径 */
  @Input() inApiUrl: string = [][0];
  /**后台异步获取数据时是否开启遮罩  默认true*/
  @Input() inLoading: boolean = true;
  /**后台异步获取数据时搜索条件 */
  @Input() inSearchObj: ShareBaseSearch;
  /**表头配置  true*/
  @Input() inItems: Array<TableItem> = [];
  /**表格数据的唯一标识key  默认id*/
  @Input() inUuid: string = "id";
  /**非后台获取时传入的表格数据 */
  @Input() inAllDatas: any[] = [];
  /**已经选中的表格数据 */
  @Input() inSelectedDatas: Array<any> = [];
  /**禁止改动选择状态的数据 */
  @Input() inDisableDatas: Array<any> = [];
  /**表格样式  "border" | "simple-border" | "background-color"*/
  @Input() inClassNames: TableClassName[] = ["border", "background-color"];

  nativeEl: HTMLElement;
  /**表格数据 */
  tableDatas: any[] = [];

  /**选中的表格数据 */
  tableSelectedDatas: any[] = [];
  /**选中的数据的唯一标识集合 */
  tableSelectedUuids: Array<string> = [];
  /**禁用数据的唯一标识集合 */
  tableDisableUuids: Array<string> = [];
  page: SharePage = new SharePage();
  paginPage: SharePage = new SharePage();
  searchItem: ShareBaseSearch = new ShareBaseSearch();
  pageRecordOptions: number[] = [15, 20, 30, 50];
  loadingFlag: boolean = false;
  @Output() onSelectChange: EventEmitter<TableSelect> = new EventEmitter();
  @Output() onCurDataChange: EventEmitter<any[]> = new EventEmitter();


  ngOnChanges(changes: SimpleChanges): void {
    if (changes.inSelectedDatas) {
      console.log('changes.inSelectedDatas')
      //传入选中数据
      this.setSelectedDatas()
      this.setTableSelectedUuidsByDatas()
    }
    if (changes.inDisableDatas) {
      //传入禁用数据
      this.setTableDisableUuidsByDatas()
    }
    if (changes.inAllDatas && this.inAllDatas.length > 0) {
      //用户自己传入表格数据非后台查询
      this.page.recordCount = this.inAllDatas.length;
      // this.paginPage = Object.assign({}, this.page)
    }
    if (changes.searchObj && changes.searchObj.currentValue) {
      //查询
      Object.assign(this.searchItem, this.inSearchObj);
      this.getList();
    }
    this.superChanges(changes)
  }

  ngAfterViewInit(): void {
    /**初次计算避免首次加载宽度与获得数据后计算的不统一 */
    this.setTableWidth();
    /**数据过多可能出现滚动条需要重新计算 */
    let $after = this.onCurDataChange.asObservable().subscribe(res => {
      this.setTableWidth();
      $after.unsubscribe();
    })
  }

  setTableWidth() {
    let allWith = 0, computeWidth = 0, len = this.inItems.length - 1;;
    this.inItems.forEach(e => {
      if (e.ifShow !== false) {
        allWith += (e.width || e.widthMin || 60);
        if (!e.styckyLeft) {
          computeWidth += (e.width || e.widthMin || 60)
        }
      }
    })
    setTimeout(() => {
      let tableWidth = this.nativeEl.querySelector('.share-table').clientWidth;
      let tableMaxHeight = this.nativeEl.querySelector('.table-part').clientHeight;
      let tableHeight = this.nativeEl.querySelector('table').clientHeight;
      /**-边框宽度 */
      if (this.inClassNames.includes('border')) {
        tableWidth -= (len + 2)
      }
      /**-侧边滚动条宽度 */
      if (tableHeight > tableMaxHeight) {
        tableWidth -= 6
      }
      if (tableWidth <= allWith) {
        Promise.resolve().then(res => {
          this.inItems.forEach(e => e._width = e.width || e.widthMin || 60)
        })
      } else if (tableWidth > allWith) {
        let extraWidth = tableWidth, len = this.inItems.length - 1;
        Promise.resolve().then(res => {
          this.inItems.forEach((e, i) => {
            if (e.ifShow === false) { e._width = 0; return }
            let eWhidth = e.width || e.widthMin || 60;
            if (i === len) {
              e._width = extraWidth;
            } else if (e.styckyLeft) {
              e._width = eWhidth;
            } else {
              e._width = (extraWidth * eWhidth / computeWidth) | 0;
              computeWidth -= eWhidth;
            }
            extraWidth -= e._width;
          })
        })
      }
    }, 10);
  }

  ngOnInit(): void {
    this.paginPage = Object.assign({}, this.page)
    this.setTableSelectedUuidsByDatas();
    this.setTableDisableUuidsByDatas();
    this.getList();
    this.superInitAfter();
  }

  setSelectedDatas() {
    let datas = this.inSelectedDatas.map(e => this.tableDatas.find(data => data[this.inUuid] == e[this.inUuid]) || e)
    datas.map(e => {
      if (!this.tableSelectedDatas.find(s => s[this.inUuid] == e[this.inUuid])) {
        this.tableSelectedDatas.push(e)
      }
    })
  }

  setTableSelectedUuidsByDatas() {
    this.tableSelectedUuids = this.tableSelectedDatas.map(e => e[this.inUuid])
  }

  setTableDisableUuidsByDatas() {
    this.tableDisableUuids = this.inDisableDatas.map(e => e[this.inUuid])
  }

  getList() {
    this.superGetListBefor();
    if (this.inApiUrl) {
      if (this.inLoading) {
        this.loadingFlag = true;
      }
      this.getDatasByHttp()
    } else {
      let page = this.page = this.paginPage;
      let pageRecord = page.pageRecord;
      this.tableDatas = this.inAllDatas.slice((page.currentPage - 1) * pageRecord, page.currentPage * pageRecord);
      this.getListAfter();
    }
  }

  getDatasByHttp() {
    this.http.post(this.inApiUrl, this.searchItem).subscribe((res: ShareResult) => {
      this.loadingFlag = false;
      if (res.rlt == 0) {
        this.page = res.datas;
        this.paginPage = Object.assign({}, this.page);
        this.tableDatas = res.datas && res.datas.result || [];
        this.getListAfter();
      }
    })
  }

  getListAfter() {
    this.onCurDataChange.emit(this.tableDatas);
    this.tableSelectedDatas = this.tableSelectedDatas.map(e => this.tableDatas.find(data => data[this.inUuid] == e[this.inUuid]) || e);
    this.superGetListAfter();
  }

  superChanges(changes: SimpleChanges) { }
  superInitAfter() { }
  superGetListBefor() { }
  superGetListAfter() { };

  /**表头点击事件 */
  onCheckThead(flag, datas = this.tableDatas, thead = this.inItems) {
    let changeDatas = []
    datas.forEach((e) => { if (!this.getDataDisableStatus(e)) { this.onCheckedData(flag, e, changeDatas) } });
    this.onSelectChange.emit(new TableSelect(flag, changeDatas, this.tableSelectedDatas, this.tableSelectedUuids))
  }

  /**数据点击事件 */
  onCheckedData(flag, data, changeDatas: any[] = undefined) {
    if (flag) {
      if (this.tableSelectedUuids.includes(data[this.inUuid])) return;
      this.tableSelectedUuids.push(data[this.inUuid]);
      this.tableSelectedDatas.push(data);
    } else {
      this.tableSelectedUuids = this.tableSelectedUuids.filter(e => e != data[this.inUuid]);
      this.tableSelectedDatas = this.tableSelectedDatas.filter(e => e[this.inUuid] != data[this.inUuid]);
    }
    changeDatas && changeDatas.push(data);
    if (!changeDatas) {
      this.onSelectChange.emit(new TableSelect(flag, [data], this.tableSelectedDatas, this.tableSelectedUuids))
    }
  }

  pageChange(page: PaginationPage) {
    let currentPage = page.currentPage, pageRecord = page.pageRecord;
    if (this.searchItem.currentPage == currentPage && this.searchItem.pageRecord == pageRecord) return;
    let flag = this.searchItem.pageRecord == pageRecord;
    Object.assign(this.searchItem, { currentPage, pageRecord });
    this.getList();
    if (!flag) {
      /**改变每页条数可能出现滚动条，需要重新计算宽度 */
      let $after = this.onCurDataChange.asObservable().subscribe(res => {
        this.setTableWidth();
        $after.unsubscribe();
      })
    }
  }

  /** 表头显示列有改变 */
  onChangeItemFilter() {
    this.setTableWidth();
  }

  //以下方案待优化
  headMix(datas = this.tableDatas): boolean {
    let flag = datas.some(e => this.tableSelectedUuids.includes(e[this.inUuid]))
    return flag;
  }

  headAllSelect(datas = this.tableDatas): boolean {
    let flag = datas.every(e => this.tableSelectedUuids.includes(e[this.inUuid]) || this.tableDisableUuids.includes(e[this.inUuid])) && datas.length > 0;
    return flag;
  }

  getDataCheckStatus(data): boolean {
    let flag = this.tableSelectedUuids.includes(data[this.inUuid])
    return flag;
  }

  getDataDisableStatus(data): boolean {
    let flag = this.tableDisableUuids.includes(data[this.inUuid])
    return flag;
  }
}
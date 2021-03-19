import { Component, OnInit, SimpleChanges, ElementRef, Renderer2, Input, Output, EventEmitter } from '@angular/core';
import { ShareBaseSearch, ShareResult } from 'share-libs/src/model';
import { ShareBaseService } from 'share-libs/src/servers';
import { TableComponent } from '../table/share-table.component';

@Component({
  selector: 'share-table-expend',
  templateUrl: './share-table-expend.component.html',
  styleUrls: ['./share-table-expend.component.less']
})
export class TableExpendComponent extends TableComponent implements OnInit {
  constructor(http: ShareBaseService, el: ElementRef) {
    super(http, el);
  }
  tableExpend: boolean = false;//是否有展开列
  expendIndex: number = [][0];//展开列序号
  
  superInitAfter() {
    this.expendIndex = [][0];
    this.tableExpend = this.inItems.some(e => e.type == 'expend');
  }

  superGetListBefor() {
    this.expendIndex = [][0];
  }

  expendLine(item, index) {
    this.expendIndex = index == this.expendIndex ? [][0] : index;
    if (this.expendIndex === [][0]) {
      return;
    }
  }
}
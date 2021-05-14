import { OverlayModule } from "@angular/cdk/overlay"
import { CommonModule } from "@angular/common"
import { HttpClientModule } from "@angular/common/http"
import { NgModule } from "@angular/core"
import { BrowserModule } from "@angular/platform-browser"
import { RouterModule } from "@angular/router"
import { httpInterceptorProviders } from "share-libs/src/services/intercepters"
import { AppMainComponent } from "./app.component"
import { APPROUTER } from "./app.routing"

@NgModule({
  declarations: [
    AppMainComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    HttpClientModule,
    RouterModule,
    OverlayModule,
    APPROUTER,
  ],
  providers: [httpInterceptorProviders],
  entryComponents: [],
  bootstrap: [AppMainComponent],
})
export class AppMainModule { }



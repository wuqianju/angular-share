import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AccountService } from 'share-libs/services/account.service';
import { AuthService } from 'share-libs/services/auth.service';
import { HttpService } from 'share-libs/services/http-base.service';
@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor(
    private account_: AccountService,
    private auth_: AuthService,
    private http_: HttpService,
  ) { }

  getWsAddress(uuid): string {
    //本地环境的 websocket地址
    let address = `ws://127.0.0.1:8086/websocketQRCode/${uuid}`
    if (environment.production) {
      address = window.location.href;
      address = address.replace("http://", "")
      address = address.substr(0, address.indexOf('/'));
      address = `ws://${address}/websocketQRCode/${uuid}`
    }
    return address;
  }

  getQRCode() { return this.http_.get(`api/open/getQRcode`); }

  /**
   * websocket 连接
   */
  connect(uuid) {
    // return makeWebSocketObservable(this.getWsAddress(uuid)).pipe(
    //   switchMap((res: GetWebSocketResponses) => {
    //     return res(new Subject<string>())
    //   })
    // );
  }

  /**获取手机验证码 */
  getPhoneCode(phoneNumber: string) {
    return this.http_.get(`api/open/getCode/${phoneNumber}`).toPromise()
  }

  /**登录验证账号 */
  login(phoneNumber, code) {
    return this.http_.get(`api/open/checkLogin/${phoneNumber}/${code}`).toPromise();
  }

  /**去掉鉴权  清空用户信息  路由快照待清除 */
  logout() {
    this.auth_.authorizeUnload();
    this.account_.clearAccount();
  }

}

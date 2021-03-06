import * as _ from "lodash";
/**清空数组，不改变引用地址*/
function clear<T>(arr: T[]): T[] {
    arr.length = 0;
    return arr;
}

/**判读对象是否是数组 */
function isArray(arr: any): arr is any[] {
    if (Array.isArray) {
        return Array.isArray(arr)
    } else {
        return Object.prototype.toString.call(arr) === '[object Array]'
    }
}

/**对象是数组且length > 0*/
function isNonNull(arr: Array<any>): boolean {
    return isArray(arr) && arr.length > 0
}

/**判断数组（包含其子项）中的key是否全为value */
function every<T>(arr: Array<T>, value: any, key: keyof T, children?: string) {
    if (isNonNull(arr)) {
        for (let i = 0, len = arr.length; i < len; i++) {
            const ele = arr[i];
            if (ele[key] !== value) {
                return false
            } else {
                if (children && !every(ele[children], value, key, children)) {
                    return false
                }
            }
        }
    }
    return true;
}

/**判断数组（包含其子项）中是否存在key为value的选项 */
function some<T>(arr: Array<T>, value: any, key: keyof T, children?: string): boolean {
    if (isNonNull(arr)) {
        for (let i = 0, len = arr.length; i < len; i++) {
            const ele = arr[i];
            if (ele === value || (key && ele[key] === value)) {
                return true;
            } else {
                if (children && some(ele[children], value, key, children)) {
                    return true
                }
            }
        }
    }
    return false;
}

/**移除数组指定item，会改变原数组，不改变引用地址*/
function itemRemove<T>(arr: T[], item: T, key?: keyof T): T[] {
    if (isNonNull(arr)) {
        let index;
        if (key) {
            index = arr.findIndex(e => e == item || e[key] == item[key])
        } else {
            index = arr.findIndex(e => e == item);
        }
        arr.splice(index, 1)
    }
    return arr || [];
}

/**数组中如果有就删除如果没有就添加(对象可指定key)*/
function itemToggle<T>(arr: T[], value: T, key?: keyof T): T[] {
    if (isArray(arr)) {
        for (let i = 0, len = arr.length; i < len; i++) {
            let el = arr[i];
            if (el === value || (key && el[key] == value[key])) {
                return itemRemove(arr, value, key);
            }
        }
        arr.push(value);
    }
    return arr
}

/**将数组中指定对象替换为另一个对象，可设置key来判断对象,没有找到指定对象则push */
function replace<T>(arr: T[], valueA: T, valueB: T, key?: keyof T): T[] {
    if (isArray(arr)) {
        for (let i = 0, len = arr.length; i < len; i++) {
            let el = arr[i];
            if (el === valueA || (key && el[key] == valueA[key])) {
                arr[i] = valueB;
                return arr
            }
        }
        arr.push(valueB);
    }
    return arr
}

/**浅复制（改变引用地址） */
function copy<T>(arr: T[]): T[] {
    let r: T[] = [];
    if (isNonNull(arr)) {
        r = [...arr]
    }
    return r
}

/**将数组及其后代数组中的 指定的key的值设置为 value
 * arr 为数组   key为要设置的key  value为要设置值   children 为子数组所在的key
 * children 为 ''  表示不设置子项
 */
function setItemValue<T>(arr: Array<T>, key: keyof T, value: any, children: string = 'children') {
    if (isNonNull(arr)) {
        for (let i = 0, len = arr.length; i < len; i++) {
            let el = arr[i];
            el[key] = value;
            if (children) {
                setItemValue(el[children], key, value, children);
            }
        }
    }
}

/**当数组arr中某条数据key为指定value时，将该数据及其所有祖先的attr设置为指定的data  
* children为子数组所在的key
* 返回该条数据(路由服务中启用)
*/
function setItemDataByValue<T>(arr: Array<T>, key: keyof T, value: any, attr: keyof T, data: any, children: string = 'children'): T {
    if (isNonNull(arr)) {
        for (let i = 0, len = arr.length; i < len; i++) {
            let el = arr[i];
            if (el[key] == value) {
                el[attr] = data;
                return el;
            } else {
                let el_c: T = setItemDataByValue(el[children], key, value, attr, data);
                if (el_c) {
                    el[attr] = data;
                    return el_c
                }
            }
        }
    }
}

/**两个数组（A,B），
 * 如果A中的数据X在B中也存在，或者X的attr属性的值等于B中某条数据的attr属性的值，
 * 则将A中该数据的key设置为value
 */
function setValueByOther<T>(A: T[], B: T[], key: keyof T, value: any, attr?: keyof T): void {
    if (isNonNull(A) && isNonNull(B)) {
        A.forEach(a => {
            if (B.some(b => b == a || (attr && a[attr] == b[attr]))) {
                a[key] = value
            }
        })
    }
}

/** 获取数组中所有key为指定value的对象组合的数组 onlySuper为true表示父类匹配后就不再匹配子类*/
function getArrByValue<T>(arr: T[], key: keyof T, value: any, onlySuper: boolean = false, children: string = 'children'): T[] {
    let values = [];
    if (isNonNull(arr)) {
        for (let i = 0, len = arr.length; i < len; i++) {
            let el = arr[i];
            if (el[key] == value) {
                values.push(el);
                if (onlySuper) {
                    continue;
                }
            }
            let datas: T[] = getArrByValue(el[children], key, value, onlySuper);
            values.push(...datas);
        }
    }
    return values
}

/**获取数组及其子项中获得key为指定value的对象
 * children 为 ''  表示不查找子项
*/
function getObjByValue<T>(arr: Array<T>, key: keyof T, value: any, children: string = 'children'): T {
    if (isNonNull(arr)) {
        for (let i = 0, len = arr.length; i < len; i++) {
            let el = arr[i];
            if (el[key] == value) {
                return el;
            } else if (children) {
                let obj: T = getObjByValue(el[children], key, value);
                if (obj) {
                    return obj;
                }
            }
        }
    }
}

/** 获取数组arr中key为指定value的始祖对象*/
function getAncestorByValue<T>(arr: Array<T>, key: keyof T, value: any, children: string = 'children'): T {
    if (isNonNull(arr)) {
        for (let i = 0, len = arr.length; i < len; i++) {
            let el = arr[i];
            if (el[key] == value) {
                return el;
            } else {
                let obj: T = getAncestorByValue(el[children], key, value);
                if (obj) {
                    return el;
                }
            }
        }
    }
}

/**得到含自身和父级的数组,顶级父类排第一
 * arr数组中key等于value或者该对象等于value的父级数组 
*/
function getAncestorsByValue<T>(arr: Array<T>, value: any, key?: keyof T, children: string = 'children'): T[] {
    if (isNonNull(arr)) {
        for (let i = 0, len = arr.length; i < len; i++) {
            let el = arr[i];
            if (el === value || (key && el[key] == value)) {
                let arrB = []
                arrB.unshift(el)
                return arrB;
            } else {
                let obj: T[] = getAncestorsByValue(el[children], value, key);
                if (obj) {
                    obj.unshift(el)
                    return obj;
                }
            }
        }
    }
}

/**两个数组（A,B），
 * 如果A中的某个数据a不存在于B中，或者该数据的attr属性在B中找不到对应的，
 * 则将该数据的放置额外的数组中并返回该数组
 */
function getSpares<T>(A: T[], B: T[], attr?: keyof T): T[] {
    let res: T[] = []
    if (isNonNull(A) && isNonNull(B)) {
        A.forEach(a => {
            if (B.some(b => b == a || (attr && a[attr] == b[attr]))) {

            } else {
                res.push(a)
            }
        })
    }
    return res
}

/**两个数组（A,B），
 * 如果A中的某个数据a不存在于B中，或者该数据的attr属性在B中找不到对应的，
 * 则将A中该数据的放置额外的数组中并返回该数组
 */
function getSparesByKey<T>(A: T[], B: T[], key: keyof T, children: string): T[] {
    let res: T[] = []
    if (isNonNull(A) && isNonNull(B)) {
        A.forEach(a => {
            if (!some(B, a[key], key, children)) {
                res.push(a)
            }
        })
    }
    return res
}

/**数组操作工具对象 */
export const UtilArray = {
    /**清空数组，不改变引用地址*/
    clear: clear,
    /**浅复制（改变引用地址） */
    copy: copy,
    copyDeep: _.cloneDeep,
    /**判读对象是否是数组 */
    isArray: isArray,
    /**对象是数组且length > 0*/
    isNonNull: isNonNull,
    /**判断数组（包含其子项）中的key是否全为value */
    every: every,
    /**判断数组（包含其子项）中是否存在key为value的选项 */
    some: some,
    /**将数组中指定对象替换为另一个对象，可设置key来判断对象 */
    replace: replace,
    /**移除数组指定item，会改变原数组，不改变引用地址 */
    itemRemove: itemRemove,
    /**数组中如果有就删除如果没有就添加(对象可指定key) */
    itemToggle: itemToggle,
    /**将数组及其后代数组中的 指定的key的值设置为 value arr 为数组 key为要设置的key value为要设置值 children 为子数组所在的key children 为 '' 表示不设置子项 */
    setItemValue: setItemValue,
    /**当数组arr中某条数据key为指定value时，将该数据及其所有祖先的attr设置为指定的data
    children为子数组所在的key 返回该条数据(路由服务中启用) */
    setItemDataByValue: setItemDataByValue,
    /**两个数组（A,B）， 如果A中的数据X在B中也存在，或者X的attr属性的值等于B中某条数据的attr属性的值， 则将A中该数据的key设置为value */
    setValueByOther: setValueByOther,
    /**获取数组中所有key为指定value的对象数组onlySuper为true表示父类匹配后就不再匹配子类*/
    getArrByValue: getArrByValue,
    /**获取数组及其子项中获得key为指定value的对象 children 为 '' 表示不查找子项 */
    getObjByValue: getObjByValue,
    /**两个数组（A,B）， 如果A中的某个数据a不存在于B中，或者该数据的attr属性在B中找不到对应的， 则将该数据的放置额外的数组中并返回该数组 */
    getSpares: getSpares,
    /**两个数组（A,B）， 如果A中的某个数据a不存在于B中，或者该数据的attr属性在B中找不到对应的， 则将A中该数据的放置额外的数组中并返回该数组 */
    getSparesByKey: getSparesByKey,
    /**获取数组arr中key为指定value的始祖对象 */
    getAncestorByValue: getAncestorByValue,
    /**得到含自身和父级的数组,顶级父类排第一 arr数组中key等于value或者该对象等于value的父级数组 */
    getAncestorsByValue: getAncestorsByValue,
}
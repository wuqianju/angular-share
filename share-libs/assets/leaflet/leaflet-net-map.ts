

import * as L from "leaflet";

'use strict';
/**坐标转换关键代码(加载后GridLayer自行转换) */
(function (window, document) {
    /**百度转84*/
    var bd09_To_gps84 = function (lng, lat) {
        var gcj02 = bd09_To_gcj02(lng, lat);
        var map84 = gcj02_To_gps84(gcj02.lng, gcj02.lat);
        return map84;
    }
    /**84转百度*/
    var gps84_To_bd09 = function (lng, lat) {
        var gcj02 = gps84_To_gcj02(lng, lat);
        var bd09 = gcj02_To_bd09(gcj02.lng, gcj02.lat);
        return bd09;
    }
    /**84转火星*/
    var gps84_To_gcj02 = function (lng, lat) {
        var dLat = transformLat(lng - 105.0, lat - 35.0);
        var dLng = transformLng(lng - 105.0, lat - 35.0);
        var radLat = lat / 180.0 * pi;
        var magic = Math.sin(radLat);
        magic = 1 - ee * magic * magic;
        var sqrtMagic = Math.sqrt(magic);
        dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * pi);
        dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * pi);
        var mgLat = lat + dLat;
        var mgLng = lng + dLng;
        var newCoord = {
            lng: mgLng,
            lat: mgLat
        };
        return newCoord;
    }
    /**火星转84*/
    var gcj02_To_gps84 = function (lng, lat) {
        var coord = transform(lng, lat);
        var lontitude = lng * 2 - coord.lng;
        var latitude = lat * 2 - coord.lat;
        var newCoord = {
            lng: lontitude,
            lat: latitude
        };
        return newCoord;
    }
    /**火星转百度*/
    var gcj02_To_bd09 = function (x, y) {
        var z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * x_pi);
        var theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * x_pi);
        var bd_lng = z * Math.cos(theta) + 0.0065;
        var bd_lat = z * Math.sin(theta) + 0.006;
        var newCoord = {
            lng: bd_lng,
            lat: bd_lat
        };
        return newCoord;
    }
    /**百度转火星*/
    var bd09_To_gcj02 = function (bd_lng, bd_lat) {
        var x = bd_lng - 0.0065;
        var y = bd_lat - 0.006;
        var z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * x_pi);
        var theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * x_pi);
        var gg_lng = z * Math.cos(theta);
        var gg_lat = z * Math.sin(theta);
        var newCoord = {
            lng: gg_lng,
            lat: gg_lat
        };
        return newCoord;
    }
    var pi = 3.1415926535897932384626;
    var a = 6378245.0;
    var ee = 0.00669342162296594323;
    var x_pi = pi * 3000.0 / 180.0;
    var R = 6378137;
    function transform(lng, lat) {
        var dLat = transformLat(lng - 105.0, lat - 35.0);
        var dLng = transformLng(lng - 105.0, lat - 35.0);
        var radLat = lat / 180.0 * pi;
        var magic = Math.sin(radLat);
        magic = 1 - ee * magic * magic;
        var sqrtMagic = Math.sqrt(magic);
        dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * pi);
        dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * pi);
        var mgLat = lat + dLat;
        var mgLng = lng + dLng;
        var newCoord = {
            lng: mgLng,
            lat: mgLat
        };
        return newCoord;
    }

    function transformLat(x, y) {
        var ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
        ret += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(y * pi) + 40.0 * Math.sin(y / 3.0 * pi)) * 2.0 / 3.0;
        ret += (160.0 * Math.sin(y / 12.0 * pi) + 320 * Math.sin(y * pi / 30.0)) * 2.0 / 3.0;
        return ret;
    }

    function transformLng(x, y) {
        var ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
        ret += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(x * pi) + 40.0 * Math.sin(x / 3.0 * pi)) * 2.0 / 3.0;
        ret += (150.0 * Math.sin(x / 12.0 * pi) + 300.0 * Math.sin(x / 30.0 * pi)) * 2.0 / 3.0;
        return ret;
    }
    L.GridLayer.include({
        _setZoomTransform: function (level, _center, zoom) {
            var center = _center;
            if (center != undefined && this.options) {
                if (this.options.corrdType == 'gcj02') {
                    center = gps84_To_gcj02(_center.lng, _center.lat);
                } else if (this.options.corrdType == 'bd09') {
                    center = gps84_To_bd09(_center.lng, _center.lat);
                }
            }
            var scale = this._map.getZoomScale(zoom, level.zoom),
                translate = level.origin.multiplyBy(scale)
                    .subtract(this._map._getNewPixelOrigin(center, zoom)).round();

            if (L.Browser.any3d) {
                L.DomUtil.setTransform(level.el, translate, scale);
            } else {
                L.DomUtil.setPosition(level.el, translate);
            }
        },
        _getTiledPixelBounds: function (_center) {
            var center = _center;
            if (center != undefined && this.options) {
                if (this.options.corrdType == 'gcj02') {
                    center = gps84_To_gcj02(_center.lng, _center.lat);
                } else if (this.options.corrdType == 'bd09') {
                    center = gps84_To_bd09(_center.lng, _center.lat);
                }
            }
            var map = this._map,
                mapZoom = map._animatingZoom ? Math.max(map._animateToZoom, map.getZoom()) : map.getZoom(),
                scale = map.getZoomScale(mapZoom, this._tileZoom),
                pixelCenter = map.project(center, this._tileZoom).floor(),
                halfSize = map.getSize().divideBy(scale * 2);
            return new L.Bounds(pixelCenter.subtract(halfSize), pixelCenter.add(halfSize));
        }
    })
}(this, document))

const MAPINFO = {
    TianDiTu: {
        Normal: {
            Map: "//t{s}.tianditu.com/DataServer?T=vec_w&X={x}&Y={y}&L={z}&tk={key}",
            Annotion: "//t{s}.tianditu.com/DataServer?T=cva_w&X={x}&Y={y}&L={z}&tk={key}"
        },
        Satellite: {
            Map: "//t{s}.tianditu.com/DataServer?T=img_w&X={x}&Y={y}&L={z}&tk={key}",
            Annotion: "//t{s}.tianditu.com/DataServer?T=cia_w&X={x}&Y={y}&L={z}&tk={key}"
        },
        Terrain: {
            Map: "//t{s}.tianditu.com/DataServer?T=ter_w&X={x}&Y={y}&L={z}&tk={key}",
            Annotion: "//t{s}.tianditu.com/DataServer?T=cta_w&X={x}&Y={y}&L={z}&tk={key}"
        },
        Subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
        key: "a9e2dd65c94fab979c9d897ff7098a4c"
    },

    GaoDe: {
        Normal: {
            Map: '//webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}'
        },
        Satellite: {
            Map: '//webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
            Annotion: '//webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}'
        },
        Subdomains: ["1", "2", "3", "4"]
    },

    Google: {
        Normal: {
            Map: "//www.google.cn/maps/vt?lyrs=m@189&gl=cn&x={x}&y={y}&z={z}"
        },
        Satellite: {
            Map: "//www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}",
            Annotion: "//www.google.cn/maps/vt?lyrs=y@189&gl=cn&x={x}&y={y}&z={z}"
        },
        Subdomains: []
    },

    Geoq: {
        Normal: {
            Map: "//map.geoq.cn/ArcGIS/rest/services/ChinaOnlineCommunity/MapServer/tile/{z}/{y}/{x}",
            PurplishBlue: "//map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetPurplishBlue/MapServer/tile/{z}/{y}/{x}",
            Gray: "//map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetGray/MapServer/tile/{z}/{y}/{x}",
            Warm: "//map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetWarm/MapServer/tile/{z}/{y}/{x}",
        },
        Theme: {
            Hydro: "//thematic.geoq.cn/arcgis/rest/services/ThematicMaps/WorldHydroMap/MapServer/tile/{z}/{y}/{x}"
        },
        Subdomains: []
    },

    OSM: {
        Normal: {
            Map: "//{s}.tile.osm.org/{z}/{x}/{y}.png",
        },
        Subdomains: ['a', 'b', 'c']
    },

    Baidu: {
        Normal: {
            Map: '//online{s}.map.bdimg.com/onlinelabel/?qt=tile&x={x}&y={y}&z={z}&styles=pl&scaler=1&p=1'
        },
        Satellite: {
            Map: '//shangetu{s}.map.bdimg.com/it/u=x={x};y={y};z={z};v=009;type=sate&fm=46',
            Annotion: '//online{s}.map.bdimg.com/tile/?qt=tile&x={x}&y={y}&z={z}&styles=sl&v=020'
        },
        Subdomains: '0123456789',
        tms: true
    }
}

/**tianDiTu 天地图 gaoDe 高德 google 谷歌 
* Normal 矢量地图 Satellite 卫星图
* Map地图 Annotion地名*/
export enum NetMap {
    tianDiTuNormalMap = 'TianDiTu.Normal.Map',
    tianDiTuNormalAnnotion = 'TianDiTu.Normal.Annotion',
    tianDiTuSatelliteMap = 'TianDiTu.Satellite.Map',
    tianDiTuSatelliteAnnotion = 'TianDiTu.Satellite.Annotion',
    tianDiTuTerrainMap = 'TianDiTu.Terrain.Map',
    tianDiTuTerrainAnnotion = 'TianDiTu.Terrain.Annotion',
    /**gaoDe 高德*/
    gaoDeNormalMap = 'GaoDe.Normal.Map',
    gaoDeSatelliteMap = 'GaoDe.Satellite.Map',
    gaoDeSatelliteAnnotion = 'GaoDe.Satellite.Annotion',
    googleNormalMap = 'Google.Normal.Map',
    googleSatelliteMap = 'Google.Satellite.Map',
    googleSatelliteAnnotion = 'Google.Satellite.Annotion',
    geoqNormalMap = 'Geoq.Normal.Map',
    geoqNormalPurplishBlue = 'Geoq.Normal.PurplishBlue',
    geoqNormalGray = 'Geoq.Normal.Gray',
    geoqNormalWarm = 'Geoq.Normal.Warm',
    geoqThemeHydro = 'Geoq.Theme.Hydro',
    oSMNormalMap = 'OSM.Normal.Map',
}

/**加载网络地图 并通过坐标转换使瓦片偏移解决地图偏移问题 */
export class LeafletNetMap {
    constructor(name: NetMap, options = {}) {
        this._setMapProvider(name, options);
    }
    private _mapProvider: L.Layer;
    private _map: L.Map;

    addTo(map) {
        this._map = map;
        this._mapProvider && this._mapProvider.addTo(this._map)
        return this;
    }

    remove() {
        this._mapProvider && this._mapProvider.remove();
    }

    changeMap(name: NetMap, options?) {
        this.remove();
        this._setMapProvider(name, options);
        this._map && this.addTo(this._map);
        return this;
    }

    /**设置map的地图来源 */
    private _setMapProvider(name: NetMap, options?) { // (type, Object)
        options = options || {}
        let parts = name.split('.'), mapSource = parts[0], mapName = parts[1], mapType = parts[2];
        let url = MAPINFO[mapSource][mapName][mapType];
        options.subdomains = MAPINFO[mapSource].Subdomains;
        options.key = options.key || MAPINFO[mapSource].key;
        options.corrdType = this._getCorrdType(mapSource);
        if ('tms' in MAPINFO[mapSource]) {
            options.tms = MAPINFO[mapSource]['tms']
        }
        this._mapProvider = new NetMapProvider(url, options);
    }

    /**获取坐标转换类型*/
    private _getCorrdType(name) {
        var zbName = "wgs84"
        switch (name) {
            case "Geoq":
            case "GaoDe":
            case "Google":
                zbName = "gcj02";
                break;
            case "Baidu":
                zbName = "bd09";
                break;
            case "OSM":
            case "TianDiTu":
                zbName = "wgs84";
                break;
        }
        return zbName;
    }
}

class NetMapProvider extends L.TileLayer {
    constructor(url: string, options = {}) {
        super(url, options)
    }
}
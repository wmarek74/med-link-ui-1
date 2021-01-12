"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var http_1 = require("@angular/common/http");
var core_1 = require("@angular/core");
var operators_1 = require("rxjs/operators");
var database_service_1 = require("~/app/shared/database.service");
var NightscoutApiService = /** @class */ (function () {
    function NightscoutApiService(httpClient, databaseService) {
        this.httpClient = httpClient;
        this.databaseService = databaseService;
        //secret = 'd6026bb45e7efd38de82680c75d31cf7f7a6a1e3';
        this.secret = '258628a55f1370569738e7da6d135c61dcaea7c9';
        this.device = 'Med-Link';
        this.timezone = '+02:00';
        this.http = '';
        this.hash = '';
    }
    NightscoutApiService.prototype.getNSData = function () {
        return this.databaseService.NSconf().pipe(operators_1.map(function (rows) {
            return rows.map(function (a) { return ({
                http: a[0],
                secret: a[1]
            }); });
        }));
    };
    NightscoutApiService.prototype.getConfig = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.getNSData().subscribe(function (g) {
                g.map(function (bol) {
                    _this.http = bol.http.toString();
                    _this.hash = bol.secret.toString();
                });
                console.log("TO JEST API I SECRET Z BAZY aaaaaaaassssssss" + _this.http + _this.hash);
                resolve(),
                    reject();
            });
        });
    };
    NightscoutApiService.prototype.sendNewBG = function (glucoses) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (glucoses.length >= 1) {
                console.log("DLUGOSC API KOMUNIKATU:  " + glucoses.length);
                _this.httpClient
                    .post(_this.http + '/api/v1/entries', glucoses.map(function (glucose) { return ({
                    device: _this.device,
                    secret: _this.hash,
                    sgv: glucose.value,
                    date: +glucose.date,
                    direction: glucose.old
                }); })).subscribe(resolve, reject);
            }
            else {
                console.log("Brak informacji o cukrze cukier!!");
                console.log("DLUGOSC API KOMUNIKATU:  " + glucoses.length);
                resolve();
            }
        });
    };
    NightscoutApiService.prototype.sendNewBol = function (treatments) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.httpClient
                .post(_this.http + '/api/v1/treatments', treatments.map(function (bol) { return ({
                enteredBy: _this.device,
                secret: _this.hash,
                insulin: bol.value,
                created_at: bol.date
            }); })).subscribe(resolve, reject);
        });
    };
    NightscoutApiService.prototype.getBGfromNs = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.getConfig().then(function () { return _this.httpClient.get(_this.http + '/api/v1/entries.json?count=1').subscribe(resolve, reject); });
        });
    };
    NightscoutApiService.prototype.setStopNs = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.getConfig().then(function () { return _this.httpClient
                .post(_this.http + '/api/v1/treatments', {
                enteredBy: _this.device,
                secret: _this.hash,
                duration: 15,
                created_at: new Date(),
                percent: -100,
                rate: 0.8,
                eventType: 'Temp Basal',
                timestamp: new Date()
            }).subscribe(resolve, reject); });
        });
    };
    NightscoutApiService.prototype.setStartNs = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.getConfig().then(function () { return _this.httpClient
                .post(_this.http + '/api/v1/treatments', {
                enteredBy: _this.device,
                secret: _this.hash,
                duration: 10,
                created_at: new Date(),
                percent: 0,
                rate: 0.8,
                eventType: 'Temp Basal',
                timestamp: new Date()
            }).subscribe(resolve, reject); });
        });
    };
    NightscoutApiService.prototype.setStartNsDs = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.getConfig().then(function () { return _this.httpClient
                .post(_this.http + '/api/v1/devicestatus', {
                device: _this.device,
                secret: _this.hash,
                created_at: new Date(),
                pump: {
                    status: { status: "POMPA URUCHOMIONA PONOWNIE" },
                }
            }).subscribe(resolve, reject); });
        });
    };
    NightscoutApiService.prototype.setStopNsDs = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.getConfig().then(function () { return _this.httpClient
                .post(_this.http + '/api/v1/devicestatus', {
                device: _this.device,
                secret: _this.hash,
                created_at: new Date(),
                pump: {
                    status: { status: "POMPA ZATRZYMANA" },
                }
            }).subscribe(resolve, reject); });
        });
    };
    NightscoutApiService.prototype.sendNewTempBasal = function (tempbasal) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (tempbasal.length >= 1) {
                _this.httpClient
                    .post(_this.http + '/api/v1/treatments', tempbasal.map(function (bol) { return ({
                    enteredBy: _this.device,
                    secret: _this.hash,
                    duration: bol.minutes,
                    created_at: bol.dateString,
                    percent: bol.percentsOfBasal,
                    rate: 0.7,
                    eventType: 'Temp Basal',
                    timestamp: new Date()
                }); })).subscribe(resolve, reject);
            }
            else {
                console.log("Brak TDP - OK");
                console.log("DLUGOSC API KOMUNIKATU:  " + tempbasal.length);
                resolve();
            }
        });
    };
    NightscoutApiService.prototype.sendNewDevicestatus = function (deviceStatus) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.getConfig().then(function () {
                return _this.httpClient
                    .post(_this.http + '/api/v1/devicestatus', deviceStatus.map(function (bol) { return ({
                    device: _this.device,
                    secret: _this.hash,
                    created_at: new Date(),
                    pump: {
                        clock: bol.dateString,
                        reservoir: bol.reservoir,
                        status: { status: bol.status, timestamp: 1557061755 },
                        extended: { version: '1.0', ActiveProfile: 'medlink' },
                        battery: { voltage: bol.voltage.toString().substring(0, 4) }
                    },
                    uploaderBattery: bol.percent
                }); })).subscribe(resolve, reject);
            });
        });
    };
    NightscoutApiService.prototype.BgCheck = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            console.log(_this.http);
            _this.httpClient
                .post('https://testowycgm.herokuapp.com/api/v1/treatments', {
                enteredBy: 'adam',
                secret: 'd6026bb45e7efd38de82680c75d31cf7f7a6a1e3',
                eventType: "BG Check",
                created_at: new Date(),
                glucose: '150',
                glucoseType: 'Finger',
                units: 'units: mg/dl'
            }).subscribe(resolve, reject);
        });
    };
    NightscoutApiService.prototype.BgCheck2 = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            console.log(_this.http);
            _this.httpClient
                .post('https://testowycgm.herokuapp.com/api/v1/treatments', {
                enteredBy: 'adam',
                secret: 'd6026bb45e7efd38de82680c75d31cf7f7a6a1e3',
                eventType: "BG Check",
                created_at: new Date(),
                glucose: '170',
                glucoseType: 'Finger',
                units: 'units: mg/dl'
            }).subscribe(resolve, reject);
        });
    };
    NightscoutApiService = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        }),
        __metadata("design:paramtypes", [http_1.HttpClient,
            database_service_1.DatabaseService])
    ], NightscoutApiService);
    return NightscoutApiService;
}());
exports.NightscoutApiService = NightscoutApiService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmlnaHRzY291dC1hcGkuc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5pZ2h0c2NvdXQtYXBpLnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSw2Q0FBcUU7QUFDckUsc0NBQTJDO0FBRTNDLDRDQUFxQztBQUlyQyxrRUFBZ0U7QUFNaEU7SUFRRSw4QkFBb0IsVUFBc0IsRUFDbEMsZUFBZ0M7UUFEcEIsZUFBVSxHQUFWLFVBQVUsQ0FBWTtRQUNsQyxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7UUFSeEMsc0RBQXNEO1FBQ3RELFdBQU0sR0FBRywwQ0FBMEMsQ0FBQztRQUNwRCxXQUFNLEdBQUcsVUFBVSxDQUFDO1FBQ3BCLGFBQVEsR0FBRyxRQUFRLENBQUM7UUFDcEIsU0FBSSxHQUFHLEVBQUUsQ0FBQztRQUNWLFNBQUksR0FBRyxFQUFFLENBQUM7SUFJVixDQUFDO0lBRUQsd0NBQVMsR0FBVDtRQUNFLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQ3ZDLGVBQUcsQ0FBQyxVQUFBLElBQUk7WUFDTixPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxDQUFDO2dCQUNwQixJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDVixNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNiLENBQUMsRUFIbUIsQ0FHbkIsQ0FBQyxDQUFDO1FBQ04sQ0FBQyxDQUFDLENBQ0gsQ0FBQztJQUNKLENBQUM7SUFFRCx3Q0FBUyxHQUFUO1FBQUEsaUJBWUM7UUFYQyxPQUFPLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFFLE1BQU07WUFDakMsS0FBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxVQUFBLENBQUM7Z0JBQzFCLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBQSxHQUFHO29CQUNQLEtBQUksQ0FBQyxJQUFJLEdBQUcsR0FB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ckIsVUFBVSxFQUFFLElBQUksSUFBSSxFQUFFO2dCQUN0QixPQUFPLEVBQUUsS0FBSztnQkFDZCxXQUFXLEVBQUUsUUFBUTtnQkFDckIsS0FBSyxFQUFFLGNBQWM7YUFDdEIsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDcEMsQ0FBQyxDQUFDLENBQUE7SUFBQSxDQUFDO0lBQ0wsdUNBQVEsR0FBUjtRQUFBLGlCQWVLO1FBZEgsT0FBTyxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBRSxNQUFNO1lBQ2pDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3ZCLEtBQUksQ0FBQyxVQUFVO2lCQUNaLElBQUksQ0FDSCxvREFBb0QsRUFDcEQ7Z0JBQ0UsU0FBUyxFQUFFLE1BQU07Z0JBQ2pCLE1BQU0sRUFBRSwwQ0FBMEM7Z0JBQ2xELFNBQVMsRUFBRSxVQUFVO2dCQUNyQixVQUFVLEVBQUUsSUFBSSxJQUFJLEVBQUU7Z0JBQ3RCLE9BQU8sRUFBRSxLQUFLO2dCQUNkLFdBQVcsRUFBRSxRQUFRO2dCQUNyQixLQUFLLEVBQUUsY0FBYzthQUN0QixDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNwQyxDQUFDLENBQUMsQ0FBQTtJQUFBLENBQUM7SUF2Tk0sb0JBQW9CO1FBSGhDLGlCQUFVLENBQUM7WUFDVixVQUFVLEVBQUUsTUFBTTtTQUNuQixDQUFDO3lDQVNnQyxpQkFBVTtZQUNqQixrQ0FBZTtPQVQ3QixvQkFBb0IsQ0F3TmhDO0lBQUQsMkJBQUM7Q0FBQSxBQXhORCxJQXdOQztBQXhOWSxvREFBb0IiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBIdHRwQ2xpZW50LCBIdHRwRXJyb3JSZXNwb25zZSB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbi9odHRwJztcclxuaW1wb3J0IHsgSW5qZWN0YWJsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcyc7XHJcbmltcG9ydCB7IG1hcCB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcclxuaW1wb3J0IHsga25vd25Gb2xkZXJzIH0gZnJvbSAndG5zLWNvcmUtbW9kdWxlcy9maWxlLXN5c3RlbSc7XHJcbmltcG9ydCB7IHJlc2V0UHJvZmlsZXMgfSBmcm9tICd0bnMtY29yZS1tb2R1bGVzL3Byb2ZpbGluZyc7XHJcbmltcG9ydCB7IG5pZ2h0U2NvdXRQYXRoIH0gZnJvbSAnfi9hcHAvZW52JztcclxuaW1wb3J0IHsgRGF0YWJhc2VTZXJ2aWNlIH0gZnJvbSAnfi9hcHAvc2hhcmVkL2RhdGFiYXNlLnNlcnZpY2UnO1xyXG5pbXBvcnQgdGVtcCA9IGtub3duRm9sZGVycy50ZW1wO1xyXG5cclxuQEluamVjdGFibGUoe1xyXG4gIHByb3ZpZGVkSW46ICdyb290J1xyXG59KVxyXG5leHBvcnQgY2xhc3MgTmlnaHRzY291dEFwaVNlcnZpY2Uge1xyXG4gIC8vc2VjcmV0ID0gJ2Q2MDI2YmI0NWU3ZWZkMzhkZTgyNjgwYzc1ZDMxY2Y3ZjdhNmExZTMnO1xyXG4gIHNlY3JldCA9ICcyNTg2MjhhNTVmMTM3MDU2OTczOGU3ZGE2ZDEzNWM2MWRjYWVhN2M5JztcclxuICBkZXZpY2UgPSAnTWVkLUxpbmsnO1xyXG4gIHRpbWV6b25lID0gJyswMjowMCc7XHJcbiAgaHR0cCA9ICcnO1xyXG4gIGhhc2ggPSAnJztcclxuXHJcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBodHRwQ2xpZW50OiBIdHRwQ2xpZW50LFxyXG4gIHByaXZhdGUgZGF0YWJhc2VTZXJ2aWNlOiBEYXRhYmFzZVNlcnZpY2UpIHtcclxuICB9XHJcblxyXG4gIGdldE5TRGF0YSgpOiBPYnNlcnZhYmxlPEFycmF5PHsgaHR0cDogc3RyaW5nOyBzZWNyZXQ6IHN0cmluZyB9Pj4ge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLk5TY29uZigpLnBpcGUoXHJcbiAgICAgIG1hcChyb3dzID0+IHtcclxuICAgICAgICByZXR1cm4gcm93cy5tYXAoYSA9PiAoe1xyXG4gICAgICAgICAgaHR0cDogYVswXSxcclxuICAgICAgICAgIHNlY3JldDogYVsxXVxyXG4gICAgICAgIH0pKTtcclxuICAgICAgfSlcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBnZXRDb25maWcoKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICB0aGlzLmdldE5TRGF0YSgpLnN1YnNjcmliZShnID0+IHtcclxuICAgICAgICBnLm1hcChib2wgPT4ge1xyXG4gICAgICAgICAgdGhpcy5odHRwID0gYm9sLmh0dHAudG9TdHJpbmcoKTtcclxuICAgICAgICAgIHRoaXMuaGFzaCA9IGJvbC5zZWNyZXQudG9TdHJpbmcoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIlRPIEpFU1QgQVBJIEkgU0VDUkVUIFogQkFaWSBhYWFhYWFhYXNzc3Nzc3NzXCIgKyB0aGlzLmh0dHAgKyB0aGlzLmhhc2gpO1xyXG4gICAgICAgIHJlc29sdmUoKSxcclxuICAgICAgICAgIHJlamVjdCgpO1xyXG4gICAgICB9KTtcclxuICAgICAgfSk7XHJcbiAgfVxyXG5cclxuICBzZW5kTmV3QkcoZ2x1Y29zZXM6IEFycmF5PHsgdmFsdWU6IG51bWJlcjsgZGF0ZTogRGF0ZTsgb2xkOiBzdHJpbmcgfT4pIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIGlmIChnbHVjb3Nlcy5sZW5ndGggPj0gMSkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiRExVR09TQyBBUEkgS09NVU5JS0FUVTogIFwiICsgZ2x1Y29zZXMubGVuZ3RoKTtcclxuICAgICAgICB0aGlzLmh0dHBDbGllbnRcclxuICAgICAgICAgIC5wb3N0KFxyXG4gICAgICAgICAgICB0aGlzLmh0dHAgKyAnL2FwaS92MS9lbnRyaWVzJyxcclxuICAgICAgICAgICAgZ2x1Y29zZXMubWFwKGdsdWNvc2UgPT4gKHtcclxuICAgICAgICAgICAgICBkZXZpY2U6IHRoaXMuZGV2aWNlLFxyXG4gICAgICAgICAgICAgIHNlY3JldDogdGhpcy5oYXNoLFxyXG4gICAgICAgICAgICAgIHNndjogZ2x1Y29zZS52YWx1ZSxcclxuICAgICAgICAgICAgICBkYXRlOiArZ2x1Y29zZS5kYXRlLFxyXG4gICAgICAgICAgICAgIGRpcmVjdGlvbjogZ2x1Y29zZS5vbGRcclxuICAgICAgICAgICAgfSkpKS5zdWJzY3JpYmUocmVzb2x2ZSwgcmVqZWN0KTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIkJyYWsgaW5mb3JtYWNqaSBvIGN1a3J6ZSBjdWtpZXIhIVwiKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIkRMVUdPU0MgQVBJIEtPTVVOSUtBVFU6ICBcIiArIGdsdWNvc2VzLmxlbmd0aCk7XHJcbiAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHNlbmROZXdCb2wodHJlYXRtZW50czogQXJyYXk8eyB2YWx1ZTogbnVtYmVyOyBkYXRlOiBEYXRlIH0+KSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICB0aGlzLmh0dHBDbGllbnRcclxuICAgICAgICAucG9zdChcclxuICAgICAgICAgIHRoaXMuaHR0cCArICcvYXBpL3YxL3RyZWF0bWVudHMnLFxyXG4gICAgICAgICAgdHJlYXRtZW50cy5tYXAoYm9sID0+ICh7XHJcbiAgICAgICAgICAgIGVudGVyZWRCeTogdGhpcy5kZXZpY2UsXHJcbiAgICAgICAgICAgIHNlY3JldDogdGhpcy5oYXNoLFxyXG4gICAgICAgICAgICBpbnN1bGluOiBib2wudmFsdWUsXHJcbiAgICAgICAgICAgIGNyZWF0ZWRfYXQ6IGJvbC5kYXRlXHJcbiAgICAgICAgICB9KSkpLnN1YnNjcmliZShyZXNvbHZlLCByZWplY3QpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG4gIGdldEJHZnJvbU5zKCkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdGhpcy5nZXRDb25maWcoKS50aGVuKCgpID0+IHRoaXMuaHR0cENsaWVudC5nZXQodGhpcy5odHRwICsgJy9hcGkvdjEvZW50cmllcy5qc29uP2NvdW50PTEnKS5zdWJzY3JpYmUocmVzb2x2ZSwgcmVqZWN0KSlcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgc2V0U3RvcE5zKCkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdGhpcy5nZXRDb25maWcoKS50aGVuKCgpID0+IHRoaXMuaHR0cENsaWVudFxyXG4gICAgICAgIC5wb3N0KHRoaXMuaHR0cCArICcvYXBpL3YxL3RyZWF0bWVudHMnLFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBlbnRlcmVkQnk6IHRoaXMuZGV2aWNlLFxyXG4gICAgICAgICAgICBzZWNyZXQ6IHRoaXMuaGFzaCxcclxuICAgICAgICAgICAgZHVyYXRpb246IDE1LFxyXG4gICAgICAgICAgICBjcmVhdGVkX2F0OiBuZXcgRGF0ZSgpLFxyXG4gICAgICAgICAgICBwZXJjZW50OiAtMTAwLFxyXG4gICAgICAgICAgICByYXRlOiAwLjgsXHJcbiAgICAgICAgICAgIGV2ZW50VHlwZTogJ1RlbXAgQmFzYWwnLFxyXG4gICAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKClcclxuICAgICAgICAgIH0pLnN1YnNjcmliZShyZXNvbHZlLCByZWplY3QpKVxyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHNldFN0YXJ0TnMoKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICB0aGlzLmdldENvbmZpZygpLnRoZW4oKCkgPT4gdGhpcy5odHRwQ2xpZW50XHJcbiAgICAgICAgLnBvc3QodGhpcy5odHRwICsgJy9hcGkvdjEvdHJlYXRtZW50cycsXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGVudGVyZWRCeTogdGhpcy5kZXZpY2UsXHJcbiAgICAgICAgICAgIHNlY3JldDogdGhpcy5oYXNoLFxyXG4gICAgICAgICAgICBkdXJhdGlvbjogMTAsXHJcbiAgICAgICAgICAgIGNyZWF0ZWRfYXQ6IG5ldyBEYXRlKCksXHJcbiAgICAgICAgICAgIHBlcmNlbnQ6IDAsXHJcbiAgICAgICAgICAgIHJhdGU6IDAuOCxcclxuICAgICAgICAgICAgZXZlbnRUeXBlOiAnVGVtcCBCYXNhbCcsXHJcbiAgICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKVxyXG4gICAgICAgICAgfSkuc3Vic2NyaWJlKHJlc29sdmUsIHJlamVjdCkpXHJcbiAgICB9KTtcclxuICB9XHJcbiAgc2V0U3RhcnROc0RzKCkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdGhpcy5nZXRDb25maWcoKS50aGVuKCgpID0+IHRoaXMuaHR0cENsaWVudFxyXG4gICAgICAgIC5wb3N0KHRoaXMuaHR0cCArICcvYXBpL3YxL2RldmljZXN0YXR1cycsXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGRldmljZTogdGhpcy5kZXZpY2UsXHJcbiAgICAgICAgICAgIHNlY3JldDogdGhpcy5oYXNoLFxyXG4gICAgICAgICAgICBjcmVhdGVkX2F0OiBuZXcgRGF0ZSgpLFxyXG4gICAgICAgICAgICBwdW1wOiB7XHJcbiAgICAgICAgICAgICAgc3RhdHVzOiB7IHN0YXR1czogXCJQT01QQSBVUlVDSE9NSU9OQSBQT05PV05JRVwiIH0sXHJcbiAgICAgICAgICB9fSkuc3Vic2NyaWJlKHJlc29sdmUsIHJlamVjdCkpXHJcbiAgICB9KTtcclxuICB9XHJcbiAgc2V0U3RvcE5zRHMoKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICB0aGlzLmdldENvbmZpZygpLnRoZW4oKCkgPT4gdGhpcy5odHRwQ2xpZW50XHJcbiAgICAgICAgLnBvc3QodGhpcy5odHRwICsgJy9hcGkvdjEvZGV2aWNlc3RhdHVzJyxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgZGV2aWNlOiB0aGlzLmRldmljZSxcclxuICAgICAgICAgICAgc2VjcmV0OiB0aGlzLmhhc2gsXHJcbiAgICAgICAgICAgIGNyZWF0ZWRfYXQ6IG5ldyBEYXRlKCksXHJcbiAgICAgICAgICAgIHB1bXA6IHtcclxuICAgICAgICAgICAgICBzdGF0dXM6IHsgc3RhdHVzOiBcIlBPTVBBIFpBVFJaWU1BTkFcIiB9LFxyXG4gICAgICAgICAgICB9fSkuc3Vic2NyaWJlKHJlc29sdmUsIHJlamVjdCkpXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHNlbmROZXdUZW1wQmFzYWwodGVtcGJhc2FsOiBBcnJheTx7IHBlcmNlbnRzT2ZCYXNhbDogbnVtYmVyOyBtaW51dGVzOiBudW1iZXI7IGRhdGVTdHJpbmc6IERhdGUgfT4pIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIGlmICh0ZW1wYmFzYWwubGVuZ3RoID49IDEpIHtcclxuICAgICAgdGhpcy5odHRwQ2xpZW50XHJcbiAgICAgICAgLnBvc3QoXHJcbiAgICAgICAgICB0aGlzLmh0dHAgKyAnL2FwaS92MS90cmVhdG1lbnRzJyxcclxuICAgICAgICAgIHRlbXBiYXNhbC5tYXAoYm9sID0+ICh7XHJcbiAgICAgICAgICAgIGVudGVyZWRCeTogdGhpcy5kZXZpY2UsXHJcbiAgICAgICAgICAgIHNlY3JldDogdGhpcy5oYXNoLFxyXG4gICAgICAgICAgICBkdXJhdGlvbjogYm9sLm1pbnV0ZXMsXHJcbiAgICAgICAgICAgIGNyZWF0ZWRfYXQ6IGJvbC5kYXRlU3RyaW5nLFxyXG4gICAgICAgICAgICBwZXJjZW50OiBib2wucGVyY2VudHNPZkJhc2FsLFxyXG4gICAgICAgICAgICByYXRlOiAwLjcsXHJcbiAgICAgICAgICAgIGV2ZW50VHlwZTogJ1RlbXAgQmFzYWwnLFxyXG4gICAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKClcclxuICAgICAgICAgIH0pKSkuc3Vic2NyaWJlKHJlc29sdmUsIHJlamVjdCk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJCcmFrIFREUCAtIE9LXCIpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiRExVR09TQyBBUEkgS09NVU5JS0FUVTogIFwiICsgdGVtcGJhc2FsLmxlbmd0aCk7XHJcbiAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHNlbmROZXdEZXZpY2VzdGF0dXMoZGV2aWNlU3RhdHVzOiBBcnJheTx7IHJlc2Vydm9pcjogbnVtYmVyOyB2b2x0YWdlOiBudW1iZXI7IGRhdGVTdHJpbmc6IERhdGU7IHBlcmNlbnQ6IG51bWJlcjsgc3RhdHVzOiBzdHJpbmcgfT4pIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSAoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICB0aGlzLmdldENvbmZpZygpLnRoZW4oKCkgPT5cclxuICAgIHRoaXMuaHR0cENsaWVudFxyXG4gICAgICAucG9zdChcclxuICAgICAgICB0aGlzLmh0dHAgKyAnL2FwaS92MS9kZXZpY2VzdGF0dXMnLFxyXG4gICAgICAgIGRldmljZVN0YXR1cy5tYXAoYm9sID0+ICh7XHJcbiAgICAgICAgICBkZXZpY2U6IHRoaXMuZGV2aWNlLFxyXG4gICAgICAgICAgc2VjcmV0OiB0aGlzLmhhc2gsXHJcbiAgICAgICAgICBjcmVhdGVkX2F0OiBuZXcgRGF0ZSgpLFxyXG4gICAgICAgICAgcHVtcDoge1xyXG4gICAgICAgICAgICBjbG9jazogYm9sLmRhdGVTdHJpbmcsXHJcbiAgICAgICAgICAgIHJlc2Vydm9pcjogYm9sLnJlc2Vydm9pcixcclxuICAgICAgICAgICAgc3RhdHVzOiB7IHN0YXR1czogYm9sLnN0YXR1cywgdGltZXN0YW1wOiAxNTU3MDYxNzU1IH0sXHJcbiAgICAgICAgICAgIGV4dGVuZGVkOiB7IHZlcnNpb246ICcxLjAnLCBBY3RpdmVQcm9maWxlOiAnbWVkbGluaycgfSxcclxuICAgICAgICAgICAgYmF0dGVyeTogeyB2b2x0YWdlOiBib2wudm9sdGFnZS50b1N0cmluZygpLnN1YnN0cmluZygwLCA0KSB9XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgdXBsb2FkZXJCYXR0ZXJ5OiBib2wucGVyY2VudFxyXG4gICAgICAgIH0pKSkuc3Vic2NyaWJlKHJlc29sdmUsIHJlamVjdCkpO1xyXG4gIH0pO1xyXG59XHJcbiAgQmdDaGVjaygpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIGNvbnNvbGUubG9nKHRoaXMuaHR0cCk7XHJcbiAgICAgIHRoaXMuaHR0cENsaWVudFxyXG4gICAgICAgIC5wb3N0KFxyXG4gICAgICAgICAgJ2h0dHBzOi8vdGVzdG93eWNnbS5oZXJva3VhcHAuY29tL2FwaS92MS90cmVhdG1lbnRzJyxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgZW50ZXJlZEJ5OiAnYWRhbScsXHJcbiAgICAgICAgICAgIHNlY3JldDogJ2Q2MDI2YmI0NWU3ZWZkMzhkZTgyNjgwYzc1ZDMxY2Y3ZjdhNmExZTMnLFxyXG4gICAgICAgICAgICBldmVudFR5cGU6IFwiQkcgQ2hlY2tcIixcclxuICAgICAgICAgICAgY3JlYXRlZF9hdDogbmV3IERhdGUoKSxcclxuICAgICAgICAgICAgZ2x1Y29zZTogJzE1MCcsXHJcbiAgICAgICAgICAgIGdsdWNvc2VUeXBlOiAnRmluZ2VyJyxcclxuICAgICAgICAgICAgdW5pdHM6ICd1bml0czogbWcvZGwnXHJcbiAgICAgICAgICB9KS5zdWJzY3JpYmUocmVzb2x2ZSwgcmVqZWN0KTtcclxuICAgIH0pfVxyXG4gIEJnQ2hlY2syKCkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgY29uc29sZS5sb2codGhpcy5odHRwKTtcclxuICAgICAgdGhpcy5odHRwQ2xpZW50XHJcbiAgICAgICAgLnBvc3QoXHJcbiAgICAgICAgICAnaHR0cHM6Ly90ZXN0b3d5Y2dtLmhlcm9rdWFwcC5jb20vYXBpL3YxL3RyZWF0bWVudHMnLFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBlbnRlcmVkQnk6ICdhZGFtJyxcclxuICAgICAgICAgICAgc2VjcmV0OiAnZDYwMjZiYjQ1ZTdlZmQzOGRlODI2ODBjNzVkMzFjZjdmN2E2YTFlMycsXHJcbiAgICAgICAgICAgIGV2ZW50VHlwZTogXCJCRyBDaGVja1wiLFxyXG4gICAgICAgICAgICBjcmVhdGVkX2F0OiBuZXcgRGF0ZSgpLFxyXG4gICAgICAgICAgICBnbHVjb3NlOiAnMTcwJyxcclxuICAgICAgICAgICAgZ2x1Y29zZVR5cGU6ICdGaW5nZXInLFxyXG4gICAgICAgICAgICB1bml0czogJ3VuaXRzOiBtZy9kbCdcclxuICAgICAgICAgIH0pLnN1YnNjcmliZShyZXNvbHZlLCByZWplY3QpO1xyXG4gICAgfSl9XHJcbn1cclxuXHJcbiJdfQ==
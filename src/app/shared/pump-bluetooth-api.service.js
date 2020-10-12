"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var rxjs_1 = require("rxjs");
var reduce_1 = require("rxjs/internal/operators/reduce");
var bluetooth = require("nativescript-bluetooth");
var database_service_1 = require("~/app/shared/database.service");
var Thread = java.lang.Thread;
var PumpBluetoothApiService = /** @class */ (function () {
    function PumpBluetoothApiService(databaseService) {
        this.databaseService = databaseService;
        this.targetBluDeviceUUID2 = [];
    }
    PumpBluetoothApiService.prototype.enable = function () {
        return new Promise(function (resolve, reject) {
            var adapter = android.bluetooth.BluetoothAdapter;
            if (!adapter.getDefaultAdapter().isEnabled().valueOf()) {
                adapter.getDefaultAdapter().enable();
                resolve();
            }
            else {
                console.log('toottooto');
                resolve();
            }
        });
    };
    PumpBluetoothApiService.prototype.scanAndConnect2 = function () {
        var _this = this;
        return new rxjs_1.Observable(function (observer) {
            _this.targetBluDeviceUUID2 = [];
            _this.enable().then(function () {
                var adapter2 = android.bluetooth.BluetoothAdapter;
                var step;
                for (step = 0; !(adapter2.getDefaultAdapter().isEnabled().valueOf() && step < 8); step++) {
                    console.log("i jesze raz" + step + adapter2.getDefaultAdapter().isEnabled().valueOf());
                    Thread.sleep(300);
                }
                //bluetooth.enable().then(() =>
                bluetooth
                    .startScanning({
                    onDiscovered: function (peripheral) {
                        console.log(peripheral.name + peripheral.UUID + "C");
                        observer.next(peripheral.name + peripheral.UUID);
                        if (peripheral.name === 'MED-LINK' || peripheral.name === 'MED-LINK-2' || peripheral.name === 'MED-LINK-3' || peripheral.name === 'HMSoft') {
                            _this.targetBluDeviceUUID2.push(peripheral.name + ' ,' + peripheral.UUID);
                            _this.targetBluDeviceUUID = peripheral.UUID.toString();
                            console.log("UIID: " + _this.targetBluDeviceUUID);
                        }
                    },
                    skipPermissionCheck: true,
                    seconds: 2
                }).then(function () { return observer.complete(); }), function () { return _this.enable(); };
            });
        }).pipe(reduce_1.reduce(function (acc, val) { return acc + val; }));
    };
    PumpBluetoothApiService.prototype.unsubscribeAll = function () {
        console.log("unsubscribeAll launchListenerCB:");
    };
    PumpBluetoothApiService.prototype.scanAndConnect = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.enable().then(function () {
                var adapter2 = android.bluetooth.BluetoothAdapter;
                var step;
                for (step = 0; !(adapter2.getDefaultAdapter().isEnabled().valueOf() && step < 8); step++) {
                    Thread.sleep(300);
                }
                _this.databaseService.getMAC().then(function (a) {
                    _this.targetBluDeviceUUID = a.toString();
                    bluetooth.connect({
                        UUID: _this.targetBluDeviceUUID,
                        onConnected: function (peripheral) {
                            console.log('Połączono' + peripheral.UUID + ' ' + peripheral.name);
                            resolve(peripheral.name);
                        },
                        onDisconnected: function (peripheral) {
                            peripheral.name = 'ZONK';
                            console.log('Rozłączono' + peripheral.name + peripheral.UUID);
                            reject(peripheral.name);
                            _this.unsubscribeAll();
                        }
                    });
                });
            });
        });
    };
    PumpBluetoothApiService.prototype.sendCommand = function (command) {
        var buffer = [];
        console.log('bede wysylal komunikat');
        //traceModule.write( "AAAAAAAAAAAAAAa  YYYYYunhandled-error", traceModule.categories.Debug, 2);
        for (var _i = 0, command_1 = command; _i < command_1.length; _i++) {
            var char = command_1[_i];
            var charCode = char.charCodeAt(0);
            buffer.push(charCode);
        }
        if (buffer.length) {
            this.recursiveWrite(buffer);
            console.log('udalo sie chyba to wsykacccc komunikat');
        }
    };
    PumpBluetoothApiService.prototype.sendCommand2 = function (command) {
        var buffer = [];
        console.log('prawdziwe ssss');
        for (var _i = 0, command_2 = command; _i < command_2.length; _i++) {
            var char = command_2[_i];
            var charCode = char.charCodeAt(0);
            buffer.push(charCode);
            if (charCode === 0x0a /*LF*/) {
                buffer.push(0x0d /*CR*/);
            }
        }
        if (buffer.length) {
            this.recursiveWrite(buffer);
        }
    };
    PumpBluetoothApiService.prototype.sendCommand3 = function (command) {
        var buffer = [];
        console.log('prawdziwe ssss');
        for (var _i = 0, command_3 = command; _i < command_3.length; _i++) {
            var char = command_3[_i];
            var charCode = char.charCodeAt(0);
            buffer.push(charCode);
            console.log("aaatotootototo:" + buffer);
        }
        if (buffer.length) {
            buffer.push(0x0d /*CR*/);
            buffer.push(0x0a /*LF*/);
            this.recursiveWrite(buffer);
        }
    };
    PumpBluetoothApiService.prototype.recursiveWrite = function (array, startByte, chunkLength) {
        var _this = this;
        if (startByte === void 0) { startByte = 0; }
        if (chunkLength === void 0) { chunkLength = 20; }
        var nextByte = startByte + chunkLength;
        bluetooth
            .writeWithoutResponse({
            peripheralUUID: this.targetBluDeviceUUID,
            characteristicUUID: 'ffe1',
            serviceUUID: 'ffe0',
            value: new Uint8Array(array.slice(startByte, nextByte))
        })
            .then(function () {
            if (nextByte < array.length) {
                _this.recursiveWrite(array, nextByte);
            }
        });
    };
    PumpBluetoothApiService.prototype.disconnect = function () {
        bluetooth.disconnect({ UUID: this.targetBluDeviceUUID });
    };
    PumpBluetoothApiService.prototype.read = function () {
        var _this = this;
        return new rxjs_1.Observable(function (observer) {
            bluetooth.startNotifying({
                onNotify: function (_a) {
                    var value = _a.value;
                    var result = new Uint8Array(value).reduce(function (o, byte) { return (o += String.fromCharCode(byte)); }, '');
                    observer.next(result);
                    console.log(result);
                    if (result.includes('rea') || result.includes('komunikacji')) {
                        observer.complete();
                    }
                },
                peripheralUUID: _this.targetBluDeviceUUID,
                characteristicUUID: 'ffe1',
                serviceUUID: 'ffe0'
            });
        }).pipe(reduce_1.reduce(function (acc, val) { return acc + val; }));
    };
    PumpBluetoothApiService.prototype.read2 = function () {
        var _this = this;
        return new rxjs_1.Observable(function (observer) {
            bluetooth.startNotifying({
                onNotify: function (_a) {
                    var value = _a.value;
                    var result = new Uint8Array(value).reduce(function (o, byte) { return (o += String.fromCharCode(byte)); }, '');
                    observer.next(result);
                    console.log(result);
                    if (result.includes('EomEomEo') || result.includes('Podaj numer') || result.includes('Test O') || result.includes('Podaj imie') || result.includes('KASUJ')) {
                        observer.complete();
                    }
                },
                peripheralUUID: _this.targetBluDeviceUUID,
                characteristicUUID: 'ffe1',
                serviceUUID: 'ffe0',
            });
        }).pipe(reduce_1.reduce(function (acc, val) { return acc + val; }));
    };
    PumpBluetoothApiService.prototype.read3 = function () {
        var _this = this;
        return new rxjs_1.Observable(function (observer) {
            bluetooth.startNotifying({
                onNotify: function (_a) {
                    var value = _a.value;
                    var result = new Uint8Array(value).reduce(function (o, byte) { return (o += String.fromCharCode(byte)); }, '');
                    observer.next(result);
                    console.log(result);
                    if (result.includes('zatrzyman') || result.includes('uruchomion') || result.includes('ustaw')) {
                        observer.complete();
                    }
                },
                peripheralUUID: _this.targetBluDeviceUUID,
                characteristicUUID: 'ffe1',
                serviceUUID: 'ffe0'
            });
        }).pipe(reduce_1.reduce(function (acc, val) { return acc + val; }));
    };
    PumpBluetoothApiService.prototype.read4 = function () {
        var _this = this;
        return new rxjs_1.Observable(function (observer) {
            bluetooth.startNotifying({
                onNotify: function (_a) {
                    var value = _a.value;
                    var result = new Uint8Array(value).reduce(function (o, byte) { return (o += String.fromCharCode(byte)); }, '');
                    observer.next(result);
                    console.log(result);
                    if (result.includes('uruchomion')) {
                        observer.complete();
                    }
                },
                peripheralUUID: _this.targetBluDeviceUUID,
                characteristicUUID: 'ffe1',
                serviceUUID: 'ffe0'
            });
        }).pipe(reduce_1.reduce(function (acc, val) { return acc + val; }));
    };
    PumpBluetoothApiService.prototype.read5 = function () {
        var _this = this;
        return new rxjs_1.Observable(function (observer) {
            bluetooth.startNotifying({
                onNotify: function (_a) {
                    var value = _a.value;
                    var result = new Uint8Array(value).reduce(function (o, byte) { return (o += String.fromCharCode(byte)); }, '');
                    observer.next(result);
                    console.log(result);
                    if (result.includes('zatrzyman') || result.includes('ready')) {
                        observer.complete();
                    }
                },
                peripheralUUID: _this.targetBluDeviceUUID,
                characteristicUUID: 'ffe1',
                serviceUUID: 'ffe0'
            });
        }).pipe(reduce_1.reduce(function (acc, val) { return acc + val; }));
    };
    PumpBluetoothApiService.prototype.read6 = function () {
        var _this = this;
        return new rxjs_1.Observable(function (observer) {
            bluetooth.startNotifying({
                onNotify: function (_a) {
                    var value = _a.value;
                    var result = new Uint8Array(value).reduce(function (o, byte) { return (o += String.fromCharCode(byte)); }, '');
                    observer.next(result);
                    console.log(result);
                    if (result.includes('rea')) {
                        observer.complete();
                    }
                },
                peripheralUUID: _this.targetBluDeviceUUID,
                characteristicUUID: 'ffe1',
                serviceUUID: 'ffe0'
            });
        }).pipe(reduce_1.reduce(function (acc, val) { return acc + val; }));
    };
    PumpBluetoothApiService = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        }),
        __metadata("design:paramtypes", [database_service_1.DatabaseService])
    ], PumpBluetoothApiService);
    return PumpBluetoothApiService;
}());
exports.PumpBluetoothApiService = PumpBluetoothApiService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVtcC1ibHVldG9vdGgtYXBpLnNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwdW1wLWJsdWV0b290aC1hcGkuc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNDQUE4RDtBQUU5RCw2QkFBa0M7QUFDbEMseURBQXdEO0FBQ3hELGtEQUFvRDtBQUVwRCxrRUFBZ0U7QUFJaEUsSUFBTyxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7QUFLakM7SUFJRSxpQ0FDVSxlQUFnQztRQUFoQyxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7UUFIMUMseUJBQW9CLEdBQUcsRUFBRSxDQUFDO0lBSzFCLENBQUM7SUFFRCx3Q0FBTSxHQUFOO1FBQ0UsT0FBTyxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBRSxNQUFNO1lBQ2pDLElBQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUM7WUFDbkQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDLE9BQU8sRUFBRSxFQUFFO2dCQUV0RCxPQUFPLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDckMsT0FBTyxFQUFFLENBQUM7YUFDWDtpQkFDSTtnQkFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUN6QixPQUFPLEVBQUUsQ0FBQzthQUNYO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBQ0QsaURBQWUsR0FBZjtRQUFBLGlCQTZCQztRQTVCQyxPQUFPLElBQUksaUJBQVUsQ0FBUyxVQUFBLFFBQVE7WUFDcEMsS0FBSSxDQUFDLG9CQUFvQixHQUFHLEVBQUUsQ0FBQztZQUMvQixLQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDO2dCQUNqQixJQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLGdCQUFn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dG9yUmVmLCBJbmplY3RhYmxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCB7IFBlcmlwaGVyYWwgfSBmcm9tICduYXRpdmVzY3JpcHQtYmx1ZXRvb3RoJztcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMnO1xyXG5pbXBvcnQgeyByZWR1Y2UgfSBmcm9tICdyeGpzL2ludGVybmFsL29wZXJhdG9ycy9yZWR1Y2UnO1xyXG5pbXBvcnQgKiBhcyBibHVldG9vdGggZnJvbSAnbmF0aXZlc2NyaXB0LWJsdWV0b290aCc7XHJcbmltcG9ydCB7IERhdGFGYWNhZGVTZXJ2aWNlIH0gZnJvbSAnfi9hcHAvc2hhcmVkL2RhdGEtZmFjYWRlLnNlcnZpY2UnO1xyXG5pbXBvcnQgeyBEYXRhYmFzZVNlcnZpY2UgfSBmcm9tICd+L2FwcC9zaGFyZWQvZGF0YWJhc2Uuc2VydmljZSc7XHJcbmltcG9ydCB7IEZvcmVncm91bmRGYWNhZGVTZXJ2aWNlIH0gZnJvbSAnfi9hcHAvc2hhcmVkL2ZvcmVncm91bmQtZmFjYWRlLnNlcnZpY2UnO1xyXG5pbXBvcnQgeyBSYXdEYXRhU2VydmljZSB9IGZyb20gJ34vYXBwL3NoYXJlZC9yYXctZGF0YS1wYXJzZS5zZXJ2aWNlJztcclxuaW1wb3J0ICogYXMgdHJhY2VNb2R1bGUgZnJvbSBcInRucy1jb3JlLW1vZHVsZXMvdHJhY2VcIlxyXG5pbXBvcnQgVGhyZWFkID0gamF2YS5sYW5nLlRocmVhZDtcclxuXHJcbkBJbmplY3RhYmxlKHtcclxuICBwcm92aWRlZEluOiAncm9vdCdcclxufSlcclxuZXhwb3J0IGNsYXNzIFB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlIHtcclxuICB0YXJnZXRCbHVEZXZpY2VVVUlEOiBzdHJpbmc7XHJcbiAgdGFyZ2V0Qmx1RGV2aWNlVVVJRDIgPSBbXTtcclxuXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBwcml2YXRlIGRhdGFiYXNlU2VydmljZTogRGF0YWJhc2VTZXJ2aWNlXHJcbiAgKSB7XHJcbiAgfVxyXG5cclxuICBlbmFibGUoKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICBjb25zdCBhZGFwdGVyID0gYW5kcm9pZC5ibHVldG9vdGguQmx1ZXRvb3RoQWRhcHRlcjtcclxuICAgICAgaWYgKCFhZGFwdGVyLmdldERlZmF1bHRBZGFwdGVyKCkuaXNFbmFibGVkKCkudmFsdWVPZigpKSB7XHJcblxyXG4gICAgICAgIGFkYXB0ZXIuZ2V0RGVmYXVsdEFkYXB0ZXIoKS5lbmFibGUoKTtcclxuICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ3Rvb3R0b290bycpO1xyXG4gICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHNjYW5BbmRDb25uZWN0MigpIHtcclxuICAgIHJldHVybiBuZXcgT2JzZXJ2YWJsZTxzdHJpbmc+KG9ic2VydmVyID0+IHtcclxuICAgICAgdGhpcy50YXJnZXRCbHVEZXZpY2VVVUlEMiA9IFtdO1xyXG4gICAgICB0aGlzLmVuYWJsZSgpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGFkYXB0ZXIyID0gYW5kcm9pZC5ibHVldG9vdGguQmx1ZXRvb3RoQWRhcHRlcjtcclxuICAgICAgICBsZXQgc3RlcDtcclxuICAgICAgICBmb3IgKHN0ZXAgPSAwIDsgIShhZGFwdGVyMi5nZXREZWZhdWx0QWRhcHRlcigpLmlzRW5hYmxlZCgpLnZhbHVlT2YoKSAmJiBzdGVwIDwgOCk7IHN0ZXArKykge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJpIGplc3plIHJhelwiICsgc3RlcCArIGFkYXB0ZXIyLmdldERlZmF1bHRBZGFwdGVyKCkuaXNFbmFibGVkKCkudmFsdWVPZigpKTtcclxuICAgICAgICAgIFRocmVhZC5zbGVlcCgzMDApO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAvL2JsdWV0b290aC5lbmFibGUoKS50aGVuKCgpID0+XHJcbiAgICAgIGJsdWV0b290aFxyXG4gICAgICAgIC5zdGFydFNjYW5uaW5nKHtcclxuICAgICAgICAgIG9uRGlzY292ZXJlZDogKHBlcmlwaGVyYWw6IFBlcmlwaGVyYWwpID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cocGVyaXBoZXJhbC5uYW1lICsgcGVyaXBoZXJhbC5VVUlEICsgXCJDXCIpO1xyXG4gICAgICAgICAgICBvYnNlcnZlci5uZXh0KHBlcmlwaGVyYWwubmFtZSArIHBlcmlwaGVyYWwuVVVJRCk7XHJcbiAgICAgICAgICAgIGlmIChwZXJpcGhlcmFsLm5hbWUgPT09ICdNRUQtTElOSycgfHwgcGVyaXBoZXJhbC5uYW1lID09PSAnTUVELUxJTkstMicgfHwgcGVyaXBoZXJhbC5uYW1lID09PSAnTUVELUxJTkstMycgfHwgcGVyaXBoZXJhbC5uYW1lID09PSAnSE1Tb2Z0Jykge1xyXG4gICAgICAgICAgICAgIHRoaXMudGFyZ2V0Qmx1RGV2aWNlVVVJRDIucHVzaChwZXJpcGhlcmFsLm5hbWUgKyAnICwnICsgcGVyaXBoZXJhbC5VVUlEKTtcclxuICAgICAgICAgICAgICB0aGlzLnRhcmdldEJsdURldmljZVVVSUQgPSBwZXJpcGhlcmFsLlVVSUQudG9TdHJpbmcoKTtcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlVJSUQ6IFwiICsgdGhpcy50YXJnZXRCbHVEZXZpY2VVVUlEKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLFxyXG4gICAgICAgICAgc2tpcFBlcm1pc3Npb25DaGVjazogdHJ1ZSxcclxuICAgICAgICAgIHNlY29uZHM6IDJcclxuICAgICAgICB9KS50aGVuKCgpID0+IG9ic2VydmVyLmNvbXBsZXRlKCkpLCAoKSA9PiB0aGlzLmVuYWJsZSgpfSk7XHJcbiAgICB9KS5waXBlKHJlZHVjZSgoYWNjLCB2YWwpID0+IGFjYyArIHZhbCkpO1xyXG4gIH1cclxuICBwcml2YXRlIHVuc3Vic2NyaWJlQWxsKCk6IHZvaWQge1xyXG4gICAgY29uc29sZS5sb2coXCJ1bnN1YnNjcmliZUFsbCBsYXVuY2hMaXN0ZW5lckNCOlwiKTtcclxuICB9XHJcblxyXG4gIHNjYW5BbmRDb25uZWN0KCkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdGhpcy5lbmFibGUoKS50aGVuKCgpID0+IHtcclxuICAgICAgICBjb25zdCBhZGFwdGVyMiA9IGFuZHJvaWQuYmx1ZXRvb3RoLkJsdWV0b290aEFkYXB0ZXI7XHJcbiAgICAgICAgbGV0IHN0ZXA7XHJcbiAgICAgICAgZm9yIChzdGVwID0gMCA7ICEoYWRhcHRlcjIuZ2V0RGVmYXVsdEFkYXB0ZXIoKS5pc0VuYWJsZWQoKS52YWx1ZU9mKCkgJiYgc3RlcCA8IDgpOyBzdGVwKyspIHtcclxuICAgICAgICAgIFRocmVhZC5zbGVlcCgzMDApO1xyXG4gICAgICAgIH1cclxuICAgICAgdGhpcy5kYXRhYmFzZVNlcnZpY2UuZ2V0TUFDKCkudGhlbihhID0+XHJcbiAgICAgIHtcclxuICAgICAgICB0aGlzLnRhcmdldEJsdURldmljZVVVSUQgPSBhLnRvU3RyaW5nKCk7XHJcblxyXG4gICAgICBibHVldG9vdGguY29ubmVjdCh7XHJcbiAgICAgICAgVVVJRDogdGhpcy50YXJnZXRCbHVEZXZpY2VVVUlELFxyXG4gICAgICAgIG9uQ29ubmVjdGVkOiAocGVyaXBoZXJhbDogUGVyaXBoZXJhbCkgPT4ge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coJ1BvxYLEhWN6b25vJyArIHBlcmlwaGVyYWwuVVVJRCArICcgJyArIHBlcmlwaGVyYWwubmFtZSk7XHJcbiAgICAgICAgICByZXNvbHZlKHBlcmlwaGVyYWwubmFtZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvbkRpc2Nvbm5lY3RlZDogKHBlcmlwaGVyYWw6IFBlcmlwaGVyYWwpID0+IHtcclxuICAgICAgICAgIHBlcmlwaGVyYWwubmFtZSA9ICdaT05LJztcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCdSb3rFgsSFY3pvbm8nICsgcGVyaXBoZXJhbC5uYW1lICsgcGVyaXBoZXJhbC5VVUlEKTtcclxuICAgICAgICAgIHJlamVjdChwZXJpcGhlcmFsLm5hbWUpO1xyXG4gICAgICAgICAgdGhpcy51bnN1YnNjcmliZUFsbCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9KX0pO1xyXG4gICAgfSk7XHJcbiAgICB9XHJcbiAgc2VuZENvbW1hbmQoY29tbWFuZCkge1xyXG4gICAgY29uc3QgYnVmZmVyID0gW107XHJcbiAgICBjb25zb2xlLmxvZygnYmVkZSB3eXN5bGFsIGtvbXVuaWthdCcpO1xyXG4gICAgLy90cmFjZU1vZHVsZS53cml0ZSggXCJBQUFBQUFBQUFBQUFBQWEgIFlZWVlZdW5oYW5kbGVkLWVycm9yXCIsIHRyYWNlTW9kdWxlLmNhdGVnb3JpZXMuRGVidWcsIDIpO1xyXG4gICAgZm9yIChjb25zdCBjaGFyIG9mIGNvbW1hbmQpIHtcclxuICAgICAgY29uc3QgY2hhckNvZGUgPSBjaGFyLmNoYXJDb2RlQXQoMCk7XHJcbiAgICAgIGJ1ZmZlci5wdXNoKGNoYXJDb2RlKTtcclxuICAgIH1cclxuICAgIGlmIChidWZmZXIubGVuZ3RoKSB7XHJcbiAgICAgIHRoaXMucmVjdXJzaXZlV3JpdGUoYnVmZmVyKTtcclxuICAgICAgY29uc29sZS5sb2coJ3VkYWxvIHNpZSBjaHliYSB0byB3c3lrYWNjY2Mga29tdW5pa2F0Jyk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHNlbmRDb21tYW5kMihjb21tYW5kKSB7XHJcbiAgICBjb25zdCBidWZmZXIgPSBbXTtcclxuICAgIGNvbnNvbGUubG9nKCdwcmF3ZHppd2Ugc3NzcycpO1xyXG4gICAgZm9yIChjb25zdCBjaGFyIG9mIGNvbW1hbmQpIHtcclxuICAgICAgY29uc3QgY2hhckNvZGUgPSBjaGFyLmNoYXJDb2RlQXQoMCk7XHJcbiAgICAgIGJ1ZmZlci5wdXNoKGNoYXJDb2RlKTtcclxuICAgICAgaWYgKGNoYXJDb2RlID09PSAweDBhIC8qTEYqLykge1xyXG4gICAgICAgIGJ1ZmZlci5wdXNoKDB4MGQgLypDUiovKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKGJ1ZmZlci5sZW5ndGgpIHtcclxuICAgICAgdGhpcy5yZWN1cnNpdmVXcml0ZShidWZmZXIpO1xyXG4gICAgfVxyXG4gIH1cclxuICBzZW5kQ29tbWFuZDMoY29tbWFuZCkge1xyXG4gICAgY29uc3QgYnVmZmVyID0gW107XHJcbiAgICBjb25zb2xlLmxvZygncHJhd2R6aXdlIHNzc3MnKTtcclxuICAgIGZvciAoY29uc3QgY2hhciBvZiBjb21tYW5kKSB7XHJcbiAgICAgIGNvbnN0IGNoYXJDb2RlID0gY2hhci5jaGFyQ29kZUF0KDApO1xyXG4gICAgICBidWZmZXIucHVzaChjaGFyQ29kZSk7XHJcblxyXG5cclxuICAgICAgY29uc29sZS5sb2coXCJhYWF0b3Rvb3RvdG90bzpcIiAgKyBidWZmZXIgKTtcclxuICAgIH1cclxuICAgIGlmIChidWZmZXIubGVuZ3RoKSB7XHJcbiAgICAgIGJ1ZmZlci5wdXNoKDB4MGQgLypDUiovKTtcclxuICAgICAgYnVmZmVyLnB1c2goMHgwYSAvKkxGKi8pO1xyXG4gICAgICB0aGlzLnJlY3Vyc2l2ZVdyaXRlKGJ1ZmZlcik7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuXHJcbiAgcHJpdmF0ZSByZWN1cnNpdmVXcml0ZShcclxuICAgIGFycmF5OiBBcnJheTxudW1iZXI+LFxyXG4gICAgc3RhcnRCeXRlID0gMCxcclxuICAgIGNodW5rTGVuZ3RoID0gMjBcclxuICApIHtcclxuICAgIGNvbnN0IG5leHRCeXRlID0gc3RhcnRCeXRlICsgY2h1bmtMZW5ndGg7XHJcbiAgICBibHVldG9vdGhcclxuICAgICAgLndyaXRlV2l0aG91dFJlc3BvbnNlKHtcclxuICAgICAgICBwZXJpcGhlcmFsVVVJRDogdGhpcy50YXJnZXRCbHVEZXZpY2VVVUlELFxyXG4gICAgICAgIGNoYXJhY3RlcmlzdGljVVVJRDogJ2ZmZTEnLFxyXG4gICAgICAgIHNlcnZpY2VVVUlEOiAnZmZlMCcsXHJcbiAgICAgICAgdmFsdWU6IG5ldyBVaW50OEFycmF5KGFycmF5LnNsaWNlKHN0YXJ0Qnl0ZSwgbmV4dEJ5dGUpKVxyXG4gICAgICB9KVxyXG4gICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgaWYgKG5leHRCeXRlIDwgYXJyYXkubGVuZ3RoKSB7XHJcbiAgICAgICAgICB0aGlzLnJlY3Vyc2l2ZVdyaXRlKGFycmF5LCBuZXh0Qnl0ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICB9XHJcblxyXG4gIGRpc2Nvbm5lY3QoKSB7XHJcbiAgICBibHVldG9vdGguZGlzY29ubmVjdCh7VVVJRDogdGhpcy50YXJnZXRCbHVEZXZpY2VVVUlEfSk7XHJcbiAgfVxyXG5cclxuICByZWFkKCkge1xyXG4gICAgcmV0dXJuIG5ldyBPYnNlcnZhYmxlPHN0cmluZz4ob2JzZXJ2ZXIgPT4ge1xyXG4gICAgICBibHVldG9vdGguc3RhcnROb3RpZnlpbmcoe1xyXG4gICAgICAgIG9uTm90aWZ5OiAoeyB2YWx1ZSB9KSA9PiB7XHJcbiAgICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgVWludDhBcnJheSh2YWx1ZSkucmVkdWNlKFxyXG4gICAgICAgICAgICAobywgYnl0ZSkgPT4gKG8gKz0gU3RyaW5nLmZyb21DaGFyQ29kZShieXRlKSksXHJcbiAgICAgICAgICAgICcnXHJcbiAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgIG9ic2VydmVyLm5leHQocmVzdWx0KTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3VsdCk7XHJcbiAgICAgICAgICBpZiAocmVzdWx0LmluY2x1ZGVzKCdyZWEnKSB8fCByZXN1bHQuaW5jbHVkZXMoJ2tvbXVuaWthY2ppJykpIHtcclxuICAgICAgICAgICAgb2JzZXJ2ZXIuY29tcGxldGUoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHBlcmlwaGVyYWxVVUlEOiB0aGlzLnRhcmdldEJsdURldmljZVVVSUQsXHJcbiAgICAgICAgY2hhcmFjdGVyaXN0aWNVVUlEOiAnZmZlMScsXHJcbiAgICAgICAgc2VydmljZVVVSUQ6ICdmZmUwJ1xyXG4gICAgICB9KTtcclxuICAgIH0pLnBpcGUocmVkdWNlKChhY2MsIHZhbCkgPT4gYWNjICsgdmFsKSk7XHJcbiAgfVxyXG4gIHJlYWQyKCkge1xyXG4gICAgcmV0dXJuIG5ldyBPYnNlcnZhYmxlPHN0cmluZz4ob2JzZXJ2ZXIgPT4ge1xyXG4gICAgICBibHVldG9vdGguc3RhcnROb3RpZnlpbmcoe1xyXG4gICAgICAgIG9uTm90aWZ5OiAoeyB2YWx1ZSB9KSA9PiB7XHJcbiAgICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgVWludDhBcnJheSh2YWx1ZSkucmVkdWNlKFxyXG4gICAgICAgICAgICAgIChvLCBieXRlKSA9PiAobyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGUpKSxcclxuICAgICAgICAgICAgICAnJ1xyXG4gICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICBvYnNlcnZlci5uZXh0KHJlc3VsdCk7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhyZXN1bHQpO1xyXG4gICAgICAgICAgaWYgKHJlc3VsdC5pbmNsdWRlcygnRW9tRW9tRW8nKSB8fCByZXN1bHQuaW5jbHVkZXMoJ1BvZGFqIG51bWVyJykgfHwgIHJlc3VsdC5pbmNsdWRlcygnVGVzdCBPJykgfHwgIHJlc3VsdC5pbmNsdWRlcygnUG9kYWogaW1pZScpIHx8IHJlc3VsdC5pbmNsdWRlcygnS0FTVUonKSkge1xyXG4gICAgICAgICAgICBvYnNlcnZlci5jb21wbGV0ZSgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcGVyaXBoZXJhbFVVSUQ6IHRoaXMudGFyZ2V0Qmx1RGV2aWNlVVVJRCxcclxuICAgICAgICBjaGFyYWN0ZXJpc3RpY1VVSUQ6ICdmZmUxJyxcclxuICAgICAgICBzZXJ2aWNlVVVJRDogJ2ZmZTAnLFxyXG4gICAgICB9KTtcclxuICAgIH0pLnBpcGUocmVkdWNlKChhY2MsIHZhbCkgPT4gYWNjICsgdmFsKSk7XHJcbiAgfVxyXG4gIHJlYWQzKCkge1xyXG4gICAgcmV0dXJuIG5ldyBPYnNlcnZhYmxlPHN0cmluZz4ob2JzZXJ2ZXIgPT4ge1xyXG4gICAgICBibHVldG9vdGguc3RhcnROb3RpZnlpbmcoe1xyXG4gICAgICAgIG9uTm90aWZ5OiAoeyB2YWx1ZSB9KSA9PiB7XHJcbiAgICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgVWludDhBcnJheSh2YWx1ZSkucmVkdWNlKFxyXG4gICAgICAgICAgICAobywgYnl0ZSkgPT4gKG8gKz0gU3RyaW5nLmZyb21DaGFyQ29kZShieXRlKSksXHJcbiAgICAgICAgICAgICcnXHJcbiAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgIG9ic2VydmVyLm5leHQocmVzdWx0KTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3VsdCk7XHJcbiAgICAgICAgICBpZiAocmVzdWx0LmluY2x1ZGVzKCd6YXRyenltYW4nKSB8fCByZXN1bHQuaW5jbHVkZXMoJ3VydWNob21pb24nKSB8fCByZXN1bHQuaW5jbHVkZXMoJ3VzdGF3JykpIHtcclxuICAgICAgICAgICAgb2JzZXJ2ZXIuY29tcGxldGUoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHBlcmlwaGVyYWxVVUlEOiB0aGlzLnRhcmdldEJsdURldmljZVVVSUQsXHJcbiAgICAgICAgY2hhcmFjdGVyaXN0aWNVVUlEOiAnZmZlMScsXHJcbiAgICAgICAgc2VydmljZVVVSUQ6ICdmZmUwJ1xyXG4gICAgICB9KTtcclxuICAgIH0pLnBpcGUocmVkdWNlKChhY2MsIHZhbCkgPT4gYWNjICsgdmFsKSk7XHJcbiAgfVxyXG4gIHJlYWQ0KCkge1xyXG4gICAgcmV0dXJuIG5ldyBPYnNlcnZhYmxlPHN0cmluZz4ob2JzZXJ2ZXIgPT4ge1xyXG4gICAgICBibHVldG9vdGguc3RhcnROb3RpZnlpbmcoe1xyXG4gICAgICAgIG9uTm90aWZ5OiAoeyB2YWx1ZSB9KSA9PiB7XHJcbiAgICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgVWludDhBcnJheSh2YWx1ZSkucmVkdWNlKFxyXG4gICAgICAgICAgICAobywgYnl0ZSkgPT4gKG8gKz0gU3RyaW5nLmZyb21DaGFyQ29kZShieXRlKSksXHJcbiAgICAgICAgICAgICcnXHJcbiAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgIG9ic2VydmVyLm5leHQocmVzdWx0KTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3VsdCk7XHJcbiAgICAgICAgICBpZiAocmVzdWx0LmluY2x1ZGVzKCd1cnVjaG9taW9uJykpIHtcclxuICAgICAgICAgICAgb2JzZXJ2ZXIuY29tcGxldGUoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHBlcmlwaGVyYWxVVUlEOiB0aGlzLnRhcmdldEJsdURldmljZVVVSUQsXHJcbiAgICAgICAgY2hhcmFjdGVyaXN0aWNVVUlEOiAnZmZlMScsXHJcbiAgICAgICAgc2VydmljZVVVSUQ6ICdmZmUwJ1xyXG4gICAgICB9KTtcclxuICAgIH0pLnBpcGUocmVkdWNlKChhY2MsIHZhbCkgPT4gYWNjICsgdmFsKSk7XHJcbiAgfVxyXG4gIHJlYWQ1KCkge1xyXG4gICAgcmV0dXJuIG5ldyBPYnNlcnZhYmxlPHN0cmluZz4ob2JzZXJ2ZXIgPT4ge1xyXG4gICAgICBibHVldG9vdGguc3RhcnROb3RpZnlpbmcoe1xyXG4gICAgICAgIG9uTm90aWZ5OiAoeyB2YWx1ZSB9KSA9PiB7XHJcbiAgICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgVWludDhBcnJheSh2YWx1ZSkucmVkdWNlKFxyXG4gICAgICAgICAgICAobywgYnl0ZSkgPT4gKG8gKz0gU3RyaW5nLmZyb21DaGFyQ29kZShieXRlKSksXHJcbiAgICAgICAgICAgICcnXHJcbiAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgIG9ic2VydmVyLm5leHQocmVzdWx0KTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3VsdCk7XHJcbiAgICAgICAgICBpZiAocmVzdWx0LmluY2x1ZGVzKCd6YXRyenltYW4nKSB8fCByZXN1bHQuaW5jbHVkZXMoJ3JlYWR5JykpIHtcclxuICAgICAgICAgICAgb2JzZXJ2ZXIuY29tcGxldGUoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHBlcmlwaGVyYWxVVUlEOiB0aGlzLnRhcmdldEJsdURldmljZVVVSUQsXHJcbiAgICAgICAgY2hhcmFjdGVyaXN0aWNVVUlEOiAnZmZlMScsXHJcbiAgICAgICAgc2VydmljZVVVSUQ6ICdmZmUwJ1xyXG4gICAgICB9KTtcclxuICAgIH0pLnBpcGUocmVkdWNlKChhY2MsIHZhbCkgPT4gYWNjICsgdmFsKSk7XHJcbiAgfVxyXG4gIHJlYWQ2KCkge1xyXG4gICAgcmV0dXJuIG5ldyBPYnNlcnZhYmxlPHN0cmluZz4ob2JzZXJ2ZXIgPT4ge1xyXG4gICAgICBibHVldG9vdGguc3RhcnROb3RpZnlpbmcoe1xyXG4gICAgICAgIG9uTm90aWZ5OiAoeyB2YWx1ZSB9KSA9PiB7XHJcbiAgICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgVWludDhBcnJheSh2YWx1ZSkucmVkdWNlKFxyXG4gICAgICAgICAgICAobywgYnl0ZSkgPT4gKG8gKz0gU3RyaW5nLmZyb21DaGFyQ29kZShieXRlKSksXHJcbiAgICAgICAgICAgICcnXHJcbiAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgIG9ic2VydmVyLm5leHQocmVzdWx0KTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3VsdCk7XHJcbiAgICAgICAgICBpZiAocmVzdWx0LmluY2x1ZGVzKCdyZWEnKSkge1xyXG4gICAgICAgICAgICBvYnNlcnZlci5jb21wbGV0ZSgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcGVyaXBoZXJhbFVVSUQ6IHRoaXMudGFyZ2V0Qmx1RGV2aWNlVVVJRCxcclxuICAgICAgICBjaGFyYWN0ZXJpc3RpY1VVSUQ6ICdmZmUxJyxcclxuICAgICAgICBzZXJ2aWNlVVVJRDogJ2ZmZTAnXHJcbiAgICAgIH0pO1xyXG4gICAgfSkucGlwZShyZWR1Y2UoKGFjYywgdmFsKSA9PiBhY2MgKyB2YWwpKTtcclxuICB9XHJcbn1cclxuIl19
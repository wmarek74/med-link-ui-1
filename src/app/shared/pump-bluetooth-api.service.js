"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var rxjs_1 = require("rxjs");
var reduce_1 = require("rxjs/internal/operators/reduce");
var bluetooth = require("nativescript-bluetooth");
var appSettings = require("tns-core-modules/application-settings");
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
                            appSettings.setBoolean("btBoolean", true);
                        },
                        onDisconnected: function (peripheral) {
                            //peripheral.name = 'ZONK';
                            console.log('Rozłączono' + peripheral.name + peripheral.UUID);
                            reject(peripheral.name);
                            appSettings.setBoolean("btBoolean", false);
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
    PumpBluetoothApiService.prototype.sendCommand4 = function (command) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var buffer = [];
            console.log('bede wysylal komunikat');
            //traceModule.write( "AAAAAAAAAAAAAAa  YYYYYunhandled-error", traceModule.categories.Debug, 2);
            for (var _i = 0, command_2 = command; _i < command_2.length; _i++) {
                var char = command_2[_i];
                var charCode = char.charCodeAt(0);
                buffer.push(charCode);
            }
            if (buffer.length) {
                _this.recursiveWrite(buffer);
                console.log('udalo sie chyba to wsykacccc komunikat');
                resolve();
            }
        });
    };
    PumpBluetoothApiService.prototype.sendCommand2 = function (command) {
        var buffer = [];
        console.log('prawdziwe ssss');
        for (var _i = 0, command_3 = command; _i < command_3.length; _i++) {
            var char = command_3[_i];
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
        for (var _i = 0, command_4 = command; _i < command_4.length; _i++) {
            var char = command_4[_i];
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
    PumpBluetoothApiService.prototype.read7 = function () {
        var _this = this;
        return new rxjs_1.Observable(function (observer) {
            bluetooth.startNotifying({
                onNotify: function (_a) {
                    var value = _a.value;
                    var result = new Uint8Array(value).reduce(function (o, byte) { return (o += String.fromCharCode(byte)); }, '');
                    console.log(result);
                    if (result.includes('CONN')) {
                        observer.next(result);
                    }
                    if (result.includes('rea')) {
                        console.log('HAHAHAHH MAMY TOOOO');
                        observer.complete();
                    }
                },
                peripheralUUID: _this.targetBluDeviceUUID,
                characteristicUUID: 'ffe1',
                serviceUUID: 'ffe0'
            }).then(function () { return console.log('Przyszło OK'); }, function () { return console.log('Error OBSLUGA!!!'); });
        });
    };
    PumpBluetoothApiService.prototype.stopNotify = function () {
        console.log('bede wywalal NOTUIFUYYYYYYY');
        Thread.sleep(7500);
        bluetooth.stopNotifying({
            peripheralUUID: this.targetBluDeviceUUID,
            characteristicUUID: 'ffe1',
            serviceUUID: 'ffe0'
        }).then(function () {
            console.log("unsubscribed for notifications");
        }, function (err) {
            console.log("unsubscribe error: " + err);
        });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVtcC1ibHVldG9vdGgtYXBpLnNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwdW1wLWJsdWV0b290aC1hcGkuc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNDQUE4RDtBQUU5RCw2QkFBa0M7QUFDbEMseURBQXdEO0FBQ3hELGtEQUFvRDtBQUNwRCxtRUFBcUU7QUFFckUsa0VBQWdFO0FBSWhFLElBQU8sTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO0FBS2pDO0lBSUUsaUNBQ1UsZUFBZ0M7UUFBaEMsb0JBQWUsR0FBZixlQUFlLENBQWlCO1FBSDFDLHlCQUFvQixHQUFHLEVBQUUsQ0FBQztJQUsxQixDQUFDO0lBRUQsd0NBQU0sR0FBTjtRQUNFLE9BQU8sSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTTtZQUNqQyxJQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDO1lBQ25ELElBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxPQUFPLEVBQUUsRUFBRTtnQkFFdEQsT0FBTyxDQUFDLGlCQUFpQixFQUFFLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3JDLE9BQU8sRUFBRSxDQUFDO2FBQ1g7aUJBQ0k7Z0JBQ0gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDekIsT0FBTyxFQUFFLENBQUM7YUFDWDtRQUNILENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUNELGlEQUFlLEdBQWY7UUFBQSxpQkE2QkM7UUE1QkMsT0FBTyxJQUFJLGlCQUFVLENBQVMsVUFBQSxRQUFRO1lBQ3BDLEtBQUksQ0FBQyxvQkFBb0IsR0FBRyxFQUFFLENBQUM7WUFDL0IsS0FBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQztnQkFDakIsSUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLFNB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b3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDaGFuZ2VEZXRlY3RvclJlZiwgSW5qZWN0YWJsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQgeyBQZXJpcGhlcmFsIH0gZnJvbSAnbmF0aXZlc2NyaXB0LWJsdWV0b290aCc7XHJcbmltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tICdyeGpzJztcclxuaW1wb3J0IHsgcmVkdWNlIH0gZnJvbSAncnhqcy9pbnRlcm5hbC9vcGVyYXRvcnMvcmVkdWNlJztcclxuaW1wb3J0ICogYXMgYmx1ZXRvb3RoIGZyb20gJ25hdGl2ZXNjcmlwdC1ibHVldG9vdGgnO1xyXG5pbXBvcnQgKiBhcyBhcHBTZXR0aW5ncyBmcm9tICd0bnMtY29yZS1tb2R1bGVzL2FwcGxpY2F0aW9uLXNldHRpbmdzJztcclxuaW1wb3J0IHsgRGF0YUZhY2FkZVNlcnZpY2UgfSBmcm9tICd+L2FwcC9zaGFyZWQvZGF0YS1mYWNhZGUuc2VydmljZSc7XHJcbmltcG9ydCB7IERhdGFiYXNlU2VydmljZSB9IGZyb20gJ34vYXBwL3NoYXJlZC9kYXRhYmFzZS5zZXJ2aWNlJztcclxuaW1wb3J0IHsgRm9yZWdyb3VuZEZhY2FkZVNlcnZpY2UgfSBmcm9tICd+L2FwcC9zaGFyZWQvZm9yZWdyb3VuZC1mYWNhZGUuc2VydmljZSc7XHJcbmltcG9ydCB7IFJhd0RhdGFTZXJ2aWNlIH0gZnJvbSAnfi9hcHAvc2hhcmVkL3Jhdy1kYXRhLXBhcnNlLnNlcnZpY2UnO1xyXG5pbXBvcnQgKiBhcyB0cmFjZU1vZHVsZSBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy90cmFjZVwiXHJcbmltcG9ydCBUaHJlYWQgPSBqYXZhLmxhbmcuVGhyZWFkO1xyXG5cclxuQEluamVjdGFibGUoe1xyXG4gIHByb3ZpZGVkSW46ICdyb290J1xyXG59KVxyXG5leHBvcnQgY2xhc3MgUHVtcEJsdWV0b290aEFwaVNlcnZpY2Uge1xyXG4gIHRhcmdldEJsdURldmljZVVVSUQ6IHN0cmluZztcclxuICB0YXJnZXRCbHVEZXZpY2VVVUlEMiA9IFtdO1xyXG5cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIHByaXZhdGUgZGF0YWJhc2VTZXJ2aWNlOiBEYXRhYmFzZVNlcnZpY2VcclxuICApIHtcclxuICB9XHJcblxyXG4gIGVuYWJsZSgpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIGNvbnN0IGFkYXB0ZXIgPSBhbmRyb2lkLmJsdWV0b290aC5CbHVldG9vdGhBZGFwdGVyO1xyXG4gICAgICBpZiAoIWFkYXB0ZXIuZ2V0RGVmYXVsdEFkYXB0ZXIoKS5pc0VuYWJsZWQoKS52YWx1ZU9mKCkpIHtcclxuXHJcbiAgICAgICAgYWRhcHRlci5nZXREZWZhdWx0QWRhcHRlcigpLmVuYWJsZSgpO1xyXG4gICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBjb25zb2xlLmxvZygndG9vdHRvb3RvJyk7XHJcbiAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcbiAgc2NhbkFuZENvbm5lY3QyKCkge1xyXG4gICAgcmV0dXJuIG5ldyBPYnNlcnZhYmxlPHN0cmluZz4ob2JzZXJ2ZXIgPT4ge1xyXG4gICAgICB0aGlzLnRhcmdldEJsdURldmljZVVVSUQyID0gW107XHJcbiAgICAgIHRoaXMuZW5hYmxlKCkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgY29uc3QgYWRhcHRlcjIgPSBhbmRyb2lkLmJsdWV0b290aC5CbHVldG9vdGhBZGFwdGVyO1xyXG4gICAgICAgIGxldCBzdGVwO1xyXG4gICAgICAgIGZvciAoc3RlcCA9IDAgOyAhKGFkYXB0ZXIyLmdldERlZmF1bHRBZGFwdGVyKCkuaXNFbmFibGVkKCkudmFsdWVPZigpICYmIHN0ZXAgPCA4KTsgc3RlcCsrKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcImkgamVzemUgcmF6XCIgKyBzdGVwICsgYWRhcHRlcjIuZ2V0RGVmYXVsdEFkYXB0ZXIoKS5pc0VuYWJsZWQoKS52YWx1ZU9mKCkpO1xyXG4gICAgICAgICAgVGhyZWFkLnNsZWVwKDMwMCk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIC8vYmx1ZXRvb3RoLmVuYWJsZSgpLnRoZW4oKCkgPT5cclxuICAgICAgYmx1ZXRvb3RoXHJcbiAgICAgICAgLnN0YXJ0U2Nhbm5pbmcoe1xyXG4gICAgICAgICAgb25EaXNjb3ZlcmVkOiAocGVyaXBoZXJhbDogUGVyaXBoZXJhbCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhwZXJpcGhlcmFsLm5hbWUgKyBwZXJpcGhlcmFsLlVVSUQgKyBcIkNcIik7XHJcbiAgICAgICAgICAgIG9ic2VydmVyLm5leHQocGVyaXBoZXJhbC5uYW1lICsgcGVyaXBoZXJhbC5VVUlEKTtcclxuICAgICAgICAgICAgaWYgKHBlcmlwaGVyYWwubmFtZSA9PT0gJ01FRC1MSU5LJyB8fCBwZXJpcGhlcmFsLm5hbWUgPT09ICdNRUQtTElOSy0yJyB8fCBwZXJpcGhlcmFsLm5hbWUgPT09ICdNRUQtTElOSy0zJyB8fCBwZXJpcGhlcmFsLm5hbWUgPT09ICdITVNvZnQnKSB7XHJcbiAgICAgICAgICAgICAgdGhpcy50YXJnZXRCbHVEZXZpY2VVVUlEMi5wdXNoKHBlcmlwaGVyYWwubmFtZSArICcgLCcgKyBwZXJpcGhlcmFsLlVVSUQpO1xyXG4gICAgICAgICAgICAgIHRoaXMudGFyZ2V0Qmx1RGV2aWNlVVVJRCA9IHBlcmlwaGVyYWwuVVVJRC50b1N0cmluZygpO1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVUlJRDogXCIgKyB0aGlzLnRhcmdldEJsdURldmljZVVVSUQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAsXHJcbiAgICAgICAgICBza2lwUGVybWlzc2lvbkNoZWNrOiB0cnVlLFxyXG4gICAgICAgICAgc2Vjb25kczogMlxyXG4gICAgICAgIH0pLnRoZW4oKCkgPT4gb2JzZXJ2ZXIuY29tcGxldGUoKSksICgpID0+IHRoaXMuZW5hYmxlKCl9KTtcclxuICAgIH0pLnBpcGUocmVkdWNlKChhY2MsIHZhbCkgPT4gYWNjICsgdmFsKSk7XHJcbiAgfVxyXG4gIHByaXZhdGUgdW5zdWJzY3JpYmVBbGwoKTogdm9pZCB7XHJcbiAgICBjb25zb2xlLmxvZyhcInVuc3Vic2NyaWJlQWxsIGxhdW5jaExpc3RlbmVyQ0I6XCIpO1xyXG4gIH1cclxuXHJcbiAgc2NhbkFuZENvbm5lY3QoKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICB0aGlzLmVuYWJsZSgpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGFkYXB0ZXIyID0gYW5kcm9pZC5ibHVldG9vdGguQmx1ZXRvb3RoQWRhcHRlcjtcclxuICAgICAgICBsZXQgc3RlcDtcclxuICAgICAgICBmb3IgKHN0ZXAgPSAwIDsgIShhZGFwdGVyMi5nZXREZWZhdWx0QWRhcHRlcigpLmlzRW5hYmxlZCgpLnZhbHVlT2YoKSAmJiBzdGVwIDwgOCk7IHN0ZXArKykge1xyXG4gICAgICAgICAgVGhyZWFkLnNsZWVwKDMwMCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB0aGlzLmRhdGFiYXNlU2VydmljZS5nZXRNQUMoKS50aGVuKGEgPT5cclxuICAgICAge1xyXG4gICAgICAgIHRoaXMudGFyZ2V0Qmx1RGV2aWNlVVVJRCA9IGEudG9TdHJpbmcoKTtcclxuXHJcbiAgICAgIGJsdWV0b290aC5jb25uZWN0KHtcclxuICAgICAgICBVVUlEOiB0aGlzLnRhcmdldEJsdURldmljZVVVSUQsXHJcbiAgICAgICAgb25Db25uZWN0ZWQ6IChwZXJpcGhlcmFsOiBQZXJpcGhlcmFsKSA9PiB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZygnUG/FgsSFY3pvbm8nICsgcGVyaXBoZXJhbC5VVUlEICsgJyAnICsgcGVyaXBoZXJhbC5uYW1lKTtcclxuICAgICAgICAgIHJlc29sdmUocGVyaXBoZXJhbC5uYW1lKTtcclxuICAgICAgICAgIGFwcFNldHRpbmdzLnNldEJvb2xlYW4oXCJidEJvb2xlYW5cIiwgdHJ1ZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvbkRpc2Nvbm5lY3RlZDogKHBlcmlwaGVyYWw6IFBlcmlwaGVyYWwpID0+IHtcclxuICAgICAgICAgIC8vcGVyaXBoZXJhbC5uYW1lID0gJ1pPTksnO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coJ1JvesWCxIVjem9ubycgKyBwZXJpcGhlcmFsLm5hbWUgKyBwZXJpcGhlcmFsLlVVSUQpO1xyXG4gICAgICAgICAgcmVqZWN0KHBlcmlwaGVyYWwubmFtZSk7XHJcbiAgICAgICAgICBhcHBTZXR0aW5ncy5zZXRCb29sZWFuKFwiYnRCb29sZWFuXCIsIGZhbHNlKTtcclxuXHJcbiAgICAgICAgICB0aGlzLnVuc3Vic2NyaWJlQWxsKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH0pfSk7XHJcbiAgICB9KTtcclxuICAgIH1cclxuICBzZW5kQ29tbWFuZChjb21tYW5kKSB7XHJcbiAgICBjb25zdCBidWZmZXIgPSBbXTtcclxuICAgIGNvbnNvbGUubG9nKCdiZWRlIHd5c3lsYWwga29tdW5pa2F0Jyk7XHJcbiAgICAvL3RyYWNlTW9kdWxlLndyaXRlKCBcIkFBQUFBQUFBQUFBQUFBYSAgWVlZWVl1bmhhbmRsZWQtZXJyb3JcIiwgdHJhY2VNb2R1bGUuY2F0ZWdvcmllcy5EZWJ1ZywgMik7XHJcbiAgICBmb3IgKGNvbnN0IGNoYXIgb2YgY29tbWFuZCkge1xyXG4gICAgICBjb25zdCBjaGFyQ29kZSA9IGNoYXIuY2hhckNvZGVBdCgwKTtcclxuICAgICAgYnVmZmVyLnB1c2goY2hhckNvZGUpO1xyXG4gICAgfVxyXG4gICAgaWYgKGJ1ZmZlci5sZW5ndGgpIHtcclxuICAgICAgdGhpcy5yZWN1cnNpdmVXcml0ZShidWZmZXIpO1xyXG4gICAgICBjb25zb2xlLmxvZygndWRhbG8gc2llIGNoeWJhIHRvIHdzeWthY2NjYyBrb211bmlrYXQnKTtcclxuICAgIH1cclxuICB9XHJcbiAgc2VuZENvbW1hbmQ0KGNvbW1hbmQpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIGNvbnN0IGJ1ZmZlciA9IFtdO1xyXG4gICAgICBjb25zb2xlLmxvZygnYmVkZSB3eXN5bGFsIGtvbXVuaWthdCcpO1xyXG4gICAgICAvL3RyYWNlTW9kdWxlLndyaXRlKCBcIkFBQUFBQUFBQUFBQUFBYSAgWVlZWVl1bmhhbmRsZWQtZXJyb3JcIiwgdHJhY2VNb2R1bGUuY2F0ZWdvcmllcy5EZWJ1ZywgMik7XHJcbiAgICAgIGZvciAoY29uc3QgY2hhciBvZiBjb21tYW5kKSB7XHJcbiAgICAgICAgY29uc3QgY2hhckNvZGUgPSBjaGFyLmNoYXJDb2RlQXQoMCk7XHJcbiAgICAgICAgYnVmZmVyLnB1c2goY2hhckNvZGUpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChidWZmZXIubGVuZ3RoKSB7XHJcbiAgICAgICAgdGhpcy5yZWN1cnNpdmVXcml0ZShidWZmZXIpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCd1ZGFsbyBzaWUgY2h5YmEgdG8gd3N5a2FjY2NjIGtvbXVuaWthdCcpO1xyXG4gICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgfVxyXG4gICAgfSlcclxuICB9XHJcbiAgc2VuZENvbW1hbmQyKGNvbW1hbmQpIHtcclxuICAgIGNvbnN0IGJ1ZmZlciA9IFtdO1xyXG4gICAgY29uc29sZS5sb2coJ3ByYXdkeml3ZSBzc3NzJyk7XHJcbiAgICBmb3IgKGNvbnN0IGNoYXIgb2YgY29tbWFuZCkge1xyXG4gICAgICBjb25zdCBjaGFyQ29kZSA9IGNoYXIuY2hhckNvZGVBdCgwKTtcclxuICAgICAgYnVmZmVyLnB1c2goY2hhckNvZGUpO1xyXG4gICAgICBpZiAoY2hhckNvZGUgPT09IDB4MGEgLypMRiovKSB7XHJcbiAgICAgICAgYnVmZmVyLnB1c2goMHgwZCAvKkNSKi8pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAoYnVmZmVyLmxlbmd0aCkge1xyXG4gICAgICB0aGlzLnJlY3Vyc2l2ZVdyaXRlKGJ1ZmZlcik7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHNlbmRDb21tYW5kMyhjb21tYW5kKSB7XHJcbiAgICBjb25zdCBidWZmZXIgPSBbXTtcclxuICAgIGNvbnNvbGUubG9nKCdwcmF3ZHppd2Ugc3NzcycpO1xyXG4gICAgZm9yIChjb25zdCBjaGFyIG9mIGNvbW1hbmQpIHtcclxuICAgICAgY29uc3QgY2hhckNvZGUgPSBjaGFyLmNoYXJDb2RlQXQoMCk7XHJcbiAgICAgIGJ1ZmZlci5wdXNoKGNoYXJDb2RlKTtcclxuXHJcblxyXG4gICAgICBjb25zb2xlLmxvZyhcImFhYXRvdG9vdG90b3RvOlwiICArIGJ1ZmZlciApO1xyXG4gICAgfVxyXG4gICAgaWYgKGJ1ZmZlci5sZW5ndGgpIHtcclxuICAgICAgYnVmZmVyLnB1c2goMHgwZCAvKkNSKi8pO1xyXG4gICAgICBidWZmZXIucHVzaCgweDBhIC8qTEYqLyk7XHJcbiAgICAgIHRoaXMucmVjdXJzaXZlV3JpdGUoYnVmZmVyKTtcclxuICAgIH1cclxuICB9XHJcblxyXG5cclxuICBwcml2YXRlIHJlY3Vyc2l2ZVdyaXRlKFxyXG4gICAgYXJyYXk6IEFycmF5PG51bWJlcj4sXHJcbiAgICBzdGFydEJ5dGUgPSAwLFxyXG4gICAgY2h1bmtMZW5ndGggPSAyMFxyXG4gICkge1xyXG4gICAgY29uc3QgbmV4dEJ5dGUgPSBzdGFydEJ5dGUgKyBjaHVua0xlbmd0aDtcclxuICAgIGJsdWV0b290aFxyXG4gICAgICAud3JpdGVXaXRob3V0UmVzcG9uc2Uoe1xyXG4gICAgICAgIHBlcmlwaGVyYWxVVUlEOiB0aGlzLnRhcmdldEJsdURldmljZVVVSUQsXHJcbiAgICAgICAgY2hhcmFjdGVyaXN0aWNVVUlEOiAnZmZlMScsXHJcbiAgICAgICAgc2VydmljZVVVSUQ6ICdmZmUwJyxcclxuICAgICAgICB2YWx1ZTogbmV3IFVpbnQ4QXJyYXkoYXJyYXkuc2xpY2Uoc3RhcnRCeXRlLCBuZXh0Qnl0ZSkpXHJcbiAgICAgIH0pXHJcbiAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICBpZiAobmV4dEJ5dGUgPCBhcnJheS5sZW5ndGgpIHtcclxuICAgICAgICAgIHRoaXMucmVjdXJzaXZlV3JpdGUoYXJyYXksIG5leHRCeXRlKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgZGlzY29ubmVjdCgpIHtcclxuICAgIGJsdWV0b290aC5kaXNjb25uZWN0KHtVVUlEOiB0aGlzLnRhcmdldEJsdURldmljZVVVSUR9KTtcclxuICB9XHJcblxyXG4gIHJlYWQoKSB7XHJcbiAgICByZXR1cm4gbmV3IE9ic2VydmFibGU8c3RyaW5nPihvYnNlcnZlciA9PiB7XHJcbiAgICAgIGJsdWV0b290aC5zdGFydE5vdGlmeWluZyh7XHJcbiAgICAgICAgb25Ob3RpZnk6ICh7IHZhbHVlIH0pID0+IHtcclxuICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBVaW50OEFycmF5KHZhbHVlKS5yZWR1Y2UoXHJcbiAgICAgICAgICAgIChvLCBieXRlKSA9PiAobyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGUpKSxcclxuICAgICAgICAgICAgJydcclxuICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgb2JzZXJ2ZXIubmV4dChyZXN1bHQpO1xyXG4gICAgICAgICAgY29uc29sZS5sb2cocmVzdWx0KTtcclxuICAgICAgICAgIGlmIChyZXN1bHQuaW5jbHVkZXMoJ3JlYScpIHx8IHJlc3VsdC5pbmNsdWRlcygna29tdW5pa2FjamknKSkge1xyXG4gICAgICAgICAgICBvYnNlcnZlci5jb21wbGV0ZSgpO1xyXG5cclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHBlcmlwaGVyYWxVVUlEOiB0aGlzLnRhcmdldEJsdURldmljZVVVSUQsXHJcbiAgICAgICAgY2hhcmFjdGVyaXN0aWNVVUlEOiAnZmZlMScsXHJcbiAgICAgICAgc2VydmljZVVVSUQ6ICdmZmUwJ1xyXG4gICAgICB9KTtcclxuICAgIH0pLnBpcGUocmVkdWNlKChhY2MsIHZhbCkgPT4gYWNjICsgdmFsKSk7XHJcbiAgfVxyXG4gIHJlYWQyKCkge1xyXG4gICAgcmV0dXJuIG5ldyBPYnNlcnZhYmxlPHN0cmluZz4ob2JzZXJ2ZXIgPT4ge1xyXG4gICAgICBibHVldG9vdGguc3RhcnROb3RpZnlpbmcoe1xyXG4gICAgICAgIG9uTm90aWZ5OiAoeyB2YWx1ZSB9KSA9PiB7XHJcbiAgICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgVWludDhBcnJheSh2YWx1ZSkucmVkdWNlKFxyXG4gICAgICAgICAgICAgIChvLCBieXRlKSA9PiAobyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGUpKSxcclxuICAgICAgICAgICAgICAnJ1xyXG4gICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICBvYnNlcnZlci5uZXh0KHJlc3VsdCk7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhyZXN1bHQpO1xyXG4gICAgICAgICAgaWYgKHJlc3VsdC5pbmNsdWRlcygnRW9tRW9tRW8nKSB8fCByZXN1bHQuaW5jbHVkZXMoJ1BvZGFqIG51bWVyJykgfHwgIHJlc3VsdC5pbmNsdWRlcygnVGVzdCBPJykgfHwgIHJlc3VsdC5pbmNsdWRlcygnUG9kYWogaW1pZScpIHx8IHJlc3VsdC5pbmNsdWRlcygnS0FTVUonKSkge1xyXG4gICAgICAgICAgICBvYnNlcnZlci5jb21wbGV0ZSgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcGVyaXBoZXJhbFVVSUQ6IHRoaXMudGFyZ2V0Qmx1RGV2aWNlVVVJRCxcclxuICAgICAgICBjaGFyYWN0ZXJpc3RpY1VVSUQ6ICdmZmUxJyxcclxuICAgICAgICBzZXJ2aWNlVVVJRDogJ2ZmZTAnLFxyXG4gICAgICB9KTtcclxuICAgIH0pLnBpcGUocmVkdWNlKChhY2MsIHZhbCkgPT4gYWNjICsgdmFsKSk7XHJcbiAgfVxyXG4gIHJlYWQzKCkge1xyXG4gICAgcmV0dXJuIG5ldyBPYnNlcnZhYmxlPHN0cmluZz4ob2JzZXJ2ZXIgPT4ge1xyXG4gICAgICBibHVldG9vdGguc3RhcnROb3RpZnlpbmcoe1xyXG4gICAgICAgIG9uTm90aWZ5OiAoeyB2YWx1ZSB9KSA9PiB7XHJcbiAgICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgVWludDhBcnJheSh2YWx1ZSkucmVkdWNlKFxyXG4gICAgICAgICAgICAobywgYnl0ZSkgPT4gKG8gKz0gU3RyaW5nLmZyb21DaGFyQ29kZShieXRlKSksXHJcbiAgICAgICAgICAgICcnXHJcbiAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgIG9ic2VydmVyLm5leHQocmVzdWx0KTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3VsdCk7XHJcbiAgICAgICAgICBpZiAocmVzdWx0LmluY2x1ZGVzKCd6YXRyenltYW4nKSB8fCByZXN1bHQuaW5jbHVkZXMoJ3VydWNob21pb24nKSB8fCByZXN1bHQuaW5jbHVkZXMoJ3VzdGF3JykpIHtcclxuICAgICAgICAgICAgb2JzZXJ2ZXIuY29tcGxldGUoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHBlcmlwaGVyYWxVVUlEOiB0aGlzLnRhcmdldEJsdURldmljZVVVSUQsXHJcbiAgICAgICAgY2hhcmFjdGVyaXN0aWNVVUlEOiAnZmZlMScsXHJcbiAgICAgICAgc2VydmljZVVVSUQ6ICdmZmUwJ1xyXG4gICAgICB9KTtcclxuICAgIH0pLnBpcGUocmVkdWNlKChhY2MsIHZhbCkgPT4gYWNjICsgdmFsKSk7XHJcbiAgfVxyXG4gIHJlYWQ0KCkge1xyXG4gICAgcmV0dXJuIG5ldyBPYnNlcnZhYmxlPHN0cmluZz4ob2JzZXJ2ZXIgPT4ge1xyXG4gICAgICBibHVldG9vdGguc3RhcnROb3RpZnlpbmcoe1xyXG4gICAgICAgIG9uTm90aWZ5OiAoeyB2YWx1ZSB9KSA9PiB7XHJcbiAgICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgVWludDhBcnJheSh2YWx1ZSkucmVkdWNlKFxyXG4gICAgICAgICAgICAobywgYnl0ZSkgPT4gKG8gKz0gU3RyaW5nLmZyb21DaGFyQ29kZShieXRlKSksXHJcbiAgICAgICAgICAgICcnXHJcbiAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgIG9ic2VydmVyLm5leHQocmVzdWx0KTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3VsdCk7XHJcbiAgICAgICAgICBpZiAocmVzdWx0LmluY2x1ZGVzKCd1cnVjaG9taW9uJykpIHtcclxuICAgICAgICAgICAgb2JzZXJ2ZXIuY29tcGxldGUoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHBlcmlwaGVyYWxVVUlEOiB0aGlzLnRhcmdldEJsdURldmljZVVVSUQsXHJcbiAgICAgICAgY2hhcmFjdGVyaXN0aWNVVUlEOiAnZmZlMScsXHJcbiAgICAgICAgc2VydmljZVVVSUQ6ICdmZmUwJ1xyXG4gICAgICB9KTtcclxuICAgIH0pLnBpcGUocmVkdWNlKChhY2MsIHZhbCkgPT4gYWNjICsgdmFsKSk7XHJcbiAgfVxyXG4gICByZWFkNygpIHtcclxuICAgIHJldHVybiBuZXcgT2JzZXJ2YWJsZTxzdHJpbmc+KG9ic2VydmVyID0+IHtcclxuICAgICAgYmx1ZXRvb3RoLnN0YXJ0Tm90aWZ5aW5nKHtcclxuICAgICAgICBvbk5vdGlmeTogKHsgdmFsdWUgfSkgPT4ge1xyXG4gICAgICAgICAgY29uc3QgcmVzdWx0ID0gbmV3IFVpbnQ4QXJyYXkodmFsdWUpLnJlZHVjZShcclxuICAgICAgICAgICAgKG8sIGJ5dGUpID0+IChvICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZSkpLFxyXG4gICAgICAgICAgICAnJ1xyXG4gICAgICAgICAgKTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3VsdCk7XHJcbiAgICAgICAgICBpZiAocmVzdWx0LmluY2x1ZGVzKCdDT05OJykpIHtcclxuICAgICAgICAgICAgb2JzZXJ2ZXIubmV4dChyZXN1bHQpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKHJlc3VsdC5pbmNsdWRlcygncmVhJykpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ0hBSEFIQUhIIE1BTVkgVE9PT08nKTtcclxuICAgICAgICAgICAgb2JzZXJ2ZXIuY29tcGxldGUoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHBlcmlwaGVyYWxVVUlEOiB0aGlzLnRhcmdldEJsdURldmljZVVVSUQsXHJcbiAgICAgICAgY2hhcmFjdGVyaXN0aWNVVUlEOiAnZmZlMScsXHJcbiAgICAgICAgc2VydmljZVVVSUQ6ICdmZmUwJ1xyXG4gICAgICB9KS50aGVuKCgpID0+IGNvbnNvbGUubG9nKCdQcnp5c3rFgm8gT0snKSwgKCkgPT4gY29uc29sZS5sb2coJ0Vycm9yIE9CU0xVR0EhISEnKSk7XHJcblxyXG4gICAgfSlcclxuICB9XHJcbiAgc3RvcE5vdGlmeSgpIHtcclxuXHJcbiAgICBjb25zb2xlLmxvZygnYmVkZSB3eXdhbGFsIE5PVFVJRlVZWVlZWVlZJyk7XHJcbiAgICBUaHJlYWQuc2xlZXAoNzUwMClcclxuICAgIGJsdWV0b290aC5zdG9wTm90aWZ5aW5nKHtcclxuICAgICAgICBwZXJpcGhlcmFsVVVJRDogdGhpcy50YXJnZXRCbHVEZXZpY2VVVUlELFxyXG4gICAgICAgIGNoYXJhY3RlcmlzdGljVVVJRDogJ2ZmZTEnLFxyXG4gICAgICAgIHNlcnZpY2VVVUlEOiAnZmZlMCdcclxuICAgIH0pLnRoZW4oZnVuY3Rpb24oKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwidW5zdWJzY3JpYmVkIGZvciBub3RpZmljYXRpb25zXCIpO1xyXG4gICAgfSwgZnVuY3Rpb24gKGVycikge1xyXG4gICAgICBjb25zb2xlLmxvZyhcInVuc3Vic2NyaWJlIGVycm9yOiBcIiArIGVycik7XHJcbiAgICB9KTtcclxuICB9XHJcbiAgcmVhZDUoKSB7XHJcbiAgICByZXR1cm4gbmV3IE9ic2VydmFibGU8c3RyaW5nPihvYnNlcnZlciA9PiB7XHJcbiAgICAgIGJsdWV0b290aC5zdGFydE5vdGlmeWluZyh7XHJcbiAgICAgICAgb25Ob3RpZnk6ICh7IHZhbHVlIH0pID0+IHtcclxuICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBVaW50OEFycmF5KHZhbHVlKS5yZWR1Y2UoXHJcbiAgICAgICAgICAgIChvLCBieXRlKSA9PiAobyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGUpKSxcclxuICAgICAgICAgICAgJydcclxuICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgb2JzZXJ2ZXIubmV4dChyZXN1bHQpO1xyXG4gICAgICAgICAgY29uc29sZS5sb2cocmVzdWx0KTtcclxuICAgICAgICAgIGlmIChyZXN1bHQuaW5jbHVkZXMoJ3phdHJ6eW1hbicpIHx8IHJlc3VsdC5pbmNsdWRlcygncmVhZHknKSkge1xyXG4gICAgICAgICAgICBvYnNlcnZlci5jb21wbGV0ZSgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcGVyaXBoZXJhbFVVSUQ6IHRoaXMudGFyZ2V0Qmx1RGV2aWNlVVVJRCxcclxuICAgICAgICBjaGFyYWN0ZXJpc3RpY1VVSUQ6ICdmZmUxJyxcclxuICAgICAgICBzZXJ2aWNlVVVJRDogJ2ZmZTAnXHJcbiAgICAgIH0pO1xyXG4gICAgfSkucGlwZShyZWR1Y2UoKGFjYywgdmFsKSA9PiBhY2MgKyB2YWwpKTtcclxuICB9XHJcbiAgcmVhZDYoKSB7XHJcbiAgICByZXR1cm4gbmV3IE9ic2VydmFibGU8c3RyaW5nPihvYnNlcnZlciA9PiB7XHJcbiAgICAgIGJsdWV0b290aC5zdGFydE5vdGlmeWluZyh7XHJcbiAgICAgICAgb25Ob3RpZnk6ICh7IHZhbHVlIH0pID0+IHtcclxuICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBVaW50OEFycmF5KHZhbHVlKS5yZWR1Y2UoXHJcbiAgICAgICAgICAgIChvLCBieXRlKSA9PiAobyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGUpKSxcclxuICAgICAgICAgICAgJydcclxuICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgb2JzZXJ2ZXIubmV4dChyZXN1bHQpO1xyXG4gICAgICAgICAgY29uc29sZS5sb2cocmVzdWx0KTtcclxuICAgICAgICAgIGlmIChyZXN1bHQuaW5jbHVkZXMoJ3JlYScpKSB7XHJcbiAgICAgICAgICAgIG9ic2VydmVyLmNvbXBsZXRlKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwZXJpcGhlcmFsVVVJRDogdGhpcy50YXJnZXRCbHVEZXZpY2VVVUlELFxyXG4gICAgICAgIGNoYXJhY3RlcmlzdGljVVVJRDogJ2ZmZTEnLFxyXG4gICAgICAgIHNlcnZpY2VVVUlEOiAnZmZlMCdcclxuICAgICAgfSk7XHJcbiAgICB9KS5waXBlKHJlZHVjZSgoYWNjLCB2YWwpID0+IGFjYyArIHZhbCkpO1xyXG4gIH1cclxufVxyXG4iXX0=
import {Peripheral} from 'react-native-ble-manager';
import promiseInterval from 'interval-promise';
import autoBind from 'auto-bind';
import {BlueveryCore, BlueveryCore as _BlueveryCore} from './blueveryCore';
import {BlueveryState as _BlueveryState} from './blueveryState';
import {BlueveryListeners as _BlueveryListeners} from './blueveryListeners';
import {
  BleManagerParams,
  BlueveryOptions,
  PeripheralInfo,
  Store,
  PublicHandlers,
  PublicListeners,
  BlueveryMethodOptions,
} from './interface';
import {applyOmoiyari, createBlueveryMethodOption} from './utils';
import {DEFAULT_OMOIYARI_TIME} from './constants';

type __ConstructorsAndInstances__ = {
  BlueveryCore: typeof _BlueveryCore;
  BlueveryState: typeof _BlueveryState;
  blueveryListeners: InstanceType<typeof _BlueveryListeners>;
  store: Store;
};
type ConstructorArgs = __ConstructorsAndInstances__;

export class Bluevery {
  private __constructorsAndInstances__: __ConstructorsAndInstances__;
  private __DO_NOT_DIRECT_USE_STORE__: Store;
  private core: _BlueveryCore | undefined;
  publicListeners: PublicListeners | undefined;

  constructor({
    BlueveryCore,
    BlueveryState,
    blueveryListeners,
    store,
  }: ConstructorArgs) {
    this.__constructorsAndInstances__ = {
      BlueveryCore,
      BlueveryState,
      blueveryListeners,
      store,
    };
    this.__DO_NOT_DIRECT_USE_STORE__ = store;

    autoBind(this);
  }

  private initialized: boolean = false;

  /**
   * ↓ Primitive APIs
   */

  checkIsInitialized(): boolean {
    return this.initialized;
  }

  /**;
   * Force stop Bluevery's operation completely.
   * TODO: more implements
   */
  stopBluevery() {
    this.core?.stop?.();
  }

  /**
   * ↓ Commands API
   */

  async init(blueveryOptions?: BlueveryOptions) {
    if (this.checkIsInitialized()) {
      return;
    }
    const {
      BlueveryCore,
      BlueveryState,
      blueveryListeners,
    } = this.__constructorsAndInstances__;
    this.core = new BlueveryCore({
      BlueveryState,
      blueveryListeners,
      store: this.__DO_NOT_DIRECT_USE_STORE__,
      initialState: blueveryOptions?.initialState,
      onChangeStateHandler: blueveryOptions?.onChangeStateHandler,
    });
    this.publicListeners = this.core.listeners.publicListeners;

    await this.core.init(blueveryOptions);
    this.initialized = true;
  }

  async startScan({
    scanOptions,
    discoverHandler,
    matchFn,
  }: {
    scanOptions: BlueveryMethodOptions['scan'];
    discoverHandler?: (peripheralInfo: PeripheralInfo) => any;
    matchFn?: (peripheral: Peripheral) => boolean;
  }) {
    const {scanningSettings, intervalLength = 0, iterations = 1} = scanOptions;

    const intervalScan = () =>
      promiseInterval(
        async () => {
          await this.core?.scan({
            scanningSettings,
            discoverHandler,
            matchFn,
          });
        },
        intervalLength,
        {iterations: iterations},
      );
    const omoiyariIntervalScan = applyOmoiyari(intervalScan, {
      time: DEFAULT_OMOIYARI_TIME,
    });

    // Initialize the list before scan
    this.core?.clearScannedPeripherals();
    await omoiyariIntervalScan();
  }

  async connect({
    connectParams,
    connectOptions,
    bondingParams,
    bondingOptions,
    retrieveServicesParams,
    retrieveServicesOptions,
  }: {
    connectParams: BleManagerParams['connect'];
    /**
     * @description connect must have timeout
     * @default timeoutMilliseconds = 8000ms
     */
    connectOptions?: BlueveryMethodOptions['connect'];
    retrieveServicesParams: BleManagerParams['retrieveServices'];
    /**
     * @description retrieveServices must have timeout
     * @default timeoutMilliseconds = 5000ms
     */
    retrieveServicesOptions?: BlueveryMethodOptions['retrieveServices'];
    /**
     * @description [Android only]
     */
    bondingParams: BleManagerParams['createBond'];
    /**
     * @description bonding must have timeout
     * @default timeoutMilliseconds = 10000ms
     */
    bondingOptions?: BlueveryMethodOptions['createBond'];
  }) {
    const _connectOptions = createBlueveryMethodOption(
      'connect',
      connectOptions,
    );

    const _retrieveServicesOptions = createBlueveryMethodOption(
      'retrieveServices',
      retrieveServicesOptions,
    );

    const _bondingOptions = createBlueveryMethodOption(
      'createBond',
      bondingOptions,
    );

    await this.core?.connect({
      connectParams,
      connectOptions: _connectOptions,
      bondingParams,
      bondingOptions: _bondingOptions,
      retrieveServicesParams,
      retrieveServicesOptions: _retrieveServicesOptions,
    });
  }

  /**
   * NOTE: connect, bondingはconnectメソッドで必要で、connectメソッド側でオプションのデフォルト値は吸収しているのでこのメソッドで設定しないのは意図的。
   */
  async receiveCharacteristicValue({
    scanParams,
    retrieveServicesParams,
    retrieveServicesOptions,
    onCallBeforeStartNotification,
    startNotificationParams,
    receiveCharacteristicHandler,
  }: {
    scanParams: Parameters<InstanceType<typeof Bluevery>['startScan']>[0];
    retrieveServicesParams: BleManagerParams['retrieveServices'];
    /**
     * @description retrieveServices must have timeout
     * @default timeoutMilliseconds = 5000ms
     */
    retrieveServicesOptions?: BlueveryMethodOptions['retrieveServices'];
    /**
     * @description Some peripherals may require preprocessing with startNotifiocaion. This is useful in such cases. Please refer to the "example app".
     */
    onCallBeforeStartNotification?: () => unknown | Promise<unknown>;
    startNotificationParams: BleManagerParams['startNotification'];
    receiveCharacteristicHandler: PublicHandlers['HandleDidUpdateValueForCharacteristic'];
  }) {
    const [targetPeripheralId] = startNotificationParams;

    // Note: retrieveServicesがpendingのままになるときがあるので、タイムアウトするようにする
    const _retrieveServicesOptions = createBlueveryMethodOption(
      'retrieveServices',
      retrieveServicesOptions,
    );

    do {
      await this.startScan(scanParams);
    } while (
      // receive対象のperipheralが見つからなければdoし続ける(見つかるまでscanを繰り返す)
      this.core?.getState().scannedPeripherals[targetPeripheralId] === undefined
    );

    if (onCallBeforeStartNotification) {
      await onCallBeforeStartNotification();
    }

    await this.core?.startNotification({
      startNotificationParams,
      receiveCharacteristicHandler,
      retrieveServicesParams,
      retrieveServicesOptions: _retrieveServicesOptions,
    });
  }

  async stopReceiveCharacteristicValue({
    stopNotificationParams,
  }: {
    stopNotificationParams: BleManagerParams['stopNotification'];
  }) {
    return await this.core?.stopNotification({stopNotificationParams});
  }

  async readValue({
    readValueParams,
    readValueOptions,
    retrieveServicesParams,
    retrieveServicesOptions,
  }: {
    readValueParams: BleManagerParams['read'];
    readValueOptions?: Parameters<
      InstanceType<typeof BlueveryCore>['readValue']
    >[0]['readValueOptions'];
    retrieveServicesParams: BleManagerParams['retrieveServices'];
    /**
     * @description retrieveServices must have timeout
     * @default timeoutMilliseconds = 5000ms
     */
    retrieveServicesOptions?: BlueveryMethodOptions['retrieveServices'];
  }) {
    const _readValueOptions = createBlueveryMethodOption(
      'read',
      readValueOptions,
    );

    const _retrieveServicesOptions = createBlueveryMethodOption(
      'retrieveServices',
      retrieveServicesOptions,
    );

    return await this.core?.readValue({
      readValueParams,
      readValueOptions: _readValueOptions,
      retrieveServicesParams,
      retrieveServicesOptions: _retrieveServicesOptions,
    });
  }

  async writeValue({
    writeValueParams,
    writeValueOptions,
    retrieveServicesParams,
    retrieveServicesOptions,
  }: {
    writeValueParams: BleManagerParams['write'];
    writeValueOptions?: BlueveryMethodOptions['write'];
    retrieveServicesParams: BleManagerParams['retrieveServices'];
    /**
     * @description retrieveServices must have timeout
     * @default timeoutMilliseconds = 5000ms
     */
    retrieveServicesOptions?: BlueveryMethodOptions['retrieveServices'];
  }) {
    const _writeValueoptions = createBlueveryMethodOption(
      'write',
      writeValueOptions,
    );

    const _retrieveServicesOptions = createBlueveryMethodOption(
      'retrieveServices',
      retrieveServicesOptions,
    );

    return await this.core?.writeValue({
      writeValueParams,
      writeValueOptions: _writeValueoptions,
      retrieveServicesParams,
      retrieveServicesOptions: _retrieveServicesOptions,
    });
  }
}

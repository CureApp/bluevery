import {EmitterSubscription} from 'react-native';
import BleManager, {Peripheral} from 'react-native-ble-manager';
import {Permission} from 'react-native-permissions';
import {DisconnectedPeripheralHandler} from './libs';
import {MethodParamsRecord} from './utils/typeUtils/MethodParamsRecord';

export type BlueveryOptions = {
  onDisconnectPeripheralHandler?: DisconnectedPeripheralHandler;
};

export type PeripheralId = string;
export type PeripheralInfo = Peripheral & {
  connect?: 'connecting' | 'connected' | 'disconnected' | 'failed';
  bonded?: 'unknown' | boolean;
  communicate?: 'nonCommunicate' | 'reading' | 'writing';
  receivingForCharacteristicValue?: boolean;
};

export type State = {
  bluetoothEnabled: boolean;
  permissionGranted: {
    is: 'granted' | 'ungranted' | 'unknown';
    lack: Permission[];
  };
  managing: boolean;
  scanning: boolean;
  scannedPeripherals: {[key in PeripheralId]: Peripheral};
  managingPeripherals: {[key in PeripheralId]: PeripheralInfo};
  error: Error | undefined;
};

export type PublicListeners = {
  [key in PeripheralId]: {
    receivingForCharacteristicValueListener?: EmitterSubscription;
  };
};

export type BlueveryEvents = 'didChangeBlueveryState';

/**
 * BleManager interface
 */
export type TBleManager = typeof BleManager;
export type BleManagerParams = MethodParamsRecord<TBleManager>;

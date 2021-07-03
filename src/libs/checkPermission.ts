import {Platform} from 'react-native';
import RNPermissions, {
  PERMISSIONS,
  Permission,
  RESULTS,
} from 'react-native-permissions';

export async function checkPermission(): Promise<
  [granted: Permission[], ungranted: Permission[]]
> {
  const permissionTargets = Platform.select({
    ios: [PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL],
    android: [
      /**
       * Android < 10では、ACCESS_FINE_LOCATIONが必要
       * https://developer.android.com/guide/topics/connectivity/bluetooth?hl=ja
       */
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
    ],
  }) as Permission[];
  if (!permissionTargets) {
    throw Error('permission targets not found');
  }

  const permissionStatuses = await RNPermissions.checkMultiple(
    permissionTargets,
  );

  const results = (Object.entries(permissionStatuses) as [
    Permission,
    typeof RESULTS[keyof typeof RESULTS],
  ][]).reduce<[granted: Permission[], ungranted: Permission[]]>(
    (acc, [permission, status]) => {
      const [granted, ungranted] = acc;
      if (status === 'granted') {
        granted.push(permission);
      } else {
        ungranted.push(permission);
      }
      return [granted, ungranted];
    },
    [[], []],
  );

  return results;
}

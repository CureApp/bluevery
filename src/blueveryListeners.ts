import _set from 'lodash.set';
import {
  InternalListeners,
  PeripheralId,
  PublicListeners,
  PublicSubscriptions,
} from './interface';

export class BlueveryListeners {
  publicListeners: PublicListeners = {};
  internalListeners: InternalListeners = {};

  /**
   * @description setProperty util method
   */
  setAnyPublicSubscription<Key extends keyof PublicSubscriptions>(
    peripheralId: PeripheralId,
    key: Key,
    value: PublicSubscriptions[Key],
  ) {
    _set(this.publicListeners, `${peripheralId}.${key}`, value);
  }
  setAnyInternalSubscription<Key extends keyof InternalListeners>(
    key: Key,
    value: InternalListeners[Key],
  ) {
    _set(this.internalListeners, `${key}`, value);
  }

  removeAnyPublicSubscription<Key extends keyof PublicSubscriptions>(
    peripheralId: PeripheralId,
    key: Key,
  ) {
    const subscription = this.publicListeners[peripheralId]?.[key];
    if (subscription) {
      subscription.remove();
      delete this.publicListeners[peripheralId]?.[key];
    }
  }

  removePeripheralPublicSubscription(peripheralId: PeripheralId) {
    const subscription = this.publicListeners[peripheralId];
    if (subscription) {
      Object.values(subscription).forEach((listener) => {
        listener?.remove();
      });
    }
    delete this.publicListeners[peripheralId];
  }

  removeAllSubscriptions() {
    Object.values(this.internalListeners).forEach((listener) => {
      listener?.remove();
    });
    this.internalListeners = {};
    Object.values(this.publicListeners).forEach((subscriptions) => {
      if (subscriptions) {
        Object.values(subscriptions).forEach((listener) => {
          listener?.remove();
        });
      }
    });
    this.publicListeners = {};
  }
}

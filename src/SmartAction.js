import equal from 'deep-equal';

export default class SmartAction {

  constructor(func, deepEqual = true) {
    this.func = func;
    this.deepEqual = deepEqual;
  }

  dispatchToStore(store) {
    const prevState = store.getState();

    this.func(store.dispatch, store.getState);

    const nextState = store.getState();

    if (prevState === nextState) {
      return false;
    }

    if (this.deepEqual) {
      return !equal(prevState, store.getState());
    }

    return true;
  }

}

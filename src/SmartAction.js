import equal from 'deep-equal';

export default class SmartAction {

  constructor(func, deepEqual = true) {
    this.func = func;
    this.deepEqual = deepEqual;
  }

  run(dispatch, getState) {
    const prevState = getState();

    this.func(dispatch, getState);

    const nextState = getState();

    if (prevState === nextState) {
      return false;
    }

    if (this.deepEqual) {
      return !equal(prevState, getState());
    }

    return true;
  }

}

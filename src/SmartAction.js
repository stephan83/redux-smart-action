import equal from 'deep-equal';

export default class SmartAction {

  constructor(func, branch = true, deepEqual = true) {
    this.func = func;
    this.branch = branch;
    this.deepEqual = deepEqual;
  }

  run(store) {
    return this.branch ? this.runBranch(store) : this.runDontBranch(store);
  }

  runBranch(store) {
    const branch = store.branch();

    if (this.runCheckState(branch.dispatch, branch.getState)) {
      return {
        canExec: true,
        exec: () => {
          store.replaceState(branch.getState());
          return true;
        }
      };
    }

    return {
      canExec: false,
      exec: () => false
    };
  }

  runCheckState(dispatch, getState) {
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

  runDontBranch(store) {
    let count = 0;

    const reducer = (state) => {
      count++;
      return state;
    };

    const branch = store.branch(reducer);
    this.func(branch.dispatch, branch.getState);

    // > 1 because of redux's init action
    if (count > 1) {
      return {
        canExec: true,
        exec: () => {
          const next = store.branch();
          this.func(next.dispatch, next.getState);
          store.replaceState(next.getState());
          return true;
        }
      };
    }

    return {
      canExec: false,
      exec: () => false
    };
  }

}

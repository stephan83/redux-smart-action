import SmartAction from './SmartAction';

export default function createSmartActionMiddleware(store) {
  return next => action => {
    if (action instanceof SmartAction) {
      const branch = store.branch();

      if (action.dispatchToStore(branch)) {
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

    next(action);
  };
}

import SmartAction from './SmartAction';

export default function createSmartActionMiddleware(store) {
  return next => action => {
    if (action instanceof SmartAction) {
      return action.run(store);
    }

    next(action);
  };
}

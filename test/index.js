import sinon from 'sinon';
import { createStore } from 'redux';
import {
  SmartAction,
  smartActionMiddleware,
  applySmartMiddleware
} from '../src';

function reducer(state = [], action) {
  let nextState;
  switch (action.type) {
  case 'PUSH':
    nextState = state.slice();
    nextState.push(action.value);
    return nextState;
  case 'POP':
    nextState = state.slice();
    nextState.pop();
    return nextState;
  default:
    return state;
  }
}

const createStoreWithMiddleware = applySmartMiddleware(
  smartActionMiddleware
)(createStore);

function createSmartStore(initialState) {
  return createStoreWithMiddleware(reducer, initialState);
}

const push = value => new SmartAction(dispatch => {
  dispatch({type: 'PUSH', value});
});

const pop = value => new SmartAction((dispatch, getState) => {
  if (getState().length) {
    dispatch({type: 'POP', value});
  }
});

const pushCap = (value, cap) => new SmartAction((dispatch, getState) => {
  if (getState().length < cap) {
    dispatch(push(value)).exec();
  }
});

const pushMutiple = (...values) => new SmartAction(dispatch => {
  values.forEach(v => dispatch(push(v)).exec());
});

const pushPop = value => new SmartAction(dispatch => {
  dispatch({type: 'PUSH', value});
  dispatch({type: 'POP', value});
});

const pushPopNoDeepEqual = value => new SmartAction(dispatch => {
  dispatch({type: 'PUSH', value});
  dispatch({type: 'POP'});
}, false);

describe('smartAction', () => {

  let store;
  let action;
  let observer;
  let unsubscribe;

  beforeEach(() => {
    store = createSmartStore();
    observer = sinon.spy();
    unsubscribe = store.subscribe(observer);
  });

  afterEach(() => {
    unsubscribe();
  });

  context('simple action', () => {

    context('the state would change', () => {

      beforeEach(() => {
        action = store.dispatch(push(1));
      });

      describe('canExec', () => {

        it('should return true', () => {
          action.canExec.should.be.exactly(true);
        });

      });

      describe('#exec()', () => {

        let returnValue;

        beforeEach(() => {
          returnValue = action.exec();
        });

        it('should return true', () => {
          returnValue.should.be.exactly(true);
        });

        it('should update the state', () => {
          store.getState().length.should.be.exactly(1);
        });

        it('should notify observers', () => {
          observer.calledOnce.should.be.exactly(true);
        });

      });

    });

    context('the state wouldn\'t change', () => {

      beforeEach(() => {
        action = store.dispatch(pop());
      });

      describe('canExec', () => {

        it('should return false', () => {
          action.canExec.should.be.exactly(false);
        });

      });

      describe('#exec()', () => {

        let returnValue;

        beforeEach(() => {
          returnValue = action.exec();
        });

        it('should return false', () => {
          returnValue.should.be.exactly(false);
        });

        it('should not update the state', () => {
          store.getState().length.should.be.exactly(0);
        });

        it('should not notify observers', () => {
          observer.called.should.be.exactly(false);
        });

      });

    });

  });

  context('composite action', () => {

    context('the state would change', () => {

      beforeEach(() => {
        action = store.dispatch(pushCap(1, 1));
      });

      describe('canExec', () => {

        it('should return true', () => {
          action.canExec.should.be.exactly(true);
        });

      });

      describe('#exec()', () => {

        let returnValue;

        beforeEach(() => {
          returnValue = action.exec();
        });

        it('should return true', () => {
          returnValue.should.be.exactly(true);
        });

        it('should update the state', () => {
          store.getState().length.should.be.exactly(1);
        });

        it('should notify observers', () => {
          observer.calledOnce.should.be.exactly(true);
        });

      });

    });

    context('the state wouldn\'t change', () => {

      beforeEach(() => {
        action = store.dispatch(pushCap(1, 0));
      });

      describe('canExec', () => {

        it('should return false', () => {
          action.canExec.should.be.exactly(false);
        });

      });

      describe('#exec()', () => {

        let returnValue;

        beforeEach(() => {
          returnValue = action.exec();
        });

        it('should return false', () => {
          returnValue.should.be.exactly(false);
        });

        it('should not update the state', () => {
          store.getState().length.should.be.exactly(0);
        });

        it('should not notify observers', () => {
          observer.called.should.be.exactly(false);
        });

      });

    });

  });

  context('mutltiple dispatches', () => {

    context('the state would change', () => {

      beforeEach(() => {
        action = store.dispatch(pushMutiple(1, 2, 3));
      });

      describe('canExec', () => {

        it('should return true', () => {
          action.canExec.should.be.exactly(true);
        });

      });

      describe('#exec()', () => {

        let returnValue;

        beforeEach(() => {
          returnValue = action.exec();
        });

        it('should return true', () => {
          returnValue.should.be.exactly(true);
        });

        it('should update the state', () => {
          store.getState().length.should.be.exactly(3);
        });

        it('should notify observers', () => {
          observer.calledOnce.should.be.exactly(true);
        });

      });

    });

    context('the state wouldn\'t change', () => {

      beforeEach(() => {
        action = store.dispatch(pushMutiple());
      });

      describe('canExec', () => {

        it('should return false', () => {
          action.canExec.should.be.exactly(false);
        });

      });

      describe('#exec()', () => {

        let returnValue;

        beforeEach(() => {
          returnValue = action.exec();
        });

        it('should return false', () => {
          returnValue.should.be.exactly(false);
        });

        it('should not update the state', () => {
          store.getState().length.should.be.exactly(0);
        });

        it('should not notify observers', () => {
          observer.called.should.be.exactly(false);
        });

      });

    });

  });

  context('mutltiple dispatches canceling each other', () => {

    context('with deepEqual', () => {

      beforeEach(() => {
        action = store.dispatch(pushPop(1));
      });

      describe('canExec', () => {

        it('should return false', () => {
          action.canExec.should.be.exactly(false);
        });

      });

      describe('#exec()', () => {

        let returnValue;

        beforeEach(() => {
          returnValue = action.exec();
        });

        it('should return false', () => {
          returnValue.should.be.exactly(false);
        });

        it('should not notify observers', () => {
          observer.called.should.be.exactly(false);
        });

      });

    });

    context('without deepEqual', () => {

      beforeEach(() => {
        action = store.dispatch(pushPopNoDeepEqual(1));
      });

      describe('canExec', () => {

        it('should return true', () => {
          action.canExec.should.be.exactly(true);
        });

      });

      describe('#exec()', () => {

        let returnValue;

        beforeEach(() => {
          returnValue = action.exec();
        });

        it('should return true', () => {
          returnValue.should.be.exactly(true);
        });

        it('should notify observers', () => {
          observer.calledOnce.should.be.exactly(true);
        });

      });

    });

  });

});

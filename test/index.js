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

const pushNoBranch = value => new SmartAction(dispatch => {
  dispatch({type: 'PUSH', value});
}, false);

const pop = value => new SmartAction((dispatch, getState) => {
  if (getState().length) {
    dispatch({type: 'POP', value});
  }
});

const popNoBranch = value => new SmartAction((dispatch, getState) => {
  if (getState().length) {
    dispatch({type: 'POP', value});
  }
}, false);

const pushCap = (value, cap) => new SmartAction((dispatch, getState) => {
  if (getState().length < cap) {
    dispatch(push(value)).exec();
  }
});

const pushCapNoBranch = (value, cap) =>
  new SmartAction((dispatch, getState) => {
    if (getState().length < cap) {
      dispatch(pushNoBranch(value)).exec();
    }
  }, false);

const pushMutiple = (...values) => new SmartAction(dispatch => {
  values.forEach(v => dispatch(push(v)).exec());
});

const pushMutipleNoBranch = (...values) => new SmartAction(dispatch => {
  values.forEach(v => dispatch(pushNoBranch(v)).exec());
}, false);

const pushPop = value => new SmartAction(dispatch => {
  dispatch({type: 'PUSH', value});
  dispatch({type: 'POP', value});
});

const pushPopNoBranch = value => new SmartAction(dispatch => {
  dispatch({type: 'PUSH', value});
  dispatch({type: 'POP', value});
}, false);

const pushPopNoDeepEqual = value => new SmartAction(dispatch => {
  dispatch({type: 'PUSH', value});
  dispatch({type: 'POP'});
}, false, false);

const pushTimes = (value, times) => new SmartAction((dispatch, getState) => {
  const initialLength = getState().length;
  while (getState().length < initialLength + times) {
    dispatch(push(value)).exec();
  }
});

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

      const tests = () => {

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

      };

      context('with branch', () => {

        beforeEach(() => {
          action = store.dispatch(push(1));
        });

        tests();

      });

      context('without branch', () => {

        beforeEach(() => {
          action = store.dispatch(pushNoBranch(1));
        });

        tests();

      });

    });

    context('the state wouldn\'t change', () => {

      const tests = () => {

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

      };

      context('with branch', () => {

        beforeEach(() => {
          action = store.dispatch(pop());
        });

        tests();

      });

      context('without branch', () => {

        beforeEach(() => {
          action = store.dispatch(popNoBranch());
        });

        tests();

      });

    });

  });

  context('composite action', () => {

    context('the state would change', () => {

      const tests = () => {

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

      };

      context('with branch', () => {

        beforeEach(() => {
          action = store.dispatch(pushCap(1, 1));
        });

        tests();

      });

      context('without branch', () => {

        beforeEach(() => {
          action = store.dispatch(pushCapNoBranch(1, 1));
        });

        tests();

      });

    });

    context('the state wouldn\'t change', () => {

      const tests = () => {

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

      };

      context('with branch', () => {

        beforeEach(() => {
          action = store.dispatch(pushCap(1, 0));
        });

        tests();

      });

      context('without branch', () => {

        beforeEach(() => {
          action = store.dispatch(pushCapNoBranch(1, 0));
        });

        tests();

      });

    });

  });

  context('mutltiple dispatches', () => {

    context('the state would change', () => {

      const tests = () => {
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
      };

      context('with branch', () => {

        beforeEach(() => {
          action = store.dispatch(pushMutiple(1, 2, 3));
        });

        tests();

      });

      context('without branch', () => {

        beforeEach(() => {
          action = store.dispatch(pushMutipleNoBranch(1, 2, 3));
        });

        tests();

      });

    });

    context('the state wouldn\'t change', () => {

      const tests = () => {

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

      };

      context('with branch', () => {

        beforeEach(() => {
          action = store.dispatch(pushMutiple());
        });

        tests();

      });

      context('without branch', () => {

        beforeEach(() => {
          action = store.dispatch(pushMutipleNoBranch());
        });

        tests();

      });

    });

  });

  context('mutltiple dispatches canceling each other', () => {

    context('with branch and deepEqual', () => {

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

    context('without branch', () => {

      beforeEach(() => {
        action = store.dispatch(pushPopNoBranch(1));
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

  context('actions mutating the state and reading it', () => {

    context('with branch', () => {

      beforeEach(() => {
        action = store.dispatch(pushTimes(1, 5));
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

        it('should work', () => {
          store.getState().length.should.be.exactly(5);
        });

        it('should return true', () => {
          returnValue.should.be.exactly(true);
        });

        it('should not notify observers', () => {
          observer.called.should.be.exactly(true);
        });

      });

    });

    context('without branch', () => {

      describe('canExec', () => {

        it('it would run into an infinite loop!', () => {
          (true).should.be.exactly(true);
        });

      });

    });

  });

});

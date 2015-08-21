# Redux Smart Action

SmartActions add a layer on top of actions to do things depending on whether
an action would modify the state. When a SmartAction is called, it returns
an object instead of dispatching immediately. The returned object tells you
whether executing it would change the state, and a method to execute it.

For instance, say you have a menu item with an enabled flag, then you can do:

```js
// Assuming remove is an action that dispatches only if something can be
// removed
const deferredRemove = remove();

const menuItem = {
  enabled: deferredRemove.canExec,
  onClick: deferredRemove.exec
};

addMenuItem(menuItem);
```

They can do a lot more, like composing and mutiple dispatches.

In some ways, SmartAction moves some business logic from reducers to actions.
This may not be everyone's cup of tea, but I personally like it because
my reducers can get pretty big. For instance the previous example could be done
by adding a `canRemove` property to the state, but I find it tedious and not as
elegant.

## Install

```
$ npm install redux-smart-action
```

## Actions

To create a SmartAction, you must return a SmartAction instance from within
a regular action:

```js
import {SmartAction} from 'redux-smart-action';

const push = value => new SmartAction(dispatch => {
  dispatch({type: 'PUSH', value});
});

const pop = () => new SmartAction((dispatch, getState) => {
  if (getState().length) {
    dispatch({type: 'POP'});
  }
});
```

The SmartAction can make decisions based on the current state via `getState`
and uses `dispatch` to dispatch actions. It can also dispatch other
SmartActions, allowing complex composing and reusability of actions.

For instance:

```js
// This action will push all given arguments
const pushMutiple = (...values) => new SmartAction(dispatch => {
  values.forEach(v => dispatch(push(v)).exec());
});
```

It can call dispatch multiple times and the store's subscribers will only be
notified once, or not at all if the state didn't change.

It uses `deep-equal` to check if the state changed, so if `dispatch` is called
with values canceling each other, the state will not update and the subscribers
won't be notified. If you don't want to use deep-equal to compare, pass `false`
as the second argument to the constructor of `SmartAction`.

## Middleware

In order for SmartActions to work with a store, you must use
`applySmartMiddleware` instead of redux's `applyMiddleware`.

This is because the middlewares must have access to extra functions
to branch a store which are not provided by redux.

`applySmartMiddleware` is compatible with normal middlewares, so you don't need
to use `applyMiddleware` at all.

Example:

```js
import {createStore} from 'redux';
import {applySmartMiddleware} from 'redux-smart-action';

const createStoreWithMiddleware = applySmartMiddleware(
  smartActionMiddleware
)(createStore);

function createSmartStore(initialState) {
  return createStoreWithMiddleware(reducer, initialState);
}

const store = createSmartStore();
```

## Executing actions

Dispatching an action does not execute it. Instead it returns an object that can
be used to determine if the action can be executed (meaning it would change
the state) as well as a function to executed it.

For instance:

```js
store.dispach(push(1));
```

Returns an object:

```js
{
  canExec: true, // True if the action would modify the state
  exec()         // Execute the action (does nothing if canExec is false)
}
```

It's up to you to decide whether you want to execute the action.

The `exec` method of the returned object is always safe to call. It returns the
value of `canExec`, allowing interesting patterns.

## Patterns

Given the reducer:

```js
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
```

Some actions:

```js
const push = value => new SmartAction(dispatch => {
  dispatch({type: 'PUSH', value});
});

const pop = () => new SmartAction((dispatch, getState) => {
  if (getState().length) {
    dispatch({type: 'POP'});
  }
});
```

And a store:

```js
const createStoreWithMiddleware = applySmartMiddleware(
  smartActionMiddleware
)(createStore);

function createSmartStore(initialState) {
  return createStoreWithMiddleware(reducer, initialState);
}

const store = createSmartStore();
```

#### Do something if an action executed:

```js
if (store.dispach(pop()).exec()) {
  console.log('Pop executed!');
}
```

#### Do something if an action can execute but don't execute it:

```js
if (store.dispach(pop()).canExec) {
  console.log('Pop can execute!');
}
```


#### Do something if an action can execute then execute it

```js
const pop = store.dispatch(pop());

if (pop.canExec) {
  console.log('Pop can execute!');
  pop.exec();
  console.log('Pop executed!');
}
```

#### Execute an action if another didn't execute

```js
// This will pop if it can, or push if it didn't pop
store.dispach(pop()).exec() || store.dispach(push(1)).exec();
```

#### Execute an action if another executed

```js
// This will pop if it can, then push if it popped
store.dispach(pop()).exec() && store.dispach(push(1)).exec();
```

#### Compose actions

```js
// This action will push all given arguments
const pushMutiple = (...values) => new SmartAction(dispatch => {
  values.forEach(v => dispatch(push(v)).exec());
});

store.dispatch(pushMultiple(1, 3, 4)).exec();
console.log(store.getState()); // [ 1, 2, 3 ]
```

## Limitations

### Deferring execution

If you choose to defer the execution of a SmartAction, be sure that the state
hasn't change in the mean time.

For instance, **DON'T DO THIS**:

```js
push(1).exec();
const deferPop = pop();
pop().exec();
deferPop.exec();
```

### Async

Obviously, it is not possible to know if an action will dispatch in the future!

However, I have a feeling something can be done with promises. I'll get to it
once that thought materializes...

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

They can do a lot more, like composing and mutiple dispatches. For instance,
you can define actions such as these:

```js
const push = value => new SmartAction(dispatch => {
  dispatch({type: 'PUSH', value});
});

// This will only notify the subscribers once!
const pushMutiple = (...values) => new SmartAction(dispatch => {
  values.forEach(v => dispatch(push(v)).exec());
});
```

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

### Options

The constructor expects the following parameters:

```js
new SmartAction(func, branch = true, deepEqual = true);
```

#### branch

If not specified, `branch` is set to `true`. If `branch` is `true`, calling an
action will create a temporary store, `dispatch` and `getState` are wired to
that temporary store. When `exec` is called, if the state of the temporary store
had changed, the state of the original store is replaced by the state of the
temporary store. This is the safest option because, whenever an action calls
`getState`, it gets a state which includes any previous mutations by the action.

For instance, this is perfectly safe to do if `branch` is `true`:

```js
const pushTimes = (value, times) => new SmartAction((dispatch, getState) => {
  const initialLength = getState().length;
  while (getState().length < initialLength + times) {
    dispatch(push(value)).exec();
  }
});
```

The down side is that a temporary store is created, so it uses memory.

On the other hand, if `branch` is set to `false`, a temporary store is not
created so it is more memory efficient. However in this case it is not safe
to `getState` because it doesn't include any previous mutations by the action.
With `branch` set to `false`, the previous example would run into an infinite
loop!
Usually, when `branch` is set to `false`, `getState` should only be called once
at the beginning of the action before it starts calling `dispatch`.

#### deepEqual

If not specified, `deepEqual` is set to `true`. It is only relevant when
`branch` is `true`. If `deepEqual` is `true`, `deep-equal` is used to check if
the state changed, so if `dispatch` is called with values canceling each other,
the state will not update and the subscribers won't be notified. This is a nice
feature but can be a little expensive.

On the other hand, if `deepEquasl` is `false`, a strict equality is used to
compare the previous state to the next state. This is must faster, but
subscribers can be notified even if the final state is the same as the original.

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

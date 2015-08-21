/*

Modified version of redux's applyMiddleware, which has the following license:

The MIT License (MIT)

Copyright (c) 2015 Dan Abramov

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import { compose } from 'redux';

const REPLACE = '@@smartAction/REPLACE';

export default function applySmartMiddleware(...middlewares) {
  return (next) => {
    const middlewareReducer = (r, initialState) => {
      const reducer = (state, action) => {
        if (action.type === REPLACE) {
          return action.state;
        }
        return r(state, action);
      };

      const store = next(reducer, initialState);
      let dispatch;
      let chain = [];

      const middlewareAPI = {
        getState: store.getState,
        dispatch: (action) => dispatch(action),
        replaceState: (state) => {
          dispatch({type: REPLACE, state});
        },
        branch: () => middlewareReducer(reducer, store.getState())
      };

      chain = middlewares.map(middleware => middleware(middlewareAPI));
      dispatch = compose(...chain, store.dispatch);

      return {
        ...store,
        dispatch
      };
    };

    return middlewareReducer;
  };
}

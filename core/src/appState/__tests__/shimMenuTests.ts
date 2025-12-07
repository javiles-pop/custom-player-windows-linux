import 'jest';
import { shimMenuInitialState } from '../initialState';
import { setMenuStatus, resetShimMenu, ShimMenuReducer } from '../shimMenuActive';

const state = shimMenuInitialState;

describe('deployment actions', () => {
  it('should create menu status action and update state', () => {
    const action = setMenuStatus(true);
    const expected = {
      type: 'shimMenu/setMenuStatus',
      payload: true,
    };
    expect(action).toEqual(expected);

    const newState = ShimMenuReducer(state, action);
    expect(newState.shimMenuActive).toEqual(true);
  });

  it('should reset state', () => {
    const action = resetShimMenu();
    const expected = {
      type: 'shimMenu/resetShimMenu',
      payload: undefined,
    };
    expect(action).toEqual(expected);

    const action1 = setMenuStatus(true);
    const newState1 = ShimMenuReducer(state, action1);
    const newState = ShimMenuReducer(newState1, action);
    expect(newState).toEqual(state);
  });
});

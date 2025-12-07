import 'jest';
import { ProvisioningStatus } from '../../constants';
import {
  setAutoProvioning,
  setAutoActivating,
  setInviteCodeProvisioning,
  setInviteCodeActivation,
  setInviteCode,
  setProvisionedDevicePayload,
  resetDeviceProvisioning,
  CloudReducer,
} from '../fwiCloud';
import { cloudInitialState } from '../initialState';

const state = cloudInitialState;
const autoProvisioningStatus = ProvisioningStatus.inProgress;
const autoActivatingStatus = ProvisioningStatus.success;
const inviteCodeProvisioningStatus = ProvisioningStatus.error;
const inviteCodeActivationStatus = ProvisioningStatus.awaitingResponse;
const inviteCode = 'AMULRK';
const devicePayload = {
  deviceId: 'SOC TEST DEVICE',
  companyId: 'FWI',
  key: 'eyJhbTest901JIUzI15cCI6IkpXVCJ9',
  cognitoUserPoolId: 'cognito-idp.us-east-1.amazonaws.com/us-east-1_123456789',
  cognitoClientId: '38fjsnc484p94kpqsnet7mpld0',
};

describe('Device Provisioning', () => {
  it('should create auto provioning action and update state', () => {
    const action = setAutoProvioning(autoProvisioningStatus);
    const expected = {
      type: 'FWICloud/setAutoProvioning',
      payload: autoProvisioningStatus,
    };
    expect(action).toEqual(expected);

    const newState = CloudReducer(state, action);
    expect(newState.provisioning.autoProvisioning).toEqual(autoProvisioningStatus);
  });

  it('should create auto activating action and update state', () => {
    const action = setAutoActivating(autoActivatingStatus);
    const expected = {
      type: 'FWICloud/setAutoActivating',
      payload: autoActivatingStatus,
    };
    expect(action).toEqual(expected);

    const newState = CloudReducer(state, action);
    expect(newState.provisioning.autoActivating).toEqual(autoActivatingStatus);
  });

  it('should create invite code provisioning action and update state', () => {
    const action = setInviteCodeProvisioning(inviteCodeProvisioningStatus);
    const expected = {
      type: 'FWICloud/setInviteCodeProvisioning',
      payload: inviteCodeProvisioningStatus,
    };
    expect(action).toEqual(expected);

    const newState = CloudReducer(state, action);
    expect(newState.provisioning.inviteCodeProvisioning).toEqual(inviteCodeProvisioningStatus);
  });

  it('should create invite code activation action and update state', () => {
    const action = setInviteCodeActivation(inviteCodeActivationStatus);
    const expected = {
      type: 'FWICloud/setInviteCodeActivation',
      payload: inviteCodeActivationStatus,
    };
    expect(action).toEqual(expected);

    const newState = CloudReducer(state, action);
    expect(newState.provisioning.inviteCodeActivating).toEqual(inviteCodeActivationStatus);
  });

  it('should create invite code action and update state', () => {
    const action = setInviteCode(inviteCode);
    const expected = {
      type: 'FWICloud/setInviteCode',
      payload: inviteCode,
    };
    expect(action).toEqual(expected);

    const newState = CloudReducer(state, action);
    expect(newState.inviteCode).toEqual(inviteCode);
  });

  it('should create provisioned Device Payload action and update state', () => {
    const action = setProvisionedDevicePayload(devicePayload);
    const expected = {
      type: 'FWICloud/setProvisionedDevicePayload',
      payload: devicePayload,
    };
    expect(action).toEqual(expected);

    const newState = CloudReducer(state, action);
    expect(newState.provisionedDevicePayload).toEqual(devicePayload);
  });

  it('should create reset action and reset state', () => {
    const action = resetDeviceProvisioning();
    const expected = {
      type: 'FWICloud/resetDeviceProvisioning',
      payload: undefined,
    };
    expect(action).toEqual(expected);

    const action1 = setProvisionedDevicePayload(devicePayload);
    const action2 = setInviteCode(inviteCode);

    const state1 = CloudReducer(state, action1);
    const state2 = CloudReducer(state1, action2);

    const newState = CloudReducer(state2, action);
    expect(newState).toEqual(state);
  });
});

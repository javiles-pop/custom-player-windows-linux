# Poppulo Shim v.2

This is the monorepo for all System-on-chip (SoC) devices supported at FWI | Poppulo starting at version 2.0, a.k.a:

- Shim
- Content Player for SoC
- Content Player for BrightSign
- Content Player for Samsung SSP
- Content Player for LG webOS

if you are looking for any versions below 2.0, you want to go to one of these repos:

- [Shared Code (~70% of the codebase)](https://bitbucket.fourwindsinteractive.com/projects/PLESS/repos/front-end/browse)
- [BrightSign Code](https://bitbucket.fourwindsinteractive.com/projects/PLESS/repos/brightsign/browse)
- [SSSP Code](https://bitbucket.fourwindsinteractive.com/projects/PLESS/repos/sssp/browse)
- [LG Code](https://bitbucket.fourwindsinteractive.com/projects/PLESS/repos/webos/browse)

## Requirements

- yarn v1.19.0+
- node v.16+
- (optional) Docker

## Overview

This repo contains the full codebase for all SoC Players including CP for BrightSign, CP for Samsung SSP, and CP for LG
webOS. It is setup as a monorepo that contains the common code `core`, and the device-specific code for each player,
`device_{platformName}`. In addition to our 3 customer facing platforms, there is also a folder for `device_browser`
which is the primary development interface for the shared code.

Throughout the core codebase, there will be references to a `DeviceAPI` on the window object. This is an abstract class
that is extended by each of the supported platforms. The DeviceAPI base class defines the common API that this app uses
to interact with hardware. In each of the device-specific platforms, there will be an index file, and a file that
extends the abstract class. The body of each method in the class is responsible for calling functions on the Device
(each one has a native JS API that they expose). Additionally, there may be a NodeJS server that is responsible for
interacting with the OS if the device's API does not expose all the native functionality through a client-side library.
All type definitions (PlatformName.d.ts) for the API's are added manually and will need to be kept up-to-date with
breaking changes when the supported firmware for each platform is updated.

### Example: Get a Screenshot from the device:

Start by defining the method on the abstract base class. Here you can see that the base class defines the method name
and the return type that all devices running this app will use.

`core/src/Util/DeviceAPI.ts`

```typescript
abstract class DeviceAPI {
  captureScreenshot = async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {});
  };
}
```

For Brightsign, we can override this method, but we need to call native functionality exposed on the node server in
order to get a screenshot.

`device_brightsign/src/BrightSign.ts`

```typescript
class BrightSign extends DeviceAPI {
  captureScreenshot = async (): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await this.sendNodeServerRequest(`/screenshot`);
        const blob = await response.blob();
        resolve(blob);
      }
    });
  };
}
```

Now to implement Samsung, we can call their client-side b2b library. Call that directly, convert to the desired type,
and return the blob.

`device_SSSP/src/Samsung.ts`

```typescript
class Samsung extends DeviceAPI {
  captureScreenshot = async (): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
      b2bapis.b2bcontrol.captureScreen(
        (screenshotPath: string) => {
          // get file from screenshot path.
          fetch(`file://${screenshotPath}`)
            .then((res) => res.blob())
            .then((blob) => {
              resolve(blob);
            });
        },
        (error) => {
          reject(error);
        }
      );
    });
  };
}
```

<hr />
<br />

## High Level Concepts

- The Application is highly event driven and relies on the pub/sub model, not only within the UI for React, but also for
  events from MQTT connection and CP Web events.
- Persistent settings are stored on disk and loaded into memory during initialization. As settings are updated, they are
  written to disk.
- Signs are displayed by a Channel URL. These signs are authenticated if needed by an access token that is refreshed 60
  minutes.
- When online, the device is connected via web socket (MQTT) to Harmony. All messaging to and from cloud happens
  through this connection.
- When offline, the device plays the last known and verified URL with assets from cache.
- App uses React + Redux for state management and Sagas for responding to these events in state change.
- Some global objects are stored on the window object because they are not serialized instances that can be stored in
  Redux state.
- When possible, the majority of business logic is stored in separate files and imported into the UI (depending on
  scope) to keep the components readable.

<hr />
<br />

## Getting Started with Development

1. export environment variables. Choose one of the commands below

For Dev environments

`export ENVIRONMENT=dev && export CLOUD_ENV=cloudtest1 && export VERSION=2.0.0 && export BUILD_NUMBER=dev && export SERIAL="YOUR_COMPUTER_SERIAL_NUMBER_HERE`

`export ENVIRONMENT=dev && export CLOUD_ENV=cloudtest2 && export VERSION=2.0.0 && export BUILD_NUMBER=dev && export SERIAL="YOUR_COMPUTER_SERIAL_NUMBER_HERE`

`export ENVIRONMENT=dev && export CLOUD_ENV=admin && export VERSION=2.0.0 && export BUILD_NUMBER=dev && export SERIAL="YOUR_COMPUTER_SERIAL_NUMBER_HERE`

`export ENVIRONMENT=dev && export CLOUD_ENV=contributor && export VERSION=2.0.0 && export BUILD_NUMBER=dev && export SERIAL="YOUR_COMPUTER_SERIAL_NUMBER_HERE`

`export ENVIRONMENT=dev && export CLOUD_ENV=network && export VERSION=2.0.0 && export BUILD_NUMBER=dev && export SERIAL="YOUR_COMPUTER_SERIAL_NUMBER_HERE`

  <br>

For Staging environments

`export ENVIRONMENT=staging && export VERSION=2.0.0`

<br>
  for Prod environments

`export ENVIRONMENT=prod && export VERSION=2.0.0`

`export ENVIRONMENT=prod-ap && export VERSION=2.0.0`

`export ENVIRONMENT=prod-eu && export VERSION=2.0.0`

1. Run `yarn` at the root of this repo to install dependencies for all devices.

1. navigate to the directory you want to build || develop for

1. run `yarn <start|dev|build>`. these scripts will read your environment variables from step 1 to create a package for
   you.

<hr />
<br />

## Development

packages are aliased by the `@` prefix and the `device` name. you can import modules from any of these by including this
path:

```typescript
import { moduleName } from '@core/index';
```

_\*\*Note: that the "/index" or other applicable path name is required for proper module resolution from prefixed
packages._

**The "core" package is not meant to run on it's own, so there is no build process required for it. Instead the other
devices' package will read it as a raw Typescript library and take care of compilation themselves.**

## State Management

 We use `Redux` for sharing of data across components and State Management. The store is the critical component that handles
 the application state. This Store set up could be found at `/core/src/createStore`. This involves couple of steps, importing
 rootReducer and setting up middleware, if any. Below is a high level example on how a store is created.

```typescript
import { configureStore } from '@reduxjs/toolkit'
import rootReducer from './reducers'

const store = configureStore({
  reducer: rootReducer,
})
```

The next step is to make this store available across all the components.
We render a <Provider> at the top level of the app to achieve this.

```typescript
const store = setupStore(initialState);

<Provider store={store}>
 <App />
</Provider>
```

The initial state thats used to set up the store could be found at `/core/src/appState/initialState`.
We split the initial state into 5 categories based on their functionalities.

```typescript
const initialState = {
    appSettings: getInitialAppSettings(),
    fwiCloud: getInitialCloudState(),
    deviceSettings: getInitialDeviceSettings(),
    shimMenu: getInitialMenuState(),
    deviceState: await getInitialDeviceState(),
  };
```

Lets move on to the next step of creating reducers. We create a root reducer to bring all the reducers under one roof.
Please refer `/core/src/appState/index`. This root reducer is then used while configuring the store as demonstrated above.

```typescript
import { combineReducers } from '@reduxjs/toolkit';
const rootReducer = combineReducers({
  ...
})
```

If we look at the actions payload type, we notice that we are using `updateStateWithString`.
When we dispatch an action, there is a use case where the new value needs to be updated to the
Harmony's shadow. To determine when this update is needed, we implemented a custom interface.
During the developmental phase we initially created individual actions with switch case reducers. This approach seemed
to have lots of redundant code and we wanted to simply it. We circled back to the drawing board and came up with a
different approach to use `Slice`. Please look at `/core/src/appState` folder to find implementations for
appSettings, deviceSettings, fwiCloud, deviceState and shimMenu. Below is a high level example on how we could add a new action


```typescript
import { createSlice } from '@reduxjs/toolkit';
const appSettings = createSlice({
  name: 'appSettings',
  initialState: appSettingsInitialState,
  reducers: {
    setNewAction(state: AppSettings, action: PayloadAction<updateStateWithString>) {
      state.value = action.payload.value;
    },
  },
})

export const { setNewAction } = appSettings.actions;

interface updateStateWithString {
  value: string;
  ignoreUpdateToCloud?: boolean;
}
```

With this step we now have all the pre-wiring done for setting up the store. When the App launches
we want to load the initial values into state from either the localStorage or storage disk
based on the device this runs on. So we use a interface that each device implements to fetch these values.

```typescript
window.DeviceAPI.getSetting(key);
```

We now have a fully functional store setup with corresponding initial values loaded in to the state.
Now lets look at fetching a value from store. We use `useSelector` hook for this use case.
No more hustle of using mapStateToProps.

```typescript
import { useSelector } from 'react-redux';
const activated = useSelector((state: RootState) => state.appSettings.activated);
```

The next step in state management is to update the actual state. For this we need to dispatch an action.
We use `useDispatch` hook to achieve this.

```typescript
import { useDispatch } from 'react-redux';
const dispatch = useDispatch();
dispatch(setAccessCode({ value: '' })); // As stated above, this dispatch will update the fwi's cloud shadow to new value.
```

### Sagas

We use `Redux Sagas` to asynchronously update the new values to Harmony and also to save them
to either the disk or local storage. Lets look into how the Saga middleware is initialized and used.
Below is an example on how we set up sagas in to our app.

```typescript
import createSagaMiddleware from 'redux-saga';
const sagaMiddleware = createSagaMiddleware();
function setupStore() {
  const store = configureStore({
    middleware: middleware,
  });
  sagaMiddleware.run(rootSaga);
};
```

Once the sagas are initialized and running, they would automatically listen
to actions that are dispatched. Please refer to `/core/src/sagas`.

```typescript
export function* testSaga() {
  yield takeEvery(['shimMenu/setNewAction'], function* execute({type,payload,}: PayloadAction<boolean>) {
    switch (type) {
      case 'shimMenu/setNewAction':
        // Do someThing like updating Harmony and store value to local storage
        window.DeviceAPI?.setSetting('key', 'value'); // This will save the setting to storage
        yield updateShadow(Shadow.WebPlayerURL, payload); // This will update the value to Harmony
        break;
    }
  });
}
```

### Webpack & Build Process

The build process for this app is handled via webpack. There is a base configuration file at the root of this repo that
is shared across all platforms and extended for each device. The primary things that are extended are the environment
variables and any additional scripts that need to be included. the environment variables are injected into the app at
build time, and the scripts are injected into the head of the HTML document as a string. This is where we define things
like required device SDK scripts. See Samsung's for an example at `device_SSSP/webpack.config.js`.

The exception at the time of this writing is the node server for Brightsign which is handled via Parcel bundler for the
sake of convenience on such a simple transpilation.

You will also find several shell scripts throughout the repository that are used to make device-ready builds. if they
are prefixed with `jenkins-` they are made to be used in Jenkins when a build is triggered on commit. Otherwise they are
meant to be used during development.

### Tests

Tests are split into 2 different suites: business logic, and UI testing. As a general rule of thumb, if you are writing
code that affects the UI, you should write a spec for it in cypress. If you are writing functional code, the logic
should be tested using Jest. Our coverage goal is ~70%.

Tests will run before you push a local branch to the remote origin. If you want to bypass the tests, you can use
 \[SKIP-TESTS\] at the end of the commit message.

 To run tests manually, use the following commands from the `core` directory

 Unit Tests: `yarn test`
 UI Tests: `yarn test:cypress`
 Manual UI Tests: `yarn cypress open`


<hr />
<br />

## Running on Device

Search for the shell script for your device that will be something like: `build-brightsign.sh` cd to that directory and
run the shell script.

### BrightSign

- Brightsign will produce `autorun.zip`. Move this file to the root of an SD card (FAT32) and insert into the device. If
  you include the following json file at the root of the SD card. You will be able to use Chrome dev tools to remotely
  control and debug the device by visiting `<IP_ADDRESS_OF_DEVICE>:2999` from \*\*\*_CHROMIUM 79 OR LOWER_.\*\*\*
  _debugSettings.json_

```json
{
  "inspectionEnabled": true
}
```

### Samsung SSP

- Samsung will produce `FWISSSP.wgt` and `sssp_config.xml`. Serve these files in the same directory on a simple web
  server use the URL Launcher on the device to point to that folder. SSSP will look first for the xml file which will
  point it to the widget file. Remote debugging on Samsung can be done, but it probably isn't worth the time. For
  detailed instructions visit:
  [this confluence page](https://fourwindsinteractive.atlassian.net/wiki/spaces/CLOUD/pages/465928201/Connecting+to+Samsung+TV+s+for+remote+debugging)
- Samsung is entirely client side, but does support node functionality.

\*Note: Samsung require each node-server file to be approved by them every time it is modified, so the way around this
is to just "require" all custom nodeJS code from the index file, and modify the external code instead.

1. Download Docker Desktop App
1. edit your ~/.bash_profile to include the following values:
```shell
export REGISTRY_USER="your-artifactory-username"
export REGISTRY_PASSWORD="your-artifactory-password"
export CI_USER=$REGISTRY_USER
export CI_PASSWORD=$REGISTRY_PASSWORD
```
1. run source ~/.bash_profile in the current shell to initialize the new values (new shell windows will do this by default from now on).

run the script at /build-sssp.sh to create a development build
#### LG webOS

- LG will produce `com.lg.app.signage.ipk` and `appinfo.json`. use a simple web server to point to the .ipk file and LG
  will install the app. You can use Chrome dev tools to remotely inspect the app by visiting
  `<IP_ADDRESS_OF_DEVICE>:9998` from \*\*\*_CHROMIUM 79 OR LOWER_.\*\*\*.

## Running in Browser (Chrome or Chromium only)

1. cd to the 'device_browser' directory and run `yarn dev` to run a live-reload server or `yarn start` to watch the
   files for compilation only.
1. Some methods in Browser.ts can use either a localhost node server or an active Brightsign's node server to augment functionality for development. To utilize this, you simply need to export the ip address and serial number of a running brightsign on your network before running `yarn dev` in `device_browser`.

```bash
export BRIGHTSIGN_SERIAL="XXXXXXXXX"
export BRIGHTSIGN_IP="192.168.X.xxx"   
```

<hr />
<br />

## Notes for Per Platform Quirks

### BrightSign

- Brightsign's registry interface doesn't do well with nested object, therefore all saved keys are saved to dot notation
  in a flat structure.
- Brightsign's registry transforms all keys to lower case so snake_case is the preferred notation for keys.

### Samsung

#### CLI tools are broken (not our fault) and builds need to be done manually in Tizen Studio. To do this, follow the Tizen Setup guide [here](https://poppulo.atlassian.net/wiki/spaces/TT/pages/754516059/Tizen+Debugging+WIP)

**DEV Build Numbers are in the format YYYY-MM-DD-HH-MM**

**Prod Build Numbers are in sequential order from Jenkins (Next Prod Build number should be `209` as of 2.4.2 release).**

- Run `./build-sssp.sh` from the project root
  - Make sure environment variables are set for your environment. `ENVIRONMENT=(dev|staging|prod|prod-ap|prod-eu)`. `CLOUD_ENV=(cloudtest1|cloudtest2|undefined)`
  - To see current environment run `echo $ENVIRONMENT` in your shell
  - to set your environment for the current bash session, run `export ENVIRONMENT=xxx`
  - to set your environment permanently, modify the line in ~/.bashrc (`code ~/.bashrc`)
  - you may need to manually set the build number on line 3 if building for production or staging. 
  - you may need to change the path on line 13 of that script to point to your Tizen Project.
- in Tizen Studio, go to your Poppulo Project
- Right Click > Refresh.
- Right Click > Build Signed Package
- Copy the new Poppulo.wgt to a new folder.
- Modify `<ver>` in sssp_config.xml to be `2.4.<BUILD_NUMBER>` since SSSP doesn't support patch semver formats.
- Move those 2 files to their respective S3 folder manually 
  - [start here](https://d-92677719f8.awsapps.com/start/#/?tab=accounts)
  -  poppulo-ds-core-dev (041962984387) 
      - S3 bucket: shims.fwi-dev.com 
        - `sssp/<ENV>/<VERSION>.<BUILD_NUMBER>`
- Post the S3 URL to [this Teams thread](https://teams.microsoft.com/l/message/19:b2fe1cc5f2f54718a6a4839315e2f2bf@thread.tacv2/1743185728325?tenantId=deba6125-c546-4c86-8a88-e84dda453573&groupId=cb37151e-96df-405e-a17f-91b9d2203abe&parentMessageId=1743185728325&teamName=Signage%20Players%20Development%20Team&channelName=SOC-Dev&createdTime=1743185728325&ngc=true): `https://shims.fwi-dev.com/sssp/<ENV>/2.4.2.<BUILD_NUMBER>`


### webOS

- none yet

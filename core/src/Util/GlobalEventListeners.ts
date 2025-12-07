import { Keyboard, OnOff } from '../constants';
import { Logger } from '../Util';
import { AnyAction, Dispatch } from 'redux';
import { setDeviceConnected } from '@core/appState/deviceState';
import { cacheBustCurrentDeployment } from '@core/Deployment';
import { ObjectValues } from './Object';

export const listenForKonamiCode = () => {
  let userKeySequence: string[] = [];
  const konamiSequence = [
    Keyboard.UP,
    Keyboard.UP,
    Keyboard.DOWN,
    Keyboard.DOWN,
    Keyboard.LEFT,
    Keyboard.RIGHT,
    Keyboard.LEFT,
    Keyboard.RIGHT,
  ];

  window.addEventListener('keyup', (e) => {
    userKeySequence.push(e.key);
    if (userKeySequence.length > 8) {
      userKeySequence.shift();
    }
    if (userKeySequence.length === 8 && JSON.stringify(userKeySequence) === JSON.stringify(konamiSequence)) {
      userKeySequence = [];
      document.getElementById('on-screen-logs-container')?.classList.toggle('hidden');
      document.getElementById('resolution-hint')?.classList.toggle('hidden');
    }
  });
};

/** Developer mode adds a single line text field that can be used to run JS statements
 * on the screen when the device is offline and you can't connect to devtools. recommended
 * really only as a last resort. return results appear in the on-screen log section with
 * a special prefix.
 */
export const listenForDeveloperMode = () => {
  let userKeySequence: KeyboardEvent['key'][] = [];
  const definedSequence: KeyboardEvent['key'][] = ['d', 'e', 'v', 'm', 'o', 'd', 'e'];

  window.addEventListener('keyup', (e) => {
    userKeySequence.push(e.key);
    if (userKeySequence.length > 7) {
      userKeySequence.shift();
    }
    if (userKeySequence.length === 7 && JSON.stringify(userKeySequence) === JSON.stringify(definedSequence)) {
      userKeySequence = [];

      const userConsole = document.getElementById('on-screen-console') as HTMLTextAreaElement;
      userConsole?.classList.toggle('hidden');
      userConsole.value = '';
      userConsole?.focus();

      userConsole?.addEventListener('keyup', (e) => {
        if (e.key === Keyboard.ENTER || e.key === Keyboard.SELECT) {
          try {
            const result = eval(userConsole?.value);
            userConsole.value = '';
            Logger.debug(`[DEV CONSOLE] ${typeof result === 'object' ? JSON.stringify(result) : result}`);
          } catch (error) {
            Logger.error(`[DEV CONSOLE] ${error.message}`);
          }
        }
      });
    }
  });
};

/** Alt+C or the blue button on the remote will pull up the shim menu */
export const listenForShimMenuHotKey = () => {
  // we need to return this handler function because it gets registered inside of a component. This way, during teardown we can remove the event listener to prevent duplicate listeners when it re-renders.
  const handlerFn = (e: KeyboardEvent) => {
    if ((e.altKey && e.key === Keyboard.C) || e.keyCode === Keyboard.BLUE || e.key === Keyboard.ALTC) {
      window.DeviceAPI.showMenu();
    } else {
      return true;
    }
  };
  window.addEventListener('keyup', handlerFn);

  document.getElementById('force-menu-open')?.addEventListener('click', window.DeviceAPI.showMenu);

  return handlerFn;
};

/**
 * CTRL+R = restart application
 * CTRL+O = toggle display on/off
 * ALT+R = cache bust current deployment
 */
export const listenForOtherKeyboardShortcuts = () => {
  window.addEventListener('keypress', async (e) => {
    if (e.ctrlKey) {
      if (e.shiftKey && e.key === 'R') {
        e.preventDefault();
        Logger.debug('User invoked hotkey to restart the application.');
        // delay for logging purposes.
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else if (e.key === Keyboard.O) {
        e.preventDefault();
        Logger.debug('User invoked hotkey to toggle display power...');
        const onOff = window.DeviceAPI.getDisplayStatus();
        window.DeviceAPI.turnDisplayOnOff(onOff === OnOff.On ? OnOff.Off : OnOff.On);
      } else {
        Logger.debug(`You tried to enter a hotkey for ctrl + ${e.key} which doesn't do anything.`, e.key);
      }
    }
    if (e.altKey) {
      if (e.key === Keyboard.R) {
        Logger.debug('User invoked hotkey to cache bust the current url...');
        e.preventDefault();
        cacheBustCurrentDeployment();
      }
    }
  });
  window.onerror = (error) => {
    Logger.error(error);
  };
};

/** Yellow key on remote rotates display 90 degrees */
export const listenForDisplayRotationHotKey = () => {
  window.addEventListener('keyup', (e) => {
    if (e.keyCode === Keyboard.YELLOW) {
      Logger.debug('User invoked hotkey to rotate the display orientation.');
      window.DeviceAPI?.rotateScreen();
    }
  });
};

/** Listen for native online/offline events. */
export const listenForNetworkStatusChange = (dispatch: Dispatch<AnyAction>) => {
  window.addEventListener('online', () => {
    Logger.info('[NETWORK CHANGE] Device connected to network.');
    dispatch(setDeviceConnected(true));
    // See NetworkChangeFlow.ts for next steps.
  });

  window.addEventListener('offline', () => {
    Logger.info('[NETWORK CHANGE] Device disconnected from network.');
    dispatch(setDeviceConnected(false));
    // See NetworkChangeFlow.ts for next steps.
  });
};

/**
 * Primary algorithm for user navigation throughout the app.
 *  Some components may override this behavior if necessary like segmented text inputs or numbers
 *  Essentially, this device gets coordinates for each element in the DOM, and uses the pressed
 *  key to determine the user's "intent" of what item comes next in a 2-dimensional array.
 *  Each item in the top-level array represents a row, and  any nested items in a row represent columns.
 * In order for items to show up together in a row, their horizontal centers must be identical regardless
 * of their height (see below).
 * due to rendering differences on each device, you may need to tweak some css to accomodate for certain
 * components to get them to line up properly if behavior is unexpected.
 * see core/src/GUI/scss/device-specific.scss if that's the case.
 *
 *    Element 1            Element 2
 *  ┌──────────┐
 * │           │           ┌──────┐
 * │     x ────│──────────│───x   │ horizontal centerline
 * │           │          └──────┘
 * └──────────┘
 *
 */
export const listenForArrowNavigation = () => {
  // Ignore default Tab behavior
  window.addEventListener('keydown', (e) => {
    if (e.key === Keyboard.TAB) {
      e.preventDefault();
    }
  });

  window.addEventListener('keyup', (e) => {
    // get the active focus.
    const activeItem = document.activeElement;

    // don't override default text navigation while editing text input fields.
    if (activeItem instanceof HTMLInputElement) {
      // what kind of input element is this?
      switch (activeItem.getAttribute('type')) {
        case 'checkbox':
          // do not return;
          break;

        case 'text':
        case 'radio':
        case 'password':
        case 'number':
        case 'range':
        default:
          return;
      }
    }

    // if focus is on the body, move it to the first navigable element.
    if (
      activeItem instanceof HTMLBodyElement &&
      ([Keyboard.UP, Keyboard.DOWN, Keyboard.LEFT, Keyboard.RIGHT, Keyboard.TAB] as string[]).includes(e.key)
    ) {
      const firstElement = document.querySelector('[data-navigable="true"]:not([disabled])') as HTMLInputElement;
      firstElement?.focus();
      return;
    }

    // ignore input if the focus is not an input or button
    if (
      !(
        activeItem instanceof HTMLInputElement ||
        activeItem instanceof HTMLButtonElement ||
        activeItem instanceof HTMLLabelElement
      ) ||
      !([Keyboard.UP, Keyboard.DOWN, Keyboard.LEFT, Keyboard.RIGHT, Keyboard.TAB] as string[]).includes(e.key)
    ) {
      return;
    }

    const navStructure = getNavigableDataStructure();
    let { row, col } = findActiveElementInStructure(navStructure);

    switch (e.key) {
      case Keyboard.UP:
        row = row - 1 < 0 ? navStructure.length - 1 : row - 1;
        col = 0;
        break;
      case Keyboard.DOWN:
        row = row + 1 <= navStructure.length - 1 ? row + 1 : 0;
        col = 0;
        break;
      case Keyboard.LEFT:
        col = col - 1 < 0 ? navStructure[row].length - 1 : col - 1;
        break;
      case Keyboard.RIGHT:
        col = col + 1 <= navStructure[row].length - 1 ? col + 1 : 0;
        break;

      case Keyboard.TAB:
        if (col !== navStructure[row].length - 1) {
          // next column
          col = col + 1 <= navStructure[row].length - 1 ? col + 1 : 0;
        } else if (row + 1 <= navStructure.length) {
          //next row
          row = row + 1 <= navStructure.length - 1 ? row + 1 : 0;
          col = 0;
        }
        break;

      default:
        break;
    }

    const next = navStructure[row][col];
    next?.el?.focus();
  });
};
interface DOMElementMidpoint {
  y: number;
  x: number;
  el: HTMLInputElement;
}
type DOMRow = DOMElementMidpoint[];
const getNavigableDataStructure = (): DOMRow[] => {
  // get all active input elements on the page.
  const table = Array.from(document.querySelectorAll('[data-navigable=true]:not([disabled])')).map((el) => {
    // calculate their "center".
    const { width, height, top, left } = el.getBoundingClientRect();
    const midpoint = {
      y: (height / 2 + top).toFixed(0),
      x: (width / 2 + left).toFixed(0),
    };
    return { midpoint, el };
  });

  // create rows based on unique y values of x,y coordinate pairs.
  const rows = new Set(table.map((el) => el.midpoint.y));
  const ui: { [key: string]: DOMElementMidpoint[] } = {};
  // add elements to their key for the "y" axis;
  rows.forEach((y) => (ui[y] = []));
  table.map((el) => {
    const { x, y } = el.midpoint;
    ui[y].push({ y: Number(y), x: Number(x), el: el.el } as DOMElementMidpoint);
  });

  // at this point we now have a data structure that is an object of Element[] based on their aligned y-axes. we will turn this into a 2D array
  /**
   *  [
   *    [ { y: 498, x: 902, el: ...  }, { y: 498, x: 971, el: ...  } ],
   *    [ { y: 581, x: 1077, el: ...  }, { y: 581, x: 1247, el: ...  } ],
   *    [ { y: 663, x: 1077, el: ...  }, { y: 663, x: 1247, el: ...  } ],
   *    [ { y: 761, x: 996, el: ... } ] ,
   *  ]
   */
  return ObjectValues(ui) as DOMRow[];
};

const findActiveElementInStructure = (structure: DOMRow[]) => {
  const active = document.activeElement;

  for (const [x, row] of structure.entries()) {
    for (const [y] of row.entries()) {
      if (structure[x][y].el.attributes === active!.attributes) {
        return { row: x, col: y };
      }
    }
  }
  return { row: 0, col: 0 };
};

/** On SoC videos have a tendency to be on a z-index above the browser level, so if a sign
 * is playing video and we need to display the menu we can create the illusion of paused
 * playback by capturing a screenshot of the sign, using it as the backdrop for the menu
 * and putting the menu on top of that while we hide the actual player with css.
 */
export const spoofPausedVideoPlayback = async () => {
  if (document.getElementById('spoofed-background-image')) {
    return;
  }
  if (window.DeviceAPI.requiresVideoZIndex) {
    const blob = await window.DeviceAPI.captureScreenshot();
    const src = URL.createObjectURL(blob);
    const bgImageEl = document.createElement('img');
    bgImageEl.src = src;
    bgImageEl.id = 'spoofed-background-image';

    const orientation = window.DeviceAPI.getState().deviceSettings.orientation;
    if (orientation !== 0) {
      bgImageEl.classList.add(`rotate-${orientation}`);
    }

    document.body.appendChild(bgImageEl);
    const iframe = document.getElementById('player-iframe');
    if (iframe) {
      iframe.style.display = 'none';
    }
  }
};

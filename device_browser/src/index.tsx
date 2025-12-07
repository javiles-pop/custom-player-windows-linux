import { render } from 'react-dom';
import { initShimApp } from '@core/index';
import { BrowserAPI } from './Browser';

(async () => {
  const Shim = await initShimApp(BrowserAPI);
  render(Shim, document.getElementById('root'));
})();

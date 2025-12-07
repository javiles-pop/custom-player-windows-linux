import { ObjectEntries } from '@core/Util/Object';
import React, { ReactElement, useState } from 'react';
import shallowEqual from 'shallowequal';

import {
  BasePlayerConfig,
  ContentPlayerChannelConfig,
  ContentPlayerWebParameters,
  getParamName,
  isCloudConfig,
  isContentManagerConfig,
} from './utils';

export interface CPWebFramePOSTFormProps extends BasePlayerConfig {
  /**
   * This should either be the `name` attribute for the CPWeb `<iframe>` or
   * `"_blank"` to open CPWeb in a new window/tab.
   *
   * This is required so that the form posts data to the iframe itself and
   * populates with the results.
   */
  target: '_blank' | string;

  /**
   * The current configuration object.
   */
  config: ContentPlayerChannelConfig;

  /**
   * An optional function to call when the form is submitted.
   *
   * Note: There is no `event` passed to this callback since the form is
   * submitted via `form.submit()` which does not fire a submit event.
   */
  onSubmit?(): void;
}

type ForceRestartOptions = Omit<ContentPlayerWebParameters, 'accessToken'>;

/**
 * This is a temporary form that will render itself once any of the
 * configuration objects have been changed and immediately submit the form to
 * update the `<iframe>`. Once the form has been submitted, the form will be
 * unmounted and removed from the DOM.
 *
 * This also creates a temporary and mildly random form id each time it renders.
 */
export default function CPWebFramePOSTForm({
  baseUrl,
  target,
  height,
  width,
  preview,
  localTime,
  localTimeOffset,
  version,
  config,
  method,
  onSubmit,
}: CPWebFramePOSTFormProps): ReactElement | null {
  const [options, setOptions] = useState<ForceRestartOptions | null>(null);
  const nextOptions: ForceRestartOptions = {
    ...config,
    baseUrl,
    height,
    width,
    preview,
    localTime,
    localTimeOffset,
    version,
  };

  if (
    method === 'GET' ||
    (!isContentManagerConfig(config) && !isCloudConfig(config)) ||
    shallowEqual(options, nextOptions)
  ) {
    return null;
  }

  return (
    <form
      id={Math.random().toString(36).substring(2, 9)}
      target={target}
      action={baseUrl}
      method="POST"
      ref={(form) => {
        if (form) {
          if (onSubmit) {
            onSubmit();
          }

          form.submit();
          setOptions(nextOptions);
        }
      }}
    >
      {ObjectEntries({
        ...config,
        height,
        width,
        preview,
        localTime,
        localTimeOffset,
        version,
      }).map(
        ([name, value]) => value && <input key={name} type="hidden" name={getParamName(name)} value={`${value}`} />
      )}
    </form>
  );
}

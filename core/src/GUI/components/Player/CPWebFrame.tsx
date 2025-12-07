import React, { forwardRef, HTMLAttributes, IframeHTMLAttributes, Ref } from 'react';
import cn from 'classnames';

import CPWebFramePOSTForm from './CPWebFramePOSTForm';
import {
  AspectRatio,
  BasePlayerConfig,
  ContentPlayerChannelConfig,
  isCloudConfig,
  isContentManagerConfig,
  PlayerOptions,
  resolveUrl,
} from './utils';

export type CPWebFrameAttributes = Omit<
  IframeHTMLAttributes<HTMLIFrameElement>,
  'src' | 'width' | 'height' | 'onSubmit'
>;

export interface BaseCPWebFrameProps extends PlayerOptions, CPWebFrameAttributes {
  /**
   * Any additional props to provide to the container `<div>` of the `<iframe>`.
   */
  containerProps?: HTMLAttributes<HTMLDivElement> & {
    ref?: Ref<HTMLDivElement>;
  };

  /**
   * An optional aspect ratio to enforce. If you want to ensure that the
   * `<iframe>` is completely within the viewport, use the `getParentMaxWidth`
   * util function to set the `maxWidth` style on a parent or just the root DOM
   * node.
   */
  aspectRatio?: AspectRatio | null;
}

export interface CPWebFramePropsWithPredefinedURL extends BaseCPWebFrameProps {
  /**
   * A custom pre-defined player url to use instead of the default behavior.
   * Providing this prop will actually disable all the other built-in options
   * and configuration other than the aspect ratio.
   */
  src: string;
}

export interface CPWebFramePropsWithPlayerConfig extends BaseCPWebFrameProps, BasePlayerConfig {
  /**
   * Either a Cloud channel or Content Manager channel configuration
   */
  config: ContentPlayerChannelConfig | null;

  /**
   * An optional function to call when the `method="POST"` and the form is
   * submitted. This can be useful for enabling a loading spinner or anything
   * else along with the `onLoad` callback.
   *
   * Note: This is only valid when the `method` is set to `"POST"`.
   *
   * Note: There is no `event` passed to this callback since the form is
   * submitted via `form.submit()` which does not fire a submit event.
   */
  onSubmit?(): void;
}

export type CPWebFrameProps = CPWebFramePropsWithPlayerConfig | CPWebFramePropsWithPredefinedURL;

/**
 * This is the main `<iframe>` for interacting with content player web. Some
 * general functionality included is:
 *
 * - ensure that a valid Cloud or Content Manager configuration has been
 * provided
 * - allow for initializing the `<iframe>` either via query parameters or a form
 * POST
 * - enforcing a specific aspect ratio
 */
export default forwardRef<HTMLIFrameElement, CPWebFrameProps>(function CPWebFrame(
  {
    containerProps,
    className,
    title = 'Content Player Web',
    height,
    width,
    preview = false,
    localTime,
    localTimeOffset,
    version,
    name = 'cpwebframe',
    aspectRatio,
    ...remaining
  },
  ref
) {
  const {
    src,
    baseUrl,
    method = src ? 'GET' : 'POST',
    config,
    onSubmit,
    ...props
  } = remaining as CPWebFramePropsWithPlayerConfig & CPWebFramePropsWithPredefinedURL;

  if (!src && (!config || (!isCloudConfig(config) && !isContentManagerConfig(config)))) {
    return null;
  }

  let playerUrl = src;
  if (!src && method === 'GET') {
    // Note: this causes the frame to load twice since it redirects to include
    // _fwi=<id>
    playerUrl = resolveUrl({
      baseUrl,
      height,
      width,
      preview,
      localTime,
      localTimeOffset,
      version,
      ...config,
    });
  }

  let style = containerProps?.style;
  if (aspectRatio) {
    const { x, y } = aspectRatio;
    style = {
      ...style,
      paddingBottom: `${(y / x) * 100}%`,
    };
  }

  return (
    <div
      {...containerProps}
      style={style}
      className={cn(
        'cpwebframe-container',
        {
          'cpwebframe-container--aspect': aspectRatio,
        },
        containerProps?.className
      )}
    >
      {config && (
        <CPWebFramePOSTForm
          baseUrl={baseUrl}
          method={method}
          height={height}
          width={width}
          preview={preview}
          localTime={localTime}
          localTimeOffset={localTimeOffset}
          config={config}
          target={name}
          onSubmit={onSubmit}
        />
      )}
      <iframe
        {...props}
        src={playerUrl}
        className={cn(
          'cpwebframe',
          {
            'cpwebframe--aspect': aspectRatio,
          },
          className
        )}
        ref={ref}
        title={title}
        name={name}
      />
    </div>
  );
});

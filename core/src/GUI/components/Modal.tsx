// Modal.tsx
import React, { forwardRef, HTMLAttributes, Ref, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { hasParentWithId, Logger } from '@core/Util';

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  active?: boolean;
  id: string;
}

const Modal = forwardRef(function Modal(props: ModalProps, forwardedRef: Ref<HTMLDivElement>) {
  const nonModalElements = useRef<Element[] | null>(null);
  const modalElements = useRef<Element[] | null>(null);

  useEffect(() => {
    if (props.active && !modalElements.current) {
      const els = [...document.querySelectorAll(`#${props.id} [data-navigable]`)];
      modalElements.current = els;
    }

    if (props.active && !nonModalElements.current) {
      Logger.debug('[MODAL] Disabling all non-modal inputs');
      // get all the navigable items that aren't in the modal.
      const _nonModalElements = [...document.querySelectorAll('[data-navigable="true"]')].filter(
        (el) => !hasParentWithId(el, props.id)
      );
      // store these items for when we exit the modal later.
      nonModalElements.current = _nonModalElements;

      // disable them.
      _nonModalElements.forEach((el) => {
        const element = el as HTMLElement;
        element.dataset.navigable = 'false';
      });
    }
  }, [modalElements, props.active, props.id]);

  useEffect(() => {
    if (props.active && modalElements.current?.length) {
      modalElements.current.forEach((el) => {
        const element = el as HTMLElement;
        element.dataset.navigable = 'true';
      });

      // select first element in the modal.
      // (document.querySelector('[data-navigable="true"]') as HTMLInputElement)?.focus();
    }
  }, [props.active]);

  useEffect(() => {
    if (!props.active && nonModalElements.current?.length) {
      nonModalElements.current.forEach((el) => {
        const element = el as HTMLElement;
        element.dataset.navigable = 'true';
      });
    }
  }, [props.active]);

  return (
    <div className={classNames('shim-modal-fullscreen', { active: props.active })} ref={forwardedRef}>
      <div className="inner-container">
        <div className="shim-modal" id={props.id}>
          {props.children}
        </div>
      </div>
    </div>
  );
});

export default Modal;

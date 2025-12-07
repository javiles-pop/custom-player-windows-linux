/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from 'react';

/** run function on component mount */

export function onMount(func: () => any) {
  useEffect(() => {
    func();
  }, []);
}

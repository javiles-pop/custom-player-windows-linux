import { useCallback, useState } from 'react';

/** allows text field to display visual feedback on invalid input */

export function useTextFieldErrors(): [string, (hasErrors: boolean) => void] {
  const [errorClasses, setErrorClasses] = useState('');
  const setHasErrors = useCallback<(hasErrors: boolean) => void>((hasErrors) => {
    setErrorClasses(hasErrors ? 'has-errors' : '');
  }, []);

  return [errorClasses, setHasErrors];
}

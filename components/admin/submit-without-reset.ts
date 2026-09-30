import { startTransition, type FormEvent } from 'react';

/**
 * onSubmit que manda el formulario a la acción sin el reset automático de React 19. Ese reset
 * (el que ocurre con `<form action={...}>`) vuelve los checkbox controlados a su estado inicial en
 * pantalla aunque el estado de React no cambie: se veía destildado algo que estaba activo, y un
 * segundo "Guardar" mandaba el valor equivocado.
 */
export function submitWithoutReset(dispatch: (formData: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  };
}

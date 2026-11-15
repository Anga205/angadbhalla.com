/**
 * EmailJS configuration for the home page message form.
 *
 * These are browser-side credentials: the public key is designed to be shipped
 * in client code, and the template decides what the email looks like. Keeping
 * them in a data module means the page markup stays free of magic strings.
 *
 * Template variables the form sends:
 *   {{time}}     client-side timestamp
 *   {{app}}      always "angadbhalla.com"
 *   {{message}}  the message body
 *   {{contact}}  the address the visitor entered
 */
export const EMAILJS_SERVICE_ID = 'service_3ys6akq';
export const EMAILJS_TEMPLATE_ID = 'template_gervg6v';
export const EMAILJS_PUBLIC_KEY = '1JMl4awfqw7WioBaX';

/** Sent as {{app}} so the template knows which site the message came from. */
export const EMAILJS_APP = 'angadbhalla.com';

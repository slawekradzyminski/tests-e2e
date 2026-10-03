let currentPassword: string | undefined;
export function setFormPassword(value: string) { currentPassword = value; }
/** Resolved by the runner only at fill time; the value never enters an agent prompt. */
export function formPassword() {
  if (!currentPassword) throw new Error('No test-scoped form password has been supplied');
  return currentPassword;
}

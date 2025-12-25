type ExecutionMode = "off" | "admin" | "public";

export function getExecutionMode(): ExecutionMode {
  return (process.env.EXECUTION_MODE as ExecutionMode) || "off";
}

export function canExecute(userRole?: string) {
  const mode = getExecutionMode();

  if (mode === "off") return false;
  if (mode === "public") return true;
  if (mode === "admin") return userRole === "admin";

  return false;
}

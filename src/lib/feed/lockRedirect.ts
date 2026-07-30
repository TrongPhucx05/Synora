export async function handleLockedResponse(res: Response): Promise<boolean> {
  if (res.status !== 403) return false;

  try {
    const data = await res.clone().json();
    if (data?.code === "ACCOUNT_LOCKED") {
      window.location.href =
        data.status === "BANNED" ? "/account-banned" : "/account-suspended";
      return true;
    }
  } catch {}
  return false;
}

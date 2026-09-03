/** Whether a sidebar/mobile nav item should appear active for the current path. */
export function isNavItemActive(
  pathname: string,
  href: string,
  allHrefs: string[] = [],
): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  const matches = pathname === href || pathname.startsWith(`${href}/`);
  if (!matches) return false;

  const competing = allHrefs.filter(
    (candidate) =>
      candidate !== "/dashboard" &&
      (pathname === candidate || pathname.startsWith(`${candidate}/`)),
  );
  if (competing.length === 0) return true;

  const best = competing.reduce((a, b) => (a.length >= b.length ? a : b));
  return best === href;
}

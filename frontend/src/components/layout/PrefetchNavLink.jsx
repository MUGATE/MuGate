import React, { useCallback } from "react";
import { Link } from "react-router-dom";
import { prefetchRoute } from "../../utils/routePrefetch";
import { shouldPrefetchRoutes } from "../../utils/deviceCapability";

const PrefetchNavLink = ({ to, children, className, ...rest }) => {
  const warm = useCallback(() => {
    if (!shouldPrefetchRoutes()) return;
    if (typeof to === "string") prefetchRoute(to);
  }, [to]);

  return (
    <Link
      to={to}
      className={className}
      {...rest}
      onMouseEnter={(e) => {
        warm();
        rest.onMouseEnter?.(e);
      }}
      onFocus={(e) => {
        warm();
        rest.onFocus?.(e);
      }}
      // Intentionally no onTouchStart — accidental touches were starting heavy chunk downloads
    >
      {children}
    </Link>
  );
};

export default PrefetchNavLink;

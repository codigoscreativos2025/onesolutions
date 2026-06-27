// import createMiddleware from "next-intl/middleware";
// import { routing } from "./i18n/routing";

// export default createMiddleware(routing);

// export const config = {
//   matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
// };

export default function middleware() {
  return null;
}

export const config = {
  matcher: [],
};
